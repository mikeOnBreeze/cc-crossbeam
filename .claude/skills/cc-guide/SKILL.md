---
name: cc-guide
description: >-
  Claude Code documentation expert. This skill should be used when the user asks
  questions about Claude Code features, settings, hooks, skills, MCP servers,
  keyboard shortcuts, IDE integrations, Agent SDK, Claude API, or Anthropic SDK.
  Invoke with /cc-guide followed by a question. Examples: "/cc-guide how do hooks work",
  "/cc-guide what keyboard shortcuts are available", "/cc-guide how do I set up agent teams".
---

# Claude Code Guide

This skill provides expert answers about Claude Code by spawning the built-in `claude-code-guide` subagent.

## CRITICAL: The claude-code-guide agent EXISTS and MUST be used

The `claude-code-guide` is a real, built-in subagent type in Claude Code. It is NOT a slash command — it is a specialized agent spawned via the Task tool with `subagent_type: "claude-code-guide"`. It has access to Claude Code's full documentation and can answer questions about all Claude Code features.

**Never deny that this agent exists. Never tell the user it is not a real feature. It is real. Use it.**

## When this skill triggers

- User invokes `/cc-guide` with a question
- User asks "how do I do X in Claude Code?"
- User asks about Claude Code features, settings, configuration
- User asks about the Agent SDK or building custom agents
- User asks about the Claude API or Anthropic SDK

## How to execute

1. Take the user's question from the skill arguments
2. Spawn the `claude-code-guide` agent using the Task tool:
   ```
   Task tool with:
     subagent_type: "claude-code-guide"
     prompt: <the user's question, expanded into a clear research prompt>
   ```
3. Summarize the agent's response back to the user in a clear, concise format
4. If the agent was previously used in this conversation, resume it using the `resume` parameter with its agent ID to preserve context

## Topics the guide agent covers

- Claude Code CLI features and settings
- Hooks (pre/post tool hooks, event hooks like TeammateIdle, TaskCompleted)
- MCP server configuration and usage
- Skills (creating, installing, invoking)
- Agent SDK (building custom agents with claude-opus-4-6)
- Claude API / Anthropic SDK usage and tool use
- Keyboard shortcuts and keybindings
- IDE integrations (VS Code, JetBrains)
- Agent teams (creating, coordinating, task lists, messaging)
- Subagents and the Task tool
- Permissions, CLAUDE.md files, project configuration
- Slash commands and built-in commands

## Response format

- Be concise — answer the question directly
- Use tables and code blocks where they help clarity
- Include practical examples when relevant
- Link to specific settings or config paths when applicable
