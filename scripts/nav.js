function ensureOverlay() {
  let overlay = document.getElementById('nav-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'nav-overlay';
    overlay.setAttribute('data-visible', 'false');
    document.body.appendChild(overlay);
  }
  return overlay;
}

function setupNavigation(toggle) {
  const targetId = toggle.getAttribute('aria-controls');
  if (!targetId) return;
  const panel = document.getElementById(targetId);
  if (!panel) return;

  const overlay = ensureOverlay();

  const closePanel = () => {
    toggle.setAttribute('aria-expanded', 'false');
    panel.dataset.open = 'false';
    overlay.setAttribute('data-visible', 'false');
    document.body.classList.remove('overflow-hidden');
  };

  const openPanel = () => {
    toggle.setAttribute('aria-expanded', 'true');
    panel.dataset.open = 'true';
    overlay.setAttribute('data-visible', 'true');
    document.body.classList.add('overflow-hidden');
  };

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      closePanel();
    } else {
      openPanel();
    }
  });

  overlay.addEventListener('click', closePanel);

  panel.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      closePanel();
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      closePanel();
    }
  });

  // Start closed on all viewports
  closePanel();
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-nav-toggle]')
    .forEach((toggle) => setupNavigation(toggle));
});

