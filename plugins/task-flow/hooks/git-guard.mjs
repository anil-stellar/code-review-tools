#!/usr/bin/env node
// In a task-flow session: commit and push only inside task-push, only right after the
// developer's yes, only to a push branch the task's state names, never forced.
import { deny, getSession, isYes, lastUserText, readInput, recentStates } from "./lib.mjs";

const input = readInput();
if (!input) process.exit(0);
const session = getSession(input.session_id);
if (!session) process.exit(0);

const cmd = String(input.tool_input?.command || "");
const GIT = String.raw`\bgit(?:\s+(?:-C\s+(?:"[^"]*"|'[^']*'|\S+)|-c\s+\S+|--no-pager))*\s+`;
const ops = [...cmd.matchAll(new RegExp(GIT + String.raw`(commit|push|add)\b([^\n;&|]*)`, "g"))];
if (ops.length === 0) process.exit(0);

for (const [, op, rest] of ops) {
  if (op === "add") {
    if (/(^|\s)(-A|--all|-u|--update|\.|\*|:\/)(\s|$)/.test(rest)) {
      deny("Blocked by task-flow: stage the task's files by explicit path only (git add -- <file> …), never -A, -u or '.', so the developer's own edits stay out.");
    }
    continue;
  }

  if (session.command !== "task-push") {
    deny(`Blocked by task-flow: git ${op} runs only in /task-flow:task-push, after the developer says yes. This session is in ${session.command}.`);
  }
  if (!isYes(lastUserText(input.transcript_path))) {
    deny(`Blocked by task-flow: the developer's latest message is not a plain yes. Show the files, the branch and the commit message, ask "Commit and push this?", and wait for the answer.`);
  }
  if (op === "push") {
    if (/(^|\s)(-f|--force|--force-with-lease|--force-if-includes|--delete|-d|--mirror|--all|--prune)(\s|=|$)|\s\+\S/.test(rest)) {
      deny("Blocked by task-flow: no forced, deleting or all-branch pushes. Use: git -C \"<repo>\" push origin <push-branch>");
    }
    const m = /\borigin\s+(?:HEAD:)?(?:refs\/heads\/)?["']?([^\s"';&|]+)/.exec(rest);
    if (!m) deny("Blocked by task-flow: name the branch: git -C \"<repo>\" push origin <push-branch>");
    const active = recentStates().find((s) => s.state?.run?.command === "task-push");
    const allowed = new Set(Object.values(active?.state?.repos || {}).map((r) => r.pushBranch).filter(Boolean));
    if (!allowed.has(m[1])) {
      deny(`Blocked by task-flow: '${m[1]}' is not a push branch of this task (${[...allowed].join(", ") || "none recorded in state.json"}).`);
    }
  }
}
process.exit(0);
