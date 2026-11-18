# task-flow

Six commands take a task from its tracker link to a pushed commit and a posted comment. Each does
one step and stops. The developer approves the plan, the push and the comment.

```
/task-flow:task-analyse <task link>   analyse, test today's behaviour, write plan.md
      ↓ developer reads plan.md, asks for changes in chat, says "approve"
/task-flow:task-implement             code, file by file, exactly as the plan says
/task-flow:task-test                  checks + Playwright on the whole module, before/after, fixes
      ↓ already-broken things found: developer picks fix here / separate task / leave
/task-flow:task-review                code-reviewer plugin on the task's files, fixes blockers/majors
/task-flow:task-push                  shows files + commit message, pushes after "yes"
/task-flow:task-comment               shows the tracker comment, posts after "yes"
```

Commands can also be started in plain words ("analyse this task <link>", "push kar").

## Install

```
/plugin marketplace add anil-stellar/code-review-tools
/plugin install task-flow@code-review-tools
/plugin install code-reviewer@code-review-tools     # task-review uses it
```

Needs Node (for the hooks), a tracker MCP (Asana today), and Playwright in the project.

## Adopting it in a repo

Copy `shared/rules-template.md` to `repos/<repo folder name>.md` in this plugin (e.g.
`repos/stellar-beyond.md`), fill it in, and commit it here. A repo may instead keep its own
`.claude/task-flow/rules.md`; that one wins when both exist. The plugin hardcodes nothing about a
project: branches, commands, test accounts, sibling repos and the comment format all come from that
file.

A task can span several repos: the home repo's rules file lists its siblings, and each sibling
keeps its own rules file (its push branch, its checks).

## Where things are

| | |
| --- | --- |
| `skills/task-*/SKILL.md` | the six commands |
| `shared/common.md` | what every command does first and last; the lines the flow never crosses |
| `shared/state.md` | `state.json` and the task folder |
| `shared/plan-template.md` | the plan the developer approves |
| `shared/report.md` | chat report, commit message and tracker comment formats |
| `shared/rules-template.md` | starter for a repo's rules file |
| `repos/*.md` | rules files kept in the plugin: `stellar-beyond`, `StellarConfiguration` |
| `agents/impact-checker.md` | second, independent search for everything the change affects |
| `agents/requirements-checker.md` | checks each requirement against the diff and the evidence |
| `hooks/` | the guards below, and `_test-hooks.mjs` |

Each task's files live in `~/.claude/task-flow/<task-id>/` — never in a repo.

## Guards

Hooks hold the rules even when an instruction is missed. They only act in a session that ran a
task-flow command in the last 12 hours; other sessions are untouched.

| Hook | What it holds |
| --- | --- |
| `track-command` | records which task command the session is in |
| `git-guard` | `git commit` / `push` only in `task-push`, only right after the developer's yes, only `push origin <the task's push branch>`, never forced; `git add` only with explicit paths |
| `tracker-guard` | tracker writes only after a yes: comments only in `task-comment`, a split-off task only in `task-test`; never a status/assignee change |
| `stop-guard` | a command cannot end its turn while `state.json` says it is still `running` |

"Yes" is the developer's own latest message — read from the transcript, not from anything the model
writes — and must be short and unconditional ("ha", "yes", "ok push kar"). "ha, pan title badlo"
is a change request.

Test the hooks: `node plugins/task-flow/hooks/_test-hooks.mjs`.
