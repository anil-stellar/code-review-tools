# Universal review lenses

Rules that hold in **any** codebase, in any language. Project-specific conventions never belong in
this file — they live in the repo's own rulebook (`.claude/review/rules.md`).

Apply a lens only where the diff actually touches its subject. Running the security lens over a copy
change, or the performance lens over a doc edit, produces noise and buries the real findings.

---

## A. Correctness — always

The category a conventions checklist crowds out, and the one that costs real money. Do not ask "does
this look tidy"; ask **"what does this compute, and for which inputs is it wrong?"** A finding here
needs a concrete failing case — inputs or state → wrong result.

- **Boundaries** — empty collection, single element, first, last, off-by-one in a slice or an index,
  a loop that never executes, a range whose ends are inclusive on one side only.
- **Absent values** — null / nil / undefined / `None`, a missing key, an absent optional, a column
  that is nullable in the schema. Which of these does the new code assume is always present?
- **Zero and negative** — division, modulo, percentage, average over an empty set, a quantity that
  can legitimately be `0`, a subtraction that can go below zero.
- **Money and rounding** — floats used for currency, rounding applied twice, a total recomputed from
  rounded parts, a split whose parts do not sum back to the whole, a currency assumed.
- **Time** — timezone assumed, local time compared against UTC, DST, a date arithmetic that assumes
  24-hour days, an expiry compared with the wrong clock, client time trusted for a server decision.
- **Types and coercion** — string/number comparison, truthiness of `0` or `""`, an ID that is a
  string in one layer and an int in another, a boolean read from a form as `"false"`.
- **Error and partial failure** — an operation that can half-succeed and leave inconsistent state; a
  multi-step write with no transaction or no compensating action; a retry that is not idempotent.
- **Concurrency** — read-modify-write without a lock or an atomic update; two requests racing the
  same row; a check-then-act whose precondition can change in between.
- **Control flow** — a condition inverted, `&&` where `||` was meant, an early return that skips
  cleanup, a `switch` with no default, an `else` that silently swallows a real case.
- **The change's own intent** — does the new code actually do what the diff, the branch name, or the
  ticket says it does? A correct implementation of the wrong behaviour is still a defect.

## B. Error handling — always

- Every call that can fail is handled: a rejected promise, a non-2xx response, a thrown exception, a
  nil error return. A missing `catch` / `except` / `if err != nil` is a finding.
- The handler does something real. Catching and only logging — or catching and swallowing — leaves
  the caller believing the operation succeeded.
- The user or caller learns that it failed. A silent failure is worse than a loud one.
- The error message does not leak internals (stack traces, SQL, secrets, file paths) to an end user.
- Cleanup happens on the failure path too: closed handles, released locks, rolled-back transactions.
- The project's own error-handling helper is used where the rulebook names one.

## C. Input validation and parity — wherever input crosses a boundary

- Every input from outside the trust boundary is validated at the point of use: type, range, length,
  format, allowed set.
- **Client/server parity** — every rule the UI enforces is enforced again server-side. Client
  validation is UX; the server is the source of truth. A request that bypasses the UI (curl,
  Postman, a stale app build) must still be rejected. Trace the rule into the server handler and
  name it, or it is not verified.
- Update endpoints whitelist the fields they accept, rather than mass-assigning whatever arrives.
- A field the UI disables or hides is explicitly rejected server-side, not merely absent from the
  form.

## D. Security — only where the diff crosses a trust boundary

Boundaries: user input, an authenticated route, a third-party or payment call, the file system, raw
SQL, shell execution, deserialization, a template render.

- **Injection** — SQL parameters bound, never string-interpolated; a list of IDs cast to integers
  before it is joined into a query; user input never reaching `ORDER BY`, a table name, a shell
  command, an `eval`, or a template expression.
- **Access control** — the authorization check is on the server, not only in the UI. A route with no
  permission check, or a role test that exists only in a conditional render, is a BLOCKER. Check the
  *object*, not just the action: can this user act on *this* record?
- **Tenant / owner scoping** — in a multi-tenant or multi-user system, every query filters by the
  caller's scope. Reading another tenant's or another user's row is always a BLOCKER.
- **Identifiers** — a sequential ID accepted from the client and used without an ownership check is
  an IDOR.
- **Secrets** — no key, token, password, or connection string committed. Not in code, not in a test
  fixture, not in a comment, not in a default value.
- **Data exposure** — no secrets or PII in logs, in a URL or query string, or echoed in an error
  response; no debug flag or verbose error reaching production.
- **Upload and path handling** — a filename from the user never concatenated into a path
  (traversal); type and size validated; content not served back with an executable content type.
- **Crypto and auth** — no hand-rolled crypto, no MD5/SHA1 for passwords, no `Math.random()` for a
  token, no `verify=false` on TLS.

## E. Performance — only for new query, loop, or bulk code

- **N+1** — a database, cache, or network call inside a loop.
- **Unbounded results** — a list endpoint or a query with no pagination, no limit, and no cap. Ask
  what it does at 100× today's row count.
- **Missing index** — a new filter, join, or sort on a column with no index, on a table that grows.
- **Repeated work** — the same value recomputed or refetched inside a loop when it is loop-invariant.
- **Blocking the request** — long-running work (report generation, bulk mail, exports, image
  processing) done inline when the project has an async or queue path. A newly-raised timeout or
  memory limit is a symptom, not a fix.
- **Payload size** — a response that now returns whole objects where it returned IDs, or loads a
  full table into memory.

## F. Hygiene — always, one grep over the diff

- Debug artifacts left behind: `console.log`, `debugger`, `print`, `var_dump`, `dd(`, `binding.pry`,
  a commented-out block kept "just in case".
- A new `TODO` / `FIXME` / `HACK` with no ticket or owner.
- Dead code: an unreachable branch, an unused import, a parameter nothing passes, a flag with one
  value.
- Deleted code with no evidence it was dead. **"No grep hits" is not proof** — check other repos,
  templates, config, cron entries, and dynamic dispatch by string name before accepting a deletion.
- A magic number or string that is persisted or compared across layers, and should be a named
  constant shared by both sides.

## G. Collateral — always

What the change should have touched and did not:

- A new endpoint with no route registration, or a route with no handler.
- A renamed or removed field still referenced by a caller, a template, a serializer, or a fixture.
- A changed label, route, or payload shape that a test still asserts the old form of. Grep the test
  directory for what you just changed.
- A schema change with no matching model/type update, or a migration with no rollback path.
- A behaviour change with no update to the design/plan doc that describes it, where the project keeps
  one.
- Files in the diff that have no business being there: unrelated reformatting, a whitespace-only
  file, a committed build artifact, an editor or OS file, a `.env`.
- A dependency added to a manifest but not to the lockfile, or vice versa.

## H. Process smells worth flagging

- A migration or seed script assumed safe to re-run against populated data (a destructive statement
  in a seed, a non-idempotent backfill).
- A data migration with no parity check and no way to tell whether it succeeded.
- A feature flag added with no removal plan, or a flag checked in one place and ignored in another.
- Generated files hand-edited, where the project generates them.
