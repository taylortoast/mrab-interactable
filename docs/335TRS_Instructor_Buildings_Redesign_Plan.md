# 335 TRS Instructor Site — Buildings Tab Redesign Plan

## Purpose

This plan describes the next recommended development change for the `taylortoast/mrab-interactable` project.

The goal is to redesign the **Buildings tab** of the instructor site from a modal-based management flow into a clearer two-panel inline layout — mirroring the pattern already established in the Student Evaluation tab.

---

## Current State

### How the Buildings tab currently works

1. The Buildings tab renders a flat list of `building-row` items, one per building.
2. Each row shows the building name, an entity count badge, and a **Manage** button.
3. Clicking **Manage** opens `openModal()` → `openBuildingPanel()`, which shows an entity list inside a modal.
4. Clicking **Edit** on an entity opens another `openModal()` → `openEntityForm()`, showing the entity form and its collection items inside a second nested modal.
5. Clicking **Edit** on a collection item opens a third `openModal()` → `openItemForm()`.

### Problems with the current design

- Three levels of modals to reach a collection item — confusing and hard to navigate.
- No way to see entities or collection items at a glance without clicking into modals.
- The "Manage" button pattern implies a gate rather than a browseable list.
- Building context is lost when drilling into entities and items.

---

## Repository State at Time of Writing

Branch: `main` (recent commits as of 2026-04-28)

Relevant files:
```
instructor/index.html           — Buildings tab HTML (currently a single #buildingList div)
instructor/styles.css           — Has building-row, entity-row, item-row styles
instructor/js/instructorApp.js  — All building/entity/item CRUD logic
shared/css/base.css             — Design tokens (--bg, --panel, --panel-dark, --border, --accent, etc.)
data/scenario.js                — window.SCENARIO_DATA with 15 buildings; bldg-001 (Wing HQ) has entities
```

The Student Evaluation tab was recently redesigned to use a two-column layout pattern:
- Left: selectable list panel (`.student-results-list-panel`)
- Right: detail panel (`.student-evaluation-detail-panel`)

The Buildings redesign should follow this same established pattern.

### Current instructor/index.html Buildings tab structure

```html
<div id="tab-buildings" class="tab-panel active">
  <div class="panel-content">
    <h2>Buildings</h2>
    <p class="muted">Select a building to manage its contacts and collection items.</p>
    <div id="buildingList" class="building-list"></div>
  </div>
</div>
```

### Current instructorApp.js Buildings functions

- `renderBuildingList()` — renders building-row items with Manage buttons into `#buildingList`
- `openBuildingPanel(building)` — opens modal containing `renderEntitySection(building)`
- `renderEntitySection(building)` — returns HTML string of entity rows + Add button
- `bindEntityFormEvents(building)` — wires edit/delete/add on entities inside the modal
- `refreshEntityList(building)` — re-renders entity list inside modal after a change
- `openEntityForm(building, existing)` — opens modal with entity form + item section
- `saveEntityForm(building, entity, isNew)` — saves entity to scenario, closes modal, reopens building panel
- `renderItemSection(entity)` — returns HTML of item rows (inside entity form modal)
- `bindItemFormEvents(building, entity)` — wires edit/delete/add on items inside entity form modal
- `refreshItemList(building, entity)` — re-renders item list inside entity form modal
- `openItemForm(building, entity, existing)` — opens modal with item form
- `saveItemForm(building, entity, item, isNew)` — saves item, closes modal, reopens entity form

---

## Desired New Design

### Layout

```
[ Buildings tab — panel-content ]

[ Buildings List (left sidebar) ]  [ Building Detail Panel (right) ]
[ Wing HQ       1 contact       ]  [ Wing HQ                       ]
[ Dorms         0 contacts      ]  [ Contacts                [+Add] ]
[ Chapel        0 contacts      ]  |─────────────────────────────| |
[ Maintenance   0 contacts      ]  | Training Manager  [person]  | |
[ ...                           ]  |   3 / 5 items   [Edit][Del] | |
                                   |   ├ Schedule Conflict       | |
                                   |   ├ Ring                    | |
                                   |   └ Water                   | |
                                   |─────────────────────────────| |
                                   |  (empty buildings show      | |
                                   |   "No contacts yet" msg)    | |
```

### Behavioral rules

- Clicking a building in the left list selects it (highlights it, updates right panel).
- The right panel shows the full entity list and their collection item titles inline — no modal needed just to view content.
- **Add Contact**, **Edit** (entity), and **Delete** (entity) still trigger modals for form input — modals are appropriate for forms.
- **Add Item**, **Edit** (item), and **Delete** (item) still trigger modals.
- After any save or delete, the right panel refreshes inline (no modal re-open).
- The first building is auto-selected on load (like the evaluation tab auto-selects the first student).
- The "Manage" button on each building row is removed.

---

## Files to Modify

| File | Change |
|------|--------|
| `instructor/index.html` | Replace `#buildingList` with two-column layout HTML |
| `instructor/styles.css` | Add layout, list item, and detail panel CSS classes |
| `instructor/js/instructorApp.js` | Refactor buildings rendering to inline panel; keep all CRUD modals |

---

## Step-by-Step Implementation Plan

---

### Step 1 — Update instructor/index.html

Replace the Buildings tab content:

**Current:**
```html
<div id="tab-buildings" class="tab-panel active">
  <div class="panel-content">
    <h2>Buildings</h2>
    <p class="muted">Select a building to manage its contacts and collection items.</p>
    <div id="buildingList" class="building-list"></div>
  </div>
</div>
```

**New:**
```html
<div id="tab-buildings" class="tab-panel active">
  <div class="panel-content">
    <h2>Buildings</h2>

    <div class="buildings-layout">
      <aside class="buildings-list-panel">
        <div id="buildingList"></div>
      </aside>
      <section class="building-detail-panel">
        <div id="buildingDetail">
          <p class="muted">Select a building to manage its contacts and collection items.</p>
        </div>
      </section>
    </div>

  </div>
</div>
```

Key IDs:
- `#buildingList` — retains same ID (left sidebar list)
- `#buildingDetail` — new ID (right detail panel)

---

### Step 2 — Add CSS to instructor/styles.css

Append to the bottom of the file. Mirror the pattern used in `.evaluation-layout` / `.student-results-list-panel`:

```css
/* ── Buildings two-column layout ─────────────────────────────────────────── */

.buildings-layout {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.buildings-list-panel {
  min-width: 16rem;
  flex-shrink: 0;
  background: var(--panel-dark);
  border: 1px solid var(--border);
  border-radius: 0.8rem;
  padding: 1.2rem;
}

.building-detail-panel {
  flex: 1;
  min-width: 0;
}

.building-list-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.8rem 1rem;
  margin-bottom: 0.5rem;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 0.6rem;
  color: var(--text);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.building-list-item:hover { background: #1a2d47; }

.building-list-item.active {
  border-left: 3px solid var(--accent);
  background: #162233;
}

.building-list-item-name {
  display: block;
  font-weight: 700;
  font-size: 1rem;
}

.building-list-item-meta {
  display: block;
  font-size: 0.85rem;
  color: var(--muted);
  margin-top: 0.15rem;
}

/* ── Building detail panel ───────────────────────────────────────────────── */

.building-detail-card {
  background: var(--panel-dark);
  border: 1px solid var(--border);
  border-radius: 0.8rem;
  padding: 1.4rem;
}

.building-detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.8rem;
  border-bottom: 1px solid var(--border);
}

.building-detail-title { margin: 0; font-size: 1.4rem; }

/* ── Inline entity cards ─────────────────────────────────────────────────── */

.entity-card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 0.6rem;
  padding: 1rem 1.2rem;
  margin-bottom: 0.8rem;
}

.entity-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.6rem;
}

.entity-card-name {
  font-weight: 700;
  font-size: 1rem;
}

.entity-card-items {
  margin-top: 0.4rem;
  padding-left: 0.8rem;
  border-left: 2px solid var(--border);
}

.entity-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.3rem 0;
  font-size: 0.9rem;
}

.entity-item-title { color: var(--text); }

.entity-item-decision {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.1rem 0.4rem;
  border-radius: 0.3rem;
}

.decision-collect    { color: #3c8; border: 1px solid #3c8; }
.decision-no-collect { color: #e55; border: 1px solid #e55; }
```

---

### Step 3 — Refactor instructor/js/instructorApp.js

#### 3a — Add buildingState

After `evaluationState`, add:

```js
const buildingState = {
  selectedBuildingId: null
};
```

#### 3b — Update els

Add:

```js
buildingDetail: document.querySelector('#buildingDetail')
```

#### 3c — Update init()

Auto-select the first building on load:

```js
function init() {
  scenario = JSON.parse(JSON.stringify(loadScenario()));
  bindEvents();
  renderBuildingList();
  if (scenario.buildings.length) {
    selectBuilding(scenario.buildings[0]);
  }
  initTabs();
}
```

#### 3d — Refactor renderBuildingList()

Replace the current implementation that generates `building-row` divs with "Manage" buttons. New version renders clickable `button.building-list-item` elements:

```js
function renderBuildingList() {
  els.buildingList.innerHTML = '';
  if (!scenario.buildings.length) {
    els.buildingList.innerHTML = '<p class="muted">No buildings in scenario.</p>';
    return;
  }
  scenario.buildings.forEach((building) => {
    const btn = document.createElement('button');
    btn.className = 'building-list-item' + (building.id === buildingState.selectedBuildingId ? ' active' : '');
    const entityCount = building.entities.length;
    btn.innerHTML = `
      <span class="building-list-item-name">${escHtml(building.name)}</span>
      <span class="building-list-item-meta">${entityCount} contact${entityCount !== 1 ? 's' : ''}</span>
    `;
    btn.addEventListener('click', () => selectBuilding(building));
    els.buildingList.appendChild(btn);
  });
}
```

#### 3e — Add selectBuilding()

```js
function selectBuilding(building) {
  buildingState.selectedBuildingId = building.id;
  renderBuildingList();
  renderBuildingDetail(building);
}
```

#### 3f — Add renderBuildingDetail()

This replaces `openBuildingPanel()` as the primary view. It renders directly into `#buildingDetail` rather than into a modal:

```js
function renderBuildingDetail(building) {
  const entityCards = building.entities.map((entity) => {
    const itemRows = entity.collectionItems.map((item) => {
      const decisionClass = item.correctDecision === 'collect' ? 'decision-collect' : 'decision-no-collect';
      const decisionLabel = item.correctDecision === 'collect' ? 'Collect' : 'No Collect';
      return `
        <div class="entity-item-row" data-item-id="${item.id}">
          <span class="entity-item-title">${escHtml(item.title)}</span>
          <div class="row-actions">
            <span class="entity-item-decision ${decisionClass}">${decisionLabel}</span>
            <button class="secondary-btn btn-sm" data-edit-item="${item.id}" data-entity-id="${entity.id}">Edit</button>
            <button class="secondary-btn btn-sm danger" data-delete-item="${item.id}" data-entity-id="${entity.id}">Delete</button>
          </div>
        </div>
      `;
    }).join('') || '<p class="muted" style="font-size:0.85rem;margin:0.4rem 0;">No items yet.</p>';

    const atMax = entity.collectionItems.length >= MAX_ITEMS;

    return `
      <div class="entity-card" data-entity-id="${entity.id}">
        <div class="entity-card-header">
          <span class="entity-card-name">${escHtml(entity.name)} <span class="badge">${entity.type}</span></span>
          <div class="row-actions">
            <button class="secondary-btn btn-sm" data-edit-entity="${entity.id}">Edit</button>
            <button class="secondary-btn btn-sm danger" data-delete-entity="${entity.id}">Delete</button>
          </div>
        </div>
        <div class="entity-card-items">
          <div class="section-header" style="margin-bottom:0.4rem;">
            <span class="muted" style="font-size:0.8rem;">Items ${entity.collectionItems.length}/${MAX_ITEMS}</span>
            <button class="secondary-btn btn-sm" data-add-item data-entity-id="${entity.id}" ${atMax ? 'disabled' : ''}>+ Add Item</button>
          </div>
          ${itemRows}
        </div>
      </div>
    `;
  }).join('') || '<p class="muted">No contacts added yet.</p>';

  els.buildingDetail.innerHTML = `
    <div class="building-detail-card">
      <div class="building-detail-header">
        <h3 class="building-detail-title">${escHtml(building.name)}</h3>
        <button id="addEntityBtn" class="secondary-btn btn-sm">+ Add Contact</button>
      </div>
      ${entityCards}
    </div>
  `;

  bindBuildingDetailEvents(building);
}
```

#### 3g — Add bindBuildingDetailEvents()

Replaces `bindEntityFormEvents()` for the new inline context:

```js
function bindBuildingDetailEvents(building) {
  document.querySelector('#addEntityBtn')?.addEventListener('click', () => openEntityForm(building, null));

  document.querySelectorAll('[data-edit-entity]').forEach((btn) => {
    const entity = building.entities.find((e) => e.id === btn.dataset.editEntity);
    if (entity) btn.addEventListener('click', () => openEntityForm(building, entity));
  });

  document.querySelectorAll('[data-delete-entity]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!confirm('Delete this contact and all its collection items?')) return;
      building.entities = building.entities.filter((e) => e.id !== btn.dataset.deleteEntity);
      syncBuildingToScenario(building);
      renderBuildingList();
      renderBuildingDetail(building);
    });
  });

  document.querySelectorAll('[data-add-item]').forEach((btn) => {
    const entity = building.entities.find((e) => e.id === btn.dataset.entityId);
    if (entity) btn.addEventListener('click', () => openItemForm(building, entity, null));
  });

  document.querySelectorAll('[data-edit-item]').forEach((btn) => {
    const entity = building.entities.find((e) => e.id === btn.dataset.entityId);
    const item = entity?.collectionItems.find((i) => i.id === btn.dataset.editItem);
    if (entity && item) btn.addEventListener('click', () => openItemForm(building, entity, item));
  });

  document.querySelectorAll('[data-delete-item]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!confirm('Delete this collection item?')) return;
      const entity = building.entities.find((e) => e.id === btn.dataset.entityId);
      if (!entity) return;
      entity.collectionItems = entity.collectionItems.filter((i) => i.id !== btn.dataset.deleteItem);
      syncEntityToBuilding(building, entity);
      syncBuildingToScenario(building);
      renderBuildingList();
      renderBuildingDetail(building);
    });
  });
}
```

#### 3h — Update saveEntityForm() and saveItemForm()

Both currently re-open a modal after saving. Change those final calls to refresh the inline panel instead:

**saveEntityForm()** — replace the last two lines:
```js
// OLD:
document.querySelector('.modal-backdrop')?.remove();
openBuildingPanel(building);

// NEW:
document.querySelector('.modal-backdrop')?.remove();
renderBuildingList();
renderBuildingDetail(building);
```

**saveItemForm()** — replace the last two lines:
```js
// OLD:
document.querySelector('.modal-backdrop')?.remove();
openEntityForm(building, entity);

// NEW:
document.querySelector('.modal-backdrop')?.remove();
renderBuildingList();
renderBuildingDetail(building);
```

#### 3i — Update openEntityForm() "Back" button

The entity form modal currently has a "Back to Building" button that calls `openBuildingPanel(building)` (which opens a modal). Change it to just close the modal — the inline panel is already visible behind it.

```js
// OLD:
{ label: 'Back to Building', role: 'close', onClick: () => openBuildingPanel(building) }

// NEW:
{ label: 'Close', role: 'close' }
```

Similarly, `openItemForm()` has a "Back to Contact" button that calls `openEntityForm(building, entity)`. Since item forms are always accessed from the inline view now, change it to just close:

```js
// OLD:
{ label: 'Back to Contact', role: 'close', onClick: () => openEntityForm(building, entity) }

// NEW:
{ label: 'Close', role: 'close' }
```

#### 3j — Remove or retire unused functions

Once the above is complete, these functions are no longer called:
- `openBuildingPanel()` — replaced by `selectBuilding()` + `renderBuildingDetail()`
- `renderEntitySection()` — replaced by inline rendering in `renderBuildingDetail()`
- `bindEntityFormEvents()` — replaced by `bindBuildingDetailEvents()`
- `refreshEntityList()` — replaced by `renderBuildingDetail(building)` call
- `renderItemSection()` — item display moved into `renderBuildingDetail()`
- `bindItemFormEvents()` — moved into `bindBuildingDetailEvents()`
- `refreshItemList()` — replaced by `renderBuildingDetail(building)` call

Remove these functions from the file to keep the codebase clean.

---

## What Is NOT Changed

- All entity and item form logic (`openEntityForm`, `saveEntityForm`, `openItemForm`, `saveItemForm`) — only the "Back" button behavior and post-save refresh change
- `syncBuildingToScenario()`, `syncEntityToBuilding()` — unchanged
- `exportScenarioJs()` — unchanged
- All evaluation tab code — unchanged
- `initTabs()`, `bindEvents()` — unchanged (except `init()` adding auto-select)
- `escHtml()` — unchanged
- No new external libraries, no ES modules, no fetch

---

## CSS Classes Being Added

```
.buildings-layout               — flex container for two-column layout
.buildings-list-panel           — left sidebar (mirrors .student-results-list-panel)
.building-detail-panel          — right detail area (mirrors .student-evaluation-detail-panel)
.building-list-item             — clickable building button (mirrors .student-result-list-item)
.building-list-item.active      — selected building highlight
.building-list-item-name        — building name text
.building-list-item-meta        — contact count meta text
.building-detail-card           — card wrapper for detail content
.building-detail-header         — flex row: title + Add Contact button
.building-detail-title          — h3 for building name
.entity-card                    — card per entity in the detail panel
.entity-card-header             — flex row: entity name/badge + Edit/Delete
.entity-card-name               — entity name + badge
.entity-card-items              — indented container for item rows
.entity-item-row                — flex row: item title + decision badge + Edit/Delete
.entity-item-title              — item title text
.entity-item-decision           — colored decision badge
.decision-collect               — green badge for "collect"
.decision-no-collect            — red badge for "do not collect"
```

---

## CSS Classes Being Removed / Deprecated

The following classes in `instructor/styles.css` are no longer used after this redesign:

```
.building-row        — replaced by .building-list-item
.building-row-name   — replaced by .building-list-item-name
```

They can be removed from the CSS file, or left temporarily and cleaned up later.

Note: `.entity-row` and `.item-row` are still used inside modals (entity/item forms are still modal-based), so they should be kept.

---

## Verification

1. Open `instructor/index.html` — confirm Buildings tab loads with two-column layout.
2. Confirm first building is auto-selected and its detail panel is populated on the right.
3. Click each building in the left list — confirm right panel updates to show that building's entities.
4. For a building with entities (Wing HQ / bldg-001): confirm entities display inline with their collection item titles and decision badges.
5. Click **Edit** on an entity — confirm form modal opens; save and confirm right panel refreshes without reopening a modal.
6. Click **Delete** on an entity — confirm confirm dialog appears; confirm deletion updates both panels.
7. Click **+ Add Contact** — confirm modal opens; add a contact and confirm it appears inline.
8. Click **+ Add Item** for an entity — confirm modal opens; add item and confirm it appears inline under the entity.
9. Click **Edit** on an item — confirm form modal; save and confirm refresh.
10. Click **Delete** on an item — confirm deletion and refresh.
11. Verify **Export Scenario** still works correctly.
12. Switch to Student Evaluation tab — confirm it still works as before.
13. No external libraries, no ES modules, no fetch.

---

## Commit Plan

### Commit 1
```
feat: add buildings two-column layout HTML
```
File: `instructor/index.html`

### Commit 2
```
feat: add building detail panel CSS classes
```
File: `instructor/styles.css`

### Commit 3
```
feat: refactor buildings tab to inline panel with entity/item detail view
```
File: `instructor/js/instructorApp.js`

---

## Claude Implementation Prompt

Use the following prompt when handing this to Claude AI:

```text
We are working in the local project at C:\Users\Admin\Documents\Web\335th MRAB (GitHub: taylortoast/mrab-interactable).

Please implement the plan in docs/335TRS_Instructor_Buildings_Redesign_Plan.md.

Primary goal:
Replace the modal-heavy Buildings tab management flow with a two-panel inline layout:
- Left sidebar: clickable list of buildings
- Right panel: selected building's entities and collection items displayed inline

Current behavior:
- Buildings tab shows a flat list with "Manage" buttons
- Clicking Manage opens a modal showing entities
- Clicking Edit on an entity opens another modal with entity form + items
- Three levels of modals to reach a collection item

Desired behavior:
- Two-column layout (mirrors the Student Evaluation tab pattern)
- Clicking a building shows its entities and items inline on the right
- Entity and item editing still uses modals (forms need them)
- After any save or delete, the inline panel refreshes automatically
- "Back" buttons in modals are removed/simplified since the inline view is always visible
- First building auto-selects on load

Constraints:
- No external libraries
- No ES modules
- No fetch
- Must work under file:// and python -m http.server 8000
- Keep all existing entity/item CRUD logic — only change the rendering context

The plan has a complete step-by-step implementation with exact code snippets and CSS classes.
All new CSS class names are defined in the plan.
All functions to add, change, and remove are specified.
```
