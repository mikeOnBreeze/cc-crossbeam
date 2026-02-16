# Plan: Fix Contractor Questions Insertion + Answer Versioning

## Problem 1: Questions Don't Insert Into contractor_answers Table

The agent writes `contractor_questions.json` with this structure:

```json
{
  "project": { ... },
  "summary": { "total_items": 13, "auto_fixable": 5, ... },
  "question_groups": [
    {
      "category": "NEEDS_CONTRACTOR_INPUT",
      "questions": [
        {
          "question_id": "q_4_0",
          "context": "CPC Table 702.1: 3\" pipe handles up to 42 DFU...",
          "options": ["3\" ABS", "4\" ABS", "4\" PVC", ...],
          "required": true,
          "allow_other": true
        }
      ]
    }
  ]
}
```

But the insert code at `server/src/services/sandbox.ts:630-633` does:
```js
const questionsList = Array.isArray(questions) ? questions : questions.questions || [];
```

It checks for `questions.questions` (top-level `questions` array) but the actual structure is `questions.question_groups[].questions[]` — a nested array inside groups. The result: `questionsList` is empty, nothing gets inserted.

### Fix (sandbox.ts, line 630-633)

Replace:
```js
const questions = allFiles['contractor_questions.json'];
if (questions) {
  const questionsList = Array.isArray(questions) ? questions : questions.questions || [];
  await insertContractorQuestions(questionsList);
}
```

With:
```js
const questions = allFiles['contractor_questions.json'];
if (questions) {
  let questionsList = [];
  if (Array.isArray(questions)) {
    // Flat array of questions
    questionsList = questions;
  } else if (questions.question_groups && Array.isArray(questions.question_groups)) {
    // Nested: question_groups[].questions[]
    for (const group of questions.question_groups) {
      if (group.questions && Array.isArray(group.questions)) {
        questionsList.push(...group.questions);
      }
    }
  } else if (questions.questions && Array.isArray(questions.questions)) {
    // Flat under "questions" key
    questionsList = questions.questions;
  }
  if (questionsList.length > 0) {
    await insertContractorQuestions(questionsList);
  } else {
    console.log('No contractor questions found in any known format');
  }
}
```

### Also fix field mapping (sandbox.ts, line 511-519)

The `insertContractorQuestions` function maps fields that don't match the agent's output schema. The agent uses `question_id` not `key`/`question_key`/`id`, and `context` not `question`/`question_text`/`text`.

Replace:
```js
const rows = questions.map(q => ({
  project_id: projectId,
  question_key: q.key || q.question_key || q.id || 'q_' + Math.random().toString(36).slice(2),
  question_text: q.question || q.question_text || q.text || '',
  question_type: q.type || 'text',
  options: q.options ? JSON.stringify(q.options) : null,
  context: q.context || q.why || null,
  correction_item_id: q.correction_item_id || q.item_id || null,
  is_answered: false,
}));
```

With:
```js
const rows = questions.map(q => ({
  project_id: projectId,
  question_key: q.question_id || q.key || q.question_key || q.id || 'q_' + Math.random().toString(36).slice(2),
  question_text: q.context || q.question || q.question_text || q.text || '',
  question_type: q.options ? 'select' : (q.type || 'text'),
  options: q.options ? (typeof q.options === 'string' ? q.options : JSON.stringify(q.options)) : null,
  context: q.context || q.why || null,
  correction_item_id: q.correction_item_id || q.item_id || null,
  is_answered: false,
}));
```

Key changes:
- Added `q.question_id` as first choice for `question_key` (that's what the agent outputs)
- `question_text` now tries `q.context` first (the agent puts the actual question text there)
- `question_type` auto-detects `'select'` when `options` is present
- `options` handles both string and array input (the column is jsonb)

---

## Problem 2: Answer Versioning

The `contractor_answers` table has no `version` or `output_id` column. If the analysis phase runs twice, old answers from run 1 mix with new questions from run 2.

### Fix: Add output_id to contractor_answers

**Migration (Supabase):**
```sql
ALTER TABLE crossbeam.contractor_answers
ADD COLUMN output_id uuid REFERENCES crossbeam.outputs(id);
```

**In sandbox.ts — after creating the output record, pass the output ID to insertContractorQuestions:**

Currently (line 625-634):
```js
} else if (flowPhase === 'analysis') {
  outputData.corrections_analysis_json = allFiles['corrections_categorized.json'] || null;
  outputData.contractor_questions_json = allFiles['contractor_questions.json'] || null;

  // Insert contractor questions into contractor_answers table
  const questions = allFiles['contractor_questions.json'];
  if (questions) {
    const questionsList = ...;
    await insertContractorQuestions(questionsList);
  }
}
```

Change to: insert questions AFTER creating the output record, so we have the output ID:
```js
} else if (flowPhase === 'analysis') {
  outputData.corrections_analysis_json = allFiles['corrections_categorized.json'] || null;
  outputData.contractor_questions_json = allFiles['contractor_questions.json'] || null;
  // questions will be inserted after createOutputRecord returns the output ID
}
```

Then after `createOutputRecord()` (around line 658), add:
```js
// Insert contractor questions linked to this output version
if (flowPhase === 'analysis' && allFiles['contractor_questions.json']) {
  const questions = allFiles['contractor_questions.json'];
  let questionsList = [];
  if (Array.isArray(questions)) {
    questionsList = questions;
  } else if (questions.question_groups && Array.isArray(questions.question_groups)) {
    for (const group of questions.question_groups) {
      if (group.questions && Array.isArray(group.questions)) {
        questionsList.push(...group.questions);
      }
    }
  } else if (questions.questions && Array.isArray(questions.questions)) {
    questionsList = questions.questions;
  }
  if (questionsList.length > 0) {
    await insertContractorQuestions(questionsList, outputRecordId);
  }
}
```

Update `insertContractorQuestions` signature to accept `outputId`:
```js
async function insertContractorQuestions(questions, outputId = null) {
  // ... existing code ...
  const rows = questions.map(q => ({
    // ... existing fields ...
    output_id: outputId,
  }));
  // ... existing insert ...
}
```

### Also: Delete old questions on re-run

Before inserting new questions, delete any existing unanswered questions for this project:
```js
// Clear old unanswered questions before inserting new ones
await supabase
  .schema('crossbeam')
  .from('contractor_answers')
  .delete()
  .eq('project_id', projectId)
  .eq('is_answered', false);
```

This way:
- Answered questions from previous runs are preserved
- Unanswered questions get replaced with the new set
- Each question links to its output version via `output_id`

---

## Problem 3: corrections-response needs to pass answers to the agent

Currently `corrections-response` reads contractor_answers from the database and passes them as `contractorAnswersJson` to the prompt. This code is in the generate API route.

**Verify this works:** Check `frontend/app/api/generate/route.ts` (or wherever the generate endpoint is) to make sure it:
1. Reads answered questions from `contractor_answers` where `is_answered = true`
2. Formats them as JSON
3. Passes them to the sandbox via `contractorAnswersJson`

This should already work — just verify it pulls from the right table/columns.

---

## Files to Modify

| File | Change |
|------|--------|
| `server/src/services/sandbox.ts` | Fix question parsing (question_groups), fix field mapping, add output_id param, move insert after createOutputRecord, delete old unanswered questions |
| Supabase migration | `ALTER TABLE crossbeam.contractor_answers ADD COLUMN output_id uuid REFERENCES crossbeam.outputs(id)` |

## Testing

After making changes:
1. Reset project b2: `POST /api/reset-project { "project_id": "b0000000-0000-0000-0000-000000000002" }`
2. Trigger analysis: `POST /api/generate { "project_id": "b0000000-0000-0000-0000-000000000002", "flow_type": "corrections-analysis" }`
3. Wait for completion (~11 min)
4. Check: `SELECT count(*) FROM crossbeam.contractor_answers WHERE project_id = 'b0000000-0000-0000-0000-000000000002'` — should have 5-9 rows
5. Check: All rows should have `output_id` set
6. Verify the UI shows the questions (check the project page in the browser)

## Deploy

Server deploys via GitHub Actions — push to `main` when `server/**` changes. The workflow at `.github/workflows/deploy-server.yml` handles it automatically.
