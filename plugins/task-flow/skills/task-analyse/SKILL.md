---
name: task-analyse
description: Step 1 of the task flow. Reads a tracker task (Asana link or id), tests how the affected screens work today, and writes plan.md — requirements, decisions with reasons, the files to change in every repo, and everything the change affects — for the developer to review and approve. Changes no code. Use for "/task-flow:task-analyse <link>", "analyse this task", "task analyse kar <link>", "plan banav <link>".
argument-hint: <task link or id>
---

# task-analyse

Read `${CLAUDE_SKILL_DIR}/../../shared/common.md` first and follow it. Templates:
`${CLAUDE_SKILL_DIR}/../../shared/plan-template.md`, `${CLAUDE_SKILL_DIR}/../../shared/state.md`,
`${CLAUDE_SKILL_DIR}/../../shared/report.md`.

**This command changes no code and writes nothing to the tracker.** It ends at `planned`, then
stays in the conversation for the developer's review until they approve (`approved`).

## Steps

Record each finished step in `state.json` (`history`) so a rerun continues from the first one not
done.

### 1. Ready check
For the home repo and every sibling in the rules file:
- `git status --porcelain` → save the paths as `baselineDirty`. Say in one line that these are the
  developer's own edits and will not be touched.
- Current branch and HEAD → `branchAtStart`, `headAtStart`. If the branch is not the rules file's
  `push-branch`, say so and ask whether to continue (`waiting`).
- `git fetch` then compare with the remote: behind → say so and ask to pull first (`waiting`). Never
  pull yourself.
- The local stack the rules file needs is up (containers, the site at `base-url` answers). If not →
  `blocked`, with the command that starts it.

### 2. Read the task
With the tracker MCP (reads only): the task, its description, its comments, subtasks, attachment
names and the project/section it sits in. Save as `task.md`.
- Task type: `dev` (feature or change) or `bug`. Anything else — a test/check task, a sign-off, a
  question — this flow does not handle: say so and stop (`blocked`).
- The task id is the folder name. If a folder for it already exists with status ≥ `planned`, show
  its status and ask: redo the analysis (plan v+1) or continue where it is.

### 3. Find the rules and the existing design
- `grep` the repos' `docs/` for the feature's names; an existing plan/spec doc is the source of
  truth and goes in the plan's reading list.
- Read the conventions files the rules file names for the areas this task touches.

### 4. Requirements
Write `requirements.md`: R1…Rn, each one testable, each citing the task line it came from. Bug →
R1 is "<steps> now gives <correct result>" and the plan must explain the cause, not only the symptom.

### 5. Find the code
Find every file the change needs, in every repo the rules file names — search, do not guess. For
each repo the rules file's routing applies (e.g. which folders belong to which repo).

### 6. How it works today (before-test)
Nothing here changes code or data that is not test data.
1. Run the module's existing Playwright spec once (find it with the rules file's `spec-map`).
   Record passed/failed per test in `before/spec.md`.
2. Write Playwright scripts for the screens this task touches into `scripts/` (task folder, never
   the repo) — open the screen, do what the task describes, screenshot. Run them, save results and
   screenshots in `before/`. Use the rules file's `login` and `base-url`.
3. Call the API routes the task touches and save the answers in `before/api/`. Save the DB rows
   involved (read-only queries) in `before/db/`.
4. Anything already broken → list it under "How it works today". **Do not fix it.**
5. A bug that does not reproduce → say so, show what was tried, and ask for steps/data (`waiting`).

### 7. Decisions
Every point the task leaves open becomes D1…Dn:
- Settled by code, data or a doc → `from code`, answer + `Why` with file:line.
- A product choice (who sees it, wording, default, scope) → `needs answer`, `Decided: —`.
Never ask the tracker's people; the developer answers in chat.

### 8. Changes, extra work, effect list
Fill the plan's **Changes** per repo, **Extra work** from the rules file's checklist, and the
**Effect list**: for every method, component, store, route, column, CSS class, translation key or
config key the plan changes, every place that uses it (all repos) and whether it is affected.

Then spawn the `impact-checker` agent with: the repo paths, the list of changed things, and the plan
path. Merge whatever it found that the plan missed, marked "(found by impact-checker)".

### 9. Write the plan
Write `plan.md` from the template, `planVersion: 1`. Record in `state.json`: `planned` with the
files and their current `git hash-object` (new files: `null`), the decisions, status `planned`.

### 10. Report and hand over
Report in chat (format in `report.md`): the summary, the **decisions to confirm first** (all of
them, needs-answer ones marked), the file count per repo, the effect-list count, anything already
broken, and the path to `plan.md`. Then ask the developer to read the plan and say what to change,
or "approve". Set `run.result: waiting`.

## The review conversation (same command, after the report)

While status is `planned`, every developer message about the plan is a change request:
- Apply it to `plan.md` (and `requirements.md` / decisions as needed), bump `planVersion`, add a
  Changelog line, and update `planned` hashes for any new file. A changed decision becomes type
  `developer`.
- Reply with what changed in 1–3 lines and ask again. Keep `run.result: waiting`.

**Approve** — the developer says approve / ok / go / "ha, barabar chhe" or similar about the plan:
1. If any decision is still `needs answer` with no answer → list those, ask for each (developer
   answer, or "use your default"), stay `waiting`. Do not approve.
2. Otherwise: lock every decision, refresh the `planned` hashes, set `status: approved`,
   `approvedAt`, `run.result: done`.
3. One line: approved, plan v<N>. `Next: /task-flow:task-implement`.
