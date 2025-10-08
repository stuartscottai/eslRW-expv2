import { fetchCommunityTemplates } from '/scripts/community-api.js';
import { saveTemplate, validateTemplate } from '/scripts/templates.js';
import { showToast } from '/scripts/ui.js';
import { isSupabaseConfigured, getSupabaseClient } from '/scripts/supabase-client.js';

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
    const sharedBy = entry.username || entry.display_name || '';

    card.innerHTML = `
      <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div class="space-y-2">
          <h3 class="text-lg font-semibold text-slate-800">${entry.name}</h3>
          <p class="text-sm text-slate-600">${entry.description || 'No description provided.'}</p>
          <div class="text-xs text-slate-500 flex flex-wrap gap-3">
            ${createdLabel ? `<span>Shared: ${createdLabel}</span>` : ''}
            ${entry.user_id ? `<span>Shared by: ${sharedBy || 'Anonymous'}</span>` : ''}
            ${template?.ratingFields ? `<span>Rating fields: ${template.ratingFields.length}</span>` : ''}
            ${template?.characterOptions ? `<span>Traits: ${template.characterOptions.length}</span>` : ''}
          </div>
        </div>
        <div class="flex flex-col gap-2 md:items-end">
          <button type="button" class="inline-flex items-center btn-primary btn-compact text-sm font-semibold" data-action="view-community" data-template-id="${entry.id}">
            View Template
          </button>
          <p class="text-[11px] text-slate-400 max-w-xs text-right">Opens the template in the editor. You can save or modify it there.</p>
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
    await enrichUsernames();
    initFilters();
    applyFiltersAndRender();
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

function openInBuilder(templateObj) {
  try {
    sessionStorage.setItem('communityTemplatePreview', JSON.stringify(templateObj));
    window.location.href = 'template-builder.html';
  } catch (e) {
    console.error('Failed to stage template for viewing', e);
    showToast('Could not open template.', 'error');
  }
}

async function handleView(templateId, trigger) {
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
      button.textContent = 'Opening...';
    }
  }

  try {
    const templateCopy = cloneTemplate(templateContent);
    if (!templateCopy) { showToast('Failed to prepare template.', 'error'); return; }
    templateCopy.id = `tmpl_${Date.now()}`;
    templateCopy.isDefault = false;
    templateCopy.isLocked = false;
    templateCopy.createdDate = Date.now();
    openInBuilder(templateCopy);
  } catch (error) {
    console.error('Failed to open community template', error);
    showToast('Failed to open template.', 'error');
  } finally {
    if (button) {
      if ('disabled' in button) button.disabled = false;
      if (originalText) button.textContent = originalText;
    }
  }
}

if (listContainer) {
  listContainer.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const tId = button.dataset.templateId;
    if (!tId) return;
    if (button.dataset.action === 'view-community') {
      handleView(tId, button);
    }
  });
}

refreshButton?.addEventListener('click', () => {
  loadTemplates();
});

if (supabaseConfigured) {
  loadTemplates();
}

// Username enrichment and filters
let usernameMap = {};
let filterState = { q: '', username: '', from: '', to: '', sort: 'recent' };

async function enrichUsernames() {
  const ids = Array.from(new Set((communityTemplates || []).map(t => t.user_id).filter(Boolean)));
  if (!ids.length) return;
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.from('profiles').select('id, username').in('id', ids);
    if (error) throw error;
    usernameMap = (data || []).reduce((acc, row) => { acc[row.id] = row.username || ''; return acc; }, {});
    communityTemplates.forEach(t => { t.username = usernameMap[t.user_id] || ''; });
  } catch (e) {
    console.warn('Could not load usernames', e);
  }
}

function initFilters() {
  const keyword = document.querySelector('[data-filter-keyword]');
  const usernameSel = document.querySelector('[data-filter-username]');
  const from = document.querySelector('[data-filter-from]');
  const to = document.querySelector('[data-filter-to]');
  const sort = document.querySelector('[data-filter-sort]');

  // Populate username dropdown
  if (usernameSel) {
    const names = Array.from(new Set((communityTemplates || []).map(t => t.username).filter(Boolean))).sort();
    names.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name; opt.textContent = name;
      usernameSel.appendChild(opt);
    });
  }

  const apply = () => applyFiltersAndRender();
  keyword?.addEventListener('input', () => { filterState.q = keyword.value.trim().toLowerCase(); apply(); });
  usernameSel?.addEventListener('change', () => { filterState.username = usernameSel.value; apply(); });
  from?.addEventListener('change', () => { filterState.from = from.value; apply(); });
  to?.addEventListener('change', () => { filterState.to = to.value; apply(); });
  sort?.addEventListener('change', () => { filterState.sort = sort.value; apply(); });
}

function applyFiltersAndRender() {
  let items = [...(communityTemplates || [])];
  // Keyword
  if (filterState.q) {
    items = items.filter(t => `${t.name} ${t.description}`.toLowerCase().includes(filterState.q));
  }
  // Username
  if (filterState.username) {
    items = items.filter(t => (t.username || '') === filterState.username);
  }
  // Date range
  const fromTs = filterState.from ? Date.parse(filterState.from) : null;
  const toTs = filterState.to ? Date.parse(filterState.to) + 24*60*60*1000 - 1 : null;
  if (fromTs || toTs) {
    items = items.filter(t => {
      const ts = t.created_at ? Date.parse(t.created_at) : null;
      if (!ts) return false;
      if (fromTs && ts < fromTs) return false;
      if (toTs && ts > toTs) return false;
      return true;
    });
  }
  // Sort
  switch (filterState.sort) {
    case 'oldest': items.sort((a,b)=> new Date(a.created_at) - new Date(b.created_at)); break;
    case 'az': items.sort((a,b)=> String(a.name).localeCompare(String(b.name))); break;
    case 'za': items.sort((a,b)=> String(b.name).localeCompare(String(a.name))); break;
    default: items.sort((a,b)=> new Date(b.created_at) - new Date(a.created_at)); break;
  }
  renderTemplates(items);
}
