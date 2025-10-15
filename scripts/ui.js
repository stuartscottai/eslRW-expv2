let toastHideTimer;
let loaderDepth = 0;
let loaderHideTimer;

export function showToast(message, type = 'success') {
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
  toastHideTimer = window.setTimeout(() => {
    toastNotification.classList.remove('show');
  }, 3200);
}


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
