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

1. **File extensions in the diff** — `.vue`, `.jsx`/`.tsx`, `.blade.php`, `.svelte`. You already
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
