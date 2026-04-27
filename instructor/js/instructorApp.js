import { downloadJson, readJsonFile } from '../../shared/js/jsonUtils.js';
import { openModal } from '../../shared/js/modal.js';

let scenario = {
  id: 'scenario-001',
  title: 'Untitled Scenario',
  description: '',
  mapImage: '../assets/maps/base-map-placeholder.svg',
  buildings: []
};

const els = {
  title: document.querySelector('#scenarioTitleInput'),
  description: document.querySelector('#scenarioDescriptionInput'),
  preview: document.querySelector('#scenarioPreview'),
  importInput: document.querySelector('#importScenarioInput'),
  exportBtn: document.querySelector('#exportScenarioBtn'),
  addBuildingBtn: document.querySelector('#addBuildingBtn')
};

init();

function init() {
  syncFormFromScenario();
  bindEvents();
  renderPreview();
}

function bindEvents() {
  els.title.addEventListener('input', () => updateScenarioField('title', els.title.value));
  els.description.addEventListener('input', () => updateScenarioField('description', els.description.value));
  els.exportBtn.addEventListener('click', () => downloadJson('scenario.json', scenario));
  els.importInput.addEventListener('change', handleImport);
  els.addBuildingBtn.addEventListener('click', openAddBuildingModal);
}

function updateScenarioField(field, value) {
  scenario[field] = value;
  renderPreview();
}

async function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  scenario = await readJsonFile(file);
  syncFormFromScenario();
  renderPreview();
}

function openAddBuildingModal() {
  openModal({
    title: 'Add Building Placeholder',
    body: '<p>The next build step will connect this modal to a structured building form.</p>',
    actions: [{ label: 'Close', role: 'close' }]
  });
}

function syncFormFromScenario() {
  els.title.value = scenario.title || '';
  els.description.value = scenario.description || '';
}

function renderPreview() {
  els.preview.textContent = JSON.stringify(scenario, null, 2);
}
