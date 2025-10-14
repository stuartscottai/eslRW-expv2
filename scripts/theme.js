// Lightweight theme manager: light / dark / system
(function(){
  const KEY = 'theme';
  const getPref = () => (localStorage.getItem(KEY) || 'system');
  const setPref = (v) => { localStorage.setItem(KEY, v); apply(); };

  const apply = () => {
    try {
      const pref = getPref();
      const sysDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const mode = pref === 'system' ? (sysDark ? 'dark' : 'light') : pref;
      document.documentElement.dataset.theme = mode;
      const meta = document.querySelector('meta[name="theme-color"]') || (function(){ const m=document.createElement('meta'); m.name='theme-color'; document.head.appendChild(m); return m; })();
      meta.setAttribute('content', mode === 'dark' ? '#0f172a' : '#ffffff');
    } catch {}
  };

  // React to system changes when in 'system'
  try {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener?.('change', () => { if (getPref() === 'system') apply(); });
  } catch {}

  // Expose API
  window.Theme = { get: getPref, set: setPref, apply };
  // Apply on load
  apply();
})();

