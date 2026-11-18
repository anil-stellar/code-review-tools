---
name: task-push
description: Step 5 of the task flow. Shows what will be committed in each repo, the commit message (task title + a plain-language body) and the branch and deploy a push starts, asks the developer, and only after their yes commits the task's own files and pushes to each repo's push branch. Use for "/task-flow:task-push", "push the task", "push kar".
argument-hint: "[task id]"
---

# task-push

Read `${CLAUDE_SKILL_DIR}/../../shared/common.md` first and follow it. Needs status `reviewed`.
Commit format: `${CLAUDE_SKILL_DIR}/../../shared/report.md` § Commit message.

The `git-guard` hook allows `git commit` and `git push` only inside this command, only after the
developer's latest message is a yes, and only to each repo's `pushBranch`.

## Steps

### 1. Prepare (no git writes)
For each repo with changed files:
1. The files to commit = the repo's `changed` list (plus extra fixes). Never a `baselineDirty`
   path — if the developer's own edit and this task touched the same file, stop and ask how to
   split it (`waiting`).
2. `git status --porcelain` — any changed file not in the task and not in `baselineDirty` → list
   it and ask (it may be the developer's new edit).
3. The branch is the rules file's `push-branch`. Otherwise stop `blocked`.
4. `git fetch`; behind the remote → you will `pull --rebase` after committing (step 3). Say so.
5. Write `commit-<repo>.txt`: title = the task title exactly; body in plain words, as `report.md`
   says; the rules file's `commit-trailer` at the end.

### 2. Ask
Show, per repo:

```
<repo> → <push-branch>   (a push starts: <push-deploys>)
<N> files:
  path
  …
Commit message:
  <title>

  <body>
```

Then ask, in the developer's language: "Commit and push this?" Set `run.result: waiting` and stop.
- A change to the message or the file list → apply it, show it again, ask again.
- No / not now → leave everything uncommitted, `run.result: done`, status stays `reviewed`.

### 3. After the yes
For each repo, in the order the plan lists them (a sibling that the home repo depends on first):
1. `git -C "<repo>" add -- <each file>` — explicit paths only, never `-A`, `.` or `-u`.
2. `git -C "<repo>" commit -F "<task folder>/commit-<repo>.txt"`
3. `git -C "<repo>" pull --rebase origin <push-branch>` — a conflict → `git rebase --abort`, stop
   `blocked`, list the files. Never resolve a conflict on your own.
4. `git -C "<repo>" push origin <push-branch>` — always this exact form, so the guard can read the
   branch. Never `--force`.
5. Record the commit hash in `push.commits` and the repo's `commit`.

If the second repo fails after the first pushed: say exactly which pushed and which did not.

### 4. Report
Status `pushed`, `push.approvedAt`, `run.result: done`. Chat: per repo the commit hash and its link
(from `git remote get-url origin`), and the deploy the push started. `Next: /task-flow:task-comment`.
