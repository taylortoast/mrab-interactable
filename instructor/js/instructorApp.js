(function () {
  const MAX_ITEMS = 5;

  let scenario;

  const evaluationState = {
    submissions: [],
    selectedSubmissionId: null,
    loadErrors: []
  };

  const buildingState = {
    selectedBuildingId: null,
    editMode: null
    // null = view only
    // { type: 'entity', entityId: null }        = adding new contact
    // { type: 'entity', entityId: 'ent-xxx' }   = editing existing contact
    // { type: 'item', entityId: 'ent-xxx', itemId: null }      = adding new item
    // { type: 'item', entityId: 'ent-xxx', itemId: 'item-xxx'} = editing item
  };

  const els = {
    exportBtn: document.querySelector('#exportScenarioBtn'),
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
    bindEvents();
    renderBuildingList();
    if (scenario.buildings.length) {
      selectBuilding(scenario.buildings[0]);
    }
    initTabs();
  }

  function bindEvents() {
    els.exportBtn.addEventListener('click', exportScenarioJs);
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
    buildingState.editMode = null;
    renderBuildingList();
    renderBuildingDetail(building);
  }

  // ── Building detail panel ───────────────────────────────────────────────────

  function renderBuildingDetail(building) {
    const em = buildingState.editMode;

    function entityCardHtml(entity) {
      const editingEntity = em?.type === 'entity' && em.entityId === entity.id;
      const addingItemHere = em?.type === 'item' && em.entityId === entity.id && em.itemId === null;
      const atMax = entity.collectionItems.length >= MAX_ITEMS;

      const itemsHtml = entity.collectionItems.map((item) => {
        if (em?.type === 'item' && em.entityId === entity.id && em.itemId === item.id) {
          return `<div class="inline-item-form">${renderInlineItemFields(item)}</div>`;
        }
        const dc = item.correctDecision === 'collect' ? 'decision-collect' : 'decision-no-collect';
        const dl = item.correctDecision === 'collect' ? 'Collect' : 'No Collect';
        return `
          <div class="entity-item-row" data-item-id="${item.id}">
            ${item.image ? `<img src="${escHtml(item.image)}" class="item-thumbnail" alt="" />` : ''}
            <span class="entity-item-title">${escHtml(item.title)}</span>
            <div class="row-actions">
              <span class="entity-item-decision ${dc}">${dl}</span>
              ${!em ? `<button class="secondary-btn btn-sm" data-edit-item="${item.id}" data-entity-id="${entity.id}">Edit</button>` : ''}
              ${!em ? `<button class="secondary-btn btn-sm danger" data-delete-item="${item.id}" data-entity-id="${entity.id}">Delete</button>` : ''}
            </div>
          </div>`;
      }).join('') || (addingItemHere ? '' : '<p class="muted-sm" style="margin:0.4rem 0;">No items yet.</p>');

      const addItemFormHtml = addingItemHere
        ? `<div class="inline-item-form">${renderInlineItemFields(null)}</div>` : '';

      const headerHtml = editingEntity
        ? `<div class="entity-card-header">
             <span class="inline-form-label">Editing: ${escHtml(entity.name)}</span>
           </div>
           ${renderInlineEntityFields(entity)}`
        : `<div class="entity-card-header">
             <div class="entity-name-group">
               ${entity.image ? `<img src="${escHtml(entity.image)}" class="entity-thumbnail" alt="" />` : ''}
               <span class="entity-card-name">${escHtml(entity.name)} <span class="badge">${entity.type}</span></span>
             </div>
             <div class="row-actions">
               ${!em ? `<button class="secondary-btn btn-sm" data-edit-entity="${entity.id}">Edit</button>` : ''}
               ${!em ? `<button class="secondary-btn btn-sm danger" data-delete-entity="${entity.id}">Delete</button>` : ''}
             </div>
           </div>`;

      return `
        <div class="entity-card${editingEntity ? ' is-editing' : ''}" data-entity-id="${entity.id}">
          ${headerHtml}
          <div class="entity-card-items">
            <div class="items-section-header">
              <span class="muted-sm">Items ${entity.collectionItems.length}/${MAX_ITEMS}</span>
              ${!em && !atMax && !editingEntity ? `<button class="secondary-btn btn-sm" data-add-item data-entity-id="${entity.id}">+ Add Item</button>` : ''}
            </div>
            ${itemsHtml}
            ${addItemFormHtml}
          </div>
        </div>`;
    }

    const addEntityFormHtml = (em?.type === 'entity' && em.entityId === null)
      ? `<div class="entity-card inline-new-entity">
           <span class="inline-form-label">New Contact</span>
           ${renderInlineEntityFields(null)}
         </div>` : '';

    const entityCardsHtml = building.entities.map(entityCardHtml).join('')
      || '<p class="muted">No contacts added yet.</p>';

    els.buildingDetail.innerHTML = `
      <div class="building-detail-card">
        <div class="building-detail-header">
          <h3 class="building-detail-title">${escHtml(building.name)}</h3>
          ${!em ? '<button id="addEntityBtn" class="primary-btn btn-sm">+ Add Contact</button>' : ''}
        </div>
        ${addEntityFormHtml}
        ${entityCardsHtml}
      </div>`;

    bindBuildingDetailEvents(building);
  }

  // ── Inline form renderers ───────────────────────────────────────────────────

  function renderInlineEntityFields(existing) {
    const name = existing ? escHtml(existing.name) : '';
    const desc = existing ? escHtml(existing.description) : '';
    const type = existing?.type || 'person';
    const imgSrc = existing?.image || '';
    const imgPreview = imgSrc
      ? `<div id="ef-img-preview" class="inline-img-preview"><img src="${escHtml(imgSrc)}" class="inline-img-preview-img" alt="" /></div>`
      : `<div id="ef-img-preview" class="inline-img-preview" style="display:none;"></div>`;
    return `
      <div class="inline-form-fields">
        <input id="ef-name" class="inline-input" type="text" placeholder="Contact name" value="${name}" />
        <select id="ef-type" class="inline-select">
          <option value="person" ${type === 'person' ? 'selected' : ''}>Person</option>
          <option value="section" ${type === 'section' ? 'selected' : ''}>Section</option>
          <option value="organization" ${type === 'organization' ? 'selected' : ''}>Organization</option>
        </select>
        <textarea id="ef-desc" class="inline-textarea" placeholder="Description">${desc}</textarea>
        <div class="inline-img-field">
          <span class="inline-form-sublabel">Image (optional)</span>
          ${imgPreview}
          <input type="hidden" id="ef-img-data" value="${escHtml(imgSrc)}" />
          <div style="display:flex;gap:0.6rem;align-items:center;flex-wrap:wrap;">
            <label class="inline-file-label secondary-btn btn-sm">
              <span id="ef-img-btn-text">${imgSrc ? 'Change Image' : 'Select Image'}</span>
              <input type="file" id="ef-img-file" accept="image/*" style="display:none;" />
            </label>
            ${imgSrc ? '<button id="ef-img-clear" class="secondary-btn btn-sm danger">Remove</button>' : ''}
          </div>
        </div>
      </div>
      <div class="inline-form-actions">
        <button id="ef-save" class="primary-btn btn-sm">${existing ? 'Save Changes' : 'Add Contact'}</button>
        <button id="ef-cancel" class="secondary-btn btn-sm">Cancel</button>
      </div>`;
  }

  function renderInlineItemFields(existing) {
    const title = existing ? escHtml(existing.title) : '';
    const content = existing ? escHtml(existing.content) : '';
    const decision = existing?.correctDecision || 'collect';
    const feedback = existing ? escHtml(existing.feedback) : '';
    const imgSrc = existing?.image || '';
    const imgPreview = imgSrc
      ? `<div id="if-img-preview" class="inline-img-preview"><img src="${escHtml(imgSrc)}" class="inline-img-preview-img" alt="" /></div>`
      : `<div id="if-img-preview" class="inline-img-preview" style="display:none;"></div>`;
    return `
      <div class="inline-form-fields">
        <input id="if-title" class="inline-input" type="text" placeholder="Item title" value="${title}" />
        <textarea id="if-content" class="inline-textarea" placeholder="Content (shown to student)">${content}</textarea>
        <select id="if-decision" class="inline-select">
          <option value="collect" ${decision === 'collect' ? 'selected' : ''}>Collect</option>
          <option value="doNotCollect" ${decision === 'doNotCollect' ? 'selected' : ''}>Do Not Collect</option>
        </select>
        <textarea id="if-feedback" class="inline-textarea" placeholder="Instructor feedback (shown after decision)">${feedback}</textarea>
        <div class="inline-img-field">
          <span class="inline-form-sublabel">Image (optional)</span>
          ${imgPreview}
          <input type="hidden" id="if-img-data" value="${escHtml(imgSrc)}" />
          <div style="display:flex;gap:0.6rem;align-items:center;flex-wrap:wrap;">
            <label class="inline-file-label secondary-btn btn-sm">
              <span id="if-img-btn-text">${imgSrc ? 'Change Image' : 'Select Image'}</span>
              <input type="file" id="if-img-file" accept="image/*" style="display:none;" />
            </label>
            ${imgSrc ? '<button id="if-img-clear" class="secondary-btn btn-sm danger">Remove</button>' : ''}
          </div>
        </div>
      </div>
      <div class="inline-form-actions">
        <button id="if-save" class="primary-btn btn-sm">${existing ? 'Save Changes' : 'Add Item'}</button>
        <button id="if-cancel" class="secondary-btn btn-sm">Cancel</button>
      </div>`;
  }

  // ── Building detail event binding ───────────────────────────────────────────

  function bindBuildingDetailEvents(building) {
    document.querySelector('#addEntityBtn')?.addEventListener('click', () => {
      buildingState.editMode = { type: 'entity', entityId: null };
      renderBuildingDetail(building);
    });

    document.querySelectorAll('[data-edit-entity]').forEach((btn) => {
      btn.addEventListener('click', () => {
        buildingState.editMode = { type: 'entity', entityId: btn.dataset.editEntity };
        renderBuildingDetail(building);
      });
    });

    document.querySelectorAll('[data-delete-entity]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('Delete this contact and all its collection items?')) return;
        building.entities = building.entities.filter((e) => e.id !== btn.dataset.deleteEntity);
        syncBuildingToScenario(building);
        renderBuildingList();
        renderBuildingDetail(building);
      });
    });

    document.querySelectorAll('[data-add-item]').forEach((btn) => {
      btn.addEventListener('click', () => {
        buildingState.editMode = { type: 'item', entityId: btn.dataset.entityId, itemId: null };
        renderBuildingDetail(building);
      });
    });

    document.querySelectorAll('[data-edit-item]').forEach((btn) => {
      btn.addEventListener('click', () => {
        buildingState.editMode = { type: 'item', entityId: btn.dataset.entityId, itemId: btn.dataset.editItem };
        renderBuildingDetail(building);
      });
    });

    document.querySelectorAll('[data-delete-item]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!confirm('Delete this collection item?')) return;
        const entity = building.entities.find((e) => e.id === btn.dataset.entityId);
        if (!entity) return;
        entity.collectionItems = entity.collectionItems.filter((i) => i.id !== btn.dataset.deleteItem);
        syncEntityToBuilding(building, entity);
        syncBuildingToScenario(building);
        renderBuildingList();
        renderBuildingDetail(building);
      });
    });

    document.querySelector('#ef-img-file')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        document.querySelector('#ef-img-data').value = reader.result;
        const preview = document.querySelector('#ef-img-preview');
        preview.style.display = '';
        preview.innerHTML = `<img src="${escHtml(reader.result)}" class="inline-img-preview-img" alt="" />`;
        const btnText = document.querySelector('#ef-img-btn-text');
        if (btnText) btnText.textContent = 'Change Image';
      };
      reader.readAsDataURL(file);
    });

    document.querySelector('#ef-img-clear')?.addEventListener('click', () => {
      document.querySelector('#ef-img-data').value = '';
      const preview = document.querySelector('#ef-img-preview');
      preview.style.display = 'none';
      preview.innerHTML = '';
      const btnText = document.querySelector('#ef-img-btn-text');
      if (btnText) btnText.textContent = 'Select Image';
    });

    document.querySelector('#if-img-file')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        document.querySelector('#if-img-data').value = reader.result;
        const preview = document.querySelector('#if-img-preview');
        preview.style.display = '';
        preview.innerHTML = `<img src="${escHtml(reader.result)}" class="inline-img-preview-img" alt="" />`;
        const btnText = document.querySelector('#if-img-btn-text');
        if (btnText) btnText.textContent = 'Change Image';
      };
      reader.readAsDataURL(file);
    });

    document.querySelector('#if-img-clear')?.addEventListener('click', () => {
      document.querySelector('#if-img-data').value = '';
      const preview = document.querySelector('#if-img-preview');
      preview.style.display = 'none';
      preview.innerHTML = '';
      const btnText = document.querySelector('#if-img-btn-text');
      if (btnText) btnText.textContent = 'Select Image';
    });

    document.querySelector('#ef-save')?.addEventListener('click', () => {
      const em = buildingState.editMode;
      const name = document.querySelector('#ef-name').value.trim();
      if (!name) { alert('Contact name is required.'); return; }
      const type = document.querySelector('#ef-type').value;
      const description = document.querySelector('#ef-desc').value.trim();
      const image = document.querySelector('#ef-img-data')?.value || '';
      if (em.entityId === null) {
        building.entities.push({ id: 'entity-' + Date.now(), type, name, description, image, collectionItems: [] });
      } else {
        const entity = building.entities.find((e) => e.id === em.entityId);
        if (entity) { entity.name = name; entity.type = type; entity.description = description; entity.image = image; }
      }
      syncBuildingToScenario(building);
      buildingState.editMode = null;
      renderBuildingList();
      renderBuildingDetail(building);
    });

    document.querySelector('#ef-cancel')?.addEventListener('click', () => {
      buildingState.editMode = null;
      renderBuildingDetail(building);
    });

    document.querySelector('#if-save')?.addEventListener('click', () => {
      const em = buildingState.editMode;
      const entity = building.entities.find((e) => e.id === em.entityId);
      if (!entity) return;
      const title = document.querySelector('#if-title').value.trim();
      if (!title) { alert('Item title is required.'); return; }
      const image = document.querySelector('#if-img-data')?.value || '';
      if (em.itemId === null) {
        if (entity.collectionItems.length >= MAX_ITEMS) {
          alert('Maximum of ' + MAX_ITEMS + ' collection items per contact.');
          return;
        }
        entity.collectionItems.push({
          id: 'item-' + Date.now(),
          title,
          content: document.querySelector('#if-content').value.trim(),
          correctDecision: document.querySelector('#if-decision').value,
          feedback: document.querySelector('#if-feedback').value.trim(),
          image
        });
      } else {
        const item = entity.collectionItems.find((i) => i.id === em.itemId);
        if (item) {
          item.title = title;
          item.content = document.querySelector('#if-content').value.trim();
          item.correctDecision = document.querySelector('#if-decision').value;
          item.feedback = document.querySelector('#if-feedback').value.trim();
          item.image = image;
        }
      }
      syncEntityToBuilding(building, entity);
      syncBuildingToScenario(building);
      buildingState.editMode = null;
      renderBuildingList();
      renderBuildingDetail(building);
    });

    document.querySelector('#if-cancel')?.addEventListener('click', () => {
      buildingState.editMode = null;
      renderBuildingDetail(building);
    });
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
      ? '<span class="student-result-warning">Warning: result is from scenario “' + escHtml(results.scenarioId) + '”</span>'
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
