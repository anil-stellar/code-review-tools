import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// TASK_FLOW_HOME lets the tests point every hook at a scratch folder instead of ~/.claude.
export const FLOW_DIR = process.env.TASK_FLOW_HOME || join(homedir(), ".claude", "task-flow");
const SESSIONS_DIR = join(FLOW_DIR, ".sessions");
const MAX_AGE_MS = 12 * 60 * 60 * 1000;

export const COMMANDS = ["task-analyse", "task-implement", "task-test", "task-review", "task-push", "task-comment"];

export function readInput() {
  try {
    const raw = readFileSync(0, "utf8");
    return raw.trim() ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: reason },
    }),
  );
  process.exit(0);
}

export function commandIn(text) {
  const m = /(?:^|[\s/:])(task-(?:analyse|analyze|implement|test|review|push|comment))\b/i.exec(text || "");
  return m ? m[1].toLowerCase().replace("analyze", "analyse") : null;
}

export function setSession(sessionId, command) {
  if (!sessionId || !command) return;
  mkdirSync(SESSIONS_DIR, { recursive: true });
  writeFileSync(join(SESSIONS_DIR, `${sessionId}.json`), JSON.stringify({ command, at: Date.now() }));
}

// A session counts as a task-flow session only while its last task command is recent.
export function getSession(sessionId) {
  if (!sessionId) return null;
  const file = join(SESSIONS_DIR, `${sessionId}.json`);
  if (!existsSync(file)) return null;
  try {
    const s = JSON.parse(readFileSync(file, "utf8"));
    return Date.now() - s.at < MAX_AGE_MS ? s : null;
  } catch {
    return null;
  }
}

export function recentStates() {
  if (!existsSync(FLOW_DIR)) return [];
  const out = [];
  for (const name of readdirSync(FLOW_DIR)) {
    if (name.startsWith(".")) continue;
    const file = join(FLOW_DIR, name, "state.json");
    const st = statSync(file, { throwIfNoEntry: false });
    if (!st || Date.now() - st.mtimeMs > MAX_AGE_MS) continue;
    try {
      out.push({ file, mtime: st.mtimeMs, state: JSON.parse(readFileSync(file, "utf8")) });
    } catch {
      // A half-written state file is the skill's problem to report, not a reason to block.
    }
  }
  return out.sort((a, b) => b.mtime - a.mtime);
}

function textOf(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  if (content.some((c) => c && c.type === "tool_result")) return "";
  return content.filter((c) => c && c.type === "text").map((c) => c.text).join("\n");
}

const INJECTED = /<(system-reminder|ide_[a-z_]+|local-command-[a-z]+|task-notification)[^>]*>[\s\S]*?<\/\1>/g;

// The newest message the developer typed: tool results, injected context and meta entries skipped.
export function lastUserText(transcriptPath) {
  if (!transcriptPath || !existsSync(transcriptPath)) return null;
  let lines;
  try {
    lines = readFileSync(transcriptPath, "utf8").split("\n");
  } catch {
    return null;
  }
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i].trim()) continue;
    let e;
    try {
      e = JSON.parse(lines[i]);
    } catch {
      continue;
    }
    if (e.type !== "user" || e.isMeta || e.isCompactSummary) continue;
    const text = textOf(e.message?.content).replace(INJECTED, "").trim();
    if (text) return text;
  }
  return null;
}

const NEGATIVE = /\b(na|naa|nahi|nai|nathi|no|nope|not|mat|wait|ruk|ruko|cancel|stop|pan|but|change|badal|badlo|pachhi|later)\b/i;
const YES = /^(ha+|han|haan|haa+n|hmm+ ha|yes|yeah|yep|y|ok|okay|okk+|sure|go|go ahead|confirm(ed)?|push|post|kar|kari|karo|kr|kri)\b/i;

// A yes must be short and unconditional: "ha, pan title badlo" is a change request, not a yes.
export function isYes(text) {
  if (!text) return false;
  const t = text.trim().replace(/[.!\s]+$/, "");
  if (t.length > 60 || t.startsWith("<") || t.startsWith("/")) return false;
  if (NEGATIVE.test(t)) return false;
  return YES.test(t);
}
