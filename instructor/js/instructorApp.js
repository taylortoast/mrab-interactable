(function () {
  const MAX_ITEMS = 5;

  let scenario;

  const evaluationState = {
    submissions: [],
    selectedSubmissionId: null,
    loadErrors: []
  };

  const buildingState = {
    selectedBuildingId: null
  };

  const els = {
    exportBtn: document.querySelector('#exportScenarioBtn'),
    loadScenarioInput: document.querySelector('#loadScenarioInput'),
    buildingList: document.querySelector('#buildingList'),
    buildingDetail: document.querySelector('#buildingDetail'),
    evaluationOutput: document.querySelector('#evaluationOutput'),
    studentResultsInput: document.querySelector('#studentResultsInput'),
    studentResultsStatus: document.querySelector('#studentResultsStatus'),
    studentResultsList: document.querySelector('#studentResultsList')
  };

  init();

  function init() {
    scenario = JSON.parse(JSON.stringify(loadScenario()));
    initBuildingDetailListeners();
    bindEvents();
    renderBuildingList();
    if (scenario.buildings.length) selectBuilding(scenario.buildings[0]);
    initTabs();
  }

  function bindEvents() {
    els.exportBtn.addEventListener('click', exportScenarioJson);
    els.loadScenarioInput?.addEventListener('change', handleLoadScenario);
    els.studentResultsInput?.addEventListener('change', handleStudentResultsSelected);
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

  // ── Export / Load ───────────────────────────────────────────────────────────

  function exportScenarioJson() {
    downloadJson(scenario.id + '.json', scenario);
  }

  function handleLoadScenario(event) {
    const file = event.target.files[0];
    if (!file) return;
    readJsonFile(file)
      .then((data) => {
        validateScenario(data);
        scenario = JSON.parse(JSON.stringify(data));
        buildingState.selectedBuildingId = null;
        renderBuildingList();
        if (scenario.buildings.length) selectBuilding(scenario.buildings[0]);
      })
      .catch((err) => alert('Could not load scenario: ' + err.message));
    event.target.value = '';
  }

  // ── Building list ───────────────────────────────────────────────────────────

  function renderBuildingList() {
    els.buildingList.innerHTML = '';
    if (!scenario.buildings.length) {
      els.buildingList.innerHTML = '<p class="muted">No buildings found in scenario.</p>';
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

  function selectBuilding(building) {
    buildingState.selectedBuildingId = building.id;
    renderBuildingList();
    renderBuildingDetail(building);
  }

  // ── Building detail panel ───────────────────────────────────────────────────

  function renderBuildingDetail(building) {
    const entityCards = building.entities.map((e) => renderEntityCard(e)).join('');
    els.buildingDetail.innerHTML = `
      <div class="building-detail-card">
        <div class="building-detail-header">
          <h3 class="building-detail-title">${escHtml(building.name)}</h3>
          <button id="addEntityBtn" class="primary-btn btn-sm">+ Add Contact</button>
        </div>
        ${entityCards || '<p class="muted">No contacts added yet.</p>'}
      </div>`;
  }

  function renderEntityCard(entity) {
    const atMax = entity.collectionItems.length >= MAX_ITEMS;
    const itemCards = entity.collectionItems.map((item) => renderItemCard(item, entity.id)).join('');
    const imgHtml = entity.image
      ? `<img src="${escHtml(entity.image)}" class="entity-card-img" alt="" />`
      : '';
    const imgChangeBtn = `
      <label class="secondary-btn btn-sm entity-img-upload-btn" title="${entity.image ? 'Change image' : 'Add image'}">
        ${entity.image ? '↺' : '+ Img'}
        <input type="file" accept="image/*" data-img-upload data-entity-id="${entity.id}" style="display:none;" />
      </label>`;
    const imgClearBtn = entity.image
      ? `<button class="secondary-btn btn-sm danger entity-img-clear-btn" data-img-clear data-entity-id="${entity.id}" title="Remove image">×</button>`
      : '';

    return `
      <div class="entity-card-v2" data-entity-id="${entity.id}">
        <div class="entity-card-v2-header">
          <div class="entity-header-left">
            <div class="entity-img-slot">
              ${imgHtml}
              ${imgChangeBtn}
              ${imgClearBtn}
            </div>
            <div class="entity-name-type">
              <input class="inline-input entity-name-input" type="text" value="${escHtml(entity.name)}"
                placeholder="Contact name" data-entity-field="name" data-entity-id="${entity.id}" />
              <select class="inline-select" data-entity-field="type" data-entity-id="${entity.id}">
                <option value="person"       ${entity.type === 'person'       ? 'selected' : ''}>Person</option>
                <option value="section"      ${entity.type === 'section'      ? 'selected' : ''}>Section</option>
                <option value="organization" ${entity.type === 'organization' ? 'selected' : ''}>Organization</option>
              </select>
            </div>
          </div>
          <button class="secondary-btn btn-sm danger" data-delete-entity="${entity.id}">Delete</button>
        </div>
        <textarea class="inline-textarea entity-desc-field" placeholder="Description"
          data-entity-field="description" data-entity-id="${entity.id}">${escHtml(entity.description)}</textarea>
        <div class="item-card-grid">
          ${itemCards}
          ${!atMax ? `<div class="item-card item-card-add"><button class="add-item-btn" data-add-item data-entity-id="${entity.id}">+ Add Item</button></div>` : ''}
        </div>
      </div>`;
  }

  function renderItemCard(item, entityId) {
    const isCollect = item.correctDecision === 'collect';
    return `
      <div class="item-card" data-item-id="${item.id}" data-entity-id="${entityId}">
        <div class="item-card-header">
          <input class="inline-input item-title-input" type="text" value="${escHtml(item.title)}"
            placeholder="Item title" data-item-field="title" data-item-id="${item.id}" data-entity-id="${entityId}" />
          <button class="item-delete-btn secondary-btn btn-sm danger"
            data-delete-item="${item.id}" data-entity-id="${entityId}" title="Delete">×</button>
        </div>
        <button class="collect-toggle ${isCollect ? 'is-collect' : 'is-no-collect'}"
          data-toggle-decision data-item-id="${item.id}" data-entity-id="${entityId}">
          <span class="toggle-dot"></span>
          <span class="toggle-label">${isCollect ? 'Collect' : 'Do Not Collect'}</span>
        </button>
        <textarea class="inline-textarea item-content-area" placeholder="Instructor Input"
          data-item-field="content" data-item-id="${item.id}" data-entity-id="${entityId}">${escHtml(item.content)}</textarea>
        <textarea class="inline-textarea item-feedback-area" placeholder="Feedback (shown after decision)"
          data-item-field="feedback" data-item-id="${item.id}" data-entity-id="${entityId}">${escHtml(item.feedback)}</textarea>
      </div>`;
  }

  // ── Building detail event delegation (single persistent listener) ───────────

  function initBuildingDetailListeners() {
    els.buildingDetail.addEventListener('blur', onDetailBlur, true);
    els.buildingDetail.addEventListener('change', onDetailChange);
    els.buildingDetail.addEventListener('click', onDetailClick);
  }

  function currentBuilding() {
    return scenario.buildings.find((b) => b.id === buildingState.selectedBuildingId);
  }

  function onDetailBlur(e) {
    const el = e.target;
    const building = currentBuilding();
    if (!building) return;

    if (el.dataset.entityField) {
      const entity = building.entities.find((ent) => ent.id === el.dataset.entityId);
      if (!entity) return;
      if (el.dataset.entityField === 'name' && !el.value.trim()) {
        el.value = entity.name;
        return;
      }
      entity[el.dataset.entityField] = el.value;
      syncBuildingToScenario(building);
      if (el.dataset.entityField === 'name') renderBuildingList();
    } else if (el.dataset.itemField) {
      const entity = building.entities.find((ent) => ent.id === el.dataset.entityId);
      const item = entity?.collectionItems.find((i) => i.id === el.dataset.itemId);
      if (!item) return;
      item[el.dataset.itemField] = el.value;
      syncEntityToBuilding(building, entity);
      syncBuildingToScenario(building);
    }
  }

  function onDetailChange(e) {
    const el = e.target;
    const building = currentBuilding();
    if (!building) return;

    if (el.dataset.entityField === 'type') {
      const entity = building.entities.find((ent) => ent.id === el.dataset.entityId);
      if (entity) {
        entity.type = el.value;
        syncBuildingToScenario(building);
      }
      return;
    }

    if (el.dataset.imgUpload !== undefined) {
      const file = el.files[0];
      if (!file) return;
      const entityId = el.dataset.entityId;
      const reader = new FileReader();
      reader.onload = () => {
        const entity = building.entities.find((ent) => ent.id === entityId);
        if (!entity) return;
        entity.image = reader.result;
        syncBuildingToScenario(building);
        const slot = els.buildingDetail.querySelector(`.entity-card-v2[data-entity-id="${entityId}"] .entity-img-slot`);
        if (slot) {
          slot.innerHTML = `
            <img src="${escHtml(reader.result)}" class="entity-card-img" alt="" />
            <label class="secondary-btn btn-sm entity-img-upload-btn" title="Change image">
              ↺<input type="file" accept="image/*" data-img-upload data-entity-id="${entityId}" style="display:none;" />
            </label>
            <button class="secondary-btn btn-sm danger entity-img-clear-btn" data-img-clear data-entity-id="${entityId}" title="Remove image">×</button>`;
        }
      };
      reader.readAsDataURL(file);
      el.value = '';
    }
  }

  function onDetailClick(e) {
    const building = currentBuilding();
    if (!building) return;

    if (e.target.id === 'addEntityBtn') {
      building.entities.push({
        id: 'entity-' + Date.now(),
        type: 'person', name: 'New Contact', description: '', image: '', collectionItems: []
      });
      syncBuildingToScenario(building);
      renderBuildingList();
      renderBuildingDetail(building);
      return;
    }

    const toggle = e.target.closest('[data-toggle-decision]');
    if (toggle) {
      const entity = building.entities.find((ent) => ent.id === toggle.dataset.entityId);
      const item = entity?.collectionItems.find((i) => i.id === toggle.dataset.itemId);
      if (item) {
        item.correctDecision = item.correctDecision === 'collect' ? 'doNotCollect' : 'collect';
        syncEntityToBuilding(building, entity);
        syncBuildingToScenario(building);
        const isCollect = item.correctDecision === 'collect';
        toggle.className = `collect-toggle ${isCollect ? 'is-collect' : 'is-no-collect'}`;
        toggle.querySelector('.toggle-label').textContent = isCollect ? 'Collect' : 'Do Not Collect';
      }
      return;
    }

    const addItemEl = e.target.closest('[data-add-item]');
    if (addItemEl) {
      const entity = building.entities.find((ent) => ent.id === addItemEl.dataset.entityId);
      if (entity && entity.collectionItems.length < MAX_ITEMS) {
        entity.collectionItems.push({
          id: 'item-' + Date.now(),
          title: 'New Item', content: '', correctDecision: 'collect', feedback: '', image: ''
        });
        syncEntityToBuilding(building, entity);
        syncBuildingToScenario(building);
        renderBuildingDetail(building);
      }
      return;
    }

    const delEntityEl = e.target.closest('[data-delete-entity]');
    if (delEntityEl) {
      if (!confirm('Delete this contact and all its items?')) return;
      building.entities = building.entities.filter((ent) => ent.id !== delEntityEl.dataset.deleteEntity);
      syncBuildingToScenario(building);
      renderBuildingList();
      renderBuildingDetail(building);
      return;
    }

    const delItemEl = e.target.closest('[data-delete-item]');
    if (delItemEl) {
      if (!confirm('Delete this item?')) return;
      const entity = building.entities.find((ent) => ent.id === delItemEl.dataset.entityId);
      if (entity) {
        entity.collectionItems = entity.collectionItems.filter((i) => i.id !== delItemEl.dataset.deleteItem);
        syncEntityToBuilding(building, entity);
        syncBuildingToScenario(building);
        renderBuildingDetail(building);
      }
      return;
    }

    const imgClearEl = e.target.closest('[data-img-clear]');
    if (imgClearEl) {
      const entity = building.entities.find((ent) => ent.id === imgClearEl.dataset.entityId);
      if (entity) {
        entity.image = '';
        syncBuildingToScenario(building);
        const slot = els.buildingDetail.querySelector(`.entity-card-v2[data-entity-id="${entity.id}"] .entity-img-slot`);
        if (slot) {
          slot.innerHTML = `
            <label class="secondary-btn btn-sm entity-img-upload-btn" title="Add image">
              + Img<input type="file" accept="image/*" data-img-upload data-entity-id="${entity.id}" style="display:none;" />
            </label>`;
        }
      }
      return;
    }
  }

  // ── Student result import ───────────────────────────────────────────────────

  function handleStudentResultsSelected(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    evaluationState.loadErrors = [];
    els.studentResultsStatus.textContent = 'Loading ' + files.length + ' file' + (files.length !== 1 ? 's' : '') + '…';

    Promise.all(files.map(readStudentResultFile))
      .then((results) => {
        const valid = results.filter(Boolean);
        evaluationState.submissions = valid;
        evaluationState.selectedSubmissionId = valid.length ? valid[0].localId : null;
        renderStudentResultsList();
        renderSelectedStudentEvaluation();
        renderStudentResultsStatus(valid, files.length);
      })
      .catch((err) => {
        console.error(err);
        els.studentResultsStatus.textContent = 'One or more result files could not be loaded.';
      });
  }

  function readStudentResultFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          resolve(normalizeStudentResult(parsed, file.name));
        } catch (err) {
          console.warn('Invalid student result file:', file.name, err);
          evaluationState.loadErrors.push({ filename: file.name, message: err.message });
          resolve(null);
        }
      };
      reader.onerror = () => {
        evaluationState.loadErrors.push({ filename: file.name, message: 'Could not read file.' });
        resolve(null);
      };
      reader.readAsText(file);
    });
  }

  function normalizeStudentResult(raw, filename) {
    if (!raw || typeof raw !== 'object') throw new Error('Result file is not a JSON object.');
    if (!Array.isArray(raw.decisions)) throw new Error('Result file is missing decisions array.');
    return {
      localId: filename + '-' + Date.now() + '-' + Math.random().toString(16).slice(2),
      filename,
      studentName: String(raw.studentName || 'Unknown Student').trim(),
      submittedAt: raw.submittedAt || null,
      scenarioId: raw.scenarioId || 'unknown-scenario',
      scenarioTitle: raw.scenarioTitle || '',
      decisions: raw.decisions.map((d) => ({
        buildingId: d.buildingId,
        entityId: d.entityId,
        itemId: d.itemId,
        decision: d.decision,
        timestamp: d.timestamp || null
      }))
    };
  }

  function renderStudentResultsList() {
    if (!evaluationState.submissions.length) {
      els.studentResultsList.innerHTML = '<p class="muted">No student results loaded.</p>';
      return;
    }
    els.studentResultsList.innerHTML = evaluationState.submissions.map((sub) => {
      const score = calculateSubmissionScore(sub);
      const selected = sub.localId === evaluationState.selectedSubmissionId;
      const mismatch = sub.scenarioId !== scenario.id;
      return `
        <button class="student-result-list-item${selected ? ' active' : ''}" data-submission-id="${escHtml(sub.localId)}">
          <span class="student-result-name">${escHtml(sub.studentName)}</span>
          <span class="student-result-meta">${score.correct} / ${score.total} correct</span>
          ${mismatch ? '<span class="student-result-warning">Scenario mismatch</span>' : ''}
        </button>
      `;
    }).join('');

    els.studentResultsList.querySelectorAll('[data-submission-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        evaluationState.selectedSubmissionId = btn.dataset.submissionId;
        renderStudentResultsList();
        renderSelectedStudentEvaluation();
      });
    });
  }

  function renderSelectedStudentEvaluation() {
    const selected = evaluationState.submissions.find((s) => s.localId === evaluationState.selectedSubmissionId);
    if (!selected) {
      els.evaluationOutput.innerHTML = '<p class="muted">Select a student to view evaluation details.</p>';
      return;
    }
    els.evaluationOutput.innerHTML = renderStudentCard(selected);
  }

  function renderStudentResultsStatus(valid, totalFiles) {
    const failed = totalFiles - valid.length;
    let msg = valid.length + ' of ' + totalFiles + ' file' + (totalFiles !== 1 ? 's' : '') + ' loaded.';
    if (failed > 0) {
      const names = evaluationState.loadErrors.map((e) => e.filename).join(', ');
      msg += ' ' + failed + ' could not be parsed: ' + names;
    }
    els.studentResultsStatus.textContent = msg;
  }

  // ── Score helpers ───────────────────────────────────────────────────────────

  function findScenarioRefs(decision) {
    const building = scenario.buildings.find((b) => b.id === decision.buildingId);
    const entity = building?.entities.find((e) => e.id === decision.entityId);
    const item = entity?.collectionItems.find((i) => i.id === decision.itemId);
    return { building, entity, item };
  }

  function calculateSubmissionScore(results) {
    const decisions = results.decisions || [];
    const total = decisions.length;
    const correct = decisions.filter((d) => {
      const { item } = findScenarioRefs(d);
      return item && d.decision === item.correctDecision;
    }).length;
    return { correct, total };
  }

  // ── Evaluation rendering ────────────────────────────────────────────────────

  function renderStudentCard(results) {
    const decisions = results.decisions || [];
    const { correct, total } = calculateSubmissionScore(results);
    const scoreClass = total === 0 ? '' : (correct === total ? 'score-perfect' : correct >= total / 2 ? 'score-passing' : 'score-failing');
    const mismatch = results.scenarioId !== scenario.id;

    const rows = decisions.map((d) => {
      const { building, entity, item } = findScenarioRefs(d);

      if (!item) {
        return '<div class="eval-row eval-unknown"><strong>Unknown item</strong> (ID: ' + escHtml(d.itemId) + ')</div>';
      }

      const isCorrect = d.decision === item.correctDecision;
      const decisionLabel = d.decision === 'collect' ? 'Collect' : 'Do Not Collect';
      const correctLabel = item.correctDecision === 'collect' ? 'Collect' : 'Do Not Collect';

      return `
        <div class="eval-row ${isCorrect ? 'eval-correct' : 'eval-incorrect'}">
          <div class="eval-meta">
            <span class="eval-building">${building?.name ?? escHtml(d.buildingId)}</span>
            <span class="eval-entity">${entity?.name ?? escHtml(d.entityId)}</span>
          </div>
          <div class="eval-item-title">${escHtml(item.title)}</div>
          <div class="eval-decisions">
            <span>Student: <strong>${decisionLabel}</strong></span>
            <span>Correct: <strong>${correctLabel}</strong></span>
            <span class="eval-result">${isCorrect ? 'CORRECT' : 'INCORRECT'}</span>
          </div>
          <div class="eval-feedback muted">${escHtml(item.feedback)}</div>
        </div>
      `;
    }).join('');

    const mismatchWarning = mismatch
      ? '<span class="student-result-warning">Warning: result is from scenario "' + escHtml(results.scenarioId) + '"</span>'
      : '';

    return `
      <div class="student-card">
        <div class="student-card-header">
          <div>
            <span class="student-name">${escHtml(results.studentName || 'Unknown Student')}</span>
            <span class="student-submitted muted">Submitted ${results.submittedAt ? new Date(results.submittedAt).toLocaleString() : 'Unknown date'}</span>
            ${mismatchWarning}
          </div>
          <div class="student-score ${scoreClass}">${correct} / ${total} correct</div>
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
