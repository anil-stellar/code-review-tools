# state.json

One per task at `~/.claude/task-flow/<task-id>/state.json`. Write it with the Write tool (whole
file), after every recorded step — not only at the end, so a broken run resumes.

```json
{
  "taskId": "1220226130398511",
  "title": "Orders: show the gift-wrap fee on the receipt",
  "url": "https://app.asana.com/0/0/1220226130398511",
  "type": "dev | bug",
  "status": "planned",
  "run": { "command": "task-analyse", "result": "running | done | waiting | blocked", "reason": "", "at": "2026-11-18T10:42:00Z" },

  "repos": {
    "app": {
      "path": "D:/work/app",
      "pushBranch": "develop",
      "branchAtStart": "develop",
      "headAtStart": "9095410e",
      "baselineDirty": ["config/local.php"],
      "planned": { "src/components/X.vue": "<git hash-object at plan time, or null for a new file>" },
      "changed": ["src/components/X.vue"],
      "commit": null
    }
  },

  "decisions": [
    { "id": "D1", "question": "", "decided": "", "why": "", "type": "from-code | needs-answer | developer", "locked": false }
  ],
  "planVersion": 1,
  "approvedAt": null,

  "implement": { "done": ["src/components/X.vue"], "left": [] },
  "test": { "round": 0, "result": null, "preexisting": [], "extraFixes": [], "splitTasks": [] },
  "review": { "result": null, "fixed": [], "leftMinor": [] },
  "push": { "approvedAt": null, "commits": {} },
  "comment": { "draft": "comment.md", "approvedAt": null, "url": null },

  "history": [ { "at": "", "command": "", "note": "" } ]
}
```

## Meaning

- `status` — the last step that finished. Order: `planned` → `approved` → `implemented` →
  `tested` → `reviewed` → `pushed` → `commented`.
- `run` — the step in progress; see `common.md` §3. `stop-guard` reads `run.result`.
- `repos.<name>.pushBranch` — copied from that repo's rules file. `git-guard` refuses a push to any
  other branch while this task is active.
- `baselineDirty` — `git status --porcelain` paths at the start of `task-analyse`. Never staged.
- `planned` — every file the plan changes, with its blob hash when the plan was approved.
  `task-implement` compares: a different hash means the file changed some other way (a pull, a
  hand edit) and it stops.
- `decisions` — open points; `locked: true` once the plan is approved. Tests prove them; the
  comment lists them.
- `test.preexisting` — failures that were already there before the change (seen in `before/`).
  Each has `"choice": "fix-here | new-task | skip"` once the developer answers.
- `history` — one line per finished step or developer change, newest last.

## Folder

```
~/.claude/task-flow/<task-id>/
  state.json
  task.md            the tracker task, its comments and attachment names, as read
  requirements.md    R1…Rn with their source lines
  plan.md            the plan the developer approves (template: plan-template.md)
  before/            results and screenshots from before the change
  after/             the same, after
  scripts/           Playwright scripts written for this task (never in the repo)
  evidence/          proof per requirement and decision
  test-report.md     task-test's report
  review.md          task-review's report
  commit-<repo>.txt  the commit message per repo
  comment.md         the tracker comment draft
```
