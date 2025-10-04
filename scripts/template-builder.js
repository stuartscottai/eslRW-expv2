// scripts/template-builder.js - Template Builder Logic

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
}

function checkEditMode() {
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  
  if (editId) {
    loadTemplateForEditing(editId);
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
  
  ratingFields = [...template.ratingFields];
  improvementAreas = [...template.areasToImprove];
  selectedLanguages = [...template.languages];
  
  renderRatingFields();
  renderImprovementAreas();
  updateLanguageCheckboxes();
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
  
  ratingFields.push({ id, label });
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
      <span class="drag-handle text-slate-400 cursor-grab">☰</span>
      <span class="flex-1 font-medium text-slate-700">${field.label}</span>
      <button type="button" onclick="window.removeRatingField(${index})"
              class="text-red-600 hover:text-red-800 font-medium text-sm">
        Delete
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
      <span class="drag-handle text-slate-400 cursor-grab">☰</span>
      <span class="flex-1 font-medium text-slate-700">${area}</span>
      <button type="button" onclick="window.removeImprovementArea(${index})"
              class="text-red-600 hover:text-red-800 font-medium text-sm">
        Delete
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
  e.dataTransfer.dropEffect = 'move';
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

// ============================================================
// LANGUAGES
// ============================================================

function renderLanguageCheckboxes() {
  const container = document.getElementById('languages-checkboxes');
  
  AVAILABLE_LANGUAGES.forEach(lang => {
    const label = document.createElement('label');
    label.className = 'flex items-center gap-2 cursor-pointer';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = lang;
    checkbox.checked = selectedLanguages.includes(lang);
    checkbox.className = 'form-checkbox h-4 w-4 text-orange-600';
    checkbox.addEventListener('change', handleLanguageChange);
    
    const span = document.createElement('span');
    span.textContent = lang;
    span.className = 'text-sm text-slate-700';
    
    label.appendChild(checkbox);
    label.appendChild(span);
    container.appendChild(label);
  });
}

function updateLanguageCheckboxes() {
  const checkboxes = document.querySelectorAll('#languages-checkboxes input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.checked = selectedLanguages.includes(cb.value);
  });
}

function handleLanguageChange(e) {
  const lang = e.target.value;
  
  if (e.target.checked) {
    if (!selectedLanguages.includes(lang)) {
      selectedLanguages.push(lang);
    }
  } else {
    selectedLanguages = selectedLanguages.filter(l => l !== lang);
  }
}

// ============================================================
// SAVE TEMPLATE
// ============================================================

function handleSaveTemplate(e) {
  e.preventDefault();
  
  const name = document.getElementById('template-name').value.trim();
  const description = document.getElementById('template-description').value.trim();
  
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
    characterOptions: [
      "hard-working", "friendly", "attentive", "lively", "active", "quiet",
      "energetic", "studious", "sociable", "motivated", "respectful",
      "confident", "organised", "positive", "focused", "determined",
      "disinterested", "demotivated", "lazy", "shy"
    ],
    areasToImprove: [...improvementAreas],
    languages: [...selecte
