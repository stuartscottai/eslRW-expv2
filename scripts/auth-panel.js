import { isSupabaseConfigured, waitForInitialSession, onAuthStateChange, signUp, signIn, signOut, getCurrentUser, refreshSession } from '/scripts/supabase-client.js';
import { showToast } from '/scripts/ui.js';

const panels = Array.from(document.querySelectorAll('[data-auth-panel]'));
function ensureStatusNode(panel) {
  if (panel.__authStatusNode) {
    return panel.__authStatusNode;
  }

  const statusNode = document.createElement('p');
  statusNode.className = 'text-sm font-medium text-slate-700';
  statusNode.textContent = 'Log in or Sign up';
  statusNode.dataset.authOriginalDisplay = statusNode.style.display || '';
  panel.prepend(statusNode);
  panel.__authStatusNode = statusNode;
  return statusNode;
}

function setSectionVisibility(section, shouldShow) {
  if (!section) return;
  if (!section.dataset.authOriginalDisplay) {
    section.dataset.authOriginalDisplay = section.style.display || '';
  }
  section.hidden = !shouldShow;
  section.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
  section.style.display = shouldShow ? section.dataset.authOriginalDisplay : 'none';
}


function toggleSections(panel, user) {
  const isSignedIn = Boolean(user);
  const statusNode = ensureStatusNode(panel);

  panel.querySelectorAll('[data-auth-when="signed-in"]').forEach((section) => {
    setSectionVisibility(section, isSignedIn);
  });
  panel.querySelectorAll('[data-auth-when="signed-out"]').forEach((section) => {
    setSectionVisibility(section, !isSignedIn);
  });

  const emailTargets = panel.querySelectorAll('[data-auth-email]');
  emailTargets.forEach((node) => {
    node.textContent = user?.email ?? '';
  });

  if (isSignedIn) {
    statusNode.hidden = true;
    statusNode.style.display = 'none';
  } else {
    statusNode.hidden = false;
    statusNode.style.display = statusNode.dataset.authOriginalDisplay || '';
    statusNode.textContent = 'Log in or Sign up';
  }
}

function disableForm(form, isDisabled) {
  Array.from(form.elements).forEach((element) => {
    if ('disabled' in element) {
      element.disabled = isDisabled;
    }
  });
}

async function initialisePanels() {
  if (!isSupabaseConfigured()) {
    panels.forEach((panel) => {
      panel.querySelectorAll('[data-auth-requires-config]').forEach((node) => {
        node.hidden = true;
      });
      panel.querySelectorAll('[data-auth-missing-config]').forEach((node) => {
        node.hidden = false;
      });
    });
    return;
  }

  await waitForInitialSession();
  const initialUser = getCurrentUser();
  panels.forEach((panel) => toggleSections(panel, initialUser));

  onAuthStateChange((user) => {
    panels.forEach((panel) => toggleSections(panel, user));
  });

  panels.forEach((panel) => {
    const signupForm = panel.querySelector('form[data-auth-form="signup"]');
    const loginForm = panel.querySelector('form[data-auth-form="login"]');
    const logoutButton = panel.querySelector('button[data-auth-action="logout"]');

    if (signupForm) {
      signupForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(signupForm);
        const email = String(formData.get('email') || '').trim();
        const password = String(formData.get('password') || '').trim();
        if (!email || !password) {
          showToast('Enter email and password to sign up.', 'error');
          return;
        }
        disableForm(signupForm, true);
        try {
          await signUp({ email, password });
          showToast('Check your inbox to confirm your account.', 'success');
          signupForm.reset();
        } catch (error) {
          console.error('Sign up failed', error);
          const message = error?.message || 'Sign up failed.';
          showToast(message, 'error');
        } finally {
          disableForm(signupForm, false);
        }
      });
    }

    if (loginForm) {
      loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(loginForm);
        const email = String(formData.get('email') || '').trim();
        const password = String(formData.get('password') || '').trim();
        if (!email || !password) {
          showToast('Enter email and password to log in.', 'error');
          return;
        }
        disableForm(loginForm, true);
        try {
          const { data } = await signIn({ email, password });
          const signedInUser = data?.user ?? await refreshSession().catch(() => null);
          const effectiveUser = signedInUser ?? getCurrentUser();
          showToast('Logged in successfully.', 'success');
          panels.forEach((panel) => toggleSections(panel, effectiveUser));
          loginForm.reset();
        } catch (error) {
          console.error('Login failed', error);
          const message = error?.message || 'Could not log in.';
          showToast(message, 'error');
        } finally {
          disableForm(loginForm, false);
        }
      });
    }

    if (logoutButton) {
      logoutButton.addEventListener('click', async (event) => {
        event.preventDefault();
        try {
          await signOut();
          showToast('Logged out.', 'success');
        } catch (error) {
          console.error('Logout failed', error);
          const message = error?.message || 'Could not log out.';
          showToast(message, 'error');
        }
      });
    }
  });
}

if (panels.length) {
  initialisePanels();
}
