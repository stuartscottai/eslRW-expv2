import { isSupabaseConfigured, getSupabaseClient } from '/scripts/supabase-client.js';
import { showToast } from '/scripts/ui.js';

function createRipple(event, container) {
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  const ripple = document.createElement('div');
  ripple.className = 'ripple';
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  container.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('forgotForm');
  const email = document.getElementById('fp-email');
  const err = document.getElementById('fpError');
  const btn = form.querySelector('.material-btn');

  // Float label when autofilled or when there is a value
  const mark = () => {
    const wrap = email.closest('.input-wrapper');
    if (wrap) wrap.classList.toggle('has-value', String(email.value || '').trim().length > 0);
  };
  mark();
  setTimeout(mark, 100);
  setTimeout(mark, 600);
  email.addEventListener('input', mark);
  email.addEventListener('change', mark);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rippleC = btn.querySelector('.btn-ripple');
    createRipple(e, rippleC);
    const value = email.value.trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value || !re.test(value)) {
      err.textContent = 'Enter a valid email address';
      err.classList.add('show');
      return;
    }
    err.textContent = '';
    err.classList.remove('show');
    btn.classList.add('loading');
    try {
      if (isSupabaseConfigured()) {
        const client = getSupabaseClient();
        const redirectTo = window.location.origin + '/login.html';
        const { error } = await client.auth.resetPasswordForEmail(value, { redirectTo });
        if (error) throw error;
        showToast('Password reset email sent. Check your inbox.', 'success');
      } else {
        await new Promise(r => setTimeout(r, 1000));
        showToast('Password reset email simulated (Supabase not configured).', 'success');
      }
    } catch (e2) {
      showToast(e2?.message || 'Could not send reset email.', 'error');
    } finally {
      btn.classList.remove('loading');
    }
  });
});
