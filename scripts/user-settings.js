import { isSupabaseConfigured, getSupabaseClient } from '/scripts/supabase-client.js';
import { showToast } from '/scripts/ui.js';

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,24}$/;

function usernameValid(value) {
  return USERNAME_REGEX.test(value || '');
}

async function usernameAvailable(client, username, selfId) {
  try {
    const { data, error } = await client
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.warn('Username availability check failed', error);
      return true; // fail-open to avoid blocking users
    }

    if (!data) return true;
    return data.id === selfId;
  } catch (err) {
    console.warn('Username availability check failed', err);
    return true;
  }
}

function resolveProviderLabel(user) {
  const identities = Array.isArray(user?.identities) ? user.identities : [];
  const explicit = identities.find((entry) => entry?.provider)?.provider
    || user?.app_metadata?.provider
    || '';

  switch (explicit) {
    case 'google':
      return 'Google email';
    case 'apple':
      return 'Apple email';
    case 'github':
      return 'GitHub email';
    default:
      return 'email';
  }
}

function setStatusMessage(messageOrLines) {
  const status = document.getElementById('signin-status');
  if (!status) return;

  if (!messageOrLines) {
    status.textContent = '';
    status.hidden = true;
    return;
  }

  const lines = Array.isArray(messageOrLines)
    ? messageOrLines.filter(Boolean)
    : [messageOrLines];

  status.innerHTML = lines.map((line) => `<span>${line}</span>`).join('<br>');
  status.hidden = false;
}

function initThemeControls() {
  const fieldset = document.getElementById('theme-options');
  if (!fieldset) return;

  const radios = fieldset.querySelectorAll('input[name="theme"]');
  if (!radios.length) return;

  let current = 'light';
  try {
    current = window.Theme?.get() || 'light';
  } catch (err) {
    console.warn('Theme get failed', err);
  }
  if (current === 'system') current = 'light';

  radios.forEach((radio) => {
    radio.checked = radio.value === current;
    radio.addEventListener('change', () => {
      try {
        window.Theme?.set(radio.value);
      } catch (err) {
        console.warn('Theme set failed', err);
      }
    });
  });
}

function setButtonLoading(button, isLoading) {
  if (!button) return;
  button.disabled = !!isLoading;
  button.classList.toggle('loading', !!isLoading);
}

document.addEventListener('DOMContentLoaded', async () => {
  initThemeControls();

  if (!isSupabaseConfigured()) {
    setStatusMessage('Supabase connection missing. Account features are unavailable.');
    return;
  }

  const client = getSupabaseClient();
  let user = null;

  try {
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    user = data?.user ?? null;
  } catch (err) {
    console.error('Failed to load user', err);
    showToast('Could not load account details.', 'error');
    return;
  }

  if (!user) {
    setStatusMessage('Not signed in. Use the menu to log in.');
    return;
  }

  const usernameInput = document.getElementById('username');
  let currentUsername = '';

  if (usernameInput) {
    try {
      const { data, error } = await client
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      currentUsername = data?.username || user.user_metadata?.username || '';
    } catch (err) {
      console.warn('Failed to load username', err);
      currentUsername = user.user_metadata?.username || '';
    }

    usernameInput.value = currentUsername;
  }

  const provider = resolveProviderLabel(user);
  const lines = [`Signed in with ${provider}: ${user.email || 'unknown email'}`];
  if (currentUsername) lines.push(`Username: ${currentUsername}`);
  setStatusMessage(lines);

  const identityForm = document.getElementById('identity-form');
  if (identityForm && usernameInput) {
    identityForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const desired = usernameInput.value.trim();

      if (!usernameValid(desired)) {
        showToast('Username must be 3-24 chars: letters, numbers, underscore.', 'error');
        return;
      }

      const submitButton = identityForm.querySelector('button[type="submit"]');
      setButtonLoading(submitButton, true);

      try {
        const available = await usernameAvailable(client, desired, user.id);
        if (!available) {
          showToast('Username is taken. Choose another.', 'error');
          return;
        }

        await client.from('profiles').upsert({ id: user.id, username: desired });
        await client.auth.updateUser({ data: { username: desired } });
        currentUsername = desired;
        const updatedLines = [`Signed in with ${provider}: ${user.email || 'unknown email'}`, `Username: ${currentUsername}`];
        setStatusMessage(updatedLines);
        showToast('Username saved.', 'success');
      } catch (err) {
        console.error('Failed to save username', err);
        showToast(err?.message || 'Failed to save username.', 'error');
      } finally {
        setButtonLoading(submitButton, false);
      }
    });
  }

  const pwForm = document.getElementById('password-form');
  const pwEmailInput = document.getElementById('pw-email');

  if (pwForm && pwEmailInput) {
    pwEmailInput.value = user.email || '';

    pwForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const entered = pwEmailInput.value.trim();

      if (!entered) {
        showToast('Enter your account email.', 'error');
        return;
      }

      if (entered.toLowerCase() !== String(user.email || '').toLowerCase()) {
        showToast('Email must match your account email.', 'error');
        return;
      }

      const submitButton = pwForm.querySelector('button[type="submit"]');
      setButtonLoading(submitButton, true);

      try {
        const redirectTo = `${window.location.origin}/reset-password.html`;
        const { error } = await client.auth.resetPasswordForEmail(entered, { redirectTo });
        if (error) throw error;
        showToast('Password reset email sent. Check your inbox.', 'success');
      } catch (err) {
        console.error('Failed to send password reset link', err);
        showToast(err?.message || 'Could not send reset email.', 'error');
      } finally {
        setButtonLoading(submitButton, false);
      }
    });
  }
});

