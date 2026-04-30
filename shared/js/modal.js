window.openModal = (function () {
  var _escapeHandler = null;

  function closeModal(node) {
    if (_escapeHandler) {
      document.removeEventListener('keydown', _escapeHandler);
      _escapeHandler = null;
    }
    node.remove();
  }

  return function openModal({ title, body, actions = [], cardClass = '' }) {
    if (_escapeHandler) {
      document.removeEventListener('keydown', _escapeHandler);
      _escapeHandler = null;
    }

    const root = document.querySelector('#modalRoot');
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <section class="modal-card${cardClass ? ' ' + cardClass : ''}" role="dialog" aria-modal="true" aria-labelledby="modalTitle" tabindex="-1">
        <header class="modal-header"><h2 id="modalTitle">${title}</h2></header>
        <div class="modal-body">${body}</div>
        <footer class="modal-footer"></footer>
      </section>
    `;

    const card = backdrop.querySelector('.modal-card');
    const footer = backdrop.querySelector('.modal-footer');

    actions.forEach((action) => {
      const btn = document.createElement('button');
      btn.className = action.role === 'primary' ? 'primary-btn' : 'secondary-btn';
      btn.textContent = action.label;
      btn.addEventListener('click', () => {
        action.onClick?.();
        if ((action.role === 'close' || action.closeOnClick !== false) && backdrop.isConnected) {
          closeModal(backdrop);
        }
      });
      footer.appendChild(btn);
    });

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal(backdrop);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusable = Array.from(
        card.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter((el) => !el.disabled && el.offsetParent !== null);
      if (!focusable.length) { e.preventDefault(); return; }
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
      }
    });

    _escapeHandler = (e) => { if (e.key === 'Escape') closeModal(backdrop); };
    document.addEventListener('keydown', _escapeHandler);

    root.replaceChildren(backdrop);
    card.focus();
  };
})();
