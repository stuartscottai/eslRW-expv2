(function(){
  const KEY = 'theme';
  const normalise = (value) => value === 'dark' ? 'dark' : 'light';
  const getPref = () => normalise(localStorage.getItem(KEY));
  const setPref = (value) => { localStorage.setItem(KEY, normalise(value)); apply(); };

  const apply = () => {
    try {
      const mode = normalise(localStorage.getItem(KEY));
      document.documentElement.dataset.theme = mode;
      const meta = document.querySelector('meta[name="theme-color"]') || (function(){ const m=document.createElement('meta'); m.name='theme-color'; document.head.appendChild(m); return m; })();
      meta.setAttribute('content', mode === 'dark' ? '#0f172a' : '#ffffff');
    } catch (e) {}
  };

  window.Theme = { get: getPref, set: setPref, apply };
  document.addEventListener('DOMContentLoaded', () => {
    try {
      const pref = getPref();
      document.querySelectorAll('input[name=\"theme\"]').forEach(radio => {
        radio.checked = (radio.value === pref);
        radio.addEventListener('change', () => setPref(radio.value));
      });
    } catch (e) {}
  });
  apply();
})();
