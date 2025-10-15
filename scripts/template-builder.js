// scripts/template-builder.js - Template Builder Logic with Minimalist UI
import { showToast } from '/scripts/ui.js';

import { getTemplateById, saveTemplate, validateTemplate } from '/scripts/templates.js';

const AVAILABLE_LANGUAGES = [
  "English", "Spanish", "Catalan", "French", "German", "Italian",
  "Portuguese", "Dutch", "Polish", "Arabic", "Chinese (Simplified)",
  "Chinese (Traditional)", "Japanese", "Korean"
];

let editingTemplateId = null;
let ratingFields = [];
let improvementAreas = [];
let selectedLanguages = ["English", "Spanish"];
let characterBank = [
  "hard-working", "friendly", "attentive", "lively", "active", "quiet",
  "energetic", "studious", "sociable", "motivated", "respectful",
  "confident", "organised", "positive", "focused", "determined",
  "disinterested", "demotivated", "lazy", "shy"
];
let selectedTraits = [
  "hard-working", "friendly", "attentive", "lively", "active", "quiet",
  "energetic", "studious", "sociable"
];
let customInstruction = '';

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initializeBuilder();
  setupEventListeners();
  checkEditMode();
});

function initializeBuilder() {
  renderLanguageCheckboxes();
  updateLanguageCheckboxes();
  renderTraitCheckboxes();
  setupContainerDragArea();

  const customInput = document.getElementById('custom-instruction');
  if (customInput) {
    customInput.value = customInstruction;
  }
}

function checkEditMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  try {
    const staged = sessionStorage.getItem('communityTemplatePreview');
    if (staged) {
      const tpl = JSON.parse(staged);
      sessionStorage.removeItem('communityTemplatePreview');
      loadTemplateFromObject(tpl);
      document.getElementById('page-title').textContent = 'View Template';
      return;
    }
  } catch {}
  
  if (editId) {
    loadTemplateForEditing(editId);
  }
}

function loadTemplateFromObject(template) {
  if (!template) return;
  editingTemplateId = null; // treat as new unless saved
  document.getElementById('template-name').value = template.name || '';
  document.getElementById('template-description').value = template.description || '';
  ratingFields = Array.isArray(template.ratingFields)
    ? template.ratingFields.map(field => ({ ...field }))
    : [];
  improvementAreas = Array.isArray(template.areasToImprove) ? [...template.areasToImprove] : [];
  selectedLanguages = Array.isArray(template.languages) ? [...template.languages] : selectedLanguages;
  customInstruction = typeof template.customInstruction === 'string' ? template.customInstruction : '';
  if (Array.isArray(template.characterOptions)) {
    selectedTraits = [...template.characterOptions];
    characterBank = Array.from(new Set([...(characterBank||[]), ...selectedTraits]));
  }
  renderRatingFields();
  renderImprovementAreas();
  updateLanguageCheckboxes();
  renderTraitCheckboxes();
  const customInput = document.getElementById('custom-instruction');
  if (customInput) {
    customInput.value = customInstruction;
  }
}

function loadTemplateForEditing(templateId) {
  const template = getTemplateById(templateId);
  
  if (!template) {
    showToast('Template not found', 'error');
    return;
  }
  
  if (template.isLocked) {
    showToast('Cannot edit locked templates. Creating a copy instead...', 'success');
    // Load as new template (duplicate)
  } else {
    editingTemplateId = templateId;
    document.getElementById('page-title').textContent = 'Edit Template';
  }
  
  // Load template data
  document.getElementById('template-name').value = template.name;
  document.getElementById('template-description').value = template.description || '';
  
  ratingFields = Array.isArray(template.ratingFields)
    ? template.ratingFields.map(field => ({ ...field }))
    : [];
  improvementAreas = Array.isArray(template.areasToImprove) ? [...template.areasToImprove] : [];
  selectedLanguages = Array.isArray(template.languages) && template.languages.length > 0
    ? [...template.languages]
    : ["English", "Spanish"];
  customInstruction = typeof template.customInstruction === 'string' ? template.customInstruction : '';
  // Merge character traits from template into bank and selection
  if (Array.isArray(template.characterOptions)) {
    selectedTraits = [...template.characterOptions];
    characterBank = Array.from(new Set([...(characterBank||[]), ...selectedTraits]));
  }
  
  renderRatingFields();
  renderImprovementAreas();
  updateLanguageCheckboxes();
  renderTraitCheckboxes();
  const customInput = document.getElementById('custom-instruction');
  if (customInput) {
    customInput.value = customInstruction;
  }
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {
  // Add rating field
  document.getElementById('add-rating-field').addEventListener('click', addRatingField);
  document.getElementById('new-rating-field').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addRatingField();
    }
  });
  
  // Add improvement area
  document.getElementById('add-improvement-area').addEventListener('click', addImprovementArea);
  document.getElementById('new-improvement-area').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addImprovementArea();
    }
  });
  
  // Form submission
  document.getElementById('template-form').addEventListener('submit', handleSaveTemplate);

  // Traits add and select-all
  const addTraitBtn = document.getElementById('add-trait');
  const newTraitInput = document.getElementById('new-trait');
  const selectAll = document.getElementById('traits-select-all');
  if (addTraitBtn && newTraitInput) {
    addTraitBtn.addEventListener('click', () => addTrait(newTraitInput));
    newTraitInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addTrait(newTraitInput); }
    });
  }
  if (selectAll) {
    selectAll.addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedTraits = Array.from(new Set([...(characterBank||[])]));
      } else {
        selectedTraits = [];
      }
      updateTraitCheckboxes();
    });
  }

  // Languages select-all
  const langAll = document.getElementById('languages-select-all');
  if (langAll) {
    langAll.addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedLanguages = [...AVAILABLE_LANGUAGES];
      } else {
        selectedLanguages = [];
      }
      updateLanguageCheckboxes();
    });
  }
}

// ============================================================
// RATING FIELDS
// ============================================================

function addRatingField() {
  const input = document.getElementById('new-rating-field');
  const label = input.value.trim();
  
  if (!label) {
    showToast('Please enter a category name', 'error');
    return;
  }
  
  // Create ID from label
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  // Check for duplicates
  if (ratingFields.some(f => f.id === id)) {
    showToast('This category already exists', 'error');
    return;
  }
  
  ratingFields.push({ id, label, inputType: 'slider' });
  input.value = '';
  renderRatingFields();
}

function removeRatingField(index) {
  ratingFields.splice(index, 1);
  renderRatingFields();
}

function renderRatingFields() {
  const container = document.getElementById('rating-fields-list');
  
  if (ratingFields.length === 0) {
    container.innerHTML = '<p class="text-slate-500 text-sm italic">No rating categories yet. Add at least one above.</p>';
    return;
  }
  
  container.innerHTML = '';
  
  ratingFields.forEach((field, index) => {
    const div = document.createElement('div');
    div.className = 'flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg';
    div.draggable = true;
    div.dataset.index = index;
    
    div.innerHTML = `
      <span class="drag-handle text-slate-400 cursor-grab select-none" title="Drag to reorder" aria-hidden="true">
        <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <circle cx="6" cy="5" r="1.2"/><circle cx="10" cy="5" r="1.2"/>
          <circle cx="6" cy="10" r="1.2"/><circle cx="10" cy="10" r="1.2"/>
          <circle cx="6" cy="15" r="1.2"/><circle cx="10" cy="15" r="1.2"/>
        </svg>
      </span>
      <span class="flex-1 font-medium text-slate-700">${field.label}</span>
      <button type="button" onclick="window.removeRatingField(${index})"
              class="text-slate-400 hover:text-red-600 transition p-1 rounded hover:bg-red-50"
              title="Delete">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    `;
    
    // Drag and drop
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragover', handleDragOver);
    div.addEventListener('drop', (e) => handleDrop(e, 'rating'));
    div.addEventListener('dragend', handleDragEnd);
    
    container.appendChild(div);
  });
}

// ============================================================
// IMPROVEMENT AREAS
// ============================================================

function addImprovementArea() {
  const input = document.getElementById('new-improvement-area');
  const area = input.value.trim();
  
  if (!area) {
    showToast('Please enter an area name', 'error');
    return;
  }
  
  if (improvementAreas.includes(area)) {
    showToast('This area already exists', 'error');
    return;
  }
  
  improvementAreas.push(area);
  input.value = '';
  renderImprovementAreas();
}

function removeImprovementArea(index) {
  improvementAreas.splice(index, 1);
  renderImprovementAreas();
}

function renderImprovementAreas() {
  const container = document.getElementById('improvement-areas-list');
  
  if (improvementAreas.length === 0) {
    container.innerHTML = '<p class="text-slate-500 text-sm italic">No improvement areas yet. Add some above.</p>';
    return;
  }
  
  container.innerHTML = '';
  
  improvementAreas.forEach((area, index) => {
    const div = document.createElement('div');
    div.className = 'flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg';
    div.draggable = true;
    div.dataset.index = index;
    
    div.innerHTML = `
      <span class="drag-handle text-slate-400 cursor-grab select-none" title="Drag to reorder" aria-hidden="true">
        <svg class="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <circle cx="6" cy="5" r="1.2"/><circle cx="10" cy="5" r="1.2"/>
          <circle cx="6" cy="10" r="1.2"/><circle cx="10" cy="10" r="1.2"/>
          <circle cx="6" cy="15" r="1.2"/><circle cx="10" cy="15" r="1.2"/>
        </svg>
      </span>
      <span class="flex-1 font-medium text-slate-700">${area}</span>
      <button type="button" onclick="window.removeImprovementArea(${index})"
              class="text-slate-400 hover:text-red-600 transition p-1 rounded hover:bg-red-50"
              title="Delete">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    `;
    
    // Drag and drop
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragover', handleDragOver);
    div.addEventListener('drop', (e) => handleDrop(e, 'improvement'));
    div.addEventListener('dragend', handleDragEnd);
    
    container.appendChild(div);
  });
}

// ============================================================
// DRAG AND DROP
// ============================================================

let draggedElement = null;

function handleDragStart(e) {
  draggedElement = e.target;
  e.target.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDrop(e, type) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  if (draggedElement === e.currentTarget) {
    return false;
  }
  
  const fromIndex = parseInt(draggedElement.dataset.index);
  const toIndex = parseInt(e.currentTarget.dataset.index);
  
  if (type === 'rating') {
    // Reorder rating fields
    const [moved] = ratingFields.splice(fromIndex, 1);
    ratingFields.splice(toIndex, 0, moved);
    renderRatingFields();
  } else if (type === 'improvement') {
    // Reorder improvement areas
    const [moved] = improvementAreas.splice(fromIndex, 1);
    improvementAreas.splice(toIndex, 0, moved);
    renderImprovementAreas();
  }
  
  return false;
}

function handleDragEnd(e) {
  e.target.classList.remove('dragging');
  draggedElement = null;
}

// Ensure container accepts dragover to avoid 'not-allowed' cursor between items
function setupContainerDragArea() {
  ['rating-fields-list', 'improvement-areas-list'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    });
    el.addEventListener('dragenter', (e) => {
      e.preventDefault();
    });
  });
}

// ============================================================
// LANGUAGES
// ============================================================

function renderLanguageCheckboxes() {
  const container = document.getElementById('languages-checkboxes');
  if (!container) return;
  container.innerHTML = '';
  
  AVAILABLE_LANGUAGES.forEach(lang => {
    const id = `lang-${lang.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const wrap = document.createElement('label');
    wrap.className = 'custom-checkbox-container';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'custom-checkbox-input';
    input.id = id;
    input.value = lang;
    input.checked = selectedLanguages.includes(lang);
    input.addEventListener('change', (e) => {
      const v = e.target.value;
      if (e.target.checked) {
        if (!selectedLanguages.includes(v)) selectedLanguages.push(v);
      } else {
        selectedLanguages = selectedLanguages.filter(x => x !== v);
      }
      updateLanguageCheckboxes();
    });

    const label = document.createElement('span');
    label.className = 'custom-checkbox-label';
    label.setAttribute('for', id);

    const shine = document.createElement('span');
    shine.className = 'custom-checkbox-shine';

    const text = document.createElement('span');
    text.className = 'custom-checkbox-text';
    text.textContent = lang;

    label.appendChild(shine);
    label.appendChild(text);
    wrap.appendChild(input);
    wrap.appendChild(label);
    container.appendChild(wrap);
  });
}

function updateLanguageCheckboxes() {
  document.querySelectorAll('#languages-checkboxes .custom-checkbox-input')
    .forEach(cb => { cb.checked = selectedLanguages.includes(cb.value); });
  const langAll = document.getElementById('languages-select-all');
  if (langAll) {
    langAll.checked = AVAILABLE_LANGUAGES.every(l => selectedLanguages.includes(l));
  }
}

// ============================================================
// CHARACTER TRAITS
// ============================================================

function normaliseTrait(label) {
  return String(label || '').trim().replace(/\s+/g, ' ').replace(/^[-\s]+|[-\s]+$/g, '');
}

function addTrait(inputEl) {
  const raw = inputEl.value;
  const label = normaliseTrait(raw);
  if (!label) { showToast('Enter a trait to add', 'error'); return; }
  if (!characterBank.includes(label)) {
    characterBank.push(label);
  }
  if (!selectedTraits.includes(label)) {
    selectedTraits.push(label);
  }
  inputEl.value = '';
  renderTraitCheckboxes();
}

function renderTraitCheckboxes() {
  const container = document.getElementById('character-traits-checkboxes');
  const selectAll = document.getElementById('traits-select-all');
  if (!container) return;
  container.innerHTML = '';
  const sorted = [...characterBank].sort((a,b)=> a.localeCompare(b));
  sorted.forEach(trait => {
    const id = `trait-${trait.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const wrap = document.createElement('label');
    wrap.className = 'custom-checkbox-container';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'custom-checkbox-input';
    input.id = id;
    input.value = trait;
    input.checked = selectedTraits.includes(trait);
    input.addEventListener('change', (e) => {
      const t = e.target.value;
      if (e.target.checked) {
        if (!selectedTraits.includes(t)) selectedTraits.push(t);
      } else {
        selectedTraits = selectedTraits.filter(x => x !== t);
      }
      if (selectAll) {
        selectAll.checked = selectedTraits.length === characterBank.length && characterBank.length > 0;
      }
    });

    const label = document.createElement('span');
    label.className = 'custom-checkbox-label';
    label.setAttribute('for', id);

    const shine = document.createElement('span');
    shine.className = 'custom-checkbox-shine';

    const text = document.createElement('span');
    text.className = 'custom-checkbox-text';
    text.textContent = trait;

    label.appendChild(shine);
    label.appendChild(text);
    wrap.appendChild(input);
    wrap.appendChild(label);
    container.appendChild(wrap);
  });
  if (selectAll) {
    selectAll.checked = selectedTraits.length === characterBank.length && characterBank.length > 0;
  }
}

function updateTraitCheckboxes() {
  document.querySelectorAll('#character-traits-checkboxes .custom-checkbox-input').forEach(cb => {
    cb.checked = selectedTraits.includes(cb.value);
  });
  const selectAll = document.getElementById('traits-select-all');
  if (selectAll) {
    selectAll.checked = selectedTraits.length === characterBank.length && characterBank.length > 0;
  }
}


// ============================================================
// SAVE TEMPLATE
// ============================================================

function handleSaveTemplate(e) {
  e.preventDefault();
  
  const name = document.getElementById('template-name').value.trim();
  const description = document.getElementById('template-description').value.trim();
  const customInput = document.getElementById('custom-instruction');
  customInstruction = customInput ? customInput.value.trim() : '';
  
  // Validation
  if (!name) {
    showToast('Template name is required', 'error');
    return;
  }
  
  if (ratingFields.length === 0) {
    showToast('Please add at least one rating category', 'error');
    return;
  }
  
  if (selectedLanguages.length === 0) {
    showToast('Please select at least one language', 'error');
    return;
  }
  
  // Build template object
  const template = {
    id: editingTemplateId || `custom-${Date.now()}`,
    name,
    description,
    isDefault: false,
    isLocked: false,
    ratingFields: [...ratingFields],
    characterOptions: [...new Set(selectedTraits)],
    areasToImprove: [...improvementAreas],
    languages: [...selectedLanguages],
    customInstruction,
    createdDate: Date.now()
  };
  
  // Validate
  const validation = validateTemplate(template);
  if (!validation.valid) {
    showToast(`Validation errors: ${validation.errors.join(', ')}`, 'error');
    return;
  }
  
  // Save
  const success = saveTemplate(template);
  
  if (success) {
    showToast(editingTemplateId ? 'Template updated!' : 'Template created!', 'success');
    setTimeout(() => {
      window.location.href = 'template-manager.html';
    }, 1500);
  } else {
    showToast('Failed to save template', 'error');
  }
}

// ============================================================
// UTILITY
// ============================================================

// Expose functions to window for onclick handlers
window.removeRatingField = removeRatingField;
window.removeImprovementArea = removeImprovementArea;



