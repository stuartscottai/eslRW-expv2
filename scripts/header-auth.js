import { isSupabaseConfigured, waitForInitialSession, onAuthStateChange, signUp, signIn, signOut, getCurrentUser } from '/scripts/supabase-client.js';
import { showToast } from '/scripts/ui.js';

function getDisplayName(user) {
  if (!user) return '';
  const meta = user.user_metadata || {};
  return meta.username || meta.full_name || (user.email ? String(user.email).split('@')[0] : '');
}

function toggle(panel, selector, show) {
  const el = panel.querySelector(selector);
  if (!el) return;
  el.classList.toggle('hidden', !show);
  el.hidden = !show;
}

function setActiveTab(panel, tab) {
  const login = panel.querySelector('[data-auth-tab="login"]');
  const signup = panel.querySelector('[data-auth-tab="signup"]');
  if (login) login.classList.toggle('hidden', tab !== 'login');
  if (signup) signup.classList.toggle('hidden', tab !== 'signup');
}

function positionDropdown(el) {
  try {
    const header = document.querySelector('.site-header');
    const gap = 0; // flush with nav bar
    const baseTop = (header && header.offsetHeight) ? (header.offsetHeight + gap) : 64;
    el.style.position = 'fixed';
    el.style.top = `${baseTop}px`;
    el.style.right = '0px'; // flush with right edge
    el.style.left = 'auto';
    el.style.maxHeight = '80vh';
    el.style.overflow = 'auto';
    el.style.zIndex = '1000';
  } catch {}
}

function wireHeader(panel) {
  const signedInRow = panel.querySelector('[data-auth-when="signed-in"]');
  const signedOutRow = panel.querySelector('[data-auth-when="signed-out"]');
  const dropdownLogin = panel.querySelector('[data-auth-dropdown]');
  const dropdownAccount = panel.querySelector('[data-auth-dropdown-account]');
  const openLogin = panel.querySelector('[data-auth-open="login"]');
  const openAccount = panel.querySelector('[data-auth-open="account"]');
  const closeBtn = panel.querySelector('[data-auth-close]');
  const closeAccountBtn = panel.querySelector('[data-auth-close-account]');
  const nameNode = panel.querySelector('[data-auth-display-name]');

  // Remove in-panel close rows entirely (X is shown on the icon toggle instead)
  try { closeBtn?.closest('div')?.remove(); } catch {}
  try { closeAccountBtn?.closest('div')?.remove(); } catch {}

  const closeDropdowns = () => {
    if (dropdownLogin) {
      dropdownLogin.dataset.open = 'false';
      setTimeout(() => dropdownLogin.classList.add('hidden'), 200);
    }
    if (dropdownAccount) {
      dropdownAccount.dataset.open = 'false';
      setTimeout(() => dropdownAccount.classList.add('hidden'), 200);
    }
    // collapse icon state
    openLogin?.setAttribute('aria-expanded', 'false');
    openAccount?.setAttribute('aria-expanded', 'false');
  };
  const openLoginDropdown = () => {
    if (!dropdownLogin) return;
    setActiveTab(panel, 'login');
    positionDropdown(dropdownLogin);
    dropdownLogin.classList.remove('hidden');
    requestAnimationFrame(() => { dropdownLogin.dataset.open = 'true'; });
    if (dropdownAccount) dropdownAccount.classList.add('hidden');
    openLogin?.setAttribute('aria-expanded', 'true');
    openAccount?.setAttribute('aria-expanded', 'false');
  };
  const openAccountDropdown = () => {
    if (!dropdownAccount) return;
    positionDropdown(dropdownAccount);
    dropdownAccount.classList.remove('hidden');
    requestAnimationFrame(() => { dropdownAccount.dataset.open = 'true'; });
    if (dropdownLogin) dropdownLogin.classList.add('hidden');
    openAccount?.setAttribute('aria-expanded', 'true');
    openLogin?.setAttribute('aria-expanded', 'false');
  };

  openLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    try {
      const here = window.location.href;
      const url = `login.html?redirect=${encodeURIComponent(here)}`;
      window.location.href = url;
    } catch {
      // Fallback to legacy dropdown if navigation is blocked
      openLoginDropdown();
    }
  });
  openAccount?.addEventListener('click', (e) => {
    e.preventDefault();
    const isOpen = dropdownAccount && !dropdownAccount.classList.contains('hidden');
    if (isOpen) {
      closeDropdowns();
    } else {
      openAccountDropdown();
    }
  });
  // We hide close buttons via CSS; keep listeners for safety
  closeBtn?.addEventListener('click', (e) => { e.preventDefault(); closeDropdowns(); });
  closeAccountBtn?.addEventListener('click', (e) => { e.preventDefault(); closeDropdowns(); });

  document.addEventListener('click', (e) => {
    const anyOpen = (dropdownLogin && !dropdownLogin.classList.contains('hidden')) || (dropdownAccount && !dropdownAccount.classList.contains('hidden'));
    if (!anyOpen) return;
    if (panel.contains(e.target)) return;
    closeDropdowns();
  });

  // Forms
  const loginForm = panel.querySelector('form[data-auth-form="login"]');
  const signupForm = panel.querySelector('form[data-auth-form="signup"]');
  const logoutBtn = panel.querySelector('[data-auth-action="logout"]');

  if (signupForm) {
    signupForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const fd = new FormData(signupForm);
      const email = String(fd.get('email') || '').trim();
      const password = String(fd.get('password') || '').trim();
      if (!email || !password) {
        showToast('Enter email and password to register.', 'error');
        return;
      }
      Array.from(signupForm.elements).forEach(el => { if ('disabled' in el) el.disabled = true; });
      try {
        await signUp({ email, password });
        showToast('Check your inbox to confirm your account.', 'success');
        signupForm.reset();
        closeDropdown();
      } catch (error) {
        showToast(error?.message || 'Sign up failed.', 'error');
      } finally {
        Array.from(signupForm.elements).forEach(el => { if ('disabled' in el) el.disabled = false; });
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const fd = new FormData(loginForm);
      const email = String(fd.get('email') || '').trim();
      const password = String(fd.get('password') || '').trim();
      if (!email || !password) {
        showToast('Enter email and password to sign in.', 'error');
        return;
      }
      Array.from(loginForm.elements).forEach(el => { if ('disabled' in el) el.disabled = true; });
      try {
        await signIn({ email, password });
        showToast('Signed in.', 'success');
        loginForm.reset();
        closeDropdowns();
      } catch (error) {
        showToast(error?.message || 'Could not sign in.', 'error');
      } finally {
        Array.from(loginForm.elements).forEach(el => { if ('disabled' in el) el.disabled = false; });
      }
    });
  }

  logoutBtn?.addEventListener('click', async (event) => {
    event.preventDefault();
    try {
      await signOut();
      showToast('Logged out.', 'success');
    } catch (error) {
      showToast(error?.message || 'Could not log out.', 'error');
    }
  });

  const render = (user) => {
    const isSignedIn = Boolean(user);
    if (nameNode) nameNode.textContent = isSignedIn ? getDisplayName(user) : '';
    if (signedInRow) {
      signedInRow.classList.toggle('hidden', !isSignedIn);
      signedInRow.hidden = !isSignedIn;
    }
    if (signedOutRow) {
      signedOutRow.classList.toggle('hidden', isSignedIn);
      signedOutRow.hidden = isSignedIn;
    }
    // Close any open dropdowns on state change
    closeDropdowns();
  };

  (async () => {
    if (!isSupabaseConfigured()) {
      // Disable actions but keep UI consistent
      openLogin?.setAttribute('disabled', 'true');
      return;
    }
    await waitForInitialSession();
    render(getCurrentUser());
    onAuthStateChange(render);
  })();
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-auth-header]').forEach(wireHeader);
});
