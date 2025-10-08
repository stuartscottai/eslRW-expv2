import { isSupabaseConfigured, waitForInitialSession, getCurrentUser, onAuthStateChange } from '/scripts/supabase-client.js';

function setGuardState(root, signedIn) {
  const content = root.querySelector('[data-auth-guard="content"]');
  const prompt = root.querySelector('[data-auth-guard="prompt"]');
  if (content) { content.hidden = !signedIn; content.setAttribute('aria-hidden', signedIn ? 'false' : 'true'); }
  if (prompt) { prompt.hidden = signedIn; prompt.setAttribute('aria-hidden', signedIn ? 'true' : 'false'); }
}

async function initGuard(root) {
  const configured = isSupabaseConfigured();
  if (!configured) {
    // If not configured, show content to avoid blocking usage in local/demo.
    setGuardState(root, true);
    return;
  }
  await waitForInitialSession();
  setGuardState(root, !!getCurrentUser());
  onAuthStateChange((user) => setGuardState(root, !!user));
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-auth-guard-root]').forEach(initGuard);
});

