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

  // Ensure panel renders above overlay
  panel.style.position = 'fixed';
  panel.style.zIndex = '40';

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

    // Position the full-height drawer below the site header
    try {
      const header = document.querySelector('.site-header');
      const top = header ? header.getBoundingClientRect().bottom : 64;
      panel.style.top = `${Math.round(top)}px`;
      panel.style.left = '0px';
      panel.style.height = `calc(100vh - ${Math.round(top)}px)`;
      panel.style.width = `${Math.round(Math.min(window.innerWidth * 0.8, 320))}px`;
    } catch (_) {}
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

  // No in-panel close button (use navbar toggle or outside click)

  // Close when clicking outside the panel/toggle
  document.addEventListener('click', (e) => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    if (!isOpen) return;
    const withinPanel = panel.contains(e.target);
    const onToggle = toggle.contains(e.target);
    if (!withinPanel && !onToggle) closePanel();
  });

  // Keep the drawer anchored below the header on resize/scroll
  const repositionIfOpen = () => {
    if (toggle.getAttribute('aria-expanded') === 'true') openPanel();
  };
  window.addEventListener('resize', repositionIfOpen);
  window.addEventListener('scroll', repositionIfOpen, true);

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
