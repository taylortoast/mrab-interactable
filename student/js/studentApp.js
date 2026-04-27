import { loadScenario } from '../../shared/js/scenarioLoader.js';
import { openModal } from '../../shared/js/modal.js';

const state = {
  scenario: null,
  decisions: []
};

const els = {
  title: document.querySelector('#scenarioTitle'),
  layer: document.querySelector('#buildingLayer'),
  summary: document.querySelector('#collectionSummary'),
  submit: document.querySelector('#submitResultsBtn')
};

init();

async function init() {
  state.scenario = await loadScenario('../data/sample-scenario.json');
  els.title.textContent = state.scenario.title;
  renderBuildings();
  bindResultsExport();
}

function renderBuildings() {
  els.layer.innerHTML = '';

  state.scenario.buildings.forEach((building) => {
    const btn = document.createElement('button');
    btn.className = 'building-marker';
    btn.textContent = building.name;
    btn.style.left = `${building.bounds.x}%`;
    btn.style.top = `${building.bounds.y}%`;
    btn.style.width = `${building.bounds.width}%`;
    btn.style.height = `${building.bounds.height}%`;
    btn.addEventListener('click', () => openBuildingModal(building));
    els.layer.appendChild(btn);
  });
}

function openBuildingModal(building) {
  openModal({
    title: building.name,
    body: `<p>${building.description}</p><p class="muted">Interaction options will be connected in the next build step.</p>`,
    actions: [{ label: 'Close', role: 'close' }]
  });
}

function bindResultsExport() {
  els.submit.addEventListener('click', () => {
    const payload = {
      scenarioId: state.scenario.id,
      exportedAt: new Date().toISOString(),
      decisions: state.decisions
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'student-results.json';
    link.click();
    URL.revokeObjectURL(link.href);
  });
}
