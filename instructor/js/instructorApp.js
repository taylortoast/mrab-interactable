(function () {
  const MAX_ITEMS = 5;

  let scenario;

  const els = {
    exportBtn: document.querySelector('#exportScenarioBtn'),
    buildingList: document.querySelector('#buildingList'),
    evaluationOutput: document.querySelector('#evaluationOutput')
  };

  init();

  function init() {
    scenario = JSON.parse(JSON.stringify(loadScenario()));
    bindEvents();
    renderBuildingList();
    initTabs();
    loadSubmissions();
  }

  function bindEvents() {
    els.exportBtn.addEventListener('click', exportScenarioJs);
  }

  // ── Tabs ────────────────────────────────────────────────────────────────────

  function initTabs() {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
        btn.classList.add('active');
        document.querySelector('#tab-' + btn.dataset.tab).classList.add('active');
      });
    });
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

  // ── Building list ───────────────────────────────────────────────────────────

  function renderBuildingList() {
    els.buildingList.innerHTML = '';
    if (!scenario.buildings.length) {
      els.buildingList.innerHTML = '<p class="muted">No buildings found in scenario.</p>';
      return;
    }
    scenario.buildings.forEach((building) => {
      const row = document.createElement('div');
      row.className = 'building-row';
      const entityCount = building.entities.length;
      row.innerHTML = `
        <span class="building-row-name">${building.name}
          <span class="badge">${entityCount} contact${entityCount !== 1 ? 's' : ''}</span>
        </span>
        <button class="secondary-btn btn-sm" data-manage="${building.id}">Manage</button>
      `;
      row.querySelector('[data-manage]').addEventListener('click', () => openBuildingPanel(building));
      els.buildingList.appendChild(row);
    });
  }

  // ── Building panel ──────────────────────────────────────────────────────────

  function openBuildingPanel(building) {
    openModal({
      title: building.name,
      body: renderEntitySection(building),
      actions: [{ label: 'Close', role: 'close' }]
    });
    bindEntityFormEvents(building);
  }

  // ── Entity section ──────────────────────────────────────────────────────────

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
        if (!confirm('Delete this contact and all its collection items?')) return;
        building.entities = building.entities.filter((e) => e.id !== btn.dataset.deleteEntity);
        syncBuildingToScenario(building);
        refreshEntityList(building);
        renderBuildingList();
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

    openModal({
      title: isNew ? 'Add Contact' : 'Edit: ' + entity.name,
      body: `
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
      `,
      actions: [
        { label: isNew ? 'Add Contact' : 'Save Changes', role: 'primary', closeOnClick: false, onClick: () => saveEntityForm(building, entity, isNew) },
        { label: 'Back to Building', role: 'close', onClick: () => openBuildingPanel(building) }
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

    syncBuildingToScenario(building);
    renderBuildingList();
    document.querySelector('.modal-backdrop')?.remove();
    openBuildingPanel(building);
  }

  // ── Collection item section ─────────────────────────────────────────────────

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
        syncEntityToBuilding(building, entity);
        syncBuildingToScenario(building);
        refreshItemList(building, entity);
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

    openModal({
      title: isNew ? 'Add Collection Item' : 'Edit: ' + item.title,
      body: `
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
      `,
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

    syncEntityToBuilding(building, entity);
    syncBuildingToScenario(building);
    document.querySelector('.modal-backdrop')?.remove();
    openEntityForm(building, entity);
  }

  // ── Submission auto-load ────────────────────────────────────────────────────

  function loadSubmissions() {
    const manifest = window.SUBMISSION_MANIFEST || [];

    if (!manifest.length) {
      els.evaluationOutput.innerHTML = '<p class="muted">No submissions yet. See <code>submissions/index.js</code> for instructions.</p>';
      return;
    }

    els.evaluationOutput.innerHTML = '<p class="muted">Loading submissions…</p>';

    const promises = manifest.map((filename) => new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = './submissions/' + filename;
      s.onload = resolve;
      s.onerror = () => {
        console.warn('Could not load submission: ' + filename);
        resolve();
      };
      document.head.appendChild(s);
    }));

    Promise.all(promises).then(() => {
      renderAllEvaluations(window.STUDENT_SUBMISSIONS || []);
    });
  }

  // ── Evaluation rendering ────────────────────────────────────────────────────

  function renderAllEvaluations(submissions) {
    if (!submissions.length) {
      els.evaluationOutput.innerHTML = '<p class="muted">No submissions loaded. Check that filenames in <code>submissions/index.js</code> match the files in the submissions folder.</p>';
      return;
    }
    els.evaluationOutput.innerHTML = submissions.map(renderStudentCard).join('');
  }

  function renderStudentCard(results) {
    const decisions = results.decisions || [];
    const total = decisions.length;

    const correctCount = decisions.filter((d) => {
      const building = scenario.buildings.find((b) => b.id === d.buildingId);
      const entity = building?.entities.find((e) => e.id === d.entityId);
      const item = entity?.collectionItems.find((i) => i.id === d.itemId);
      return item && d.decision === item.correctDecision;
    }).length;

    const scoreClass = total === 0 ? '' : (correctCount === total ? 'score-perfect' : correctCount >= total / 2 ? 'score-passing' : 'score-failing');

    const rows = decisions.map((d) => {
      const building = scenario.buildings.find((b) => b.id === d.buildingId);
      const entity = building?.entities.find((e) => e.id === d.entityId);
      const item = entity?.collectionItems.find((i) => i.id === d.itemId);

      if (!item) {
        return `<div class="eval-row eval-unknown"><strong>Unknown item</strong> (ID: ${d.itemId})</div>`;
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

    return `
      <div class="student-card">
        <div class="student-card-header">
          <div>
            <span class="student-name">${escHtml(results.studentName || 'Unknown Student')}</span>
            <span class="student-submitted muted">Submitted ${new Date(results.submittedAt).toLocaleString()}</span>
          </div>
          <div class="student-score ${scoreClass}">${correctCount} / ${total} correct</div>
        </div>
        <div class="student-card-body">
          ${rows || '<p class="muted">No decisions recorded.</p>'}
        </div>
      </div>
    `;
  }

  // ── Utilities ───────────────────────────────────────────────────────────────

  function syncBuildingToScenario(building) {
    const idx = scenario.buildings.findIndex((b) => b.id === building.id);
    if (idx >= 0) scenario.buildings[idx] = building;
  }

  function syncEntityToBuilding(building, entity) {
    const idx = building.entities.findIndex((e) => e.id === entity.id);
    if (idx >= 0) building.entities[idx] = entity;
  }

  function escHtml(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
})();
