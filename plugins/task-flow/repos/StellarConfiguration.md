# Task flow rules — StellarConfiguration

Read by the `task-flow` plugin (`code-review-tools` marketplace). The extension and tenant-config
half of Stellar Beyond: `Extensions/<Name>Extension/` and `clients/<hostname>/`. It has no tooling
of its own — every command runs from the sibling app repo `../stellar-beyond`, whose rules file and
`CLAUDE.md` apply here too.

```yaml
repo: StellarConfiguration
push-branch: stellar-beyond      # the Beyond config trunk; develop and master here are Stellar 7
push-deploys: "deploy-config-dev.yml → every Beyond dev box (prod is a manual workflow)"
siblings:
  - path: ../stellar-beyond
run-from: ../stellar-beyond
tracker: asana
check:
  - npm run ui:check            # scans this repo's .vue files too
  - npm run uuid:check          # scans Extensions/ too
  - npm run vue:check
syntax: docker compose exec -T app php -l /var/www/StellarConfiguration/{file}
build-log: docker compose logs node --since 5m     # a broken extension .vue shows here, not in any check
schema: STELLAR_CLIENT=<host> php tools/schema_drift.php export --fresh --extensions=<Ext>   # after an extension's schema code changes
spec-run: docker compose --profile test run --rm playwright npx playwright test {spec} --retries=0
spec-map: extension specs in ../stellar-beyond/tests/playwright/specs/ (e.g. 34-campw-development, 35-echo-community); none yet for most extensions
login: playwright-admin@stellarwebsystems.com, on a local tenant that has the extension enabled
mail-to: the developer's own address only
commit-trailer: |
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

## Where the rules are

- `../stellar-beyond/CLAUDE.md` and its `docs/conventions/*` — every app rule for `src/**` applies
  to the `.vue` and PHP files here.
- This repo's `CLAUDE.md` (uuids) and `.claude/review/rules.md` (the review rulebook).
- Extension i18n: `extensionI18n('<Id>')` / `useExtensionI18n('<Id>')`.

## Which repo a change belongs to

- `Extensions/**` and `clients/<host>/**` → here.
- A core component, route, store, API or migration → `../stellar-beyond`, in the same task.

## Testing an extension

- Find a local tenant with the extension enabled (`clients/<host>/` config) and say which one in
  the plan. No such tenant → ask the developer which to use; never enable an extension on a tenant
  just to test.
- No spec for the extension → task scripts only (in the task folder), covering the screens touched.

## Extra-work checklist

- An extension model's `CREATE TABLE` or `ADD COLUMN uuid` → `ensure_uuid_policy('<xtn_table>', '<trigger>')`
  right after it; never a hand-written uuid trigger; never rewrite an existing uuid.
- Extension schema code changed → rebuild its reference with the `schema` command above.
- New tables and columns: `utf8mb4` / `utf8mb4_unicode_ci`, no ENUM.

## Never

- Push to `develop` or `master` — those are Stellar 7 and `develop` deploys to current-dev-east.
- Change a tenant's `clients/<host>/` config unless the task names that tenant; say so plainly in
  the plan when it does.
- Run or trigger the prod config deploy.
- Touch `clients_former/`.

## Comment format

Same as stellar-beyond.
