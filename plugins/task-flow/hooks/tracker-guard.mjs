#!/usr/bin/env node
// In a task-flow session: a tracker write (comment, create, update, delete) only right after the
// developer's yes — comments only in task-comment, new tasks only in task-test (a split-off bug).
import { deny, getSession, isYes, lastUserText, readInput } from "./lib.mjs";

const input = readInput();
if (!input) process.exit(0);
const tool = String(input.tool_name || "");
if (!/^mcp__.*(asana|jira|atlassian|linear)/i.test(tool)) process.exit(0);

const action = tool.split("__").pop() || "";
if (!/^(add_|create_|update_|delete_|post_|transition_|edit_)/i.test(action)) process.exit(0);

const session = getSession(input.session_id);
if (!session) process.exit(0);

const allowedHere =
  (session.command === "task-comment" && /comment/i.test(action)) ||
  (session.command === "task-test" && /^create_task/i.test(action));
if (!allowedHere) {
  deny(`Blocked by task-flow: ${action} is not allowed in ${session.command}. Comments go out only from /task-flow:task-comment; a split-off task only from /task-flow:task-test.`);
}
if (!isYes(lastUserText(input.transcript_path))) {
  deny("Blocked by task-flow: show the exact text first and ask the developer; post only after a plain yes.");
}
process.exit(0);
