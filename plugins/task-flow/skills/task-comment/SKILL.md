---
name: task-comment
description: Step 6 of the task flow. Drafts the tracker comment — what was done, the decisions taken and why, what to check, and the commit links — shows it, and posts it with the tracker MCP only after the developer's yes. Use for "/task-flow:task-comment", "comment the task", "asana comment kar".
argument-hint: "[task id]"
---

# task-comment

Read `${CLAUDE_SKILL_DIR}/../../shared/common.md` first and follow it. Needs status `pushed`.
Comment format: the rules file's `Comment format` section, else
`${CLAUDE_SKILL_DIR}/../../shared/report.md` § Tracker comment.

The `tracker-guard` hook allows a tracker write only after the developer's latest message is a yes.

## Steps

### 1. Draft
Write `comment.md` from the format:
- **What it does** — behaviour as the user sees it, from `plan.md` and the evidence. Plain words.
- **Decisions taken** — every locked decision: the question, the answer, and the short why. The
  task's owner never saw these being made; this is where they do.
- **What to check** — neutral steps a tester can follow (where, what to do, what should happen).
  No pass/fail results.
- **Code** — every repo's commit link and branch, from `push.commits`.
- Split tasks made during `task-test` — one line each with their link, if any.

Leave out: test results, internal findings, file lists, anything about the flow itself.

### 2. Ask
Show the draft exactly as it will be posted, and ask "Post this on the task?" `run.result:
waiting`, stop.
- A change → apply, show again, ask again.
- No → keep the draft, `run.result: done`, status stays `pushed`. Say where the draft is.

### 3. After the yes
Post `comment.md`'s text as a comment on this task id only, with the tracker MCP (Asana:
`add_comment`). Record the comment url in `comment.url`, `comment.approvedAt`, status `commented`,
`run.result: done`.

Do not change the task's status, assignee, section or completion — the flow stops at the comment.

### 4. Report
One line with the comment link. Then a short wrap-up: the task is done in the flow; the task folder
stays at `~/.claude/task-flow/<task-id>/` for reference.
