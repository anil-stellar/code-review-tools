---
name: task-implement
description: Step 2 of the task flow. Writes the code exactly as the approved plan.md says, file by file across every repo in the plan, and stops to ask before touching anything the plan does not list. Never commits. Use for "/task-flow:task-implement", "implement the plan", "implement kar".
argument-hint: "[task id]"
---

# task-implement

Read `${CLAUDE_SKILL_DIR}/../../shared/common.md` first and follow it. Needs status `approved`.

## Steps

### 1. Nothing moved since the plan
For each file in every repo's `planned`: compare `git hash-object <file>` with the recorded hash
(a new file must still not exist). Any difference → list the files, say they changed after the plan
(a pull or a hand edit), and stop `blocked`. The developer either reruns `task-analyse` or says
"continue" — then record the new hashes in `history` and go on.

Also stop if the branch is no longer `branchAtStart`.

### 2. Read before writing
Read the plan, the requirements, the decisions, and the repo rules/conventions files the plan's
areas need. Read each planned file before editing it.

### 3. Implement, file by file
Follow the plan's **Changes** table in order, repo by repo. For each file:
- Make exactly the change the plan describes for it, for the R/D it names.
- Follow the repo's own instructions (CLAUDE.md and its conventions files) — they win.
- Edit with the Edit tool; a new file with Write. No shell writes into source.
- Add it to `implement.done` in `state.json` and to the repo's `changed` list.

Then do the plan's **Extra work** the same way (translations, generated files, docs, screen maps,
existing specs whose labels or routes change).

**Outside the plan:** if the change needs a file, a behaviour or a decision the plan does not have
— stop before writing it. Explain in two lines what and why, and ask (`waiting`). On a yes, add it
to `plan.md` (Changes + Changelog, plan v+1) first, then write it.

### 4. Format
Run the repo's formatter only on the files this task changed (never `--write .`, never a file in
`baselineDirty`). If the rules file says a formatter is not used in a repo, skip it there.

### 5. Quick self-check
- `git diff --stat` per repo: every changed path is in `planned` or in Extra work. Anything else —
  explain or revert your own change to it.
- No `baselineDirty` file changed by you.
- The rules file's `syntax` command on each changed file of that kind (e.g. `php -l`), if it has one.
  Full checks belong to `task-test`.

### 6. Report
Status `implemented`, `run.result: done`. Chat: files changed per repo (count + list), anything
added to the plan on the way, `Next: /task-flow:task-test`.

Never commit, stage or push.
