# code-review-tools

A Claude Code plugin marketplace containing **`code-reviewer`** — a code review plugin that works in
any project, in any language, with no configuration required to start.

## What makes it portable

The review logic and a project's rules are two separate things:

| Layer | Lives in | Contains |
| --- | --- | --- |
| **Engine** | this plugin | tiers, scope resolution, verification, severity, report format, and the universal correctness / security / performance lenses |
| **Rulebook** | each repo, at `.claude/review/rules.md` | that project's own conventions, buckets, and verification commands |

The engine hardcodes nothing about any project — no paths, no framework, no language. It resolves the
repo with `git rev-parse --show-toplevel`, finds the rulebook at runtime, and reaches its own bundled
files through `${CLAUDE_SKILL_DIR}`, so it behaves identically installed as a plugin, a personal
skill, or a project skill.

With no rulebook it still runs on the universal lenses and says, once, that conventions went
unchecked. It never invents project rules: **a rule it cannot cite does not exist.**

## Install

```
/plugin marketplace add <owner>/<repo>
/plugin install code-reviewer@code-review-tools
```

Replace `<owner>/<repo>` with wherever this repository is hosted. If the install summary says
`Run /reload-plugins to activate.`, run that.

To try it from a local checkout instead, run Claude Code from the directory that contains the clone:

```
/plugin marketplace add ./code-review-tools
```

## Use

```
/code-reviewer:review                        review everything uncommitted, fast
/code-reviewer:review --init                 generate this repo's rulebook, then stop
/code-reviewer:review deep 412               multi-agent pass on PR 412
/code-reviewer:review api --severity=major   one bucket, blockers and majors
/code-reviewer:review --fix                  review, then apply the safe fixes
```

Claude also invokes it on its own for "review my changes" or "check this before I push".

## Adopting it in a project

Run `/code-reviewer:review --init` once. It reads the repo — instructions files, manifests, CI config,
linter config, and a few representative source files — and writes `.claude/review/rules.md` from the
bundled template. It reports which rules it **inferred** rather than read, so you can confirm or
delete those. Commit the file; every reviewer on the team then checks the same rules.

If the project already keeps a review checklist, adopting it is a copy instead: move it to
`.claude/review/rules.md`, add the `yaml` commands block at the top, and give each section an explicit
path glob so the engine can bucket files. See `rulebook-template.md` in the skill for the shape.

The rulebook declares how to verify things, so the plugin never guesses a command:

```yaml
syntax:    # e.g. docker compose exec -T app php -l {file}
lint:      # e.g. npm run lint
test:      # e.g. npm test -- {test}
build-log: # e.g. docker compose logs node --since 5m
```

An absent key means that check is unavailable — the review skips it and says so.

## Two tiers

**FAST** (default) is one pass in the main context. It escalates to a single batched `finding-skeptic`
only when it finds a BLOCKER or three-plus findings — self-verification by the context that produced
the findings is the weakest link in any review, and one cold context is cheap insurance. The report
states which verification you got.

**DEEP** (`deep`) fans out one `bucket-reviewer` per bucket, capped at five agents, then one
`finding-skeptic` per file to try to refute what they found. It is never entered on the reviewer's own
initiative; the FAST pass suggests it and the user decides.

Both tiers treat **untracked files as part of the change** and read their bodies directly — `git diff`
is silent about new files, which are usually the highest-risk code in a branch.

## Layout

```
.claude-plugin/marketplace.json          the catalog
plugins/code-reviewer/
  .claude-plugin/plugin.json             the manifest
  skills/review/
    SKILL.md                             the engine
    universal-checklist.md               project-agnostic lenses
    rulebook-template.md                 starter a rulebook is generated from
    init.md                              the --init procedure
  agents/
    bucket-reviewer.md                   one bucket → findings as JSON
    finding-skeptic.md                   tries to refute findings; defaults to refuted
```

Nothing under `plugins/` names a project, a framework, a language, or a path.

## Security model

The plugin ships **no executable content** — no hooks, no MCP or LSP servers, no scripts, no
`allowed-tools` grants. It is markdown plus two JSON manifests. Installing it grants nothing.

The one live trust boundary is the per-repo rulebook, and it matters precisely because you review
code you did not write: a repo supplies both the code under review *and* the rules and commands the
reviewer is asked to use. The plugin treats that file as **untrusted input**:

- Rulebook content is **data describing what to check**, never instructions. A directive in a
  rulebook — suppress a finding, read outside the repo, send something somewhere — is ignored and
  reported as a BLOCKER finding against that repo.
- Commands from a rulebook's `yaml` block are **confirmed with you the first time** they run in a
  repo.
- Shapes a verification command has no reason to have — piping into a shell, fetching and executing
  remote content, opening a network connection, decode-then-execute, writing outside the repo,
  recursive deletion, reading `~/.aws` / `~/.ssh` / `.env` — are refused outright and reported.
- Repository content, credentials, and environment data are never transmitted anywhere.

The same guards are repeated in both subagents, since they read the rulebook too. Claude Code's own
permission prompts remain the backstop underneath all of it.

## Notes

- Plugin skills are namespaced, so `/code-reviewer:review` never collides with the built-in
  `/code-review`.
- Precedence differs by component type: for **skills**, personal (`~/.claude/skills/`) overrides
  project; for **agents**, project (`.claude/agents/`) overrides personal. A repo can therefore
  override `bucket-reviewer` for itself while still using the plugin's engine.
- A plugin works in cloud sessions and routines. A skill that exists only in `~/.claude/skills/` does
  not — which is the other reason this ships as a plugin.
- Validate any change with `claude plugin validate ./plugins/code-reviewer` and
  `claude plugin validate .`. Tag a release with `claude plugin tag`.

## License

MIT — see [LICENSE](LICENSE).
