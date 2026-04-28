# 335 TRS Interactive Scenario

A local training tool for the 335th Training Squadron. Two self-contained websites — no server, no build step, no external libraries required.

## Quick Start

Open either file directly in a browser:

- **Student:** `student/index.html`
- **Instructor:** `instructor/index.html`

**Optional development server** (if you prefer URLs over `file://` paths):

```bash
python -m http.server 8000
```

Then open:
- Student: `http://localhost:8000/student/`
- Instructor: `http://localhost:8000/instructor/`

## Folder Structure

```
335trs-scenario-scaffold/
├── assets/maps/                SVG map files
├── data/
│   ├── scenario.js             Active scenario (window.SCENARIO_DATA global)
│   └── sample-scenario.json   Archive/reference only — not loaded by the app
├── docs/
│   └── buildings.xlsx          Building registry (source of truth for bounds)
├── shared/
│   ├── css/base.css            Design system and shared component styles
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
    ├── js/instructorApp.js
    └── submissions/
        ├── index.js            Submission manifest — instructor edits this
        └── *.js                Individual student submission files
```

## How It Works

### Student Flow

1. Open `student/index.html`
2. Enter your full name at the login screen
3. Click buildings on the map to open them
4. Interact with entities (people, sections, organizations) inside each building
5. Review collection items and decide: **Collect** or **Do Not Collect**
6. Export your decisions as a `.js` file when finished

Submission filenames follow this pattern: `YYYYMMDD_HHMMSS_First_Last.js`

### Instructor Flow — Managing Scenario Content

Open `instructor/index.html` and use the **Buildings** tab to:

- Add, edit, or remove entities within each building
- Add, edit, or remove collection items for each entity (max 5 per entity)
- Set the correct decision and feedback text for each item

> Building names, locations, and bounds are set by the developer in `data/scenario.js`. They are not editable from the instructor UI.

### Instructor Flow — Evaluating Student Submissions

1. Receive the student's `.js` file
2. Copy it into `instructor/submissions/`
3. Open `instructor/submissions/index.js` and add the filename to `window.SUBMISSION_MANIFEST`
4. Open `instructor/index.html` → **Student Evaluation** tab — all listed submissions load automatically

## Scenario Data

The active scenario is defined in `data/scenario.js` as a window global:

```js
window.SCENARIO_DATA = {
  "id": "scenario-001",
  "title": "...",
  "buildings": [ ... ]
};
```

Key schema points:
- `buildings[]` — each building has an `id`, `name`, `description`, `bounds`, and `entities[]`
- `bounds` values are percentages (0–100) for CSS positioning on the map
- `entities[]` — people, sections, or organizations; each has `collectionItems[]`
- `collectionItems[]` — max 5 per entity; each has a `correctDecision` (`collect` | `doNotCollect`) and `feedback`

See `CLAUDE.md` for the full schema and guardrails.

## Script Load Order

**student/index.html:**
```
data/scenario.js → shared/js/scenarioLoader.js → shared/js/modal.js → student/js/studentApp.js
```

**instructor/index.html:**
```
data/scenario.js → shared/js/scenarioLoader.js → shared/js/modal.js → shared/js/jsonUtils.js
→ instructor/submissions/index.js → instructor/js/instructorApp.js
```

## Development Notes

- **No external libraries** — do not add `<script>` tags pointing to CDNs or npm packages
- **No ES modules** — do not use `import`/`export` or `<script type="module">`; Chrome blocks module imports under `file://`
- **No `fetch()`** — all data loads via plain `<script>` tags so the app works under `file://` without a server
- **Buildings are static** — set bounds in `data/scenario.js` using the built-in coord tool (`initCoordTool()` in `studentApp.js`); do not expose building fields in the instructor UI
- See `CLAUDE.md` for the full schema and all development guardrails
