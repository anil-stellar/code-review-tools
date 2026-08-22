# <Project> review rulebook

<!--
  Read by the `code-reviewer` plugin. Lives at `.claude/review/rules.md` and is committed with the
  repo, so every reviewer — human or agent — checks the same rules.

  Rules marked **HARD** are always findings, no judgement call. Everything else is a finding when it
  causes a visible or functional defect, or when the surrounding file already follows the convention
  and the change breaks it.

  Do NOT restate what a linter or formatter already enforces — that produces nits and buries the
  real findings. Only rules a reviewer can check by reading a diff belong here.
-->

```yaml
# How to verify things in this project. Omit any key you do not have a real command for —
# an absent key means "unavailable, skip it", and a guessed command is worse than none.
syntax:    # e.g. docker compose exec -T app php -l {file}
lint:      # e.g. npm run lint
test:      # e.g. npm test -- {test}
build-log: # e.g. docker compose logs node --since 5m
```

**Generated / excluded from review:** <lockfiles, `dist/`, vendored deps, snapshots, generated
clients — anything a reviewer should skip>

**Sources of truth:** <instruction files and design docs whose rules this file summarises; divergence
from them is a finding, not a style note>

---

## A. <Bucket name> (`<path/glob/**>`)

<!-- One section per area with genuinely different rules. 3-6 sections is right. Where two globs
     overlap, the narrower one wins — say which is narrower. -->

- **HARD** <A non-negotiable: a security, data-integrity, or correctness guarantee, or something the
  project instructions state absolutely.>
- <A convention a reviewer can check in a diff. Say what is required, not what is discouraged.>
- <A rule with its exemption stated inline — "…, except under `legacy/`, which is grandfathered".>
- <A rule you inferred from the code rather than read in a doc — mark it: "(inferred from
  `src/…`; confirm)".>

**Exempt:** <directories, file types, or patterns these rules do NOT apply to>

## B. <Bucket name> (`<path/glob/**>`)

- **HARD** …
- …

## C. Tests (`<test path>`)

- <When tests are expected: on every change, only when asked, only for bug fixes.>
- <Where a new case goes — the spec that owns the module, a new file, a naming convention.>
- **Existing tests stay in sync:** any route, label, selector, or payload the change touches is
  grepped for in the test directory and updated in the same change.
- <Anything a test must never do here — mutate shared data, hit a live service, depend on order.>

## D. Docs (`docs/**`)

- <Which docs must be updated alongside code, and when.>
- <Which docs are sources of truth for their area.>

## E. Process smells

- <Patterns that are not defects in themselves but are worth flagging in this project — a
  destructive seed, a non-idempotent backfill, a hand-edited generated file, a deletion with no
  evidence the code was dead.>
