#!/usr/bin/env node
// A task command may not end its turn mid-step: state.json's run.result must say done,
// waiting (a question was asked) or blocked (with a reason) before the turn ends.
import { getSession, readInput, recentStates } from "./lib.mjs";

const input = readInput();
if (!input || input.stop_hook_active) process.exit(0);
const session = getSession(input.session_id);
if (!session) process.exit(0);

const open = recentStates().find((s) => s.state?.run?.command === session.command && s.state?.run?.result === "running");
if (!open) process.exit(0);

process.stdout.write(
  JSON.stringify({
    decision: "block",
    reason:
      `task-flow: ${session.command} for task ${open.state.taskId} is still marked running in ${open.file}. ` +
      `Finish its remaining steps, or set run.result to "waiting" (you asked the developer something) ` +
      `or "blocked" with run.reason, then end with the report.`,
  }),
);
process.exit(0);
