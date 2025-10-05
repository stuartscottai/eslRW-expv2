const MOBILE_BREAKPOINT = 768;

function setupNavigation(toggle) {
  const targetId = toggle.getAttribute('aria-controls');
  if (!targetId) return;
  const panel = document.getElementById(targetId);
  if (!panel) return;

  const closePanel = () => {
    toggle.setAttribute('aria-expanded', 'false');
    panel.dataset.open = 'false';
  };

  const openPanel = () => {
    toggle.setAttribute('aria-expanded', 'true');
    panel.dataset.open = 'true';
  };

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      closePanel();
    } else {
      openPanel();
    }
  });

  panel.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth < MOBILE_BREAKPOINT) {
        closePanel();
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      closePanel();
    }
  });

  const syncWithViewport = () => {
    if (window.innerWidth >= MOBILE_BREAKPOINT) {
      panel.dataset.open = 'true';
      toggle.setAttribute('aria-expanded', 'false');
    } else if (toggle.getAttribute('aria-expanded') !== 'true') {
      panel.dataset.open = 'false';
    }
  };

  window.addEventListener('resize', syncWithViewport);
  syncWithViewport();
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-nav-toggle]')
    .forEach((toggle) => setupNavigation(toggle));
});
