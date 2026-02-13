/**
 * Progress Event Handler + Subagent Lifecycle Tracker
 *
 * Formats and logs Agent SDK streaming messages to console.
 * Tracks subagent spawn/resolution timing for pipeline debugging.
 */
import fs from 'fs';
import path from 'path';

// --- Subagent Lifecycle Tracking ---

type SubagentRecord = {
  index: number;
  description: string;
  spawnTime: number;
  spawnElapsed: string;       // e.g., "1.3m"
  toolUseId: string;          // tool_use block id for correlation
  resolveTime?: number;
  resolveElapsed?: string;
  durationSec?: number;
};

export class SubagentTracker {
  private subagents: Map<string, SubagentRecord> = new Map();
  private spawnOrder: string[] = [];
  private startTime: number;
  private nextIndex = 1;

  constructor(startTime: number) {
    this.startTime = startTime;
  }

  /** Call when a Task tool_use block is seen */
  trackSpawn(toolUseId: string, description: string): void {
    const now = Date.now();
    const elapsed = this.formatElapsed(now);
    const record: SubagentRecord = {
      index: this.nextIndex++,
      description,
      spawnTime: now,
      spawnElapsed: elapsed,
      toolUseId,
    };
    this.subagents.set(toolUseId, record);
    this.spawnOrder.push(toolUseId);
    console.log(`  [${elapsed}] 🚀 Subagent #${record.index} spawned: ${description}`);
  }

  /** Call when a TaskOutput tool_use block is seen (polling) */
  trackPoll(taskId?: string): void {
    const elapsed = this.formatElapsed(Date.now());
    const pending = this.getPendingCount();
    console.log(`  [${elapsed}] ⏳ TaskOutput poll (${pending} subagent${pending !== 1 ? 's' : ''} pending)`);
  }

  /**
   * Mark a subagent as resolved. Since we can't always correlate TaskOutput
   * to specific subagents from the stream, this can also be called from
   * file-timestamp analysis after the run.
   */
  markResolved(toolUseId: string): void {
    const record = this.subagents.get(toolUseId);
    if (record && !record.resolveTime) {
      record.resolveTime = Date.now();
      record.resolveElapsed = this.formatElapsed(record.resolveTime);
      record.durationSec = (record.resolveTime - record.spawnTime) / 1000;
      console.log(`  [${record.resolveElapsed}] ✅ Subagent #${record.index} resolved (${record.durationSec.toFixed(0)}s): ${record.description}`);
    }
  }

  /** Mark all unresolved subagents as resolved (call when parent gets result) */
  markAllResolved(): void {
    for (const [id, record] of this.subagents) {
      if (!record.resolveTime) {
        this.markResolved(id);
      }
    }
  }

  getPendingCount(): number {
    return [...this.subagents.values()].filter(r => !r.resolveTime).length;
  }

  /** Print summary table of all subagent timings */
  printSummary(): void {
    if (this.subagents.size === 0) {
      console.log('\n  No subagents were spawned.');
      return;
    }

    console.log(`\n--- Subagent Timing Summary (${this.subagents.size} subagents) ---`);
    console.log('  #  | Spawned | Resolved | Duration | Description');
    console.log('  ---|---------|----------|----------|------------');

    for (const id of this.spawnOrder) {
      const r = this.subagents.get(id)!;
      const dur = r.durationSec ? `${r.durationSec.toFixed(0)}s`.padStart(7) : '    ???';
      const resolved = r.resolveElapsed ?? '???';
      console.log(`  ${String(r.index).padStart(2)} | ${r.spawnElapsed.padEnd(7)} | ${resolved.padEnd(8)} | ${dur}  | ${r.description}`);
    }

    // Bottleneck analysis
    const resolved = [...this.subagents.values()].filter(r => r.durationSec);
    if (resolved.length > 0) {
      const slowest = resolved.reduce((a, b) => (a.durationSec! > b.durationSec!) ? a : b);
      const fastest = resolved.reduce((a, b) => (a.durationSec! < b.durationSec!) ? a : b);
      const totalWait = slowest.durationSec!;
      console.log(`\n  ⚡ Fastest: #${fastest.index} (${fastest.durationSec!.toFixed(0)}s) — ${fastest.description}`);
      console.log(`  🐌 Slowest: #${slowest.index} (${slowest.durationSec!.toFixed(0)}s) — ${slowest.description}`);
      console.log(`  📊 Wall-clock wait: ${totalWait.toFixed(0)}s (gated by slowest subagent)`);
    }
  }

  /**
   * Infer subagent resolution timing from session directory file timestamps.
   * Maps known research file patterns to subagent descriptions.
   */
  analyzeFileTimestamps(sessionDir: string): void {
    const researchFiles = [
      { pattern: /research_state|state_law_findings/, label: 'State law' },
      { pattern: /research_city|city_research|city_discovery/, label: 'City research' },
      { pattern: /research_sheet|sheet_observations/, label: 'Sheet viewer' },
    ];

    console.log('\n--- File Timestamp Analysis ---');

    try {
      const files = fs.readdirSync(sessionDir);
      const fileStats: { name: string; mtime: Date; size: number }[] = [];

      for (const file of files) {
        const stat = fs.statSync(path.join(sessionDir, file));
        fileStats.push({ name: file, mtime: stat.mtime, size: stat.size });
      }

      // Sort by modification time
      fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());

      const firstTime = fileStats[0]?.mtime.getTime() ?? this.startTime;

      for (const f of fileStats) {
        const offsetSec = ((f.mtime.getTime() - this.startTime) / 1000).toFixed(0);
        const offsetMin = ((f.mtime.getTime() - this.startTime) / 1000 / 60).toFixed(1);
        const sizeKB = (f.size / 1024).toFixed(1);

        // Try to match to a research subagent
        let label = '';
        for (const rf of researchFiles) {
          if (rf.pattern.test(f.name)) {
            label = ` ← ${rf.label} subagent`;
            break;
          }
        }

        console.log(`  [${offsetMin.padStart(5)}m] ${f.name.padEnd(35)} ${sizeKB.padStart(6)}KB${label}`);
      }
    } catch {
      console.log('  (could not read session directory)');
    }
  }

  private formatElapsed(now: number): string {
    return ((now - this.startTime) / 1000 / 60).toFixed(1) + 'm';
  }
}

// --- Standard Message Handler ---

export function handleProgressMessage(
  msg: any,
  startTime: number,
  tracker?: SubagentTracker,
): void {
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
            // Subagent lifecycle tracking
            if (tracker && block.name === 'Task') {
              const desc = block.input?.description ?? block.input?.prompt?.slice(0, 60) ?? 'unknown';
              tracker.trackSpawn(block.id, desc);
            } else if (tracker && block.name === 'TaskOutput') {
              tracker.trackPoll(block.input?.task_id);
            } else {
              // Regular tool call logging
              const detail = formatToolDetail(block);
              console.log(`  [${elapsed}m] ${block.name}${detail}`);
            }
          }
        }
      }
      break;

    case 'result':
      // Mark all subagents resolved when parent finishes
      if (tracker) {
        tracker.markAllResolved();
      }

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
    case 'TodoWrite':
      return '';
    default:
      return '';
  }
}

function basename(filePath: string): string {
  return filePath.split('/').pop() ?? filePath;
}
