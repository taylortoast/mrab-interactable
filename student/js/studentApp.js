(function () {
  const state = {
    scenario: null,
    decisions: [],
    studentName: ''
  };

  const els = {
    title: document.querySelector('#scenarioTitle'),
    nameDisplay: document.querySelector('#studentNameDisplay'),
    layer: document.querySelector('#buildingLayer'),
    summary: document.querySelector('#collectionSummary'),
    submit: document.querySelector('#submitResultsBtn')
  };

  init();

  function init() {
    initLogin();
  }

  // ── Login ───────────────────────────────────────────────────────────────────

  function initLogin() {
    const overlay = document.querySelector('#loginOverlay');
    const nameInput = document.querySelector('#studentNameInput');
    const beginBtn = document.querySelector('#beginScenarioBtn');

    nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') attemptLogin(); });
    beginBtn.addEventListener('click', attemptLogin);
    nameInput.focus();

    function attemptLogin() {
      const name = nameInput.value.trim();
      if (!name) { nameInput.focus(); return; }
      state.studentName = name;
      overlay.remove();
      startScenario();
    }
  }

  function startScenario() {
    state.scenario = loadScenario();
    els.title.textContent = state.scenario.title;
    els.nameDisplay.textContent = state.studentName;
    renderBuildings();
    els.submit.addEventListener('click', exportResults);
    // initCoordTool(); // DEV TOOL — remove when done placing buildings
  }

  // ── Buildings ───────────────────────────────────────────────────────────────

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
    const entityButtons = building.entities.map((entity) => {
      const typeLabel = { person: 'Person', section: 'Section', organization: 'Organization' }[entity.type] || entity.type;
      return `<button class="entity-btn secondary-btn" data-entity-id="${entity.id}">${entity.name} <span class="entity-type-badge">${typeLabel}</span></button>`;
    }).join('');

    openModal({
      title: building.name,
      body: `
        <p>${building.description}</p>
        <p class="muted">Select a contact to speak with:</p>
        <div class="entity-list">${entityButtons || '<p class="muted">No contacts available.</p>'}</div>
      `,
      actions: [{ label: 'Close', role: 'close' }]
    });

    document.querySelectorAll('.entity-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const entity = building.entities.find((e) => e.id === btn.dataset.entityId);
        if (entity) openEntityModal(building, entity);
      });
    });
  }

  function openEntityModal(building, entity) {
    const itemButtons = entity.collectionItems.map((item) => {
      return `<button class="item-btn secondary-btn" data-item-id="${item.id}">${item.title}</button>`;
    }).join('');

    openModal({
      title: entity.name,
      body: `
        <p class="entity-type-badge">${entity.type}</p>
        <p>${entity.description}</p>
        <p class="muted">Select information to review:</p>
        <div class="item-list">${itemButtons || '<p class="muted">No information available.</p>'}</div>
      `,
      actions: [{ label: 'Back', role: 'close', onClick: () => openBuildingModal(building) }]
    });

    document.querySelectorAll('.item-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = entity.collectionItems.find((i) => i.id === btn.dataset.itemId);
        if (item) openCollectionModal(building, entity, item);
      });
    });
  }

  function openCollectionModal(building, entity, item) {
    const alreadyDecided = state.decisions.find(
      (d) => d.buildingId === building.id && d.entityId === entity.id && d.itemId === item.id
    );

    openModal({
      title: 'Review Information',
      body: `
        <h3 class="item-content-title">${item.title}</h3>
        <p>${item.content}</p>
        ${alreadyDecided ? `<p class="muted decision-recorded">Decision recorded: <strong>${alreadyDecided.decision === 'collect' ? 'Collect' : 'Do Not Collect'}</strong></p>` : ''}
      `,
      actions: [
        { label: 'Collect', role: 'primary', onClick: () => recordDecision(building, entity, item, 'collect'), closeOnClick: true },
        { label: 'Do Not Collect', role: 'secondary', onClick: () => recordDecision(building, entity, item, 'doNotCollect'), closeOnClick: true },
        { label: 'Back', role: 'close', onClick: () => openEntityModal(building, entity) }
      ]
    });
  }

  // ── Decisions ───────────────────────────────────────────────────────────────

  function recordDecision(building, entity, item, decision) {
    const existing = state.decisions.findIndex(
      (d) => d.buildingId === building.id && d.entityId === entity.id && d.itemId === item.id
    );
    const record = { buildingId: building.id, entityId: entity.id, itemId: item.id, decision, timestamp: new Date().toISOString() };
    if (existing >= 0) {
      state.decisions[existing] = record;
    } else {
      state.decisions.push(record);
    }
    updateSummary();
  }

  function updateSummary() {
    const total = state.decisions.length;
    const collected = state.decisions.filter((d) => d.decision === 'collect').length;
    els.summary.innerHTML = `
      <p><strong>${total}</strong> decision${total !== 1 ? 's' : ''} recorded</p>
      <p>${collected} collected &nbsp;|&nbsp; ${total - collected} not collected</p>
    `;
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  function exportResults() {
    if (state.decisions.length === 0) {
      alert('No decisions recorded yet. Interact with the scenario before submitting.');
      return;
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const namePart = state.studentName.trim().replace(/\s+/g, '_');
    const filename = `${datePart}_${timePart}_${namePart}_results.json`;

    const payload = {
      studentName: state.studentName,
      submittedAt: now.toISOString(),
      scenarioId: state.scenario.id,
      scenarioTitle: state.scenario.title,
      decisions: state.decisions
    };

    const content = JSON.stringify(payload, null, 2);

    const blob = new Blob([content], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
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
