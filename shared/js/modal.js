export function openModal({ title, body, actions = [] }) {
  const root = document.querySelector('#modalRoot');
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modalTitle" tabindex="-1">
      <header class="modal-header"><h2 id="modalTitle">${title}</h2></header>
      <div class="modal-body">${body}</div>
      <footer class="modal-footer"></footer>
    </section>
  `;

  const footer = backdrop.querySelector('.modal-footer');
  actions.forEach((action) => {
    const btn = document.createElement('button');
    btn.className = action.role === 'primary' ? 'primary-btn' : 'secondary-btn';
    btn.textContent = action.label;
    btn.addEventListener('click', () => {
      action.onClick?.();
      if (action.role === 'close' || action.closeOnClick !== false) closeModal(backdrop);
    });
    footer.appendChild(btn);
  });

  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) closeModal(backdrop);
  });
  document.addEventListener('keydown', handleEscape);

  root.replaceChildren(backdrop);
  backdrop.querySelector('.modal-card').focus();

  function handleEscape(event) {
    if (event.key === 'Escape') closeModal(backdrop);
  }

  function closeModal(node) {
    document.removeEventListener('keydown', handleEscape);
    node.remove();
  }
}
