import { isSupabaseConfigured, getSupabaseClient, refreshSession } from '/scripts/supabase-client.js';
import { showToast } from '/scripts/ui.js';

function usernameValid(u) { return /^[a-zA-Z0-9_]{3,24}$/.test(u || ''); }

async function usernameAvailable(client, username, selfId) {
  try {
    const { data, error } = await client.from('profiles').select('id').eq('username', username).maybeSingle();
    if (error && error.code !== 'PGRST116') return true; // fail-open
    if (!data) return true;
    return data.id === selfId; // allow existing own username
  } catch { return true; }
}

async function upsertProfile(client, userId, payload) {
  try { await client.from('profiles').upsert({ id: userId, ...payload }); }
  catch (e) { console.warn('Profile upsert failed', e); }
}

async function init() {
  if (!isSupabaseConfigured()) return;
  const client = getSupabaseClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return;

  const identityForm = document.getElementById('identity-form');
  const displayName = document.getElementById('display-name');
  const username = document.getElementById('username');
  const emailForm = document.getElementById('email-form');
  const newEmail = document.getElementById('new-email');
  const passwordForm = document.getElementById('password-form');
  const newPassword = document.getElementById('new-password');

  // Pre-fill
  displayName.value = user.user_metadata?.display_name || '';
  try {
    const { data } = await client.from('profiles').select('username').eq('id', user.id).maybeSingle();
    username.value = data?.username || user.user_metadata?.username || '';
  } catch { username.value = user.user_metadata?.username || ''; }

  identityForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dn = displayName.value.trim();
    const un = username.value.trim();
    if (un && !usernameValid(un)) { showToast('Username must be 3–24 chars: letters, numbers, underscore.', 'error'); return; }
    if (un) {
      const ok = await usernameAvailable(client, un, user.id);
      if (!ok) { showToast('Username is taken. Choose another.', 'error'); return; }
    }
    try {
      await client.auth.updateUser({ data: { display_name: dn || null, username: un || null } });
      await upsertProfile(client, user.id, { username: un || null });
      await refreshSession();
      showToast('Profile updated', 'success');
    } catch (err) { showToast(err?.message || 'Failed to update profile', 'error'); }
  });

  emailForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (newEmail.value || '').trim();
    if (!email) { showToast('Enter a new email first.', 'error'); return; }
    try { await client.auth.updateUser({ email }); showToast('Email update requested. Check your inbox to confirm.', 'success'); }
    catch (err) { showToast(err?.message || 'Failed to update email', 'error'); }
  });

  passwordForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = (newPassword.value || '').trim();
    if (!pw || pw.length < 8) { showToast('Password must be at least 8 characters.', 'error'); return; }
    try { await client.auth.updateUser({ password: pw }); newPassword.value=''; showToast('Password changed.', 'success'); }
    catch (err) { showToast(err?.message || 'Failed to change password', 'error'); }
  });
}

document.addEventListener('DOMContentLoaded', init);

