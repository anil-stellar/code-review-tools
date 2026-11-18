# Framework-gated review lenses

Rules that hold in **any** codebase using a given framework — and are meaningless outside it.

Nothing in this file is applied by default. Every section opens with an **Applies when** line naming
the signals that switch it on. **A section whose signals are absent is skipped entirely** — do not
read it, do not check it, do not mention it in the report. A React repo pays nothing for the Vue
section.

This file is not a place for project conventions. The test for a rule belonging here is: *"would
this be true in every project using this framework, regardless of who wrote it?"* If the answer is
no — if it is how *this* team names components or structures *its* stores — it belongs in the repo's
own rulebook (`.claude/review/rules.md`), not here.

## Gating — one cheap check, before any section is read

Decide from what you have already read, plus at most one extra call:

1. **File extensions in the diff** — `.vue`, `.jsx`/`.tsx`, `.php`, `.blade.php`, `.svelte`. You already
   have the file list from §1, so this costs nothing.
2. **The manifest** — one `grep` on `package.json` / `composer.json` for the dependency the section
   names, not a full read.

Where a section names two signals, **both** must hold. A framework the diff does not touch is out of
scope even when the repo uses it elsewhere: a change to `api/orders.py` in a repo that happens to
ship a Vue frontend gets no Vue checks.

---

## Vue + Vuetify

**Applies when:** the diff contains `.vue` files **and** `package.json` lists `vuetify`. Both
signals are required — a Vue project that does not use Vuetify gets none of these checks, and a
Vuetify dependency alone does not apply them to a diff with no `.vue` files in it.

### Nested dialogs — declare the child inside the parent

When one `v-dialog` opens another, the child **must be declared inside the parent's content slot**,
never as a sibling of it. Declared as siblings the two overlays are peers rather than parent and
child, and a click on a button in the child dismisses **both** — the user loses the parent dialog
they were working in, along with any unsaved state in it.

**What to look for in a diff** — a template with two or more `<v-dialog>` elements at the same
nesting level, where a control rendered *inside* one of them toggles the `v-model` of the other.
That combination is the defect. Two unrelated sibling dialogs, each only ever opened from the page
itself, are fine.

```vue
<!-- WRONG — siblings: the child's buttons close both -->
<v-dialog v-model="parent">
  <v-btn @click="child = true">Edit</v-btn>
</v-dialog>
<v-dialog v-model="child"> … </v-dialog>

<!-- RIGHT — the child lives inside the parent's slot -->
<v-dialog v-model="parent">
  <v-btn @click="child = true">Edit</v-btn>
  <v-dialog v-model="child"> … </v-dialog>
</v-dialog>
```

Severity **MAJOR** — wrong behaviour the author will not catch in a happy-path click-through,
because it only shows when the child is actually dismissed. Report it against the line where the
child `v-dialog` is declared, and name the control that opens it as the evidence.

---

## PHP

**Applies when:** the diff contains `.php` files. No manifest check is needed — the extension alone
is the signal. `.blade.php` templates count; PHP inside them follows the same rules.

### Naming — PSR-1 casing, camelCase variables

PHP itself accepts `$Total` and `$order_total`, so nothing here is a syntax error — every rule in
this section is a **MINOR** style finding. Check only names the diff **introduces**; a pre-existing
name the change merely references is not a finding, and a rename of it is out of scope.

| Kind | Required form | Example |
|---|---|---|
| Variable, property, parameter | camelCase, first letter lowercase | `$orderTotal`, `private $lineItems` |
| Function, method | camelCase | `getOrderTotal()` |
| Class, interface, trait, enum | StudlyCaps | `OrderService` |
| Constant, enum case | UPPER_SNAKE_CASE | `MAX_RETRIES` |

**What to look for in a diff:**

- A new variable, property, or parameter whose name starts with a capital letter (`$OrderTotal`)
  or contains an underscore (`$order_total`). Report it with the camelCase form the author should
  use. A name is "new" wherever the diff first binds it, not only in a plain assignment:
  - a compound assignment (`$run_total += $x`, `$cache_key ??= …`)
  - a `foreach` key or value (`as $row_id`, `as $row_key => $row_val`)
  - a parameter of a function, method, closure, or arrow function (`fn($event_id) => …`), and a
    closure's `use ($old_total)`
  - a `catch` variable (`catch (Exception $db_err)`)
  - unpacking (`[$first_name, $lastName] = …`, `list($a_b) = …`)
  - a property, with or without a value (`private $line_items;`, a promoted constructor property)
  - a `static` or `global` declaration (`static $call_count = 0;`)
- A new class, interface, trait, or enum whose name is not StudlyCaps (`orderService`,
  `Order_Service`).
- A new constant or enum case that is not UPPER_SNAKE_CASE (`const maxRetries`).
- A new method that starts with a capital letter or contains an underscore, other than the
  PHP magic methods (`__construct`, `__get`, `__toString`, …).

```php
// WRONG
$Order_Total = $Subtotal + $Tax;
function Calculate_total(array $Items) { … }

// RIGHT
$orderTotal = $subtotal + $tax;
function calculateTotal(array $items) { … }
```

**Exempt:** names PHP or a framework dictates — superglobals (`$_GET`, `$_SERVER`), magic methods,
magic constants, and array keys or property names that mirror an external payload (a JSON field
`Order_ID` read as `$row['Order_ID']`, or an ORM property mapped to a database column). A name that
exists only to match an external contract is not a style finding.

**Defer to the project's own naming rules.** Before reporting, check the rulebook (`.claude/review/rules.md`, or
`CLAUDE.md` and the convention docs it links) and the project's lint script for naming rules, and
apply them on top of this section:

- **A suppression marker wins.** A line carrying the project's opt-out comment (for example
  `// naming:allow`, `// phpcs:ignore`, `@phpstan-ignore`) is not a finding.
- **Names the project prescribes win.** If the project requires fixed handler names (REST names
  such as `index`, `show`, `create`, `update`, `delete` on public API routes), a new handler
  that ignores them is a finding even when it is valid camelCase. Report it with the required name.
- **Renaming rules win.** If the project renames a legacy name only together with something else
  (an old snake_case method only together with its route), a diff that renames one without the
  other is a finding, and a diff that keeps the old name is not.
- **Request and response keys follow the project's wire format.** A snake_case array key
  that mirrors the database or the API payload is exempt, as above. A camelCase key added to a
  snake_case API is a finding if the project's rules say so.
