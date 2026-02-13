/**
 * Progress Event Handler
 *
 * Formats and logs Agent SDK streaming messages to console.
 * Used by tests and flows for visibility into agent activity.
 */

export function handleProgressMessage(msg: any, startTime: number): void {
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  switch (msg.type) {
    case 'system':
      console.log(`  [init] Model: ${msg.model}`);
      if (msg.tools?.length) {
        console.log(`  [init] Tools: ${msg.tools.length} loaded`);
      }
      break;

    case 'assistant':
      if (msg.message?.content) {
        for (const block of msg.message.content) {
          if (block.type === 'tool_use') {
            const detail = formatToolDetail(block);
            console.log(`  [${elapsed}m] ${block.name}${detail}`);
          }
        }
      }
      break;

    case 'result':
      const status = msg.subtype === 'success' ? 'SUCCESS' : `FAILED (${msg.subtype})`;
      console.log(`\n  [result] ${status}`);
      console.log(`  [result] Cost: $${msg.total_cost_usd?.toFixed(4) ?? 'unknown'}`);
      console.log(`  [result] Turns: ${msg.num_turns ?? 'unknown'}`);
      break;
  }
}

function formatToolDetail(block: any): string {
  const input = block.input;
  if (!input) return '';

  switch (block.name) {
    case 'Write':
    case 'Read':
      return input.file_path ? ` — ${basename(input.file_path)}` : '';
    case 'Edit':
      return input.file_path ? ` — ${basename(input.file_path)}` : '';
    case 'Skill':
      return input.skill ? ` (${input.skill})` : '';
    case 'Task':
      return input.description ? ` — ${input.description}` : '';
    case 'Bash':
      return input.command ? ` — ${input.command.slice(0, 60)}` : '';
    case 'Glob':
      return input.pattern ? ` — ${input.pattern}` : '';
    case 'Grep':
      return input.pattern ? ` — ${input.pattern}` : '';
    case 'WebSearch':
      return input.query ? ` — ${input.query.slice(0, 60)}` : '';
    case 'WebFetch':
      return input.url ? ` — ${input.url.slice(0, 60)}` : '';
    default:
      return '';
  }
}

function basename(filePath: string): string {
  return filePath.split('/').pop() ?? filePath;
}
