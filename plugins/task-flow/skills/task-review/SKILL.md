---
name: task-review
description: Step 4 of the task flow. Runs the code-reviewer plugin on this task's changes in each repo, fixes blocker and major findings, retests what the fixes touch, and reports the minor ones. Use for "/task-flow:task-review", "review the task", "review kar".
argument-hint: "[task id]"
---

# task-review

Read `${CLAUDE_SKILL_DIR}/../../shared/common.md` first and follow it. Needs status `tested`.

## Steps

### 1. Review each repo
For each repo with changed files, run the `code-reviewer:review` skill (the `code-reviewer`
plugin from this marketplace) once **per repo** — it reviews one repo per run — scoped to this
task's changed paths only, never the `baselineDirty` files:

`/code-reviewer:review <path> <path> …` from that repo (or with the paths of that repo).

If the `code-reviewer` plugin is not installed: say so, give the install line
(`/plugin install code-reviewer@code-review-tools`) and stop `blocked`.

The review follows its own rules (the repo's `.claude/review/rules.md`, when present). Use FAST;
suggest `deep` in one line if the plan touches a migration, permissions, money, or 30+ files, and
let the developer decide.

### 2. Fix
- **Blocker / Major** → fix each one in the task's files (outside the plan → ask first, as in
  `task-implement`). Record in `review.fixed`.
- **Minor** → do not fix on your own; list them. Fix any the developer picks.
- A finding about code this task did not change → not this task's; list it as "seen, not ours".

### 3. Retest what the fixes touched
Rerun the static checks and the Playwright specs/scripts that cover each fixed file. A new fail →
fix (counts toward a 3-round limit, as in `task-test`).

If the fixes were large (a new file, a changed signature), run `task-test` steps 2–4 in full.

### 4. Review again
Rerun the review on the fixed files once. Clean of blockers and majors → status `reviewed`,
`run.result: done`. Still a blocker or major after the second pass → `blocked`, listed.

### 5. Report
Write `review.md`. Chat: finding counts per repo (fixed / left), each left minor in one line, the
retest result. `Next: /task-flow:task-push`.
