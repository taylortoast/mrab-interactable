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
│   ├── scenario.js             Active scenario (window.SCENARIO_DATA global)
│   └── sample-scenario.json   Archive/reference only — not loaded by app
├── shared/
│   ├── css/base.css            Design system, shared component styles
│   └── js/
│       ├── scenarioLoader.js   Reads window.SCENARIO_DATA
│       ├── modal.js            openModal({ title, body, actions })
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

## Scenario Data (data/scenario.js)

The scenario is a global JS variable loaded via `<script>` tag — not a fetched JSON file.

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
          "collectionItems": [
            {
              "id": "string (item-XXX)",
              "title": "string",
              "content": "string",
              "correctDecision": "collect | doNotCollect",
              "feedback": "string"
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
- Building id, name, description, and bounds are **programmer-only** — set directly in `data/scenario.js`
- Instructors manage entities and collection items only, via the instructor UI

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
data/scenario.js → shared/js/scenarioLoader.js → shared/js/modal.js → student/js/studentApp.js
```

**instructor/index.html:**
```
data/scenario.js → shared/js/scenarioLoader.js → shared/js/modal.js → shared/js/jsonUtils.js
→ instructor/js/instructorApp.js
```

## Development Guardrails

- **No external libraries** — check all `<script>` tags after any change
- **No ES modules** — do not use `import`/`export` or `<script type="module">`. Chrome blocks module imports under `file://`. All shared utilities expose globals on `window` and load as plain `<script>` tags.
- **Buildings are static** — id, name, description, bounds are programmer-only; set in `data/scenario.js`. Do not add instructor UI for these fields.
- All scenario content must come from `window.SCENARIO_DATA` — never hardcode building names or entity data
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

Entity and item editing still opens modals (forms need them). After any save or delete the inline panel refreshes automatically — no modal re-open. The old `openBuildingPanel` / `renderEntitySection` / modal-chain flow has been removed.
