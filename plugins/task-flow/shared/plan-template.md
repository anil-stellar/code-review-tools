# plan.md template

`task-analyse` writes `~/.claude/task-flow/<task-id>/plan.md` in this shape. Keep each section to
what the developer needs to approve it; drop a section that has nothing in it, except **Decisions
to confirm**, **Effect list** and **Not checked**, which always appear.

```markdown
# <task title>

<task url> · <dev | bug> · plan v<N>

## Summary
Two or three plain sentences: what changes for the person using the app, and where.

## Decisions to confirm
D1. <question in plain words>
    Decided: <answer> — or "—" for needs-answer
    Why: <the code/DB/doc fact it rests on, with file:line>
    Type: from code | needs answer
(Nothing → "None — the task answers everything.")

## Requirements
R1. <one testable statement> — from: "<the task line it came from>"
R2. …

## How it works today
What `before/` showed: the spec run (passed/failed counts), the screens scripted, the API answers,
the DB rows. Anything already broken is listed here and not fixed.

## Changes
### <repo name>
| File | What changes | For |
| --- | --- | --- |
| path/to/file | one line | R1, D1 |

### <sibling repo name>
| … |

## Extra work
Migrations, translations, icons, generated files, docs, screen maps, existing tests whose labels or
routes change — each one named, with the file. (From the rules file's checklist.)

## Effect list
Everything the changed code is used by, and whether it is affected:
| Changed thing | Used in | Affected? | How it will be checked |
| --- | --- | --- | --- |
| `methodName()` | path:line | yes — new argument | Playwright: screen X |
| `.some-class` | path:line | no — only the color token moves | — |

## Test plan
- Static checks: <the rules file's commands>
- Playwright: <module spec> (whole), plus scripts for: <screens>
- API / DB: <calls and rows to compare>
- Each R and each D → the check that proves it.

## Risks
Only real ones, one line each. (None → "None found.")

## Not checked / still left
…

## Changelog
v1 — first plan.
v2 — <what the developer asked to change>.
```

Rules for the plan:

- Every R cites the task text it came from. A requirement with no source is a decision (D), not an R.
- Every file in **Changes** has a reason (R or D). A file nobody asked for is not in the plan.
- The effect list is found with search, not memory: every call site, import, route use, column use,
  class use — across every repo the rules file names. `impact-checker` repeats the search on its own.
- A decision is **from code** only when a file, a DB row or a doc settles it — cite it. Anything
  that is a product choice (who sees it, what wording, what default) is **needs answer**.
