# 335 TRS Interactive Scenario – Project Notes

## What This Is

A local HTML/CSS/JS training tool for the 335th Training Squadron. Two websites:
- **Student** (`student/`) – interactive map, click buildings, interact with entities, make collect decisions, export results
- **Instructor** (`instructor/`) – build/edit scenarios, review student results

No external libraries. No frameworks. No server required.

## How to Run

Open `student/index.html` or `instructor/index.html` directly in a browser. No server needed.

Optional server (for development): `python -m http.server 8000` from project root.

## Folder Structure

```
335trs-scenario-scaffold/
├── assets/maps/           SVG map files
├── data/
│   ├── scenario.js        Active scenario (window.SCENARIO_DATA global)
│   └── sample-scenario.json  Archive/reference only
├── shared/
│   ├── css/base.css       Design system, shared component styles
│   └── js/
│       ├── scenarioLoader.js  Reads window.SCENARIO_DATA
│       ├── modal.js           openModal({ title, body, actions })
│       └── jsonUtils.js       downloadJson(), readJsonFile()
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

The scenario is a global JS variable — not a fetched JSON file — so it works under `file://` without a server.

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
          "id": "string",
          "type": "person | section | organization",
          "name": "string",
          "description": "string",
          "collectionItems": [
            {
              "id": "string",
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
- IDs follow pattern: `bldg-XXX`, `entity-XXX`, `item-XXX`

## Student Results Schema

Exported as `student-results.json`:

```json
{
  "scenarioId": "string",
  "exportedAt": "ISO timestamp",
  "decisions": [
    {
      "buildingId": "string",
      "entityId": "string",
      "itemId": "string",
      "decision": "collect | doNotCollect",
      "timestamp": "ISO timestamp"
    }
  ]
}
```

## Development Guardrails

- No external libraries (check all `<script>` tags after any change)
- **No ES modules** — do not use `import`/`export` or `<script type="module">`. Chrome blocks module imports under `file://`. All shared utilities expose globals on `window` and are loaded as plain `<script>` tags.
- Script load order in HTML: `scenario.js` → `scenarioLoader.js` → `modal.js` → `jsonUtils.js` → app script
- All content must come from `window.SCENARIO_DATA` — never hardcode building names or entity data
- Do not replace or modify the SVG map at `assets/maps/base-map-placeholder.svg`
- Make small, testable changes — verify in browser after each step
- Do not add authentication
- Do not add real student PII
- Maintain the existing folder structure
