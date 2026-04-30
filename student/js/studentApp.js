(function () {
  const SESSION_KEY = '335trs-student-session';

  const state = {
    scenario: null,
    decisions: [],
    studentName: ''
  };

  const els = {
    title:            document.querySelector('#scenarioTitle'),
    nameDisplay:      document.querySelector('#studentNameDisplay'),
    layer:            document.querySelector('#buildingLayer'),
    briefcaseCount:   document.querySelector('#briefcaseCount'),
    briefcaseList:    document.querySelector('#briefcaseList'),
    openBriefcaseBtn: document.querySelector('#openBriefcaseBtn'),
    buildingTracker:  document.querySelector('#buildingTracker'),
    newSessionBtn:    document.querySelector('#newSessionBtn'),
    submit:           document.querySelector('#submitResultsBtn')
  };

  init();

  function init() {
    if (restoreSession()) {
      document.querySelector('#loginOverlay')?.remove();
      startScenario();
    } else {
      initLogin();
    }
  }

  // ── Session storage ─────────────────────────────────────────────────────────

  function saveSession() {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        scenario:    state.scenario,
        studentName: state.studentName,
        decisions:   state.decisions
      }));
    } catch (e) {}
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function restoreSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data.scenario || !data.studentName) return false;
      validateScenario(data.scenario);
      state.scenario   = data.scenario;
      state.studentName = data.studentName;
      state.decisions  = Array.isArray(data.decisions) ? data.decisions : [];
      return true;
    } catch (e) {
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    }
  }

  // ── Login ───────────────────────────────────────────────────────────────────

  function initLogin() {
    const overlay       = document.querySelector('#loginOverlay');
    const scenarioInput = document.querySelector('#scenarioFileInput');
    const scenarioTitle = document.querySelector('#scenarioLoadedTitle');
    const nameInput     = document.querySelector('#studentNameInput');
    const beginBtn      = document.querySelector('#beginScenarioBtn');

    let pendingScenario = null;

    function updateBeginState() {
      beginBtn.disabled = !pendingScenario || !nameInput.value.trim();
    }

    scenarioInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      readJsonFile(file)
        .then((data) => {
          validateScenario(data);
          pendingScenario = data;
          scenarioTitle.textContent = data.title;
          scenarioTitle.classList.remove('muted');
        })
        .catch((err) => {
          pendingScenario = null;
          scenarioTitle.textContent = 'Invalid scenario file: ' + err.message;
          scenarioTitle.classList.add('muted');
        })
        .finally(updateBeginState);
      e.target.value = '';
    });

    nameInput.addEventListener('input', updateBeginState);
    nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') attemptLogin(); });
    beginBtn.addEventListener('click', attemptLogin);
    nameInput.focus();

    function attemptLogin() {
      if (!pendingScenario || !nameInput.value.trim()) return;
      state.studentName = nameInput.value.trim();
      state.scenario    = pendingScenario;
      overlay.remove();
      startScenario();
      saveSession();
    }
  }

  function startScenario() {
    els.title.textContent       = state.scenario.title;
    els.nameDisplay.textContent = state.studentName;
    renderBuildings();
    els.submit.addEventListener('click', exportResults);
    els.openBriefcaseBtn.addEventListener('click', openBriefcaseModal);
    els.newSessionBtn.addEventListener('click', confirmNewSession);
    updateBriefcase();
    updateBuildingTracker();
    // initCoordTool(); // DEV TOOL — remove when done placing buildings
  }

  // ── Image src helper ────────────────────────────────────────────────────────

  function imgSrc(image) {
    if (!image) return '';
    return image.startsWith('data:') ? image : '../shared/images/' + image;
  }

  // ── Buildings ───────────────────────────────────────────────────────────────

  function renderBuildings() {
    els.layer.innerHTML = '';
    state.scenario.buildings.forEach((building) => {
      const btn = document.createElement('button');
      btn.className = 'building-marker';
      btn.textContent = building.name;
      btn.style.left   = `${building.bounds.x}%`;
      btn.style.top    = `${building.bounds.y}%`;
      btn.style.width  = `${building.bounds.width}%`;
      btn.style.height = `${building.bounds.height}%`;
      btn.addEventListener('click', () => openBuildingModal(building));
      els.layer.appendChild(btn);
    });
  }

  // ── Building tracker ────────────────────────────────────────────────────────

  function updateBuildingTracker() {
    if (!els.buildingTracker || !state.scenario) return;
    els.buildingTracker.innerHTML = state.scenario.buildings.map((building) => {
      const totalItems = building.entities.reduce((sum, e) => sum + e.collectionItems.length, 0);
      const decided    = state.decisions.filter((d) => d.buildingId === building.id).length;
      let status;
      if (decided === 0) {
        status = 'not-visited';
      } else if (totalItems > 0 && decided >= totalItems) {
        status = 'complete';
      } else {
        status = 'visited';
      }
      return `
        <div class="building-tracker-item">
          <span class="tracker-dot ${status}"></span>
          <span class="tracker-label ${status}">${building.name}</span>
        </div>`;
    }).join('');
  }

  // ── Modals ──────────────────────────────────────────────────────────────────

  function openBuildingModal(building) {
    const entityRows = building.entities.map((entity) => {
      const thumbHtml = entity.image
        ? `<img src="${imgSrc(entity.image)}" class="entity-row-thumb" alt="" />`
        : `<span class="entity-row-thumb-placeholder">?</span>`;
      return `
        <button class="entity-row" data-entity-id="${entity.id}">
          ${thumbHtml}
          <span class="entity-row-arrow">&#9658;</span>
          <span class="entity-row-name">${entity.name}</span>
          <span class="entity-type-badge">${entity.type}</span>
        </button>`;
    }).join('');

    openModal({
      title: `[ ${building.name} ]`,
      body: `
        <p>${building.description}</p>
        <p class="muted">Select who you want to engage:</p>
        <div class="entity-list">${entityRows || '<p class="muted">No contacts available.</p>'}</div>
      `,
      actions: [{ label: 'Close', role: 'close' }]
    });

    document.querySelectorAll('.entity-row').forEach((btn) => {
      btn.addEventListener('click', () => {
        const entity = building.entities.find((e) => e.id === btn.dataset.entityId);
        if (entity) openEntityModal(building, entity);
      });
    });
  }

  function openEntityModal(building, entity) {
    const colImg = entity.image
      ? `<img src="${imgSrc(entity.image)}" alt="" />`
      : `<div class="modal-col-img-placeholder">?</div>`;

    const hasMoreInfo = entity.whoTheySupport || entity.keyResponsibilities || entity.whenChapelEngagesThem;
    const moreBtnHtml = hasMoreInfo
      ? `<button class="secondary-btn more-info-btn">More Info</button>`
      : '';

    const itemButtons = entity.collectionItems.map((item) => {
      const thumbHtml = item.image
        ? `<img src="${imgSrc(item.image)}" class="item-btn-thumb" alt="" />`
        : '';
      return `<button class="item-btn secondary-btn" data-item-id="${item.id}">
        ${thumbHtml}<span class="item-btn-title">${item.title}</span>
      </button>`;
    }).join('');

    openModal({
      title: `${entity.type.toUpperCase()} – ${entity.name.toUpperCase()}`,
      body: `
        <div class="modal-two-col">
          <div class="modal-col-img">${colImg}</div>
          <div class="modal-col-content">
            <p class="entity-field-label">What They Do</p>
            <p>${entity.description || '<span class="muted">No description.</span>'}</p>
            ${moreBtnHtml}
            <p class="modal-detail-prompt">What do you want to ask?</p>
            <div class="item-list">${itemButtons || '<p class="muted">No information available.</p>'}</div>
          </div>
        </div>
      `,
      actions: [{ label: 'Back', role: 'close', onClick: () => openBuildingModal(building) }],
      cardClass: 'modal-wide'
    });

    if (hasMoreInfo) {
      const moreBtn = document.querySelector('.more-info-btn');
      if (moreBtn) moreBtn.addEventListener('click', () => openMoreInfoModal(building, entity));
    }

    document.querySelectorAll('.item-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = entity.collectionItems.find((i) => i.id === btn.dataset.itemId);
        if (item) openCollectionModal(building, entity, item);
      });
    });
  }

  function openMoreInfoModal(building, entity) {
    const fields = [
      { label: 'Who They Support',        value: entity.whoTheySupport },
      { label: 'Key Responsibilities',     value: entity.keyResponsibilities },
      { label: 'When Chapel Engages Them', value: entity.whenChapelEngagesThem }
    ].filter((f) => f.value);

    const content = fields.map((f) => `
      <div class="more-info-field">
        <p class="more-info-label">${f.label}</p>
        <p>${f.value}</p>
      </div>`
    ).join('');

    openModal({
      title: entity.name.toUpperCase(),
      body: content || '<p class="muted">No additional information available.</p>',
      actions: [{ label: 'Back', role: 'close', onClick: () => openEntityModal(building, entity) }],
      cardClass: 'modal-wide'
    });
  }

  function openCollectionModal(building, entity, item) {
    const inBriefcase = state.decisions.some(
      (d) => d.buildingId === building.id && d.entityId === entity.id && d.itemId === item.id && d.decision === 'collect'
    );

    const colImg = item.image
      ? `<img src="${imgSrc(item.image)}" alt="" />`
      : `<div class="modal-col-img-placeholder">?</div>`;

    openModal({
      title: item.title,
      body: `
        <div class="modal-two-col">
          <div class="modal-col-img">${colImg}</div>
          <div class="modal-col-content">
            <p>${item.content}</p>
            ${inBriefcase ? '<p class="decision-recorded muted">&#10003; In your briefcase.</p>' : ''}
          </div>
        </div>
      `,
      actions: [
        {
          label: 'Keep',
          role: 'primary',
          onClick: () => {
            recordDecision(building, entity, item, 'collect');
            openEntityModal(building, entity);
          }
        },
        {
          label: 'Discard',
          role: 'secondary',
          onClick: () => {
            recordDecision(building, entity, item, 'doNotCollect');
            openEntityModal(building, entity);
          }
        },
        { label: 'Back', role: 'close', onClick: () => openEntityModal(building, entity) }
      ],
      cardClass: 'modal-wide'
    });
  }

  // ── Decisions ───────────────────────────────────────────────────────────────

  function recordDecision(building, entity, item, decision) {
    const existing = state.decisions.findIndex(
      (d) => d.buildingId === building.id && d.entityId === entity.id && d.itemId === item.id
    );
    const record = {
      buildingId: building.id,
      entityId:   entity.id,
      itemId:     item.id,
      decision,
      timestamp:  new Date().toISOString()
    };
    if (existing >= 0) {
      state.decisions[existing] = record;
    } else {
      state.decisions.push(record);
    }
    updateBriefcase();
    updateBuildingTracker();
    saveSession();
  }

  // ── Briefcase ───────────────────────────────────────────────────────────────

  function updateBriefcase() {
    const kept = state.decisions.filter((d) => d.decision === 'collect');
    els.briefcaseCount.textContent = kept.length;
    els.openBriefcaseBtn.disabled  = kept.length === 0;

    if (!kept.length) {
      els.briefcaseList.innerHTML = '<p class="muted briefcase-empty">No items collected yet.</p>';
      return;
    }

    els.briefcaseList.innerHTML = kept.map((d) => {
      const building = state.scenario.buildings.find((b) => b.id === d.buildingId);
      const entity   = building?.entities.find((e) => e.id === d.entityId);
      const item     = entity?.collectionItems.find((i) => i.id === d.itemId);
      if (!item) return '';
      return `
        <div class="briefcase-item">
          <button class="briefcase-item-link"
            data-nav-building="${d.buildingId}"
            data-nav-entity="${d.entityId}">
            <span class="briefcase-item-location">${building?.name ?? d.buildingId}</span>
            <span class="briefcase-item-entity">${entity?.name ?? d.entityId}</span>
            <span class="briefcase-item-title">${item.title}</span>
          </button>
          <button class="briefcase-item-delete"
            data-del-building="${d.buildingId}"
            data-del-entity="${d.entityId}"
            data-del-item="${d.itemId}"
            title="Remove from briefcase">&#x00D7;</button>
        </div>`;
    }).join('');

    els.briefcaseList.querySelectorAll('.briefcase-item-link').forEach((btn) => {
      btn.addEventListener('click', () => {
        const building = state.scenario.buildings.find((b) => b.id === btn.dataset.navBuilding);
        const entity   = building?.entities.find((e) => e.id === btn.dataset.navEntity);
        if (building && entity) openEntityModal(building, entity);
      });
    });

    els.briefcaseList.querySelectorAll('.briefcase-item-delete').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.decisions = state.decisions.filter(
          (d) => !(d.buildingId === btn.dataset.delBuilding
                && d.entityId  === btn.dataset.delEntity
                && d.itemId    === btn.dataset.delItem)
        );
        updateBriefcase();
        updateBuildingTracker();
        saveSession();
      });
    });
  }

  function openBriefcaseModal() {
    const kept = state.decisions.filter((d) => d.decision === 'collect');
    if (!kept.length) return;

    const byBuilding = {};
    kept.forEach((d) => {
      if (!byBuilding[d.buildingId]) byBuilding[d.buildingId] = [];
      byBuilding[d.buildingId].push(d);
    });

    const content = Object.entries(byBuilding).map(([buildingId, decisions]) => {
      const building = state.scenario.buildings.find((b) => b.id === buildingId);
      const items = decisions.map((d) => {
        const entity = building?.entities.find((e) => e.id === d.entityId);
        const item   = entity?.collectionItems.find((i) => i.id === d.itemId);
        if (!item) return '';
        return `
          <div class="briefcase-modal-item">
            <span class="briefcase-modal-entity">${entity?.name ?? d.entityId}</span>
            <span class="briefcase-modal-title">${item.title}</span>
          </div>`;
      }).join('');
      return `
        <div class="briefcase-modal-building">
          <p class="briefcase-modal-building-name">${building?.name ?? buildingId}</p>
          ${items}
        </div>`;
    }).join('');

    openModal({
      title: 'Briefcase — Collected Items',
      body: content,
      actions: [{ label: 'Close', role: 'close' }]
    });
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  function exportResults() {
    if (state.decisions.length === 0) {
      alert('No decisions recorded yet. Interact with the scenario before submitting.');
      return;
    }

    openModal({
      title: 'Submit Results',
      body: '<p>Your results will be downloaded as a JSON file. Your session will be cleared so the next student can begin.</p>',
      actions: [
        {
          label: 'Submit & Clear Session',
          role: 'primary',
          onClick: () => {
            doExport();
            setTimeout(() => {
              clearSession();
              location.reload();
            }, 300);
          }
        },
        { label: 'Cancel', role: 'close' }
      ]
    });
  }

  function doExport() {
    const now      = new Date();
    const pad      = (n) => String(n).padStart(2, '0');
    const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const namePart = state.studentName.trim().replace(/\s+/g, '_');
    const filename = `${datePart}_${timePart}_${namePart}_results.json`;

    const payload = {
      studentName:   state.studentName,
      submittedAt:   now.toISOString(),
      scenarioId:    state.scenario.id,
      scenarioTitle: state.scenario.title,
      decisions:     state.decisions
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // ── New session ─────────────────────────────────────────────────────────────

  function confirmNewSession() {
    openModal({
      title: 'New Session',
      body: '<p>Start a new session? Your current progress will be cleared and the login screen will return.</p>',
      actions: [
        {
          label: 'Clear & Restart',
          role: 'primary',
          onClick: () => {
            clearSession();
            location.reload();
          }
        },
        { label: 'Cancel', role: 'close' }
      ]
    });
  }

  // DEV TOOL — delete the initCoordTool() call in startScenario() and this whole function when done
  function initCoordTool() {
    const mapContainer = document.querySelector('#mapContainer');

    const hud = document.createElement('div');
    hud.id = 'coordHud';
    hud.style.cssText = [
      'position:absolute', 'bottom:0.8rem', 'left:0.8rem', 'z-index:9999',
      'background:rgba(0,0,0,0.75)', 'color:#6fb6ff', 'font:bold 1.3rem monospace',
      'padding:0.5rem 0.9rem', 'border-radius:0.5rem', 'pointer-events:none',
      'border:1px solid #6fb6ff', 'user-select:none'
    ].join(';');
    hud.textContent = 'x: — y: —';
    mapContainer.appendChild(hud);

    const toast = document.createElement('div');
    toast.id = 'coordToast';
    toast.style.cssText = [
      'position:absolute', 'bottom:4rem', 'left:0.8rem', 'z-index:9999',
      'background:#6fb6ff', 'color:#07111f', 'font:bold 1.2rem monospace',
      'padding:0.4rem 0.8rem', 'border-radius:0.5rem', 'pointer-events:none',
      'opacity:0', 'transition:opacity 0.3s'
    ].join(';');
    mapContainer.appendChild(toast);

    let toastTimer;
    mapContainer.addEventListener('mousemove', (e) => {
      const rect = mapContainer.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
      const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
      hud.textContent = `x: ${x}%  y: ${y}%`;
    });
    mapContainer.addEventListener('mouseleave', () => { hud.textContent = 'x: — y: —'; });
    mapContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('building-marker')) return;
      const rect = mapContainer.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
      const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
      const text = `"x": ${x}, "y": ${y}`;
      navigator.clipboard.writeText(text).catch(() => {});
      clearTimeout(toastTimer);
      toast.textContent = `Copied: ${text}`;
      toast.style.opacity = '1';
      toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 2000);
    });
  }
})();
