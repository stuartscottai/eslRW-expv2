// scripts/template-selector.js - Handles template selection UI with action buttons

import { getAllTemplates, getActiveTemplate, setActiveTemplate } from '/scripts/templates.js';

/**
 * Populate the template selector dropdown
 */
export function populateTemplateSelector() {
  const selector = document.getElementById('template-selector');
  if (!selector) return;

  const templates = getAllTemplates();
  const activeTemplate = getActiveTemplate();

  // Clear existing options
  selector.innerHTML = '';

  // Add "Create New Template" option at the top
  const createOption = document.createElement('option');
  createOption.value = '__create_new__';
  createOption.textContent = 'Create New Template';
  selector.appendChild(createOption);

  // Add separator
  const separator = document.createElement('option');
  separator.disabled = true;
  separator.textContent = '─────────';
  selector.appendChild(separator);

  // Add all templates as options (clean text, no emojis)
  templates.forEach(template => {
    const option = document.createElement('option');
    option.value = template.id;
    option.textContent = template.name;
    
    // Mark active template as selected
    if (template.id === activeTemplate.id) {
      option.selected = true;
    }

    selector.appendChild(option);
  });

  // Update description
  updateTemplateDescription();
  
  // Add action buttons after selector
  renderTemplateActions();

  console.log('✅ Template selector populated with', templates.length, 'templates');
}

/**
 * Render action buttons below the dropdown
 */
function renderTemplateActions() {
  // Check if action buttons container exists
  let actionsContainer = document.getElementById('template-actions');
  
  if (!actionsContainer) {
    // Create it after the description
    const descEl = document.getElementById('template-description');
    if (!descEl) return;
    
    actionsContainer = document.createElement('div');
    actionsContainer.id = 'template-actions';
    actionsContainer.className = 'flex items-center gap-2 mt-3';
    descEl.parentElement.appendChild(actionsContainer);
  }
  
  const activeTemplate = getActiveTemplate();
  const canEdit = !activeTemplate.isLocked;
  
  actionsContainer.innerHTML = `
    <div class="flex items-center gap-2">
      ${canEdit ? `
        <button type="button" onclick="window.editActiveTemplate()" 
                title="Edit this template"
                class="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md border border-slate-300 transition">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
          Edit
        </button>
      ` : ''}
      
      <button type="button" onclick="window.duplicateActiveTemplate()" 
              title="Duplicate & edit this template"
              class="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md border border-slate-300 transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
        Duplicate
      </button>
    </div>
  `;
}

// Expose functions for button handlers
if (typeof window !== 'undefined') {
  window.editActiveTemplate = function() {
    const active = getActiveTemplate();
    window.location.href = `template-builder.html?edit=${active.id}`;
  };
  
  window.duplicateActiveTemplate = function() {
    const active = getActiveTemplate();
    // Import duplicateTemplate dynamically
    import('/scripts/templates.js').then(module => {
      const newTemplate = module.duplicateTemplate(active.id);
      if (newTemplate) {
        if (typeof window.showToast === 'function') {
          window.showToast('Template duplicated! Opening editor...', 'success');
        }
        setTimeout(() => {
          window.location.href = `template-builder.html?edit=${newTemplate.id}`;
        }, 1000);
      }
    });
  };
}

/**
 * Update the description text below the selector
 */
function updateTemplateDescription() {
  const descEl = document.getElementById('template-description');
  if (!descEl) return;

  const activeTemplate = getActiveTemplate();
  descEl.textContent = activeTemplate.description || '';
}

/**
 * Handle template selection change
 */
function handleTemplateChange(event) {
  const newTemplateId = event.target.value;
  
  // Check if user selected "Create New Template"
  if (newTemplateId === '__create_new__') {
    console.log('🆕 User wants to create new template');
    window.location.href = 'template-builder.html';
    return;
  }

  console.log('🔄 User selected template:', newTemplateId);

  // Confirm if user has filled out any form data
  const confirmSwitch = confirmTemplateSwitch();
  
  if (!confirmSwitch) {
    // User cancelled, revert selector to active template
    const activeTemplate = getActiveTemplate();
    event.target.value = activeTemplate.id;
    return;
  }

  // Clear the form before switching
  clearStudentForm();

  // Set the new active template
  const success = setActiveTemplate(newTemplateId);
  
  if (success) {
    updateTemplateDescription();
    renderTemplateActions();
    
    // Show toast notification
    const template = getAllTemplates().find(t => t.id === newTemplateId);
    if (typeof window.showToast === 'function') {
      window.showToast(`Switched to: ${template.name}`, 'success');
    }
  }
}

/**
 * Clear all student form data (Step 2)
 */
function clearStudentForm() {
  // Clear name field
  const nameField = document.getElementById('name');
  if (nameField) nameField.value = '';

  // Reset gender to default
  const genderField = document.getElementById('gender');
  if (genderField) genderField.selectedIndex = 0;

  // Clear all rating dropdowns
  const perfLeft = document.getElementById('perf-left');
  if (perfLeft) {
    const selects = perfLeft.querySelectorAll('select');
    selects.forEach(select => select.value = '0');
  }

  // Uncheck all character checkboxes
  const characterOptions = document.getElementById('characterOptions');
  if (characterOptions) {
    const checkboxes = characterOptions.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
  }

  // Uncheck all areas checkboxes
  const areasOptions = document.getElementById('areasOptions');
  if (areasOptions) {
    const checkboxes = areasOptions.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
  }

  // Clear other points
  const otherPoints = document.getElementById('other-points');
  if (otherPoints) otherPoints.value = '';

  // Update multiselect display text
  const characterSelected = document.getElementById('character-selected');
  if (characterSelected) {
    characterSelected.textContent = 'Select options';
    characterSelected.className = 'text-slate-500';
  }

  const areasSelected = document.getElementById('areas-selected');
  if (areasSelected) {
    areasSelected.textContent = 'Select options';
    areasSelected.className = 'text-slate-500';
  }

  console.log('✅ Form cleared');
}

/**
 * Check if user has entered any data and confirm switch
 * @returns {boolean} True if should proceed with switch
 */
function confirmTemplateSwitch() {
  let hasData = false;

  // Check name field
  const nameField = document.getElementById('name');
  if (nameField && nameField.value && nameField.value.trim() !== '') {
    hasData = true;
  }

  // Check rating dropdowns
  const perfLeft = document.getElementById('perf-left');
  if (perfLeft && !hasData) {
    const ratingSelects = perfLeft.querySelectorAll('select');
    for (const select of ratingSelects) {
      const value = select.value;
      if (value && value !== '0') {
        hasData = true;
        break;
      }
    }
  }

  // Check character checkboxes
  if (!hasData) {
    const characterOptions = document.getElementById('characterOptions');
    if (characterOptions) {
      const checked = characterOptions.querySelectorAll('input[type="checkbox"]:checked');
      if (checked.length > 0) {
        hasData = true;
      }
    }
  }

  // Check improvement areas checkboxes
  if (!hasData) {
    const areasOptions = document.getElementById('areasOptions');
    if (areasOptions) {
      const checked = areasOptions.querySelectorAll('input[type="checkbox"]:checked');
      if (checked.length > 0) {
        hasData = true;
      }
    }
  }

  // Check "Other Points" text field
  if (!hasData) {
    const otherPoints = document.getElementById('other-points');
    if (otherPoints && otherPoints.value && otherPoints.value.trim() !== '') {
      hasData = true;
    }
  }

  // If data was found, show confirmation
  if (hasData) {
    return confirm('Switching templates will clear the current form. Continue?');
  }

  return true;
}

/**
 * Initialize the template selector
 */
export function initializeTemplateSelector() {
  const selector = document.getElementById('template-selector');
  if (!selector) {
    console.warn('⚠️ Template selector not found on page');
    return;
  }

  // Populate dropdown
  populateTemplateSelector();

  // Add change event listener
  selector.addEventListener('change', handleTemplateChange);

  // Listen for template updates
  window.addEventListener('templates-updated', () => {
    populateTemplateSelector();
  });

  // Listen for template changes
  window.addEventListener('template-changed', () => {
    updateTemplateDescription();
    renderTemplateActions();
  });

  console.log('✅ Template selector initialized');
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTemplateSelector);
} else {
  initializeTemplateSelector();
}
