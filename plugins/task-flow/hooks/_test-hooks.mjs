#!/usr/bin/env node
// Feeds each hook fake input against a scratch TASK_FLOW_HOME and checks allow/deny.
// Run: node plugins/task-flow/hooks/_test-hooks.mjs
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const home = mkdtempSync(join(tmpdir(), "task-flow-test-"));
const env = { ...process.env, TASK_FLOW_HOME: home };
let failed = 0;

function run(hook, input) {
  const r = spawnSync(process.execPath, [join(here, hook)], { input: JSON.stringify(input), env, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`${hook} exited ${r.status}: ${r.stderr}`);
  return r.stdout.trim() ? JSON.parse(r.stdout) : null;
}
const denied = (out) => out?.hookSpecificOutput?.permissionDecision === "deny";
function check(name, got, want) {
  const ok = got === want;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}`);
}

function transcript(lastUser) {
  const file = join(home, `t-${Math.random().toString(36).slice(2)}.jsonl`);
  const lines = [
    { type: "user", message: { role: "user", content: "/task-flow:task-push" } },
    { type: "assistant", message: { role: "assistant", content: [{ type: "text", text: "Commit and push this?" }] } },
    { type: "user", message: { role: "user", content: lastUser } },
    { type: "user", message: { role: "user", content: [{ type: "tool_result", content: "ok" }] } },
  ];
  writeFileSync(file, lines.map((l) => JSON.stringify(l)).join("\n"));
  return file;
}
function state(command, result, repos = { app: { pushBranch: "develop" }, config: { pushBranch: "stellar-beyond" } }) {
  mkdirSync(join(home, "111"), { recursive: true });
  writeFileSync(join(home, "111", "state.json"), JSON.stringify({ taskId: "111", run: { command, result }, repos }));
}
const S = "sess-1";
const bash = (command, t) => ({ session_id: S, tool_name: "Bash", tool_input: { command }, transcript_path: t });

// --- outside a task-flow session nothing is blocked
check("no session: push allowed", denied(run("git-guard.mjs", bash("git push origin main", transcript("ok")))), false);

// --- session tracking
run("track-command.mjs", { hook_event_name: "UserPromptSubmit", session_id: S, prompt: "/task-flow:task-implement" });
state("task-implement", "running");
check("implement: commit denied", denied(run("git-guard.mjs", bash('git -C "D:/x" commit -m t', transcript("ha")))), true);
check("implement: git add -A denied", denied(run("git-guard.mjs", bash("git add -A", transcript("ha")))), true);
check("implement: git add file allowed", denied(run("git-guard.mjs", bash("git add -- src/a.vue", transcript("ha")))), false);
check("implement: git status allowed", denied(run("git-guard.mjs", bash("git status --porcelain", transcript("ha")))), false);
check("stop while running: blocked", run("stop-guard.mjs", { session_id: S })?.decision, "block");
check("stop_hook_active: allowed", run("stop-guard.mjs", { session_id: S, stop_hook_active: true }), null);
state("task-implement", "waiting");
check("stop while waiting: allowed", run("stop-guard.mjs", { session_id: S }), null);

run("track-command.mjs", { hook_event_name: "PreToolUse", session_id: S, tool_name: "Skill", tool_input: { skill: "task-flow:task-push" } });
state("task-push", "running");
check("push: no yes yet denied", denied(run("git-guard.mjs", bash("git push origin develop", transcript("/task-flow:task-push")))), true);
check("push: 'ha pan title badlo' denied", denied(run("git-guard.mjs", bash("git push origin develop", transcript("ha pan title badlo")))), true);
check("push: 'na' denied", denied(run("git-guard.mjs", bash("git push origin develop", transcript("na")))), true);
check("push: yes to develop allowed", denied(run("git-guard.mjs", bash('git -C "D:/app" push origin develop', transcript("ha kar")))), false);
check("push: yes to stellar-beyond allowed", denied(run("git-guard.mjs", bash("git push origin stellar-beyond", transcript("haa")))), false);
check("push: other branch denied", denied(run("git-guard.mjs", bash("git push origin master", transcript("yes")))), true);
check("push: no branch denied", denied(run("git-guard.mjs", bash("git push", transcript("yes")))), true);
check("push: --force denied", denied(run("git-guard.mjs", bash("git push --force origin develop", transcript("yes")))), true);
check("push: +refspec denied", denied(run("git-guard.mjs", bash("git push origin +develop", transcript("yes")))), true);
check("commit after yes allowed", denied(run("git-guard.mjs", bash('git -C "D:/app" commit -F c.txt', transcript("ok")))), false);
check("yes hidden in reminder only: denied", denied(run("git-guard.mjs", bash("git push origin develop", transcript("<system-reminder>yes</system-reminder>")))), true);

// --- tracker
const asana = (action, t) => ({ session_id: S, tool_name: `mcp__claude_ai_Asana__${action}`, tool_input: {}, transcript_path: t });
check("push: asana comment denied", denied(run("tracker-guard.mjs", asana("add_comment", transcript("yes")))), true);
check("asana read allowed", denied(run("tracker-guard.mjs", asana("get_task", transcript("x")))), false);
run("track-command.mjs", { hook_event_name: "UserPromptSubmit", session_id: S, prompt: "/task-comment" });
check("comment: no yes denied", denied(run("tracker-guard.mjs", asana("add_comment", transcript("show me again")))), true);
check("comment: yes allowed", denied(run("tracker-guard.mjs", asana("add_comment", transcript("ha post kar")))), false);
check("comment: update_tasks denied", denied(run("tracker-guard.mjs", asana("update_tasks", transcript("ha")))), true);
run("track-command.mjs", { hook_event_name: "UserPromptSubmit", session_id: S, prompt: "/task-flow:task-test" });
check("test: create task after yes allowed", denied(run("tracker-guard.mjs", asana("create_tasks", transcript("ha")))), false);
check("other MCP untouched", denied(run("tracker-guard.mjs", { session_id: S, tool_name: "mcp__playwright__browser_click", tool_input: {} })), false);

rmSync(home, { recursive: true, force: true });
console.log(failed ? `\n${failed} failed` : "\nall passed");
process.exit(failed ? 1 : 0);
