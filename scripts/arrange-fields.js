<!-- keep included AFTER main.js and layout.js -->
<script>
// arrange-fields.js
(function () {
  function byId(id) { return document.getElementById(id); }

  function moveTo(col, el) {
    if (!col || !el) return;
    // Avoid re-appending if already placed
    if (el.parentElement === col) return;
    col.appendChild(el);
  }

  function arrangeOnce() {
    const src   = byId('dynamic-form-fields');
    const left  = byId('perf-left');
    const right = byId('perf-right');

    if (!src || !left || !right) return;

    // If already arranged (left/right have content), skip
    if (left.childElementCount + right.childElementCount > 0) return;

    // Known IDs (adjust if your form.js uses different wrappers)
    const ratingIds = [
      'progress',          // e.g. wrapper or field for Progress rating
      'behaviour',         // Behaviour rating
      'participation',     // Participation rating
      'english-level',     // English level rating
      'exam-performance'   // Exam performance rating
    ];

    const rightIds = [
      'character-container',   // multiselect character traits
      'areas-container',       // multiselect areas to improve
      'other-points-container',// textarea
      'salutation-container'   // select
    ];

    // Try to find wrappers by ID; fall back to heuristics
    let placed = 0;

    ratingIds.forEach(id => {
      const el = byId(id) || src.querySelector(`[data-id="${id}"]`);
      if (el) { moveTo(left, el); placed++; }
    });

    rightIds.forEach(id => {
      const el = byId(id) || src.querySelector(`[data-id="${id}"]`);
      if (el) { moveTo(right, el); placed++; }
    });

    // Fallback: if nothing matched known IDs, split existing children roughly in half
    if (placed === 0) {
      const kids = Array.from(src.children);
      if (kids.length) {
        const mid = Math.ceil(kids.length / 2);
        kids.slice(0, mid).forEach(el => moveTo(left, el));
        kids.slice(mid).forEach(el => moveTo(right, el));
      }
    }
  }

  // Run once on DOM ready (in case fields are already there)
  document.addEventListener('DOMContentLoaded', arrangeOnce);

  // Re-run as soon as form fields have been populated by main.js
  window.addEventListener('esl:form-populated', arrangeOnce);

  // Re-run when user enters Step 2 in step-by-step mode
  window.addEventListener('esl:step-changed', (e) => {
    if (e && e.detail && e.detail.step === 2) arrangeOnce();
  });

  // Safety net: if something appends into the staging div later, catch it
  const staging = document.getElementById('dynamic-form-fields');
  if (staging) {
    new MutationObserver(() => arrangeOnce())
      .observe(staging, { childList: true, subtree: false });
  }
})();
</script>
