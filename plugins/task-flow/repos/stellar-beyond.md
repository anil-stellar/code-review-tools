# Task flow rules — stellar-beyond

Read by the `task-flow` plugin (`code-review-tools` marketplace). The app repo: Vue 3 + Vuetify
admin, PHP (Fat-Free) V2 API, Phinx migrations. A task may also change the sibling
`StellarConfiguration` (extensions and tenant config), which has its own rules file.

```yaml
repo: stellar-beyond
push-branch: develop
push-deploys: "deploy-dev.yml → every dev box (beyond-dev-*), migrations included"
siblings:
  - path: ../StellarConfiguration
run-from: .
tracker: asana
check:
  - npm run i18n:check
  - npm run ui:check
  - npm run moving-bg:check
  - npm run routes:check
  - npm run api:check
  - npm run naming:check
  - npm run icons:check
  - npm run feedback:check
  - npm run file-security:check
  - npm run uuid:check
  - npm run vue:check
syntax: docker compose exec -T app php -l /var/www/html/{file}
migrate: docker compose exec -e STELLAR_CLIENT=local.stellarwebsystems.com app vendor/bin/phinx migrate -e default
rollback: docker compose exec -e STELLAR_CLIENT=local.stellarwebsystems.com app vendor/bin/phinx rollback -e default
spec-run: docker compose --profile test run --rm playwright npx playwright test {spec} --retries=0
script-run: docker compose --profile test run --rm -v "{taskdir}/scripts:/task" playwright npx playwright test --config /task/playwright.task.config.js {script} --retries=0
script-setup: |
  The repo config only runs ./specs, so the task's scripts folder holds its own config:
    // playwright.task.config.js
    import base from '/work/playwright.config.js';
    export default { ...base, testDir: '/task' };
  and each script imports the suite's helpers: import { test, expect } from '/work/lib/test.js';
spec-map: docs/conventions/testing.md (the "Module you touched → Spec that owns it" table)
base-url: inside Docker the config's default (BASE_URL unset); from the host https://local.stellarwebsystems.com:8443
login: playwright-admin@stellarwebsystems.com (password in tests/playwright/.env, written by npm run setup)
themes: light, dark
mail-to: the developer's own address only; run against a workspace with mail OFF
commit-trailer: |
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
```

## Where the rules are

- `CLAUDE.md` first, always. Then by area:
  - Vue components, styling, dark mode, dialogs, notifications: `docs/conventions/frontend.md`
  - Lists and transitions: `docs/conventions/motion.md`
  - PHP, uploads, internal codes, Pathfinder, charset, uuids, schema: `docs/conventions/backend.md`
  - Playwright: `tests/playwright/README.md`, `docs/conventions/testing.md`
  - Routing, Docker, servers: `docs/conventions/operations.md`
  - Screens: `docs/SCREEN_MAP.md`
  - Translations: `docs/LOCALIZATION_IMPLEMENTED.md`
- A feature's `docs/*_PLAN.md` is the source of truth for it — grep `docs/` for the feature first.

## Which repo a change belongs to

- `Extensions/**`, `clients/<host>/**` → StellarConfiguration.
- Everything else (`src/`, `Classes/`, `config/`, `db/`, `public/`, `tests/`, `docs/`) → here.
- An extension that needs a new core hook, component prop or API → both repos, one task.

## Extra-work checklist

- New or changed English text → `npm run i18n:extract`, then `es` / `fr`; never hand-edit `en.json`.
- New icon → `npm run icons:generate`, commit the result.
- New page or full-screen modal → a row in `docs/SCREEN_MAP.md`.
- New Vue route → `npm run routes:check`; new PHP route → `vite.config.js` proxy entry and a node
  container restart.
- New `/api/v2` route → `config/api_surface.php` (api:check).
- New column → a Phinx migration with the real timestamp (`date +%Y%m%d%H%M%S`), `after` the right
  column, `utf8mb4`; no ENUM. Never edit a pushed migration.
- Raw SQL write to a searched table → `SearchIndexer::enqueue()`; a changed search document → bump
  `SearchSources::TYPE_VERSIONS`.
- New S3 key class → `FileSecurity.php` and `fileSecurity.js`.
- New internal code → `Codes.php` in both repos and the seeds.
- A feature with a `docs/*_PLAN.md` → update it in the same change.
- Changed label, route, selector or payload → grep `tests/playwright/specs/` and update the specs
  that use it (the only time the flow edits a spec in the repo).
- Prettier on every changed file: `npx prettier --write <files>`.

## Never

- Touch a client URL, a client database, or a production machine.
- Send mail to anyone but the developer.
- Stage `public/index.php`, `vite.config.js` or any other file the developer had changed before the
  task started.
- Write a new Playwright spec file into the repo — task scripts stay in the task folder.
- Put dates or task links in docs or code comments.
- Use V1 API classes or create files under `Classes/Api/V1/`.

## Comment format

Default plugin format (What it does / Decisions taken / What to check / Code), in English, plain
words, for the person who will check the task.
