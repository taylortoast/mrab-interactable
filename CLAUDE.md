# 335 TRS Interactive Scenario – Project Notes

## What This Is

A local HTML/CSS/JS training tool for the 335th Training Squadron. Two websites:
- **Student** (`student/`) – login, interactive map, click buildings, interact with entities, make collect decisions, export results as a `.json` file
- **Instructor** (`instructor/`) – manage building entities/collection items, import student `.json` result files and evaluate them

No external libraries. No frameworks. No server required — works under `file://` and HTTP equally.

## How to Run

Open `student/index.html` or `instructor/index.html` directly in a browser. No server needed.

Optional server (for development): `python -m http.server 8000` from project root.

## Folder Structure

```
335trs-scenario-scaffold/
├── assets/maps/                SVG map files
├── data/
│   ├── scenario.js             Instructor bootstrap seed only (window.SCENARIO_DATA global)
│   └── sample-scenario.json   Archive/reference only — not loaded by app
├── shared/
│   ├── css/base.css            Design system, shared component styles
│   ├── images/                 Source images (base64 data URLs stored in scenario JSON)
│   ├── scenarios/              Saved scenario JSON files (scenario-1.json, scenario-2.json, …)
│   └── js/
│       ├── scenarioLoader.js   loadScenario() + validateScenario()
│       ├── modal.js            openModal({ title, body, actions, cardClass })
│       └── jsonUtils.js        downloadJson(), readJsonFile()
├── student/
│   ├── index.html
│   ├── styles.css
│   └── js/studentApp.js
└── instructor/
    ├── index.html
    ├── styles.css
    └── js/instructorApp.js
```

## Scenario Data

### Canonical format: `shared/scenarios/scenario-N.json`

Saved scenarios are **pure JSON** files stored in `shared/scenarios/`. Filename convention: `scenario-1.json`, `scenario-2.json`, etc. The `id` field inside must match: `"id": "scenario-1"`.

The instructor exports the current scenario as JSON and saves it here manually. The student loads a scenario from this folder via a file picker on the login page.

### `data/scenario.js` — instructor bootstrap seed only

Loaded via `<script>` tag in `instructor/index.html` to give the instructor app an initial working state on first open. Not loaded by the student app. Format:

```js
window.SCENARIO_DATA = { /* scenario object */ };
```

### Schema

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "mapImage": "string (relative path to SVG)",
  "buildings": [
    {
      "id": "string (bldg-XXX)",
      "name": "string",
      "description": "string",
      "bounds": { "x": number, "y": number, "width": number, "height": number },
      "entities": [
        {
          "id": "string (entity-XXX)",
          "type": "person | section | organization",
          "name": "string",
          "description": "string",
          "image": "string (base64 data URL or empty string)",
          "collectionItems": [
            {
              "id": "string (item-XXX)",
              "title": "string",
              "content": "string",
              "correctDecision": "collect | doNotCollect",
              "feedback": "string",
              "image": "string (base64 data URL or empty string)"
            }
          ]
        }
      ]
    }
  ]
}
```

- `bounds` values are percentages (0–100) for CSS `left`, `top`, `width`, `height`
- Max **5 collection items per entity**
- Building id, name, description, and bounds are **programmer-only** — set directly in `data/scenario.js` (the seed)
- Instructors manage entities and collection items only, via the instructor UI
- `validateScenario(data)` in `scenarioLoader.js` checks id, title, and buildings fields and throws on invalid input

## Student Submission Format

Students log in with their name before the scenario begins. Submissions export as plain `.json` files:

**Filename:** `YYYYMMDD_HHMMSS_First_Last_results.json` (e.g. `20260427_143022_John_Smith_results.json`)

**File content:**
```json
{
  "studentName": "John Smith",
  "submittedAt": "ISO timestamp",
  "scenarioId": "scenario-001",
  "scenarioTitle": "335 TRS Sample Interactive Scenario",
  "decisions": [
    {
      "buildingId": "bldg-001",
      "entityId": "entity-001",
      "itemId": "item-001",
      "decision": "collect | doNotCollect",
      "timestamp": "ISO timestamp"
    }
  ]
}
```

## Instructor Submission Workflow

1. Receive student `.json` result file
2. Open `instructor/index.html` → Student Evaluation tab
3. Click **Choose Result Files**, select one or more `.json` files — loaded students appear in the left panel immediately

## Script Load Order

**student/index.html:**
```
shared/js/scenarioLoader.js → shared/js/modal.js → shared/js/jsonUtils.js → student/js/studentApp.js
```
Note: `data/scenario.js` is NOT loaded by the student. The scenario is selected via file picker on the login page. `jsonUtils.js` is required (student uses `readJsonFile`).

**instructor/index.html:**
```
data/scenario.js → shared/js/scenarioLoader.js → shared/js/modal.js → shared/js/jsonUtils.js
→ instructor/js/instructorApp.js
```

## Development Guardrails

- **No external libraries** — check all `<script>` tags after any change
- **No ES modules** — do not use `import`/`export` or `<script type="module">`. Chrome blocks module imports under `file://`. All shared utilities expose globals on `window` and load as plain `<script>` tags.
- **No `fetch()` for local files** — does not work under `file://`. Use `FileReader` via `readJsonFile()` for all local file loading.
- **Buildings are static** — id, name, description, bounds are programmer-only; set in `data/scenario.js`. Do not add instructor UI for these fields.
- Scenario content in the student app comes from a user-selected JSON file (not a hardcoded script tag). Never assume `window.SCENARIO_DATA` is pre-loaded in the student app.
- Do not replace or modify the SVG map at `assets/maps/base-map-placeholder.svg`
- Make small, testable changes — verify in browser after each step
- Do not add real student PII beyond the name field
- Maintain the existing folder structure

## Known Dev Tool

`studentApp.js` contains `initCoordTool()` (currently commented out in `startScenario()`). Uncomment the call when placing building bounds, remove when done.

## Instructor Buildings Tab Layout

The Buildings tab uses a two-column layout (mirroring the Student Evaluation tab):
- **Left sidebar** (`#buildingList`, `.buildings-list-panel`) — clickable list of all buildings; first building auto-selected on load
- **Right panel** (`#buildingDetail`, `.building-detail-panel`) — selected building's contacts (entities) and their collection items displayed inline with Collect/No Collect decision badges

All entity and item editing is fully inline — no modals. Forms render directly in the right panel via `buildingState.editMode`. After any save or delete the panel re-renders automatically. The old modal-chain flow (`openBuildingPanel`, `renderEntitySection`, etc.) has been removed.

Entities and items both support an optional `image` field (base64 data URL). The instructor can select an image file in the inline edit form; the data URL is stored in the scenario. Thumbnails appear next to entity names and item rows in view mode. Images are intended for display in the student modal (not yet implemented on the student side).
