// Material-style login wired to Supabase when available
import { isSupabaseConfigured, signIn, getSupabaseClient, waitForInitialSession, getCurrentUser } from '/scripts/supabase-client.js';

class MaterialLoginForm {
  constructor() {
    this.form = document.getElementById('loginForm');
    this.emailInput = document.getElementById('email');
    this.passwordInput = document.getElementById('password');
    this.passwordToggle = document.getElementById('passwordToggle');
    this.submitButton = this.form.querySelector('.material-btn');
    this.successMessage = document.getElementById('successMessage');
    this.socialButtons = document.querySelectorAll('.social-btn');
    const params = new URLSearchParams(window.location.search);
    this.redirectTarget = params.get('redirect') || '';
    this.init();
  }
  init() {
    this.bindEvents();
    this.setupPasswordToggle();
    this.setupSocialButtons();
    this.setupRipples();
    this.refreshFilledState();
  }
  bindEvents() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.emailInput.addEventListener('blur', () => this.validateEmail());
    this.passwordInput.addEventListener('blur', () => this.validatePassword());
    this.emailInput.addEventListener('input', () => this.clearError('email'));
    this.passwordInput.addEventListener('input', () => this.clearError('password'));
  }
  setupPasswordToggle() {
    this.passwordToggle.addEventListener('click', (e) => {
      this.createRipple(e, this.passwordToggle.querySelector('.toggle-ripple'));
      const type = this.passwordInput.type === 'password' ? 'text' : 'password';
      this.passwordInput.type = type;
      this.passwordToggle.querySelector('.toggle-icon').classList.toggle('show-password', type === 'text');
    });
  }
  setupSocialButtons() {
    // Google button
    const googleBtn = document.querySelector('.social-btn.google-material');
    if (googleBtn) {
      googleBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        this.createRipple(e, googleBtn.querySelector('.social-ripple'));
        if (!isSupabaseConfigured()) {
          this.showError('password', 'Google login unavailable (Supabase not configured).');
          return;
        }
        try {
          this.setLoading(true);
          const client = getSupabaseClient();
          const redirectTo = `${window.location.origin}/app.html`;
          await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
        } catch (err) {
          this.showError('password', err?.message || 'Could not start Google login.');
        } finally {
          this.setLoading(false);
        }
      });
    }

    // Optional: disable other social buttons (e.g., Facebook) if present
    this.socialButtons.forEach(btn => {
      if (btn && !btn.classList.contains('google-material')) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.createRipple(e, btn.querySelector('.social-ripple'));
          this.showError('password', 'This sign-in method is not enabled.');
        });
      }
    });
  }
  setupRipples() {
    [this.emailInput, this.passwordInput].forEach(input => {
      input.addEventListener('focus', (e) => {
        const c = input.parentNode.querySelector('.ripple-container');
        this.createRipple(e, c);
      });
    });
    this.submitButton.addEventListener('click', (e) => this.createRipple(e, this.submitButton.querySelector('.btn-ripple')));
    const cb = document.querySelector('.checkbox-wrapper');
    cb?.addEventListener('click', (e) => this.createRipple(e, cb.querySelector('.checkbox-ripple')));
  }
  refreshFilledState() {
    const mark = (el) => {
      const w = el.closest('.input-wrapper');
      if (!w) return;
      const has = String(el.value || '').trim().length > 0;
      w.classList.toggle('has-value', has);
    };
    [this.emailInput, this.passwordInput].forEach((el) => {
      mark(el);
      el.addEventListener('input', () => mark(el));
      el.addEventListener('change', () => mark(el));
      el.addEventListener('blur', () => mark(el));
    });
    // Re-check shortly after load to catch browser autofill
    setTimeout(() => { [this.emailInput, this.passwordInput].forEach(mark); }, 100);
    setTimeout(() => { [this.emailInput, this.passwordInput].forEach(mark); }, 600);
  }
  createRipple(event, container) {
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
  validateEmail() {
    const email = this.emailInput.value.trim();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) { this.showError('email', 'Email is required'); return false; }
    if (!re.test(email)) { this.showError('email', 'Enter a valid email address'); return false; }
    this.clearError('email'); return true;
  }
  validatePassword() {
    const pw = this.passwordInput.value;
    if (!pw) { this.showError('password', 'Password is required'); return false; }
    if (pw.length < 6) { this.showError('password', 'Password must be at least 6 characters'); return false; }
    this.clearError('password'); return true;
  }
  showError(field, message) {
    const group = document.getElementById(field).closest('.form-group');
    const el = document.getElementById(`${field}Error`);
    group.classList.add('error'); el.textContent = message; el.classList.add('show');
  }
  clearError(field) {
    const group = document.getElementById(field).closest('.form-group');
    const el = document.getElementById(`${field}Error`);
    group.classList.remove('error'); el.classList.remove('show'); setTimeout(() => { el.textContent = ''; }, 200);
  }
  async handleSubmit(e) {
    e.preventDefault();
    if (!this.validateEmail() || !this.validatePassword()) {
      this.submitButton.style.animation = 'materialPulse .3s ease';
      setTimeout(() => this.submitButton.style.animation = '', 300);
      return;
    }
    this.setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await signIn({ email: this.emailInput.value.trim(), password: this.passwordInput.value });
      } else {
        await new Promise(r => setTimeout(r, 1200));
      }
      this.showSuccess();
      setTimeout(() => {
        let target = 'app.html';
        const r = (this.redirectTarget || '').trim();
        if (r && !/login\.html/i.test(r)) {
          target = r;
        }
        window.location.href = target;
      }, 900);
    } catch (err) {
      this.showError('password', err?.message || 'Sign in failed. Please try again.');
    } finally {
      this.setLoading(false);
    }
  }
  setLoading(flag) {
    this.submitButton.classList.toggle('loading', flag);
    this.submitButton.disabled = flag;
    this.socialButtons.forEach(b => { b.style.pointerEvents = flag ? 'none' : 'auto'; b.style.opacity = flag ? '0.6' : '1'; });
  }
  showSuccess() {
    this.form.style.transform = 'translateY(-16px) scale(0.95)';
    this.form.style.opacity = '0';
    setTimeout(() => {
      this.form.style.display = 'none';
      document.querySelector('.social-login').style.display = 'none';
      document.querySelector('.signup-link').style.display = 'none';
      this.successMessage.classList.add('show');
    }, 300);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    if (isSupabaseConfigured()) {
      await waitForInitialSession();
      const user = getCurrentUser();
      if (user) {
        window.location.replace('app.html');
        return;
      }
    }
  } catch {}
  new MaterialLoginForm();
});
