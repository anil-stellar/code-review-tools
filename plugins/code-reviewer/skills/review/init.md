# `--init` — generate this repo's rulebook

Read only when `--init` was passed. You are **writing a rulebook, not reviewing anything.** Produce
`$ROOT/.claude/review/rules.md` and stop.

The goal is a file that captures **what this project actually requires** — enough that a reviewer who
has never seen the codebase can cite a rule instead of guessing. Rules you cannot source from
something in the repo do not go in.

## 1. If a rulebook already exists

`$ROOT/.claude/review/rules.md` present → do **not** overwrite it. Read it, then report what is
missing or stale (a bucket whose globs no longer match the tree, a declared command that no longer
exists, a section for a framework the repo has since dropped) and offer to update those sections
specifically. Wait for the user.

## 2. Learn the project — one pass, cheap

Spend roughly a dozen tool calls. In rough order of value:

- **`$ROOT/CLAUDE.md`** and any `AGENTS.md` / `.cursorrules` / `CONTRIBUTING.md` — the highest-value
  source by far. Project instructions are already written as requirements; most of them convert to
  rulebook lines nearly verbatim.
- **Manifests** — `package.json`, `composer.json`, `requirements.txt`, `pyproject.toml`, `go.mod`,
  `Gemfile`, `Cargo.toml`. These give you the stack, and their `scripts` section usually gives you
  the commands block outright.
- **The tree** — two levels deep. Where does backend code live, where does UI live, where do
  migrations, tests, docs, and infra live? These become the buckets.
- **CI config** — `.github/workflows/*`, `.gitlab-ci.yml`, a `Makefile`. Whatever CI runs is what
  the commands block should run. This is the most reliable source for `lint` and `test`.
- **Linter and formatter config** — `.eslintrc`, `ruff.toml`, `.php-cs-fixer`, `.editorconfig`.
  **Anything the linter already enforces does NOT belong in the rulebook.** A reviewer restating
  lint rules produces nits and nothing else.
- **Two or three representative source files per bucket** — read them for the conventions the tooling
  cannot catch: how errors are handled, how API calls are made, how auth is checked, the naming
  patterns. This is where the genuinely useful rules come from.
- **`docs/`** — a design or plan doc the project keeps in sync is a rule ("changes to X update
  `docs/X_PLAN.md` in the same change").

## 3. Write the file

Start from `${CLAUDE_SKILL_DIR}/rulebook-template.md` and fill it in.

**The commands block.** Only keys you actually found. A command you guessed is worse than an absent
one, because the reviewer will run it. Prefer the exact invocation CI uses. If the project runs in
Docker, write the containerized form — that is what will actually work.

**Buckets.** One section per area that has genuinely different rules. Three to six is right; ten is a
sign you are splitting on directory names rather than on rules. Give each an explicit path glob, and
make overlapping globs unambiguous — the narrower one wins, so state which is narrower.

**Rules.** For each bucket, the requirements a reviewer should check. Every line must be:

- **Sourced.** From an instructions file, from an obvious and consistent pattern in the code, or from
  a doc. If you inferred it from a single file, say so in the line: *"(inferred from
  `src/api/user.js`; confirm)"*. Never state a convention as settled when you saw it once.
- **Checkable by reading a diff.** "Code should be maintainable" is not a rule. "Every API call
  handles the error branch with `handleApiError`" is.
- **Not already enforced by a linter or formatter.**
- **Marked HARD only when it is genuinely non-negotiable** — a security, data-integrity, or
  correctness guarantee, or a rule the instructions state absolutely. HARD means "always a finding,
  no judgement call." Over-marking turns the review into noise. Most rules are not HARD.

Note **exemptions** explicitly where they exist — a directory the rule does not apply to, a
grandfathered pattern, generated files. An exemption you omit produces confident false findings,
which is the most expensive failure mode a reviewer has.

## 4. Report back

Write the file, then tell the user, briefly:

- Where it was written and which buckets it defines.
- Which commands you found, and which you left out because you could not source them.
- **Which rules you inferred rather than read** — these are the ones the user needs to confirm or
  delete. Be specific; this list is the point of the report.
- Anything you noticed the project clearly does but you could not phrase as a checkable rule.

Then stop. Do not review the working tree in the same run — say the rulebook is ready and that a
plain `/code-reviewer:review` will now use it.
