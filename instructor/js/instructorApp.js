(function () {
  const MAX_ITEMS = 5;

  let scenario;

  const els = {
    title: document.querySelector('#scenarioTitleInput'),
    description: document.querySelector('#scenarioDescriptionInput'),
    preview: document.querySelector('#scenarioPreview'),
    importInput: document.querySelector('#importScenarioInput'),
    exportBtn: document.querySelector('#exportScenarioBtn'),
    addBuildingBtn: document.querySelector('#addBuildingBtn'),
    buildingList: document.querySelector('#buildingList'),
    importResultsInput: document.querySelector('#importResultsInput'),
    evaluationOutput: document.querySelector('#evaluationOutput')
  };

  init();

  function init() {
    scenario = JSON.parse(JSON.stringify(loadScenario()));
    syncFormFromScenario();
    bindEvents();
    renderBuildingList();
    renderPreview();
  }

  function bindEvents() {
    els.title.addEventListener('input', () => { scenario.title = els.title.value; renderPreview(); });
    els.description.addEventListener('input', () => { scenario.description = els.description.value; renderPreview(); });
    els.exportBtn.addEventListener('click', exportScenarioJs);
    els.importInput.addEventListener('change', handleImport);
    els.addBuildingBtn.addEventListener('click', () => openBuildingForm(null));
    els.importResultsInput.addEventListener('change', handleResultsImport);
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  function exportScenarioJs() {
    const content = 'window.SCENARIO_DATA = ' + JSON.stringify(scenario, null, 2) + ';\n';
    const blob = new Blob([content], { type: 'application/javascript' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'scenario.js';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // ── Import ──────────────────────────────────────────────────────────────────

  async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';

    if (file.name.endsWith('.js')) {
      const text = await file.text();
      const match = text.match(/window\.SCENARIO_DATA\s*=\s*(\{[\s\S]*\});/);
      if (!match) { alert('Could not parse scenario.js — expected window.SCENARIO_DATA = {...}'); return; }
      try { scenario = JSON.parse(match[1]); } catch (e) { alert('Invalid JSON in scenario.js'); return; }
    } else {
      try { scenario = await readJsonFile(file); } catch (e) { alert('Invalid JSON file'); return; }
    }

    syncFormFromScenario();
    renderBuildingList();
    renderPreview();
  }

  // ── Building list ───────────────────────────────────────────────────────────

  function renderBuildingList() {
    els.buildingList.innerHTML = '';
    if (!scenario.buildings.length) {
      els.buildingList.innerHTML = '<p class="muted">No buildings added yet.</p>';
      return;
    }
    scenario.buildings.forEach((building) => {
      const row = document.createElement('div');
      row.className = 'building-row';
      row.innerHTML = `
        <span class="building-row-name">${building.name}</span>
        <div class="row-actions">
          <button class="secondary-btn btn-sm" data-edit="${building.id}">Edit</button>
          <button class="secondary-btn btn-sm danger" data-delete="${building.id}">Delete</button>
        </div>
      `;
      row.querySelector('[data-edit]').addEventListener('click', () => openBuildingForm(building));
      row.querySelector('[data-delete]').addEventListener('click', () => deleteBuilding(building.id));
      els.buildingList.appendChild(row);
    });
  }

  // ── Building form ───────────────────────────────────────────────────────────

  function openBuildingForm(existing) {
    const isNew = !existing;
    const building = existing
      ? JSON.parse(JSON.stringify(existing))
      : { id: 'bldg-' + Date.now(), name: '', description: '', bounds: { x: 10, y: 10, width: 15, height: 10 }, entities: [] };

    const body = `
      <div class="form-grid">
        <label>Name <input id="bf-name" type="text" value="${escHtml(building.name)}" /></label>
        <label>Description <textarea id="bf-desc">${escHtml(building.description)}</textarea></label>
        <fieldset class="bounds-fieldset">
          <legend>Map Position (%)</legend>
          <label>Left (x) <input id="bf-x" type="number" min="0" max="100" value="${building.bounds.x}" /></label>
          <label>Top (y) <input id="bf-y" type="number" min="0" max="100" value="${building.bounds.y}" /></label>
          <label>Width <input id="bf-w" type="number" min="1" max="100" value="${building.bounds.width}" /></label>
          <label>Height <input id="bf-h" type="number" min="1" max="100" value="${building.bounds.height}" /></label>
        </fieldset>
      </div>
      ${!isNew ? renderEntitySection(building) : ''}
    `;

    openModal({
      title: isNew ? 'Add Building' : 'Edit: ' + building.name,
      body,
      actions: [
        { label: isNew ? 'Add Building' : 'Save Changes', role: 'primary', closeOnClick: false, onClick: () => saveBuildingForm(building, isNew) },
        { label: 'Cancel', role: 'close' }
      ]
    });

    if (!isNew) bindEntityFormEvents(building);
  }

  function saveBuildingForm(building, isNew) {
    const name = document.querySelector('#bf-name').value.trim();
    if (!name) { alert('Building name is required.'); return; }

    building.name = name;
    building.description = document.querySelector('#bf-desc').value.trim();
    building.bounds = {
      x: clampNum(document.querySelector('#bf-x').value, 0, 100),
      y: clampNum(document.querySelector('#bf-y').value, 0, 100),
      width: clampNum(document.querySelector('#bf-w').value, 1, 100),
      height: clampNum(document.querySelector('#bf-h').value, 1, 100)
    };

    if (isNew) {
      scenario.buildings.push(building);
    } else {
      const idx = scenario.buildings.findIndex((b) => b.id === building.id);
      if (idx >= 0) scenario.buildings[idx] = building;
    }

    renderBuildingList();
    renderPreview();
    document.querySelector('.modal-backdrop')?.remove();
  }

  function deleteBuilding(id) {
    if (!confirm('Delete this building and all its entities?')) return;
    scenario.buildings = scenario.buildings.filter((b) => b.id !== id);
    renderBuildingList();
    renderPreview();
  }

  // ── Entity section (inside building form) ───────────────────────────────────

  function renderEntitySection(building) {
    const rows = building.entities.map((entity) => `
      <div class="entity-row" data-entity-id="${entity.id}">
        <span>${entity.name} <span class="badge">${entity.type}</span></span>
        <div class="row-actions">
          <button class="secondary-btn btn-sm" data-edit-entity="${entity.id}">Edit</button>
          <button class="secondary-btn btn-sm danger" data-delete-entity="${entity.id}">Delete</button>
        </div>
      </div>
    `).join('');

    return `
      <hr class="section-divider" />
      <div class="section-header">
        <h3>Contacts / Entities</h3>
        <button id="addEntityBtn" class="secondary-btn btn-sm">+ Add</button>
      </div>
      <div id="entityList">${rows || '<p class="muted">No contacts added yet.</p>'}</div>
    `;
  }

  function bindEntityFormEvents(building) {
    document.querySelector('#addEntityBtn')?.addEventListener('click', () => openEntityForm(building, null));
    document.querySelectorAll('[data-edit-entity]').forEach((btn) => {
      const entity = building.entities.find((e) => e.id === btn.dataset.editEntity);
      if (entity) btn.addEventListener('click', () => openEntityForm(building, entity));
    });
    document.querySelectorAll('[data-delete-entity]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('Delete this entity?')) return;
        building.entities = building.entities.filter((e) => e.id !== btn.dataset.deleteEntity);
        refreshEntityList(building);
        renderPreview();
      });
    });
  }

  function refreshEntityList(building) {
    const list = document.querySelector('#entityList');
    if (!list) return;
    list.innerHTML = building.entities.map((entity) => `
      <div class="entity-row" data-entity-id="${entity.id}">
        <span>${entity.name} <span class="badge">${entity.type}</span></span>
        <div class="row-actions">
          <button class="secondary-btn btn-sm" data-edit-entity="${entity.id}">Edit</button>
          <button class="secondary-btn btn-sm danger" data-delete-entity="${entity.id}">Delete</button>
        </div>
      </div>
    `).join('') || '<p class="muted">No contacts added yet.</p>';
    bindEntityFormEvents(building);
  }

  // ── Entity form ─────────────────────────────────────────────────────────────

  function openEntityForm(building, existing) {
    const isNew = !existing;
    const entity = existing
      ? JSON.parse(JSON.stringify(existing))
      : { id: 'entity-' + Date.now(), type: 'person', name: '', description: '', collectionItems: [] };

    const body = `
      <div class="form-grid">
        <label>Name <input id="ef-name" type="text" value="${escHtml(entity.name)}" /></label>
        <label>Type
          <select id="ef-type">
            <option value="person" ${entity.type === 'person' ? 'selected' : ''}>Person</option>
            <option value="section" ${entity.type === 'section' ? 'selected' : ''}>Section</option>
            <option value="organization" ${entity.type === 'organization' ? 'selected' : ''}>Organization</option>
          </select>
        </label>
        <label>Description <textarea id="ef-desc">${escHtml(entity.description)}</textarea></label>
      </div>
      ${!isNew ? renderItemSection(entity) : ''}
    `;

    openModal({
      title: isNew ? 'Add Contact' : 'Edit: ' + entity.name,
      body,
      actions: [
        { label: isNew ? 'Add Contact' : 'Save Changes', role: 'primary', closeOnClick: false, onClick: () => saveEntityForm(building, entity, isNew) },
        { label: 'Back to Building', role: 'close', onClick: () => openBuildingForm(building) }
      ]
    });

    if (!isNew) bindItemFormEvents(building, entity);
  }

  function saveEntityForm(building, entity, isNew) {
    const name = document.querySelector('#ef-name').value.trim();
    if (!name) { alert('Contact name is required.'); return; }

    entity.name = name;
    entity.type = document.querySelector('#ef-type').value;
    entity.description = document.querySelector('#ef-desc').value.trim();

    if (isNew) {
      building.entities.push(entity);
    } else {
      const idx = building.entities.findIndex((e) => e.id === entity.id);
      if (idx >= 0) building.entities[idx] = entity;
    }

    const bIdx = scenario.buildings.findIndex((b) => b.id === building.id);
    if (bIdx >= 0) scenario.buildings[bIdx] = building;

    renderBuildingList();
    renderPreview();
    document.querySelector('.modal-backdrop')?.remove();
    openBuildingForm(building);
  }

  // ── Collection item section (inside entity form) ────────────────────────────

  function renderItemSection(entity) {
    const rows = entity.collectionItems.map((item) => `
      <div class="item-row" data-item-id="${item.id}">
        <span>${item.title}</span>
        <div class="row-actions">
          <button class="secondary-btn btn-sm" data-edit-item="${item.id}">Edit</button>
          <button class="secondary-btn btn-sm danger" data-delete-item="${item.id}">Delete</button>
        </div>
      </div>
    `).join('');

    const atMax = entity.collectionItems.length >= MAX_ITEMS;

    return `
      <hr class="section-divider" />
      <div class="section-header">
        <h3>Collection Items <span class="badge">${entity.collectionItems.length}/${MAX_ITEMS}</span></h3>
        <button id="addItemBtn" class="secondary-btn btn-sm" ${atMax ? 'disabled' : ''}>+ Add</button>
      </div>
      ${atMax ? '<p class="muted">Maximum of 5 items reached.</p>' : ''}
      <div id="itemList">${rows || '<p class="muted">No items added yet.</p>'}</div>
    `;
  }

  function bindItemFormEvents(building, entity) {
    document.querySelector('#addItemBtn')?.addEventListener('click', () => openItemForm(building, entity, null));
    document.querySelectorAll('[data-edit-item]').forEach((btn) => {
      const item = entity.collectionItems.find((i) => i.id === btn.dataset.editItem);
      if (item) btn.addEventListener('click', () => openItemForm(building, entity, item));
    });
    document.querySelectorAll('[data-delete-item]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('Delete this collection item?')) return;
        entity.collectionItems = entity.collectionItems.filter((i) => i.id !== btn.dataset.deleteItem);
        const bIdx = scenario.buildings.findIndex((b) => b.id === building.id);
        if (bIdx >= 0) {
          const eIdx = scenario.buildings[bIdx].entities.findIndex((e) => e.id === entity.id);
          if (eIdx >= 0) scenario.buildings[bIdx].entities[eIdx] = entity;
        }
        refreshItemList(building, entity);
        renderPreview();
      });
    });
  }

  function refreshItemList(building, entity) {
    const list = document.querySelector('#itemList');
    if (!list) return;
    list.innerHTML = entity.collectionItems.map((item) => `
      <div class="item-row" data-item-id="${item.id}">
        <span>${item.title}</span>
        <div class="row-actions">
          <button class="secondary-btn btn-sm" data-edit-item="${item.id}">Edit</button>
          <button class="secondary-btn btn-sm danger" data-delete-item="${item.id}">Delete</button>
        </div>
      </div>
    `).join('') || '<p class="muted">No items added yet.</p>';

    const addBtn = document.querySelector('#addItemBtn');
    if (addBtn) addBtn.disabled = entity.collectionItems.length >= MAX_ITEMS;

    bindItemFormEvents(building, entity);
  }

  // ── Collection item form ────────────────────────────────────────────────────

  function openItemForm(building, entity, existing) {
    const isNew = !existing;
    const item = existing
      ? JSON.parse(JSON.stringify(existing))
      : { id: 'item-' + Date.now(), title: '', content: '', correctDecision: 'collect', feedback: '' };

    const body = `
      <div class="form-grid">
        <label>Title <input id="if-title" type="text" value="${escHtml(item.title)}" /></label>
        <label>Content <textarea id="if-content">${escHtml(item.content)}</textarea></label>
        <label>Correct Decision
          <select id="if-decision">
            <option value="collect" ${item.correctDecision === 'collect' ? 'selected' : ''}>Collect</option>
            <option value="doNotCollect" ${item.correctDecision === 'doNotCollect' ? 'selected' : ''}>Do Not Collect</option>
          </select>
        </label>
        <label>Instructor Feedback <textarea id="if-feedback">${escHtml(item.feedback)}</textarea></label>
      </div>
    `;

    openModal({
      title: isNew ? 'Add Collection Item' : 'Edit: ' + item.title,
      body,
      actions: [
        { label: isNew ? 'Add Item' : 'Save Changes', role: 'primary', closeOnClick: false, onClick: () => saveItemForm(building, entity, item, isNew) },
        { label: 'Back to Contact', role: 'close', onClick: () => openEntityForm(building, entity) }
      ]
    });
  }

  function saveItemForm(building, entity, item, isNew) {
    const title = document.querySelector('#if-title').value.trim();
    if (!title) { alert('Item title is required.'); return; }

    if (isNew && entity.collectionItems.length >= MAX_ITEMS) {
      alert('Maximum of ' + MAX_ITEMS + ' collection items per contact.');
      return;
    }

    item.title = title;
    item.content = document.querySelector('#if-content').value.trim();
    item.correctDecision = document.querySelector('#if-decision').value;
    item.feedback = document.querySelector('#if-feedback').value.trim();

    if (isNew) {
      entity.collectionItems.push(item);
    } else {
      const idx = entity.collectionItems.findIndex((i) => i.id === item.id);
      if (idx >= 0) entity.collectionItems[idx] = item;
    }

    const bIdx = scenario.buildings.findIndex((b) => b.id === building.id);
    if (bIdx >= 0) {
      const eIdx = scenario.buildings[bIdx].entities.findIndex((e) => e.id === entity.id);
      if (eIdx >= 0) scenario.buildings[bIdx].entities[eIdx] = entity;
    }

    renderPreview();
    document.querySelector('.modal-backdrop')?.remove();
    openEntityForm(building, entity);
  }

  // ── Student evaluation ──────────────────────────────────────────────────────

  async function handleResultsImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';
    let results;
    try { results = await readJsonFile(file); } catch (e) { alert('Invalid results JSON file'); return; }
    renderEvaluation(results);
  }

  function renderEvaluation(results) {
    if (!results.decisions?.length) {
      els.evaluationOutput.innerHTML = '<p class="muted">No decisions found in results file.</p>';
      return;
    }

    const rows = results.decisions.map((d) => {
      const building = scenario.buildings.find((b) => b.id === d.buildingId);
      const entity = building?.entities.find((e) => e.id === d.entityId);
      const item = entity?.collectionItems.find((i) => i.id === d.itemId);

      if (!item) {
        return `<div class="eval-row eval-unknown"><strong>Unknown item</strong> (ID: ${d.itemId}) — decision: ${d.decision}</div>`;
      }

      const correct = d.decision === item.correctDecision;
      const decisionLabel = d.decision === 'collect' ? 'Collect' : 'Do Not Collect';
      const correctLabel = item.correctDecision === 'collect' ? 'Collect' : 'Do Not Collect';

      return `
        <div class="eval-row ${correct ? 'eval-correct' : 'eval-incorrect'}">
          <div class="eval-meta">
            <span class="eval-building">${building?.name ?? d.buildingId}</span>
            <span class="eval-entity">${entity?.name ?? d.entityId}</span>
          </div>
          <div class="eval-item-title">${item.title}</div>
          <div class="eval-decisions">
            <span>Student: <strong>${decisionLabel}</strong></span>
            <span>Correct: <strong>${correctLabel}</strong></span>
            <span class="eval-result">${correct ? 'CORRECT' : 'INCORRECT'}</span>
          </div>
          <div class="eval-feedback muted">${item.feedback}</div>
        </div>
      `;
    }).join('');

    const total = results.decisions.length;
    const correctCount = results.decisions.filter((d) => {
      const building = scenario.buildings.find((b) => b.id === d.buildingId);
      const entity = building?.entities.find((e) => e.id === d.entityId);
      const item = entity?.collectionItems.find((i) => i.id === d.itemId);
      return item && d.decision === item.correctDecision;
    }).length;

    els.evaluationOutput.innerHTML = `
      <div class="eval-summary">
        Score: <strong>${correctCount} / ${total}</strong> correct
        &nbsp;(exported ${new Date(results.exportedAt).toLocaleString()})
      </div>
      ${rows}
    `;
  }

  // ── Utilities ───────────────────────────────────────────────────────────────

  function syncFormFromScenario() {
    els.title.value = scenario.title || '';
    els.description.value = scenario.description || '';
  }

  function renderPreview() {
    els.preview.textContent = JSON.stringify(scenario, null, 2);
  }

  function escHtml(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function clampNum(val, min, max) {
    const n = parseFloat(val);
    return isNaN(n) ? min : Math.min(max, Math.max(min, n));
  }
})();
