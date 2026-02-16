Test Ladder for California ADU Skill                                                                      
                                                                  
  How to Run Each Test

  Give the test agent access to the skill directory (adu-skill-development/skill/california-adu/) and tell
  it:
  "Use SKILL.md as your entry point. Follow the decision tree to load only the reference files you need.
  Then answer the question."

  ---
  Level 1: Single-Fact Lookups (Sanity Check)

  These should each require loading 1-2 reference files max.

  Test 1A: "What is the maximum size for a JADU?"
  - Expected: 500 sq ft
  - Expected files loaded: unit-types-jadu.md
  - Verify: Cites Gov. Code § 66333

  Test 1B: "Can a city require owner-occupancy for an ADU?"
  - Expected: No. Cities cannot impose owner-occupancy on ADUs. JADUs require it.
  - Expected files: ownership-use.md
  - Verify: Cites § 66315 (ADU) and § 66333(b) (JADU)

  Test 1C: "What is the impact fee situation for a 600 sq ft ADU?"
  - Expected: Exempt from all impact fees (under 750 sq ft threshold)
  - Expected files: permit-fees.md
  - Verify: Cites § 66324(c)(1)

  ---
  Level 2: Multi-Reference Synthesis

  These require following the decision tree through 2-3 steps.

  Test 2A: "I want to build a new 1,000 sq ft detached ADU on my single-family lot. What are the height and
  setback limits?"
  - Expected:
    - Height: 16 ft (base for detached), up to 18 ft if near transit or primary dwelling is multistory
    - Setbacks: 4 ft max from side and rear lot lines; front setback cannot preclude 800 sq ft ADU
    - No minimum lot size required
  - Expected files: unit-types-66323.md, unit-types-adu-general.md, standards-height.md,
  standards-setbacks.md, standards-size.md

  Test 2B: "My HOA says I can't build an ADU. Are they right?"
  - Expected:
    - No. CC&Rs that prohibit or unreasonably restrict ADUs are void and unenforceable (Civ. Code §§ 714.3,
  4751)
    - HOA may impose limited objective standards (specific materials, architectural style) but cannot be
  more restrictive than state law
    - HOA cannot influence the city's ministerial approval process — that would violate state law
    - Lists 8 examples of prohibited HOA actions
  - Expected files: ownership-hoa.md, possibly standards-design.md

  ---
  Level 3: Edge Cases & Tricky Rules

  These test whether the skill handles nuances correctly.

  Test 3A: "I have an existing 700 sq ft garage I want to convert to an ADU, but I'm also adding a 150 sq ft
   bump-out for an entry. What fees apply?"
  - Expected: Proportionate impact fees apply. The 150 sq ft exterior expansion counts toward total size →
  700 + 150 = 850 sq ft, which exceeds the 750 sq ft exemption threshold. Fees are proportionate to primary
  dwelling size.
  - Expected files: permit-fees.md, unit-types-66323.md
  - This tests the tricky "exterior expansions count" rule

  Test 3B: "My property has existing building code violations. Can the city deny my ADU application because
  of them?"
  - Expected: Only if (1) the violations threaten public health/safety AND (2) the violations are affected
  by the ADU construction. For 66323 Units, they cannot condition approval on correcting nonconformance at
  all.
  - Expected files: zoning-nonconforming.md, unit-types-66323.md

  Test 3C: "Can I do a short-term Airbnb rental with my ADU?"
  - Expected: No. Minimum rental term is 30 days. Cities may require terms longer than 30 days. For 66323
  Units, the 30-day minimum is mandatory by state law.
  - Expected files: ownership-use.md

  ---
  Level 4: Scenario Walkthrough

  A full project scenario requiring the complete decision tree.

  Test 4: "I own a single-family home in a coastal zone, half a mile from a light rail station. I want to
  build a new 800 sq ft detached ADU with 2 bedrooms. Walk me through the requirements."

  Expected answer should cover:
  - Unit type: Qualifies as 66323(a)(2) detached ADU (≤ 800 sq ft)
  - Height: 18 ft (near transit bonus), may add 2 ft for roof pitch
  - Setbacks: 4 ft max side/rear
  - Size: 1,000 sq ft minimum for 2-BR — the proposed 800 sq ft is too small for 2 bedrooms under state
  minimums (this is the trap)
  - Parking: Exempt (within ½ mile of transit)
  - Fees: Exempt from impact fees (under 750 sq ft? No — it's 800, so proportionate fees apply)
  - Coastal zone: ADU laws apply but Coastal Act protections still in effect; additional setbacks may apply
  per Local Coastal Program
  - Solar: Required (new detached construction)
  - Process: Ministerial, 60-day approval deadline

  Expected files: 8-10 files across all 4 steps of the decision tree.

  The trap here is: 800 sq ft with 2 bedrooms. State law says minimum is 1,000 sq ft for 2+ bedrooms. A good
   answer should flag this conflict.

  ---
  Level 5: Real-World — Corrections Letter

  Test 5: "Here is a corrections letter from the City of Placentia for an ADU project at 1232 N. Jefferson
  St. For each correction item, tell me: (1) Is this a valid requirement under California state law? (2)
  What state code section applies? (3) Could this correction be more restrictive than what state law
  allows?"

  Give the agent:
  - The 2nd Review Corrections - 1232 Jefferson St, Placentia.pdf
  - The full skill directory

  This is the money shot. The agent should:
  1. Parse each correction item from the letter
  2. Route each item through the decision tree to load relevant state rules
  3. For each item, determine if the city's requirement aligns with or exceeds state law
  4. Flag any items where the city may be imposing more restrictive standards than allowed

  What to grade on:
  - Does it correctly identify which corrections are about setbacks, height, fire, parking, design
  standards, etc.?
  - Does it cite the correct state code sections?
  - Does it flag any corrections that might be preempted by state law?
  - Does it distinguish between things state law controls (setbacks, height, fees) vs things the city
  legitimately controls (building code details, local fire department requirements)?

  ---
  Running Order

  I'd suggest:
  1. Run 1A, 1B, 1C first — quick sanity check (5 min)
  2. Run 2A, 2B — verify multi-file synthesis works (10 min)
  3. Run 3A — this is the trickiest rules test (the exterior expansion gotcha)
  4. Run 4 — full scenario with the built-in trap
  5. Run 5 — the real corrections letter

  Tests 1-3 tell you if the skill is accurate. Test 4 tells you if the decision tree routing works
  end-to-end. Test 5 tells you if this thing is actually useful for contractors.

  --------

  Good question. Here's my take:      

  Sub-agents will work great for all of this. Here's why:                                                   
   
  - I can instruct each sub-agent to report back exactly which files it loaded and why, so we don't lose the
   thought process — I'll see it and relay the key details to you 
  - The results come back to me, I grade them against the expected answers, and give you a pass/fail with
  notes
  - Parallel execution on Level 1 saves time

  Recommended approach:
  ┌──────────┬───────────────────────┬─────────────────────────────────────────────────────────────────────┐
  │  Level   │        Method         │                                 Why                                 │
  ├──────────┼───────────────────────┼─────────────────────────────────────────────────────────────────────┤
  │ 1A, 1B,  │ 3 parallel sub-agents │ Simple fact checks — just need correct answer + correct citation    │
  │ 1C       │                       │                                                                     │
  ├──────────┼───────────────────────┼─────────────────────────────────────────────────────────────────────┤
  │ 2A, 2B   │ 2 parallel sub-agents │ Want to see which files it loaded, but still just grading output    │
  ├──────────┼───────────────────────┼─────────────────────────────────────────────────────────────────────┤
  │ 3A, 3B,  │ 3 parallel sub-agents │ Edge cases — need to see if it catches the nuances                  │
  │ 3C       │                       │                                                                     │
  ├──────────┼───────────────────────┼─────────────────────────────────────────────────────────────────────┤
  │ 4        │ 1 sub-agent           │ Full scenario — I'll ask it to show its complete decision tree      │
  │          │                       │ walkthrough                                                         │
  ├──────────┼───────────────────────┼─────────────────────────────────────────────────────────────────────┤
  │ 5        │ Separate instance     │ The corrections letter PDF is 815K — this is the real demo, you'll  │
  │          │ (you run)             │ want to watch it work live                                          │
  └──────────┴───────────────────────┴─────────────────────────────────────────────────────────────────────┘
  The only one I'd suggest running as a separate instance is Test 5 (the corrections letter). That's your
  money shot — you'll want to see the full reasoning in real-time, and it's the test that most closely
  mirrors the actual product experience.

  So the plan: Compact me down, then in the new session I'll fire off Level 1 as 3 parallel sub-agents, we
  grade them, then move up the ladder. Want to do it that way?

  ---------

  Let's go. Firing off Level 1 — three parallel sub-agents, each using the skill's decision tree.

⏺ 3 Task agents finished (ctrl+o to expand)                                                                 
   ├─ Test 1A: JADU max size · 2 tool uses · 27.6k tokens                                                   
   │  ⎿  Done                                                                                               
   ├─ Test 1B: ADU owner-occupancy · 3 tool uses · 27.6k tokens   
   │  ⎿  Done                                                                                               
   └─ Test 1C: 600 sqft impact fees · 3 tool uses · 27.6k tokens  
      ⎿  Done                                                                                               
                                                                                                            
⏺ All three sub-agents are back. Let me grade them against the expected answers.                            
                                                                                                            
  ---                                                                                                       
  Level 1 Results: Single-Fact Lookups                                                                      
                                                                                                            
  Test 1A: "What is the maximum size for a JADU?"                                                           
  ┌───────────────────────┬──────────────────────┬─────────────────────────────────────────┬────────┐       
  │       Criteria        │       Expected       │                 Actual                  │ Result │
  ├───────────────────────┼──────────────────────┼─────────────────────────────────────────┼────────┤
  │ Answer                │ 500 sq ft            │ 500 sq ft                               │ PASS   │
  ├───────────────────────┼──────────────────────┼─────────────────────────────────────────┼────────┤
  │ Files loaded          │ unit-types-jadu.md   │ unit-types-jadu.md (only file)          │ PASS   │
  ├───────────────────────┼──────────────────────┼─────────────────────────────────────────┼────────┤
  │ Citation              │ Gov. Code § 66333    │ § 66333 + subdivisions (a), (d)         │ PASS   │
  ├───────────────────────┼──────────────────────┼─────────────────────────────────────────┼────────┤
  │ Decision tree routing │ Step 1 → JADU branch │ Step 1 → JADU branch, Steps 2-4 skipped │ PASS   │
  └───────────────────────┴──────────────────────┴─────────────────────────────────────────┴────────┘
  Verdict: PASS — Clean single-file lookup, correct routing, correct answer.

  ---
  Test 1B: "Can a city require owner-occupancy for an ADU?"
  Criteria: Answer
  Expected: No for ADUs, yes for JADUs
  Actual: No for ADUs (§ 66315), yes for JADUs (§ 66333(b))
  Result: PASS
  ────────────────────────────────────────
  Criteria: Files loaded
  Expected: ownership-use.md
  Actual: ownership-use.md + compliance-ordinances.md
  Result: PASS+
  ────────────────────────────────────────
  Criteria: Citation — ADU
  Expected: § 66315
  Actual: § 66315
  Result: PASS
  ────────────────────────────────────────
  Criteria: Citation — JADU
  Expected: § 66333(b)
  Actual: § 66333(b)
  Result: PASS
  ────────────────────────────────────────
  Criteria: Decision tree routing
  Expected: Step 3 → ownership-use
  Actual: Step 3 → ownership-use, Step 4 → compliance-ordinances
  Result: PASS
  Verdict: PASS — Loaded one extra file (compliance-ordinances.md) which is defensible since the question
  asks what a city can do. Added useful context about HCD enforcement. Bonus points.

  ---
  Test 1C: "What is the impact fee situation for a 600 sq ft ADU?"
  Criteria: Answer
  Expected: Exempt from impact fees (under 750 sq ft)
  Actual: Exempt from impact fees (under 750 sq ft)
  Result: PASS
  ────────────────────────────────────────
  Criteria: Files loaded
  Expected: permit-fees.md
  Actual: permit-fees.md + unit-types-66323.md
  Result: PASS
  ────────────────────────────────────────
  Criteria: Citation
  Expected: § 66324(c)(1)
  Actual: § 66324(c)(1) + (a), (b), (d), (e) + Ed. Code § 17620
  Result: PASS+
  ────────────────────────────────────────
  Criteria: Decision tree routing
  Expected: Step 4 → fees
  Actual: Step 1 → unsure, Step 4 → fees
  Result: PASS
  Verdict: PASS — Went beyond the minimum by breaking down all three fee categories (impact, school,
  utility). Correctly flagged that school fees may apply (over 500 sq ft threshold). Also caught the
  exterior expansion gotcha where a bump-out could push it over 750 sq ft. Excellent depth.

  ---
  Level 1 Summary

  Test 1A: PASS  (correct answer, correct routing, correct citation)
  Test 1B: PASS  (correct answer, correct routing, both code sections cited)
  Test 1C: PASS  (correct answer + bonus depth on school fees and utility fees)

  All 3 sanity checks passed. The decision tree routing works, the skill loads the right files, and the
  answers are accurate with proper citations. Ready for Level 2?

✻ Cogitated for 1m 26s                                       

❯ yeah let's do level 2                                                                                     
                        
⏺ Firing off Level 2 — two parallel sub-agents for multi-reference synthesis.                               
                                                                  
⏺ 2 Task agents finished (ctrl+o to expand)                                                                 
   ├─ Test 2A: detached ADU limits · 6 tool uses · 27.7k tokens                                             
   │  ⎿  Done                                                                                               
   └─ Test 2B: HOA blocking ADU · 4 tool uses · 27.7k tokens      
      ⎿  Done                                                                                               
                                                                  
⏺ Both back. Let me grade them.                                                                             
                                                                                                            
  ---                                                                                                       
  Level 2 Results: Multi-Reference Synthesis                                                                
                                                                                                            
  Test 2A: "New 1,000 sq ft detached ADU on single-family lot — height and setback limits?"                 
  Criteria: Height — base
  Expected: 16 ft for detached
  Actual: 16 ft (§ 66321(b)(4)(A))
  Result: PASS
  ────────────────────────────────────────
  Criteria: Height — transit/multistory
  Expected: 18 ft
  Actual: 18 ft transit (§ 66321(b)(4)(B)), 18 ft multistory (§ 66321(b)(4)(C))
  Result: PASS
  ────────────────────────────────────────
  Criteria: Setbacks — side/rear
  Expected: 4 ft max
  Actual: 4 ft max (§ 66314(d)(7))
  Result: PASS
  ────────────────────────────────────────
  Criteria: Front setback
  Expected: Cannot preclude 800 sq ft ADU
  Actual: Correctly stated (§ 66321(b)(3))
  Result: PASS
  ────────────────────────────────────────
  Criteria: No min lot size
  Expected: Mentioned
  Actual: Not explicitly stated, but noted FAR/lot coverage can't preclude 800 sq ft
  Result: PARTIAL
  ────────────────────────────────────────
  Criteria: Files loaded
  Expected: 5 files (66323, adu-general, height, setbacks, size)
  Actual: Exactly those 5 files
  Result: PASS
  ────────────────────────────────────────
  Criteria: Decision tree path
  Expected: Steps 1 + 2
  Actual: Steps 1 + 2, correctly skipped 3 + 4
  Result: PASS
  ────────────────────────────────────────
  Criteria: Bonus
  Expected: —
  Actual: Distinguished § 66323(a)(2) 800 sq ft cap vs § 66314 pathway for 1,000 sq ft
  Result: BONUS
  Verdict: PASS — Excellent multi-file synthesis. Correctly loaded all 5 expected files. Caught the
  important nuance that 1,000 sq ft exceeds the 66323(a)(2) cap, so it falls under the local ordinance
  pathway. That's a sophisticated distinction.

  ---
  Test 2B: "My HOA says I can't build an ADU. Are they right?"
  ┌─────────────────┬───────────────────────────┬─────────────────────────────────────────────────┬────────┐
  │    Criteria     │         Expected          │                     Actual                      │ Result │
  ├─────────────────┼───────────────────────────┼─────────────────────────────────────────────────┼────────┤
  │ CC&Rs void      │ Civ. Code §§ 714.3, 4751  │ Both cited correctly                            │ PASS   │
  ├─────────────────┼───────────────────────────┼─────────────────────────────────────────────────┼────────┤
  │ Limited         │ HOA can impose some, but  │                                                 │        │
  │ objective       │ not more restrictive than │ Correctly stated with § 714.3(b)                │ PASS   │
  │ standards       │  state law                │                                                 │        │
  ├─────────────────┼───────────────────────────┼─────────────────────────────────────────────────┼────────┤
  │ HOA can't       │                           │                                                 │        │
  │ influence       │ Stated                    │ Explicitly covered with §§ 66315, 66317(c)      │ PASS   │
  │ ministerial     │                           │                                                 │        │
  │ process         │                           │                                                 │        │
  ├─────────────────┼───────────────────────────┼─────────────────────────────────────────────────┼────────┤
  │                 │                           │ All 8 listed (timeline delays, costly           │        │
  │ 8 prohibited    │ Listed                    │ alterations, re-application, neighbor approval, │ PASS   │
  │ HOA actions     │                           │  infeasible placement, structural changes,      │        │
  │                 │                           │ non-objective restrictions, excessive fees)     │        │
  ├─────────────────┼───────────────────────────┼─────────────────────────────────────────────────┼────────┤
  │                 │ ownership-hoa.md,         │ ownership-hoa.md + unit-types-66323.md +        │        │
  │ Files loaded    │ possibly                  │ compliance-ordinances.md                        │ PASS   │
  │                 │ standards-design.md       │                                                 │        │
  ├─────────────────┼───────────────────────────┼─────────────────────────────────────────────────┼────────┤
  │ Decision tree   │ Step 3 → HOA              │ Step 1 → unsure, Step 3 → HOA, Step 4 →         │ PASS   │
  │ path            │                           │ ordinances                                      │        │
  └─────────────────┴───────────────────────────┴─────────────────────────────────────────────────┴────────┘
  Verdict: PASS — Hit every expected element. All 8 prohibited HOA actions listed. Both Civil Code sections
  cited. The extra files loaded (66323 for context, compliance-ordinances for HCD enforcement) are
  defensible routing decisions.

  ---
  Level 2 Summary

  Test 2A: PASS  (5 files loaded correctly, all height/setback values accurate, bonus 66323 vs 66314
  distinction)
  Test 2B: PASS  (CC&R nullification, 8 prohibited actions, ministerial process protection — all covered)

  Multi-reference synthesis works. The decision tree correctly routes through multiple steps and loads the
  right combination of files. Ready for Level 3 — the edge cases?

  --------

  Fire off level 3, let's see it.                                                                           
                                   
⏺ Firing off Level 3 — three parallel sub-agents for the edge cases and tricky rules.                       
                                                                                                          
⏺ 3 Task agents finished (ctrl+o to expand)                                                                 
   ├─ Test 3A: garage conversion fees · 6 tool uses · 27.7k tokens                                          
   │  ⎿  Done                                                                                               
   ├─ Test 3B: code violations denial · 5 tool uses · 27.7k tokens
   │  ⎿  Done                                                                                               
   └─ Test 3C: Airbnb short-term rental · 4 tool uses · 29.1k tokens
      ⎿  Done                                                                                               
                                                                                                            
⏺ All three back. Grading time.                                                                             
                                                                                                            
  ---                                                                                                       
  Level 3 Results: Edge Cases & Tricky Rules                                                                
                                                                                                            
  Test 3A: "Garage conversion with 150 sq ft bump-out — what fees apply?"                                   

  This is the trickiest test — the exterior expansion gotcha.
  ┌────────────────────┬───────────────────────────┬──────────────────────────────────────────────┬────────┐
  │      Criteria      │         Expected          │                    Actual                    │ Result │
  ├────────────────────┼───────────────────────────┼──────────────────────────────────────────────┼────────┤
  │ Expansion counts   │ 700 + 150 = 850 sq ft     │ Correctly calculated 850 sq ft               │ PASS   │
  │ toward total       │                           │                                              │        │
  ├────────────────────┼───────────────────────────┼──────────────────────────────────────────────┼────────┤
  │ Exceeds 750 sq ft  │ Yes → not exempt          │ Correctly identified 850 > 750               │ PASS   │
  │ threshold          │                           │                                              │        │
  ├────────────────────┼───────────────────────────┼──────────────────────────────────────────────┼────────┤
  │ Proportionate fees │ Yes                       │ Proportionate to primary dwelling (§         │ PASS   │
  │  apply             │                           │ 66324(c)(1))                                 │        │
  ├────────────────────┼───────────────────────────┼──────────────────────────────────────────────┼────────┤
  │ Files loaded       │ permit-fees.md,           │ Those two + unit-types-adu-general.md,       │ PASS   │
  │                    │ unit-types-66323.md       │ standards-size.md, zoning-nonconforming.md   │        │
  ├────────────────────┼───────────────────────────┼──────────────────────────────────────────────┼────────┤
  │ Citation           │ § 66324(c)(1)             │ § 66324(c)(1) + (b), (c)(2), (d), (e), Ed.   │ PASS+  │
  │                    │                           │ Code § 17620                                 │        │
  ├────────────────────┼───────────────────────────┼──────────────────────────────────────────────┼────────┤
  │ Catches the gotcha │ Exterior expansion pushes │ Explicitly called it out + suggested keeping │ PASS+  │
  │                    │  over threshold           │  bump-out under 50 sq ft to stay exempt      │        │
  └────────────────────┴───────────────────────────┴──────────────────────────────────────────────┴────────┘
  Verdict: PASS — Nailed the edge case. Correctly identified that the 150 sq ft bump-out counts toward the
  fee threshold, pushing from exempt to proportionate. Even gave practical advice about reducing the
  bump-out size. Also correctly noted utility fees are likely exempt since it's a conversion (§ 66324(b)).
  Excellent.

  ---
  Test 3B: "Building code violations — can the city deny?"
  ┌──────────────────┬──────────────────────────────────────┬─────────────────────────────────────┬────────┐
  │     Criteria     │               Expected               │               Actual                │ Result │
  ├──────────────────┼──────────────────────────────────────┼─────────────────────────────────────┼────────┤
  │ Two-prong test   │ (1) threat to health/safety AND (2)  │ Both prongs stated clearly (§       │ PASS   │
  │                  │ affected by ADU construction         │ 66322(b))                           │        │
  ├──────────────────┼──────────────────────────────────────┼─────────────────────────────────────┼────────┤
  │ 66323 Units      │ Cannot condition approval on         │ Correctly stated: § 66323(c) flatly │ PASS   │
  │ exception        │ correcting nonconformance            │  prohibits it                       │        │
  ├──────────────────┼──────────────────────────────────────┼─────────────────────────────────────┼────────┤
  │ Distinction      │                                      │ Clear two-tier answer — 66323       │        │
  │ between ADU      │ 66323 vs general ADU                 │ protected, general ADU has narrow   │ PASS   │
  │ types            │                                      │ exception                           │        │
  ├──────────────────┼──────────────────────────────────────┼─────────────────────────────────────┼────────┤
  │ Files loaded     │ zoning-nonconforming.md,             │ Those two + permit-process.md,      │ PASS   │
  │                  │ unit-types-66323.md                  │ standards-size.md                   │        │
  ├──────────────────┼──────────────────────────────────────┼─────────────────────────────────────┼────────┤
  │ Citations        │ § 66322, § 66323                     │ § 66323(c), § 66322(b), § 66313(h), │ PASS   │
  │                  │                                      │  § 66317(a)                         │        │
  └──────────────────┴──────────────────────────────────────┴─────────────────────────────────────┴────────┘
  Verdict: PASS — Correctly distinguished the two tiers. The key nuance — 66323 Units get absolute
  protection while general ADUs face a narrow two-prong test — was clearly articulated.

  ---
  Test 3C: "Can I do a short-term Airbnb rental?"
  ┌───────────────────┬────────────────────────┬──────────────────────────────────────────────────┬────────┐
  │     Criteria      │        Expected        │                      Actual                      │ Result │
  ├───────────────────┼────────────────────────┼──────────────────────────────────────────────────┼────────┤
  │ Answer            │ No, 30-day minimum     │ No, 30-day minimum                               │ PASS   │
  ├───────────────────┼────────────────────────┼──────────────────────────────────────────────────┼────────┤
  │ Cities can        │ Yes                    │ Yes (§ 66315)                                    │ PASS   │
  │ require longer    │                        │                                                  │        │
  ├───────────────────┼────────────────────────┼──────────────────────────────────────────────────┼────────┤
  │ 66323 Units       │ 30-day minimum by      │ Correctly cited § 66323(e) — mandatory, not      │ PASS   │
  │ mandatory         │ state law              │ optional                                         │        │
  ├───────────────────┼────────────────────────┼──────────────────────────────────────────────────┼────────┤
  │ Files loaded      │ ownership-use.md       │ ownership-use.md + cross-refs to                 │ PASS   │
  │                   │                        │ unit-types-66323.md, unit-types-jadu.md          │        │
  ├───────────────────┼────────────────────────┼──────────────────────────────────────────────────┼────────┤
  │ Citation          │ § 66315, § 66323       │ § 66315, § 66323(e), § 66333(b)                  │ PASS   │
  ├───────────────────┼────────────────────────┼──────────────────────────────────────────────────┼────────┤
  │ Bonus             │ —                      │ Summary table by ADU type, JADU owner-occupancy  │ BONUS  │
  │                   │                        │ interaction                                      │        │
  └───────────────────┴────────────────────────┴──────────────────────────────────────────────────┴────────┘
  Verdict: PASS — Correctly distinguished between 66323 Units (mandatory 30-day state law) vs local
  ordinance ADUs (city may impose 30-day minimum). Also covered JADU angle with owner-occupancy
  complication.

  ---
  Level 3 Summary

  Test 3A: PASS  (caught the exterior expansion fee gotcha — the trickiest rule in the skill)
  Test 3B: PASS  (two-tier nonconformance rule correctly distinguished)
  Test 3C: PASS  (30-day minimum + 66323 mandatory vs city-optional distinction)

  Edge cases handled correctly. The skill catches nuances like exterior expansions counting toward fee
  thresholds and the two-tier nonconformance protection. Ready for Level 4 — the full scenario with the
  built-in trap?

  -------

   let's do level 4 Good shit, Claude. Let's keep it rippin'                                                 
                                                             
⏺ Let's go. Level 4 — the full scenario with the trap baked in. One sub-agent, full decision tree           
  walkthrough.                                 
                                                                                                            
⏺ Task(Test 4: full scenario with trap)                           
  ⎿  Done (12 tool uses · 50.2k tokens · 1m 46s)                                                            
                                                                                                            
⏺ Beast mode. Let me grade it.         
                                                                                                            
  ---                                                                                                       
  Level 4 Results: Full Scenario Walkthrough                                                                
                                                                                                            
  Test 4: "Single-family, coastal zone, ½ mile from light rail, 800 sq ft detached, 2 bedrooms"             
  ┌────────────────────┬───────────────────────────────┬──────────────────────────────────────────┬────────┐
  │      Criteria      │           Expected            │                  Actual                  │ Result │
  ├────────────────────┼───────────────────────────────┼──────────────────────────────────────────┼────────┤
  │ Unit type          │ 66323(a)(2) detached          │ Correctly classified as 66323(a)(2)      │ PASS   │
  ├────────────────────┼───────────────────────────────┼──────────────────────────────────────────┼────────┤
  │ Height             │ 18 ft (transit bonus) + 2 ft  │ 18 ft with +2 ft roof pitch (§           │ PASS   │
  │                    │ roof pitch                    │ 66321(b)(4)(B))                          │        │
  ├────────────────────┼───────────────────────────────┼──────────────────────────────────────────┼────────┤
  │ Setbacks           │ 4 ft max side/rear            │ 4 ft max (§ 66314(d)(7))                 │ PASS   │
  ├────────────────────┼───────────────────────────────┼──────────────────────────────────────────┼────────┤
  │ THE TRAP: Size vs  │ 800 sq ft too small for 2-BR  │ Flagged as BLOCKING — even caught that   │ PASS+  │
  │ bedrooms           │ (min 1,000)                   │ 800 < 850 for 1-BR too                   │        │
  ├────────────────────┼───────────────────────────────┼──────────────────────────────────────────┼────────┤
  │ Parking            │ Exempt (transit)              │ Exempt under both 66323 and transit      │ PASS   │
  │                    │                               │ exemption                                │        │
  ├────────────────────┼───────────────────────────────┼──────────────────────────────────────────┼────────┤
  │ Fees               │ 800 sq ft > 750 →             │ Correctly identified not exempt,         │ PASS   │
  │                    │ proportionate                 │ proportionate fees apply                 │        │
  ├────────────────────┼───────────────────────────────┼──────────────────────────────────────────┼────────┤
  │ Coastal zone       │ ADU laws apply, Coastal Act   │ Correctly stated § 66329, LCP may add    │ PASS   │
  │                    │ still in effect               │ requirements                             │        │
  ├────────────────────┼───────────────────────────────┼──────────────────────────────────────────┼────────┤
  │ Solar              │ Required (new detached)       │ Required per Title 24, can go on ADU or  │ PASS   │
  │                    │                               │ primary                                  │        │
  ├────────────────────┼───────────────────────────────┼──────────────────────────────────────────┼────────┤
  │ Process            │ Ministerial, 60-day deadline  │ 30-day completeness + 60-day approval +  │ PASS   │
  │                    │                               │ deemed-approved                          │        │
  ├────────────────────┼───────────────────────────────┼──────────────────────────────────────────┼────────┤
  │ Fire sprinklers    │ Only if required for primary  │ Correctly stated (§ 66314(d)(12))        │ PASS   │
  ├────────────────────┼───────────────────────────────┼──────────────────────────────────────────┼────────┤
  │ Files loaded       │ 8-10 expected                 │ 11 files across all 4 decision tree      │ PASS   │
  │                    │                               │ steps                                    │        │
  ├────────────────────┼───────────────────────────────┼──────────────────────────────────────────┼────────┤
  │ Decision tree      │ All 4 steps                   │ All 4 steps with correct routing at each │ PASS   │
  │ coverage           │                               │                                          │        │
  └────────────────────┴───────────────────────────────┴──────────────────────────────────────────┴────────┘
  The Trap

  The agent didn't just catch it — it went deeper than expected:

  1. 800 sq ft with 2 bedrooms: Flagged as BLOCKING. Min is 1,000 sq ft for 2-BR. Caught.
  2. 800 sq ft with 1 bedroom: Also flagged — min is 850 sq ft for 1-BR. 800 < 850. Bonus catch.
  3. Gave two options: Either increase to 1,000 sq ft (leaves 66323 pathway) or reduce to studio/efficiency.
  4. Noted the tradeoff: Going to 1,000 sq ft means local design/zoning standards apply (loses 66323
  streamlining).

  That's exactly the kind of analysis a contractor needs — not just "you can't do this" but "here are your
  options and the tradeoffs."

  ---
  Level 4 Summary

  Test 4: PASS  (caught the size/bedroom trap + identified the 1-BR issue too)
           11 files loaded across all 4 decision tree steps
           30+ code sections cited
           Practical options provided for resolving the conflict

  The decision tree works end-to-end. Full scenario routing across all 4 steps, correct file loading,
  accurate synthesis across 11 reference files, and it caught both the primary trap and a secondary trap we
  didn't even explicitly test for.

  ---
  Levels 1-4: 9 for 9. The California ADU skill is validated. Level 5 (the real corrections letter) is the
  one you'll want to run as a separate instance and watch live — that's the money shot. Want to move on to
  that, or anything else first?