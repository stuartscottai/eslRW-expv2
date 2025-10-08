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

function wireHeader(panel) {
  const signedInRow = panel.querySelector('[data-auth-when="signed-in"]');
  const signedOutRow = panel.querySelector('[data-auth-when="signed-out"]');
  const dropdown = panel.querySelector('[data-auth-dropdown]');
  const openLogin = panel.querySelector('[data-auth-open="login"]');
  const closeBtn = panel.querySelector('[data-auth-close]');
  const nameNode = panel.querySelector('[data-auth-display-name]');

  const closeDropdown = () => {
    if (dropdown) dropdown.classList.add('hidden');
  };
  const openDropdown = (tab) => {
    if (!dropdown) return;
    setActiveTab(panel, tab);
    // Reposition dropdown to be fully visible below the header
    try {
      const header = document.querySelector('.site-header');
      const gap = 8; // px
      const baseTop = (header && header.offsetHeight) ? (header.offsetHeight + gap) : 72;
      dropdown.style.position = 'fixed';
      dropdown.style.top = `${baseTop}px`;
      dropdown.style.right = '16px';
      dropdown.style.left = 'auto';
      dropdown.style.maxHeight = '80vh';
      dropdown.style.overflow = 'auto';
      dropdown.style.zIndex = '1000';
    } catch {}
    dropdown.classList.remove('hidden');
  };

  openLogin?.addEventListener('click', (e) => { e.preventDefault(); openDropdown('login'); });
  closeBtn?.addEventListener('click', (e) => { e.preventDefault(); closeDropdown(); });

  document.addEventListener('click', (e) => {
    if (!dropdown || dropdown.classList.contains('hidden')) return;
    if (panel.contains(e.target)) return;
    closeDropdown();
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
        closeDropdown();
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
