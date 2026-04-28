# Scenario JSON Redesign Plan

## Problem

The current scenario system has two blocking gaps:

1. **No round-trip save/load** — the instructor can edit entities and items, but the only export is a `.js` file wrapped in `window.SCENARIO_DATA = …`. That format can't be reloaded via a file picker; it can only be placed back on disk and loaded at startup. There is no way to maintain and iterate on multiple named scenarios.

2. **Student has no scenario selection** — the student app hardcodes `data/scenario.js` as the only possible scenario. Students cannot choose which scenario to run.

---

## Goals

- Instructor exports scenarios as **pure JSON** (`scenario-1.json`, `scenario-2.json`, …)
- Instructor can **load** a previously saved scenario JSON to continue editing
- `shared/scenarios/` is the canonical home for saved scenario files
- Student **login page** gains a file picker to select a scenario JSON before beginning
- Everything still works under `file://` with no server — no `fetch()`, only `FileReader`

---

## Architecture Notes

**Why a file picker instead of a dropdown?**
Under `file://`, browsers block directory listing and cross-origin `fetch()` for local files. A file picker (`<input type="file">`) is the only reliable way to load a local JSON file under `file://`. The student picks the file from `shared/scenarios/` in the OS dialog.

**`data/scenario.js` is not removed.** It remains as the instructor's initial seed — the instructor app still loads it at startup via `<script>` tag, giving an immediate working state on first open. The new "Load Scenario" button lets the instructor swap it for any saved JSON at runtime.

**`scenarioLoader.js`** gains a `validateScenario(data)` export. The student app stops calling `loadScenario()` (it no longer needs it); the instructor still calls `loadScenario()` as before.

---

## Scenario Filename Convention

```
shared/scenarios/scenario-1.json
shared/scenarios/scenario-2.json
...
```

Filenames use a simple `scenario-N` format. The `id` field inside each JSON should match: `"id": "scenario-1"`.

Update `data/scenario.js` to change the existing seed ID from `"scenario-001"` to `"scenario-1"` so exports are consistent.

---

## Files to Change

| File | Change type |
|---|---|
| `shared/scenarios/` | **Create** directory + `.gitkeep` + `scenario-1.json` seed |
| `shared/js/scenarioLoader.js` | **Add** `validateScenario()` export |
| `instructor/index.html` | **Add** "Load Scenario" file input to header |
| `instructor/js/instructorApp.js` | **Change** export to JSON; **Add** load scenario handler |
| `student/index.html` | **Add** scenario file picker to login card; **Remove** `data/scenario.js` script tag |
| `student/js/studentApp.js` | **Rework** login to require scenario file; remove `loadScenario()` call |
| `student/styles.css` | **Add** styles for scenario picker row in login card |
| `data/scenario.js` | **Update** ID from `scenario-001` → `scenario-1` |
| `CLAUDE.md` | **Update** architecture, folder structure, load order |

---

## Detailed Changes

### 1. `shared/scenarios/` directory

Create the directory. Add two files:

**`shared/scenarios/.gitkeep`** — empty, establishes the directory in git.

**`shared/scenarios/scenario-1.json`** — copy of the current scenario as pure JSON (no JS wrapper):
```json
{
  "id": "scenario-1",
  "title": "335 TRS Sample Interactive Scenario",
  ...
}
```
This is the same data as `data/scenario.js` but without `window.SCENARIO_DATA = ` prefix, ID updated to `"scenario-1"`.

---

### 2. `shared/js/scenarioLoader.js`

Add `validateScenario()` alongside the existing `loadScenario()`. Keep `loadScenario()` unchanged (instructor still uses it).

```js
window.loadScenario = function () {
  if (!window.SCENARIO_DATA) {
    throw new Error('SCENARIO_DATA not found. Ensure data/scenario.js is loaded before this script.');
  }
  return window.SCENARIO_DATA;
};

window.validateScenario = function (data) {
  if (!data || typeof data !== 'object') throw new Error('Not a valid scenario object.');
  if (typeof data.id !== 'string' || !data.id) throw new Error('Scenario missing id field.');
  if (typeof data.title !== 'string' || !data.title) throw new Error('Scenario missing title field.');
  if (!Array.isArray(data.buildings)) throw new Error('Scenario missing buildings array.');
  return data; // returns the data for chaining
};
```

---

### 3. `instructor/index.html`

**In the `<header>`**, add a "Load Scenario" styled file label + hidden input alongside the existing "Export Scenario" button:

```html
<div class="button-row">
  <label class="secondary-btn" for="loadScenarioInput" style="cursor:pointer;">Load Scenario</label>
  <input id="loadScenarioInput" type="file" accept=".json,application/json" style="display:none;" />
  <button id="exportScenarioBtn" class="primary-btn">Export Scenario</button>
</div>
```

---

### 4. `instructor/js/instructorApp.js`

#### 4a. Wire up `#loadScenarioInput`

Add to `bindEvents()`:
```js
document.querySelector('#loadScenarioInput')?.addEventListener('change', handleLoadScenario);
```

Add the handler:
```js
function handleLoadScenario(event) {
  const file = event.target.files[0];
  if (!file) return;
  readJsonFile(file)
    .then((data) => {
      validateScenario(data); // throws on invalid
      scenario = JSON.parse(JSON.stringify(data)); // deep clone
      buildingState.selectedBuildingId = null;
      buildingState.editMode = null;
      renderBuildingList();
      if (scenario.buildings.length) selectBuilding(scenario.buildings[0]);
    })
    .catch((err) => alert('Could not load scenario: ' + err.message));
  event.target.value = ''; // allow reloading same file
}
```

#### 4b. Replace `exportScenarioJs()` with `exportScenarioJson()`

Remove:
```js
function exportScenarioJs() {
  const content = 'window.SCENARIO_DATA = ' + JSON.stringify(scenario, null, 2) + ';\n';
  const blob = new Blob([content], { type: 'application/javascript' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'scenario.js';
  link.click();
  URL.revokeObjectURL(link.href);
}
```

Replace with:
```js
function exportScenarioJson() {
  downloadJson(scenario.id + '.json', scenario);
}
```

Update `bindEvents()` reference from `exportScenarioJs` → `exportScenarioJson`.

---

### 5. `student/index.html`

#### 5a. Remove `data/scenario.js` script tag

Remove this line:
```html
<script src="../data/scenario.js"></script>
```

The student no longer pre-loads the scenario via script tag; it comes entirely from the file picker.

#### 5b. Also remove `scenarioLoader.js` from student script tags

```html
<script src="../shared/js/scenarioLoader.js"></script>  ← remove
```

`loadScenario()` is no longer called by the student app. `validateScenario()` is used directly from the new inline validation in `studentApp.js` — OR load `scenarioLoader.js` just for the validate function (either is fine; removing is cleaner).

**Recommended: keep `scenarioLoader.js` loaded** (it's tiny) so `validateScenario()` is available, but the student app stops calling `loadScenario()`.

#### 5c. Update login card HTML

Replace the current login card body:
```html
<div class="login-card">
  <p class="eyebrow">335th Training Squadron</p>
  <h2>Scenario Login</h2>
  <p class="muted">Enter your full name to begin.</p>
  <label>Full Name <input id="studentNameInput" type="text" placeholder="First Last" autocomplete="name" /></label>
  <button id="beginScenarioBtn" class="primary-btn">Begin Scenario</button>
</div>
```

With:
```html
<div class="login-card">
  <p class="eyebrow">335th Training Squadron</p>
  <h2>Scenario Login</h2>

  <div class="login-scenario-row">
    <span class="login-step-label">1. Select Scenario</span>
    <label class="secondary-btn login-file-btn" for="scenarioFileInput">Choose Scenario File</label>
    <input id="scenarioFileInput" type="file" accept=".json,application/json" style="display:none;" />
    <p id="scenarioLoadedTitle" class="login-scenario-title muted">No scenario loaded.</p>
  </div>

  <label class="login-name-label">
    <span class="login-step-label">2. Enter Your Name</span>
    <input id="studentNameInput" type="text" placeholder="First Last" autocomplete="name" />
  </label>

  <button id="beginScenarioBtn" class="primary-btn" disabled>Begin Scenario</button>
</div>
```

---

### 6. `student/js/studentApp.js`

The `initLogin()` function needs to:
1. Bind `#scenarioFileInput` change → load + validate the JSON → store in `pendingScenario` → show title → update Begin button state
2. Update Begin button enabled state on both file load and name input
3. On Begin click: set `state.scenario = pendingScenario` then start

```js
function initLogin() {
  const overlay = document.querySelector('#loginOverlay');
  const scenarioInput = document.querySelector('#scenarioFileInput');
  const scenarioTitle = document.querySelector('#scenarioLoadedTitle');
  const nameInput = document.querySelector('#studentNameInput');
  const beginBtn = document.querySelector('#beginScenarioBtn');

  let pendingScenario = null;

  function updateBeginState() {
    beginBtn.disabled = !pendingScenario || !nameInput.value.trim();
  }

  scenarioInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    readJsonFile(file)
      .then((data) => {
        validateScenario(data); // throws on bad schema
        pendingScenario = data;
        scenarioTitle.textContent = data.title;
        scenarioTitle.classList.remove('muted');
      })
      .catch((err) => {
        pendingScenario = null;
        scenarioTitle.textContent = 'Invalid scenario file: ' + err.message;
        scenarioTitle.classList.add('muted');
      })
      .finally(updateBeginState);
    e.target.value = '';
  });

  nameInput.addEventListener('input', updateBeginState);
  nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') attemptLogin(); });
  beginBtn.addEventListener('click', attemptLogin);
  nameInput.focus();

  function attemptLogin() {
    if (!pendingScenario || !nameInput.value.trim()) return;
    state.studentName = nameInput.value.trim();
    state.scenario = pendingScenario;
    overlay.remove();
    startScenario();
  }
}
```

In `startScenario()`, remove the `loadScenario()` call — `state.scenario` is already set:
```js
function startScenario() {
  // state.scenario is already set by initLogin()
  els.title.textContent = state.scenario.title;
  els.nameDisplay.textContent = state.studentName;
  renderBuildings();
  els.submit.addEventListener('click', exportResults);
}
```

Note: `readJsonFile` and `validateScenario` must be available as globals. `readJsonFile` comes from `shared/js/jsonUtils.js` (already loaded). `validateScenario` comes from `shared/js/scenarioLoader.js`.

**Updated student script load order:**
```html
<script src="../shared/js/scenarioLoader.js"></script>
<script src="../shared/js/modal.js"></script>
<script src="../shared/js/jsonUtils.js"></script>  ← add (student needs readJsonFile)
<script src="./js/studentApp.js"></script>
```

`data/scenario.js` is removed. `jsonUtils.js` is added (student now needs `readJsonFile`).

---

### 7. `student/styles.css`

Add login card scenario-picker styles:

```css
/* ── Login scenario picker ───────────────────────────────────────────────── */

.login-scenario-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.login-step-label {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.login-file-btn {
  display: inline-block;
  cursor: pointer;
  width: fit-content;
  font-size: 1.4rem;
  padding: 0.6rem 1rem;
}

.login-scenario-title {
  font-size: 1.4rem;
  margin: 0;
}

.login-name-label {
  display: grid;
  gap: 0.5rem;
  font-weight: 700;
}
```

---

### 8. `data/scenario.js`

Change `"id": "scenario-001"` → `"id": "scenario-1"` to match the new naming convention.

---

## Implementation Order

1. Create `shared/scenarios/` with `.gitkeep` and `scenario-1.json` seed
2. Update `shared/js/scenarioLoader.js` — add `validateScenario()`
3. Update `data/scenario.js` — change ID to `scenario-1`
4. Update `instructor/js/instructorApp.js` — export JSON + load scenario handler
5. Update `instructor/index.html` — add Load Scenario input to header
6. Update `student/styles.css` — add login picker styles
7. Update `student/index.html` — swap script tags, update login card HTML
8. Update `student/js/studentApp.js` — rework `initLogin()`, simplify `startScenario()`
9. Verify in browser: instructor load/save round-trip; student login with scenario file

---

## Verification Checklist

**Instructor:**
- [ ] "Export Scenario" button downloads `scenario-1.json` (pure JSON, no JS wrapper)
- [ ] "Load Scenario" button opens file picker; selecting `scenario-1.json` reloads the Buildings tab
- [ ] Editing an entity then exporting produces valid JSON that can be re-loaded

**Student:**
- [ ] Login page shows "Choose Scenario File" button + "Begin Scenario" (disabled)
- [ ] Selecting `scenario-1.json` shows the scenario title; Begin button enables (after name entered)
- [ ] Entering name only does NOT enable Begin (scenario still required)
- [ ] Clicking Begin starts the scenario; map loads, buildings are clickable
- [ ] Submit Results export still works correctly (includes correct `scenarioId: "scenario-1"`)

**Backward compatibility:**
- [ ] Any existing student result files with `scenarioId: "scenario-001"` will show scenario mismatch warning in the instructor — this is expected and acceptable
