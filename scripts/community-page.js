import { fetchCommunityTemplates } from '/scripts/community-api.js';
import { saveTemplate, validateTemplate } from '/scripts/templates.js';
import { showToast } from '/scripts/ui.js';
import { isSupabaseConfigured } from '/scripts/supabase-client.js';

const listContainer = document.querySelector('[data-community-list]');
const loadingState = document.querySelector('[data-community-loading]');
const emptyState = document.querySelector('[data-community-empty]');
const errorState = document.querySelector('[data-community-error]');
const refreshButton = document.querySelector('[data-community-refresh]');
const supabaseWarning = document.querySelector('[data-community-missing-config]');

function parseContent(content) {
  if (!content) return null;
  if (typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse community template content', error);
      return null;
    }
  }
  return content;
}

let communityTemplates = [];
const supabaseConfigured = isSupabaseConfigured();

if (!supabaseConfigured) {
  if (loadingState) {
    loadingState.textContent = 'Supabase is not configured. Add credentials to load community templates.';
  }
  if (supabaseWarning) {
    supabaseWarning.hidden = false;
  }
  if (refreshButton) {
    refreshButton.disabled = true;
  }
} else {
  if (supabaseWarning) {
    supabaseWarning.hidden = true;
  }
}

function setLoading(isLoading) {
  if (loadingState) {
    loadingState.hidden = !isLoading;
  }
  if (refreshButton) {
    refreshButton.disabled = isLoading || !supabaseConfigured;
  }
}

function showError(message) {
  if (errorState) {
    errorState.hidden = false;
    errorState.textContent = message;
  }
}

function clearError() {
  if (errorState) {
    errorState.hidden = true;
    errorState.textContent = '';
  }
}

function renderTemplates(templates) {
  if (!listContainer) return;

  listContainer.innerHTML = '';

  if (!templates.length) {
    if (emptyState) emptyState.hidden = false;
    return;
  }

  if (emptyState) emptyState.hidden = true;

  templates.forEach((entry) => {
    const card = document.createElement('div');
    card.className = 'rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition space-y-4';

    const createdLabel = entry.created_at ? new Date(entry.created_at).toLocaleString() : null;
    const template = parseContent(entry.content ?? entry.template);

    card.innerHTML = `
      <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div class="space-y-2">
          <h3 class="text-lg font-semibold text-slate-800">${entry.name}</h3>
          <p class="text-sm text-slate-600">${entry.description || 'No description provided.'}</p>
          <div class="text-xs text-slate-500 flex flex-wrap gap-3">
            ${createdLabel ? `<span>Shared: ${createdLabel}</span>` : ''}
            ${entry.user_id ? `<span>Shared by: ${entry.user_id}</span>` : ''}
            ${template?.ratingFields ? `<span>Rating fields: ${template.ratingFields.length}</span>` : ''}
            ${template?.characterOptions ? `<span>Traits: ${template.characterOptions.length}</span>` : ''}
          </div>
        </div>
        <div class="flex flex-col gap-2 md:items-end">
          <button type="button" class="inline-flex items-center btn-primary btn-compact text-sm font-semibold" data-action="import-community" data-template-id="${entry.id}">
            Import Template
          </button>
          <p class="text-[11px] text-slate-400 max-w-xs text-right">
            Imports create a copy in your local library. You can edit it freely after importing.
          </p>
        </div>
      </div>
    `;

    listContainer.appendChild(card);
  });
}

async function loadTemplates() {
  if (!supabaseConfigured || !listContainer) {
    return;
  }

  setLoading(true);
  clearError();
  if (emptyState) emptyState.hidden = true;

  try {
    communityTemplates = await fetchCommunityTemplates();
    renderTemplates(communityTemplates);
  } catch (error) {
    console.error('Failed to load community templates', error);
    showError(error?.message || 'Failed to load community templates.');
  } finally {
    setLoading(false);
  }
}

function cloneTemplate(template) {
  try {
    return JSON.parse(JSON.stringify(template));
  } catch (error) {
    console.error('Failed to clone template', error);
    return null;
  }
}

async function handleImport(templateId, trigger) {
  const entry = communityTemplates.find((item) => String(item.id) === String(templateId));
  const templateContent = entry ? parseContent(entry.content ?? entry.template) : null;
  if (!entry || !templateContent) {
    showToast('Template data unavailable.', 'error');
    return;
  }

  const button = trigger || null;
  let originalText = '';

  if (button) {
    if ('disabled' in button) button.disabled = true;
    if ('textContent' in button) {
      originalText = button.textContent;
      button.textContent = 'Importing...';
    }
  }

  try {
    const templateCopy = cloneTemplate(templateContent);
    if (!templateCopy) {
      showToast('Failed to prepare template.', 'error');
      return;
    }

    templateCopy.id = `tmpl_${Date.now()}`;
    templateCopy.isDefault = false;
    templateCopy.isLocked = false;
    templateCopy.createdDate = Date.now();

    const validation = validateTemplate(templateCopy);
    if (!validation.valid) {
      showToast('Template is missing required fields and cannot be imported.', 'error');
      return;
    }

    const saved = saveTemplate(templateCopy);
    showToast(saved ? 'Template imported from the community!' : 'Failed to import template.', saved ? 'success' : 'error');
  } catch (error) {
    console.error('Failed to import community template', error);
    showToast('Failed to import template.', 'error');
  } finally {
    if (button) {
      if ('disabled' in button) button.disabled = false;
      if (originalText) button.textContent = originalText;
    }
  }
}

if (listContainer) {
  listContainer.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action="import-community"]');
    if (!button) return;
    const templateId = button.dataset.templateId;
    if (!templateId) return;
    handleImport(templateId, button);
  });
}

refreshButton?.addEventListener('click', () => {
  loadTemplates();
});

if (supabaseConfigured) {
  loadTemplates();
}