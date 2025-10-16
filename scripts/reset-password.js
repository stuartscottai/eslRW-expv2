import { isSupabaseConfigured, getSupabaseClient, waitForInitialSession, getCurrentUser } from '/scripts/supabase-client.js';
import { showToast } from '/scripts/ui.js';

function setLoading(btn, flag) {
  if (!btn) return;
  btn.classList.toggle('loading', flag);
  btn.disabled = !!flag;
}

function setFieldError(node, msg) {
  const out = node?.closest('.form-group')?.querySelector('.error-message');
  if (out) { out.textContent = msg || ''; out.classList.toggle('show', !!msg); }
}

async function ensureRecoverySession() {
  if (!isSupabaseConfigured()) return null;
  const client = getSupabaseClient();
  await waitForInitialSession();
  const user = getCurrentUser();
  return user || null;
}

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('resetForm');
  const pw1 = document.getElementById('newPassword');
  const pw2 = document.getElementById('confirmPassword');
  const success = document.getElementById('rpSuccess');
  const btn = form?.querySelector('.material-btn');

  // If already signed in, skip to app
  try {
    const u = await ensureRecoverySession();
    if (!u) {
      // Not signed in via recovery link
      showToast('Open this page from your email reset link.', 'error');
    }
  } catch {}

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const v1 = (pw1.value || '').trim();
    const v2 = (pw2.value || '').trim();
    setFieldError(pw1, ''); setFieldError(pw2, '');
    if (!v1 || v1.length < 8) { setFieldError(pw1, 'Password must be at least 8 characters.'); return; }
    if (v1 !== v2) { setFieldError(pw2, 'Passwords do not match.'); return; }
    try {
      setLoading(btn, true);
      const client = getSupabaseClient();
      await client.auth.updateUser({ password: v1 });
      success?.classList.add('show');
      setTimeout(() => { window.location.replace('app.html'); }, 900);
    } catch (err) {
      showToast(err?.message || 'Could not update password.', 'error');
    } finally {
      setLoading(btn, false);
    }
  });
});

