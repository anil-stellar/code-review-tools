# Report, commit and comment formats

## Chat report at the end of a command

```
<one line: done / waiting / blocked, and the main result>

<3–8 short lines or a small table — only what the developer needs now>

Not checked / still left
- …

Next: /task-flow:<next command>
```

Use the developer's language if they wrote in it. No headings on a report shorter than ten lines.

## Before/after table (task-test)

| Check | Before | After | Note |
| --- | --- | --- | --- |
| spec: <name> | 24 passed, 1 failed | 25 passed | the failure was pre-existing, fixed here (developer chose) |
| screen: <name> | screenshot | screenshot | new column shows |
| API: <route> | 200, no field | 200, field present | |

## Commit message (task-push)

Written to `commit-<repo>.txt` and shown before asking.

- **Title:** the task title exactly as the tracker has it. If the rules file sets a prefix or a
  length cap, apply it; otherwise the title as is.
- **Body:** plain words a non-developer can follow. What changed for the person using the app,
  where they will see it, and what stays the same. One idea per line or short paragraph. Name a
  file only when it helps a reader find the change. No ticket chatter, no "this commit".
- When a decision shaped the change, one line for it: "Empty amounts show as — (same as the
  Pledges list)."
- A sibling repo's commit gets its own message, same title, body about its own part, and one line
  naming the other repo's commit when both exist.
- End with any trailer lines the rules file requires.

## Tracker comment (task-comment)

Written to `comment.md` and shown before asking. Use the rules file's `comment-format` if it has
one. Default:

```
<one line: what was done>

What it does
1. <plain-language behaviour, as the user sees it>
2. …

Decisions taken
- D1: <question> → <answer> (<why, short>)
(omit the section when there were none)

What to check
1. <a neutral step someone can follow: where to go, what to do, what should happen>
2. …

Code
- <repo>: <commit url or short hash> — <branch>
- <sibling repo>: …
```

No test results, no internal findings, no list of files beyond the Code line — those stay in chat.
