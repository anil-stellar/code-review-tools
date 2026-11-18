#!/usr/bin/env node
// Records which task-flow command a session is running, from a typed slash command
// (UserPromptSubmit) or a model-invoked skill (PreToolUse on Skill). The guards key off it.
import { commandIn, readInput, setSession } from "./lib.mjs";

const input = readInput();
if (!input) process.exit(0);

if (input.hook_event_name === "UserPromptSubmit") {
  const prompt = (input.prompt || "").trim();
  if (/^\/(task-flow:)?task-/i.test(prompt)) setSession(input.session_id, commandIn(prompt));
} else if (input.tool_name === "Skill") {
  const skill = input.tool_input?.skill || "";
  if (/^(task-flow:)?task-/i.test(skill)) setSession(input.session_id, commandIn(skill));
}
process.exit(0);
