---
name: task-test
description: Step 3 of the task flow. Runs the repos' static checks, then tests the whole module with Playwright (the existing spec plus the task's own scripts and every screen on the effect list), compares before and after, proves each requirement and decision, fixes what the change broke, and asks the developer about anything that was broken before. Use for "/task-flow:task-test", "test the task", "test kar".
argument-hint: "[task id]"
---

# task-test

Read `${CLAUDE_SKILL_DIR}/../../shared/common.md` first and follow it. Needs status
`implemented` (or later, for a rerun). Report formats: `${CLAUDE_SKILL_DIR}/../../shared/report.md`.

## Steps

### 1. Static checks
From each repo's rules file, run every `check` command **one at a time**, in order, from the rules
file's `run-from`. Then `syntax` on each changed file it applies to. If the plan has a migration:
`migrate` → `rollback` → `migrate` again, and confirm the schema matches after the second run.
Save each command's output tail in `after/checks.md`.

A failure caused by this task's change → fix it (step 5). A failure in a file this task did not
touch and that fails the same on a clean checkout → pre-existing (step 6).

### 2. Playwright — the whole module
1. The module's existing spec, whole (the same one `before/` ran), with the rules file's
   `spec-run`. If the change touches more than one module, every module's spec.
2. The task's own scripts in `scripts/` — the same ones `before/` ran — and new ones for any screen
   the plan adds.
3. A script per row of the plan's **Effect list** marked affected, checking that place still works.
4. For UI changes: screenshots of each changed screen in every theme the rules file names (e.g.
   light and dark) and at phone width.
Save results and screenshots in `after/`. Use only the rules file's `login`, `base-url` and
`mail-to`.

### 3. Prove each R and D
For every requirement and every locked decision, one piece of proof: a screenshot, an API answer,
or a DB row (read-only), saved in `evidence/R<n>-…` / `evidence/D<n>-…`. No proof → it counts as a
fail.

Then spawn the `requirements-checker` agent with the requirements, decisions, the diff command per
repo and the evidence folder. Its "not met" items are fails.

### 4. Before/after
Build the before/after table (`report.md`). A test that passed before and fails now is a regression
caused by this change, whatever it looks like.

### 5. Fix what this change broke — up to 3 rounds
For each fail caused by the change: find the cause, fix it in the planned files (outside the plan →
ask first, as in `task-implement`), and rerun the checks and tests it affects. Count rounds in
`test.round`. After round 3 with fails left → stop `blocked`, with each fail, what was tried, and
the likely cause.

### 6. Found broken before — ask the developer
Every fail that is also in `before/` (or fails on code this task did not touch) goes in
`test.preexisting`. Do not fix any of it yet. List them together:

```
These were already broken before this task:
1. <what, where, screenshot path>
2. …
For each: fix it in this task, make a separate task, or leave it?
```

Set `run.result: waiting` and stop. On the answer:
- **fix here** → add it to `plan.md` (Changes + Changelog, plan v+1, recorded as an extra fix),
  fix it, retest what it touches.
- **separate task** → write the new task's draft (title, steps to reproduce, expected/actual,
  screenshot path, the parent task link) and show it. Create it with the tracker MCP only after the
  developer's yes for that draft. Record it in `test.splitTasks`.
- **leave** → record it; it goes in the report's "still left".

### 7. Result
All R and D proven, no regression, every pre-existing item answered → status `tested`,
`run.result: done`. Write `test-report.md`; chat report: pass/fail line, the before/after table,
fixes made, extra fixes, split tasks, Not checked / still left. `Next: /task-flow:task-review`.

Give the developer the manual check steps as a short numbered list in chat only.
