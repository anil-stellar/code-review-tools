# Rules file — template

Each repo the flow works in has one: in this plugin at `repos/<repo folder name>.md`, or in the
repo itself at `.claude/task-flow/rules.md` (that one wins). The flow reads
it as data (see `common.md` §1). Copy this, fill it in, delete what does not apply.

````markdown
# Task flow rules — <repo name>

```yaml
repo: <name>
push-branch: develop            # the only branch task-push may push to
push-deploys: <what a push starts, e.g. "deploy-dev.yml → the dev servers"; or "nothing">
siblings:                       # other repos a task may change, relative to this repo
  - path: ../other-repo
run-from: .                     # where commands below run (a sibling path if this repo has no tooling)
tracker: asana                  # asana | jira | github — the MCP the flow reads and writes
check:                          # static gates, run one at a time, in this order
  - npm run lint
syntax: docker compose exec -T app php -l /var/www/html/{file}    # {file} = repo-relative path
migrate: <command>              # with rollback: and migrate-again: if migrations exist
rollback: <command>
spec-run: npx playwright test {spec}           # {spec} = a spec path
script-run: npx playwright test {script} --config <config>   # {taskdir} = the task folder, {script} = a script in it
script-setup: <anything a task script needs: its own config, which helpers to import>
spec-map: docs/testing.md#module-table         # where to find the module → spec table
base-url: https://local.example.com
login: <test account the specs use; never a real person's>
mail-to: <the only address test mail may go to; blank = the developer's own>
commit-trailer: |
  Co-Authored-By: …
```

## Where the rules are
Which files to read for which area — e.g. "Vue components: docs/conventions/frontend.md".

## Extra-work checklist
What a change of each kind also needs — e.g. "a new route: routes:check and a proxy entry";
"a new icon: icons:generate"; "a new page: a SCREEN_MAP row".

## Never
Things the flow must never do in this repo — e.g. "touch a client URL or DB", "push to master".

## Comment format
Only if the team's comment differs from the plugin default.
````
