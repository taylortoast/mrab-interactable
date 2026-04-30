(function () {
  const MAX_ITEMS   = 5;
  const LS_KEY      = '335trs-instructor-scenario';

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
    exportBtn:           document.querySelector('#exportScenarioBtn'),
    loadScenarioInput:   document.querySelector('#loadScenarioInput'),
    saveToLocalBtn:      document.querySelector('#saveToLocalBtn'),
    scenarioTitleInput:  document.querySelector('#scenarioTitleInput'),
    scenarioDescInput:   document.querySelector('#scenarioDescInput'),
    buildingList:        document.querySelector('#buildingList'),
    buildingDetail:      document.querySelector('#buildingDetail'),
    evaluationOutput:    document.querySelector('#evaluationOutput'),
    studentResultsInput: document.querySelector('#studentResultsInput'),
    studentResultsStatus:document.querySelector('#studentResultsStatus'),
    studentResultsList:  document.querySelector('#studentResultsList')
  };

  init();

  function init() {
    const saved = loadFromLocalStorage();
    if (saved) {
      try {
        validateScenario(saved);
        scenario = JSON.parse(JSON.stringify(saved));
      } catch (e) {
        scenario = JSON.parse(JSON.stringify(loadScenario()));
      }
    } else {
      scenario = JSON.parse(JSON.stringify(loadScenario()));
    }

    initBuildingDetailListeners();
    bindEvents();
    syncScenarioMetaInputs();
    initScenarioMeta();
    renderBuildingList();
    if (scenario.buildings.length) selectBuilding(scenario.buildings[0]);
    initTabs();
  }

  function bindEvents() {
    els.exportBtn.addEventListener('click', exportScenarioJson);
    els.loadScenarioInput?.addEventListener('change', handleLoadScenario);
    els.studentResultsInput?.addEventListener('change', handleStudentResultsSelected);
    els.saveToLocalBtn?.addEventListener('click', () => {
      saveToLocalStorage();
      const btn = els.saveToLocalBtn;
      const orig = btn.textContent;
      btn.textContent = 'Saved!';
      setTimeout(() => { btn.textContent = orig; }, 1500);
    });
  }

  // ── Local storage ───────────────────────────────────────────────────────────

  function saveToLocalStorage() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(scenario));
    } catch (e) {}
  }

  function loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  // ── Scenario meta inputs ────────────────────────────────────────────────────

  function syncScenarioMetaInputs() {
    if (els.scenarioTitleInput) els.scenarioTitleInput.value = scenario.title || '';
    if (els.scenarioDescInput)  els.scenarioDescInput.value  = scenario.description || '';
  }

  function initScenarioMeta() {
    els.scenarioTitleInput?.addEventListener('blur', () => {
      const val = els.scenarioTitleInput.value.trim();
      if (val) scenario.title = val;
      else els.scenarioTitleInput.value = scenario.title;
      saveToLocalStorage();
    });
    els.scenarioDescInput?.addEventListener('blur', () => {
      scenario.description = els.scenarioDescInput.value;
      saveToLocalStorage();
    });
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
        syncScenarioMetaInputs();
        renderBuildingList();
        if (scenario.buildings.length) selectBuilding(scenario.buildings[0]);
        saveToLocalStorage();
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
    const total = building.entities.length;
    const entityCards = building.entities.map((e, i) => renderEntityCard(e, i, total)).join('');
    els.buildingDetail.innerHTML = `
      <div class="building-detail-card">
        <div class="building-detail-header">
          <h3 class="building-detail-title">${escHtml(building.name)}</h3>
          <button id="addEntityBtn" class="primary-btn btn-sm">+ Add Contact</button>
        </div>
        ${entityCards || '<p class="muted">No contacts added yet.</p>'}
      </div>`;
  }

  function entityImgSrc(image) {
    if (!image) return null;
    return image.startsWith('data:') ? image : '../shared/images/' + image;
  }

  function renderEntityCard(entity, entityIndex, totalEntities) {
    const atMax = entity.collectionItems.length >= MAX_ITEMS;
    const total = entity.collectionItems.length;
    const itemCards = entity.collectionItems.map((item, i) => renderItemCard(item, entity.id, i, total)).join('');
    const resolvedSrc = entityImgSrc(entity.image);
    const imgHtml = resolvedSrc ? `<img src="${escHtml(resolvedSrc)}" class="entity-card-img" alt="" />` : '';
    const imgChangeBtn = `
      <label class="secondary-btn btn-sm entity-img-upload-btn" title="${entity.image ? 'Change image' : 'Add image'}">
        ${entity.image ? '&#x21BA;' : '+ Img'}
        <input type="file" accept="image/*" data-img-upload data-entity-id="${entity.id}" style="display:none;" />
      </label>`;
    const imgClearBtn = entity.image
      ? `<button class="secondary-btn btn-sm danger entity-img-clear-btn" data-img-clear data-entity-id="${entity.id}" title="Remove image">&#x00D7;</button>`
      : '';
    const imgNotice = entity.image && !entity.image.startsWith('data:')
      ? `<p class="entity-img-notice muted-sm">Place <strong>${escHtml(entity.image)}</strong> in shared/images/</p>`
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
          <div class="entity-reorder-btns">
            <button class="reorder-btn" ${entityIndex === 0 ? 'disabled' : ''}
              data-move-entity="up" data-entity-id="${entity.id}" title="Move up">↑</button>
            <button class="reorder-btn" ${entityIndex === totalEntities - 1 ? 'disabled' : ''}
              data-move-entity="down" data-entity-id="${entity.id}" title="Move down">↓</button>
          </div>
          <button class="secondary-btn btn-sm danger" data-delete-entity="${entity.id}">Delete</button>
        </div>
        ${imgNotice}
        <textarea class="inline-textarea entity-desc-field" placeholder="What They Do"
          data-entity-field="description" data-entity-id="${entity.id}">${escHtml(entity.description)}</textarea>
        <textarea class="inline-textarea entity-desc-field" placeholder="Who They Support"
          data-entity-field="whoTheySupport" data-entity-id="${entity.id}">${escHtml(entity.whoTheySupport || '')}</textarea>
        <textarea class="inline-textarea entity-desc-field" placeholder="Key Responsibilities"
          data-entity-field="keyResponsibilities" data-entity-id="${entity.id}">${escHtml(entity.keyResponsibilities || '')}</textarea>
        <textarea class="inline-textarea entity-desc-field" placeholder="When Chapel Engages Them"
          data-entity-field="whenChapelEngagesThem" data-entity-id="${entity.id}">${escHtml(entity.whenChapelEngagesThem || '')}</textarea>
        <div class="item-card-grid">
          ${itemCards}
          ${!atMax ? `<div class="item-card item-card-add"><button class="add-item-btn" data-add-item data-entity-id="${entity.id}">+ Add Item</button></div>` : ''}
        </div>
      </div>`;
  }

  function renderItemCard(item, entityId, itemIndex, totalItems) {
    const isCollect  = item.correctDecision === 'collect';
    const resolvedSrc = entityImgSrc(item.image);
    const imgHtml = resolvedSrc ? `<img src="${escHtml(resolvedSrc)}" class="item-card-img" alt="" />` : '';
    const imgNotice = item.image && !item.image.startsWith('data:')
      ? `<p class="entity-img-notice muted-sm">Place <strong>${escHtml(item.image)}</strong> in shared/images/</p>`
      : '';
    const uploadBtn = `
      <label class="secondary-btn btn-sm item-img-upload-btn" title="${item.image ? 'Change image' : 'Add image'}">
        ${item.image ? '&#x21BA;' : '+ Img'}
        <input type="file" accept="image/*" data-item-img-upload
          data-item-id="${item.id}" data-entity-id="${entityId}" style="display:none;" />
      </label>`;
    const clearBtn = item.image
      ? `<button class="secondary-btn btn-sm danger item-img-clear-btn"
           data-item-img-clear data-item-id="${item.id}" data-entity-id="${entityId}" title="Remove image">&#x00D7;</button>`
      : '';
    return `
      <div class="item-card" data-item-id="${item.id}" data-entity-id="${entityId}">
        <div class="item-img-slot">${imgHtml}${uploadBtn}${clearBtn}</div>
        ${imgNotice}
        <div class="item-card-header">
          <input class="inline-input item-title-input" type="text" value="${escHtml(item.title)}"
            placeholder="Item title" data-item-field="title" data-item-id="${item.id}" data-entity-id="${entityId}" />
          <div class="item-reorder-btns">
            <button class="reorder-btn" ${itemIndex === 0 ? 'disabled' : ''}
              data-move-item="up" data-item-id="${item.id}" data-entity-id="${entityId}" title="Move up">↑</button>
            <button class="reorder-btn" ${itemIndex === totalItems - 1 ? 'disabled' : ''}
              data-move-item="down" data-item-id="${item.id}" data-entity-id="${entityId}" title="Move down">↓</button>
          </div>
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
      </div>`;
  }

  // ── Building detail event delegation ────────────────────────────────────────

  function initBuildingDetailListeners() {
    els.buildingDetail.addEventListener('blur',   onDetailBlur,   true);
    els.buildingDetail.addEventListener('change', onDetailChange);
    els.buildingDetail.addEventListener('click',  onDetailClick);
  }

  function currentBuilding() {
    return scenario.buildings.find((b) => b.id === buildingState.selectedBuildingId);
  }

  function onDetailBlur(e) {
    const el       = e.target;
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
      const item   = entity?.collectionItems.find((i) => i.id === el.dataset.itemId);
      if (!item) return;
      item[el.dataset.itemField] = el.value;
      syncEntityToBuilding(building, entity);
      syncBuildingToScenario(building);
    }
  }

  function onDetailChange(e) {
    const el       = e.target;
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
      const entity = building.entities.find((ent) => ent.id === el.dataset.entityId);
      if (!entity) return;
      entity.image = file.name;
      syncBuildingToScenario(building);
      renderBuildingDetail(building);
      el.value = '';
    }

    if (el.dataset.itemImgUpload !== undefined) {
      const file = el.files[0];
      if (!file) return;
      const entity = building.entities.find((ent) => ent.id === el.dataset.entityId);
      const item   = entity?.collectionItems.find((i) => i.id === el.dataset.itemId);
      if (!item) return;
      item.image = file.name;
      syncEntityToBuilding(building, entity);
      syncBuildingToScenario(building);
      renderBuildingDetail(building);
      el.value = '';
    }
  }

  function onDetailClick(e) {
    const building = currentBuilding();
    if (!building) return;

    if (e.target.id === 'addEntityBtn') {
      building.entities.push({
        id: 'entity-' + Date.now(),
        type: 'person', name: 'New Contact', description: '',
        whoTheySupport: '', keyResponsibilities: '', whenChapelEngagesThem: '',
        image: '', collectionItems: []
      });
      syncBuildingToScenario(building);
      renderBuildingList();
      renderBuildingDetail(building);
      return;
    }

    const moveEntityEl = e.target.closest('[data-move-entity]');
    if (moveEntityEl) {
      const dir = moveEntityEl.dataset.moveEntity;
      const idx = building.entities.findIndex((ent) => ent.id === moveEntityEl.dataset.entityId);
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      if (swap >= 0 && swap < building.entities.length) {
        [building.entities[idx], building.entities[swap]] = [building.entities[swap], building.entities[idx]];
        syncBuildingToScenario(building);
        renderBuildingDetail(building);
      }
      return;
    }

    const moveItemEl = e.target.closest('[data-move-item]');
    if (moveItemEl) {
      const dir    = moveItemEl.dataset.moveItem;
      const entity = building.entities.find((ent) => ent.id === moveItemEl.dataset.entityId);
      if (!entity) return;
      const idx  = entity.collectionItems.findIndex((i) => i.id === moveItemEl.dataset.itemId);
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      if (swap >= 0 && swap < entity.collectionItems.length) {
        [entity.collectionItems[idx], entity.collectionItems[swap]] = [entity.collectionItems[swap], entity.collectionItems[idx]];
        syncEntityToBuilding(building, entity);
        syncBuildingToScenario(building);
        renderBuildingDetail(building);
      }
      return;
    }

    const toggle = e.target.closest('[data-toggle-decision]');
    if (toggle) {
      const entity = building.entities.find((ent) => ent.id === toggle.dataset.entityId);
      const item   = entity?.collectionItems.find((i) => i.id === toggle.dataset.itemId);
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
        renderBuildingDetail(building);
      }
      return;
    }

    const itemImgClearEl = e.target.closest('[data-item-img-clear]');
    if (itemImgClearEl) {
      const entity = building.entities.find((ent) => ent.id === itemImgClearEl.dataset.entityId);
      const item   = entity?.collectionItems.find((i) => i.id === itemImgClearEl.dataset.itemId);
      if (item) {
        item.image = '';
        syncEntityToBuilding(building, entity);
        syncBuildingToScenario(building);
        renderBuildingDetail(building);
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
      localId:      filename + '-' + Date.now() + '-' + Math.random().toString(16).slice(2),
      filename,
      studentName:  String(raw.studentName || 'Unknown Student').trim(),
      submittedAt:  raw.submittedAt || null,
      scenarioId:   raw.scenarioId || 'unknown-scenario',
      scenarioTitle:raw.scenarioTitle || '',
      decisions:    raw.decisions.map((d) => ({
        buildingId: d.buildingId,
        entityId:   d.entityId,
        itemId:     d.itemId,
        decision:   d.decision,
        timestamp:  d.timestamp || null
      }))
    };
  }

  function renderStudentResultsList() {
    if (!evaluationState.submissions.length) {
      els.studentResultsList.innerHTML = '<p class="muted">No student results loaded.</p>';
      return;
    }
    els.studentResultsList.innerHTML = evaluationState.submissions.map((sub) => {
      const score      = calculateSubmissionScore(sub);
      const unreviewed = countUnreviewed(sub);
      const selected   = sub.localId === evaluationState.selectedSubmissionId;
      const mismatch   = sub.scenarioId !== scenario.id;
      return `
        <button class="student-result-list-item${selected ? ' active' : ''}" data-submission-id="${escHtml(sub.localId)}">
          <span class="student-result-name">${escHtml(sub.studentName)}</span>
          <span class="student-result-meta">${score.correct} / ${score.total} correct</span>
          ${unreviewed > 0 ? `<span class="student-result-unreviewed">${unreviewed} not reviewed</span>` : ''}
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
    const entity   = building?.entities.find((e) => e.id === decision.entityId);
    const item     = entity?.collectionItems.find((i) => i.id === decision.itemId);
    return { building, entity, item };
  }

  function calculateSubmissionScore(results) {
    const decisions = results.decisions || [];
    const total     = decisions.length;
    const correct   = decisions.filter((d) => {
      const { item } = findScenarioRefs(d);
      return item && d.decision === item.correctDecision;
    }).length;
    return { correct, total };
  }

  function countUnreviewed(results) {
    const totalItems = scenario.buildings.reduce((sum, b) =>
      sum + b.entities.reduce((s, e) => s + e.collectionItems.length, 0), 0);
    return Math.max(0, totalItems - (results.decisions || []).length);
  }

  // ── Evaluation rendering ────────────────────────────────────────────────────

  function renderStudentCard(results) {
    const decisions  = results.decisions || [];
    const { correct, total } = calculateSubmissionScore(results);
    const unreviewed = countUnreviewed(results);
    const scoreClass = total === 0 ? '' : (correct === total ? 'score-perfect' : correct >= total / 2 ? 'score-passing' : 'score-failing');
    const mismatch   = results.scenarioId !== scenario.id;

    const rows = decisions.map((d) => {
      const { building, entity, item } = findScenarioRefs(d);

      if (!item) {
        return '<div class="eval-row eval-unknown"><strong>Unknown item</strong> (ID: ' + escHtml(d.itemId) + ')</div>';
      }

      const isCorrect     = d.decision === item.correctDecision;
      const decisionLabel = d.decision === 'collect' ? 'Collect' : 'Do Not Collect';
      const correctLabel  = item.correctDecision === 'collect' ? 'Collect' : 'Do Not Collect';

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
        </div>
      `;
    }).join('');

    const unreviewedNote = unreviewed > 0
      ? `<span class="student-result-unreviewed">${unreviewed} item${unreviewed !== 1 ? 's' : ''} not reviewed</span>`
      : '';
    const mismatchWarning = mismatch
      ? '<span class="student-result-warning">Warning: result is from scenario "' + escHtml(results.scenarioId) + '"</span>'
      : '';

    return `
      <div class="student-card">
        <div class="student-card-header">
          <div>
            <span class="student-name">${escHtml(results.studentName || 'Unknown Student')}</span>
            <span class="student-submitted muted">Submitted ${results.submittedAt ? new Date(results.submittedAt).toLocaleString() : 'Unknown date'}</span>
            ${unreviewedNote}
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
    saveToLocalStorage();
  }

  function syncEntityToBuilding(building, entity) {
    const idx = building.entities.findIndex((e) => e.id === entity.id);
    if (idx >= 0) building.entities[idx] = entity;
  }

  function escHtml(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
})();
