// layout.js — mode toggle and stepper (no changes to your business logic)

// Grab elements (null-safe with optional chaining below)
const btnSingle = document.getElementById('mode-single');
const btnSteps  = document.getElementById('mode-steps');
const controls  = document.getElementById('stepper-controls');
const prevBtn   = document.getElementById('step-prev');
const nextBtn   = document.getElementById('step-next');
const indicator = document.getElementById('step-indicator');

const steps = [
  document.getElementById('step1'),
  document.getElementById('step2'),
  document.getElementById('step3')
].filter(Boolean); // in case a page doesn’t have all steps

let current = 0;
let mode = 'steps';

// --- Button style presets (Tailwind classes) ---
const BTN_BASE      = "px-3 py-1.5 rounded-md text-sm font-medium border";
const BTN_ACTIVE    = "bg-orange-600 text-white shadow border-transparent";
const BTN_INACTIVE  = "bg-white text-slate-700 hover:bg-slate-100 border";

// Helper: apply active/inactive styles to the mode buttons
function styleButtons(active) {
  if (!btnSingle || !btnSteps) return;

  if (active === 'single') {
    btnSingle.className = `${BTN_BASE} ${BTN_ACTIVE}`;
    btnSteps.className  = `${BTN_BASE} ${BTN_INACTIVE}`;
  } else {
    btnSteps.className  = `${BTN_BASE} ${BTN_ACTIVE}`;
    btnSingle.className = `${BTN_BASE} ${BTN_INACTIVE}`;
  }
}

// Helper: show a particular step (0-based)
function showStep(i) {
  if (!steps.length) return;

  current = Math.max(0, Math.min(i, steps.length - 1));
  steps.forEach((s, idx) => {
    s.classList.toggle('hidden', idx !== current);
  });

  // Update indicator
  if (indicator) indicator.textContent = `Step ${current + 1} of ${steps.length}`;

  // Notify listeners that the step changed (1-based for readability)
  try {
  window.dispatchEvent(new CustomEvent('esl:step-changed', { detail: { step: current + 1 } }));
} catch {}


  // Disable ends
  if (prevBtn) prevBtn.disabled = current === 0;
  if (nextBtn) nextBtn.disabled = current === steps.length - 1;

  // NEW: hide "Previous" on Step 1, hide "Next" on last step
  // (use 'hidden' to remove them from layout; switch to 'invisible' if you want to preserve spacing)
  prevBtn?.classList.toggle('hidden', current === 0);
  nextBtn?.classList.toggle('hidden', current === steps.length - 1);
}

// Set mode (single | steps)
function setActiveMode(m) {
  mode = m;

  if (mode === 'single') {
    // Show everything; hide stepper controls
    steps.forEach(s => s.classList.remove('hidden'));
    controls?.classList.add('hidden');
    styleButtons('single');
  } else {
    // Show only the current step; show stepper controls
    controls?.classList.remove('hidden');
    styleButtons('steps');
    showStep(current);
  }
}

// Events
btnSingle?.addEventListener('click', () => setActiveMode('single'));
btnSteps?.addEventListener('click', () => setActiveMode('steps'));
prevBtn?.addEventListener('click', () => showStep(current - 1));
nextBtn?.addEventListener('click', () => showStep(current + 1));

// Default: keep steps mode as initial (matches original behavior)
setActiveMode('steps');

// If the user generates or opens results, jump to step 3 when in step mode
// (We don’t alter your functions; just observe DOM changes.)
const reportSection     = document.getElementById('report-section');
const strategiesSection = document.getElementById('strategies-section');
const chatSection       = document.getElementById('chat-section');

const observerTargets = [reportSection, strategiesSection, chatSection].filter(Boolean);

if (observerTargets.length) {
  const observer = new MutationObserver(() => {
    if (mode === 'steps') {
      const anyVisible = observerTargets.some(el => !el.classList.contains('hidden'));
      if (anyVisible) showStep(2); // step index for results
    }
  });
  observerTargets.forEach(el => observer.observe(el, { attributes: true, attributeFilter: ['class'] }));
}
// Make step navigation available to other scripts (e.g., main.js)
window.goToStep = (n) => { setActiveMode('steps'); showStep(n); };
window.isStepMode = () => !controls?.classList.contains('hidden');
