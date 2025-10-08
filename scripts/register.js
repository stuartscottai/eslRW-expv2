import { isSupabaseConfigured, getSupabaseClient, signIn } from '/scripts/supabase-client.js';
import { showToast } from '/scripts/ui.js';

function usernameValid(u) {
  return /^[a-zA-Z0-9_]{3,24}$/.test(u || '');
}

async function usernameAvailable(client, username) {
  try {
    const { data, error } = await client.from('profiles').select('id').eq('username', username).maybeSingle();
    if (error && error.code !== 'PGRST116') { // ignore no rows
      console.warn('Username check error', error);
      return true; // fail-open to avoid blocking if table missing
    }
    return !data; // available if no row
  } catch (e) {
    console.warn('Username check failed', e);
    return true; // fail-open
  }
}

async function upsertProfile(client, userId, username) {
  try {
    await client.from('profiles').upsert({ id: userId, username });
  } catch (e) {
    console.warn('Profile upsert failed (non-fatal)', e);
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const fd = new FormData(form);
  const email = String(fd.get('email') || '').trim();
  const password = String(fd.get('password') || '').trim();
  const username = String(fd.get('username') || '').trim();

  if (!email || !password || !username) {
    showToast('Please fill in all fields.', 'error');
    return;
  }
  if (!usernameValid(username)) {
    showToast('Username must be 3–24 chars: letters, numbers, underscore.', 'error');
    return;
  }

  if (!isSupabaseConfigured()) {
    showToast('Supabase not configured. Registration unavailable.', 'error');
    return;
  }

  const client = getSupabaseClient();

  // Disable while processing
  Array.from(form.elements).forEach(el => { if ('disabled' in el) el.disabled = true; });

  try {
    const available = await usernameAvailable(client, username);
    if (!available) {
      showToast('Username is taken. Please choose another.', 'error');
      return;
    }

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { username } }
    });
    if (error) throw error;

    const user = data?.user || null;

    if (user?.id) {
      await upsertProfile(client, user.id, username);
    }

    // Try to sign in (if email confirmation disabled this will succeed immediately)
    try {
      await signIn({ email, password });
      showToast('Registration complete. You are now signed in.', 'success');
      setTimeout(() => { window.location.href = 'index.html'; }, 800);
    } catch (e) {
      // If confirmation required
      showToast('Check your email to confirm your account.', 'success');
    }
  } catch (e) {
    console.error('Registration failed', e);
    showToast(e?.message || 'Registration failed.', 'error');
  } finally {
    Array.from(form.elements).forEach(el => { if ('disabled' in el) el.disabled = false; });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registration-form');
  if (form) form.addEventListener('submit', handleRegister);
});

