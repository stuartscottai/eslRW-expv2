let toastHideTimer;
let loaderDepth = 0;
let loaderHideTimer;


export function setGenButtonState(button, spinner, isGenerating) {
  const btnText = button.querySelector('span');
  const generateReportButton = document.getElementById('generate-report-button');
  const getStrategiesButton = document.getElementById('get-strategies-button');
  const clearFormButton = document.getElementById('clear-form-button');

  button.disabled = isGenerating;
  if (getStrategiesButton) getStrategiesButton.disabled = isGenerating;
  if (generateReportButton) generateReportButton.disabled = isGenerating;
  if (clearFormButton) clearFormButton.disabled = isGenerating; // Also disable clear form button during generation
  if (spinner) spinner.classList.toggle('hidden', !isGenerating);
  if (button === generateReportButton) {
    if (btnText) btnText.textContent = isGenerating ? 'Generating...' : 'Generate Full Report';
  } else if (button === getStrategiesButton) {
    if (btnText) btnText.textContent = isGenerating ? 'Fetching Ideas...' : 'Get Improvement Ideas';
  }
}

export function showAiLoader(message) {
  const overlay = document.getElementById('ai-loader');
  const label = document.getElementById('ai-loader-text');
  if (!overlay || !label) return;

  loaderDepth += 1;
  label.textContent = message || 'Working...';
  if (loaderHideTimer) {
    clearTimeout(loaderHideTimer);
    loaderHideTimer = null;
  }
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add('ai-loader--visible'));
}

export function hideAiLoader(force = false) {
  const overlay = document.getElementById('ai-loader');
  if (!overlay) return;

  loaderDepth = force ? 0 : Math.max(0, loaderDepth - 1);
  if (loaderDepth > 0) return;

  overlay.classList.remove('ai-loader--visible');
  loaderHideTimer = window.setTimeout(() => {
    if (!overlay.classList.contains('ai-loader--visible')) {
      overlay.hidden = true;
    }
  }, 220);
}

export function autoResizeTextarea(element) {
  element.style.height = 'auto';
  element.style.height = (element.scrollHeight) + 'px';
}

// Fallback copy helper used in your code
export function fallbackCopyToClipboard(text, successMessage) {
  const ta = document.createElement("textarea"); ta.value = text;
  ta.style.position = "fixed"; ta.style.top = "0"; ta.style.left = "0";
  document.body.appendChild(ta); ta.focus(); ta.select();
  try {
    const ok = document.execCommand('copy');
    showToast(ok ? successMessage : "Failed to copy.", ok ? 'success' : 'error');
  } catch (err) { showToast("Failed to copy.", "error"); }
  document.body.removeChild(ta);
}

// Expose auto-resize to api.js without circular imports
if (typeof window !== 'undefined') {
  window.__autoResizeTextarea = autoResizeTextarea;
}


export function showToast(message, type = 'success', opts = {}) {
  // New: bottom-right custom toasts. Keeps old #toast-notification as a fallback.
  try {
    const titleMap = { success: 'Success', error: 'Error', info: 'Info', warning: 'Notice' };
    const title = opts.title || titleMap[type] || 'Notice';
    const duration = typeof opts.duration === 'number' ? opts.duration : 3200;

    let container = document.getElementById('custom-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'custom-toast-container';
      container.className = 'custom-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    const iconSvg = {
      success: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-1.2 12.3-2.6-2.6-1.4 1.4 4 4 .1.1.1-.1 7-7-1.4-1.4-5.8 5.8Z"/></svg>',
      error: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-1 5h2v7h-2V7Zm0 9h2v2h-2v-2Z"/></svg>',
      info: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm-1 5h2v2h-2V7Zm0 4h2v6h-2v-6Z"/></svg>',
      warning: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 21h22L12 2 1 21Zm12-3h-2v2h2v-2Zm0-8h-2v6h2v-6Z"/></svg>'
    }[type] || '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg>';

    toast.innerHTML = `
      <div class="icon-container">${iconSvg}</div>
      <div class="content-container">
        <div class="title">${title}</div>
        <div class="message">${message || ''}</div>
      </div>
      <button type="button" aria-label="Close" class="toast-close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 L18 18 M6 18 L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
    `;

    const closer = toast.querySelector('button');
    closer.addEventListener('click', () => toast.remove());
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    if (!opts.sticky) {
      window.setTimeout(() => toast.remove(), duration);
    }
    return;
  } catch (e) { }

  const toastNotification = document.getElementById('toast-notification');
  const toastMessage = document.getElementById('toast-message');
  if (!toastNotification || !toastMessage) return;
  toastMessage.textContent = message;
  toastNotification.classList.add('toast');
  toastNotification.classList.remove('toast--success', 'toast--error', 'show');
  const variant = type === 'error' ? 'toast--error' : 'toast--success';
  toastNotification.classList.add(variant);
  requestAnimationFrame(() => toastNotification.classList.add('show'));
  clearTimeout(toastHideTimer);
  toastHideTimer = window.setTimeout(() => { toastNotification.classList.remove('show'); }, 3200);
}
