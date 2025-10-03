// scripts/template-selector.js - Handles template selection UI

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

  // Add all templates as options
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

  console.log('✅ Template selector populated with', templates.length, 'templates');
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
  console.log('🔄 User selected template:', newTemplateId);

  // Confirm if user has filled out any form data
  const confirmSwitch = confirmTemplateSwitch();
  
  if (!confirmSwitch) {
    // User cancelled, revert selector to active template
    const activeTemplate = getActiveTemplate();
    event.target.value = activeTemplate.id;
    return;
  }

  // Set the new active template
  const success = setActiveTemplate(newTemplateId);
  
  if (success) {
    updateTemplateDescription();
    
    // Show toast notification
    const template = getAllTemplates().find(t => t.id === newTemplateId);
    if (typeof window.showToast === 'function') {
      window.showToast(`Switched to: ${template.name}`, 'success');
    }
  }
}

/**
 * Check if user has entered any data and confirm switch
 * @returns {boolean} True if should proceed with switch
 */
function confirmTemplateSwitch() {
  // Check if name field has content
  const nameField = document.getElementById('name');
  if (nameField && nameField.value.trim() !== '') {
    return confirm('Switching templates will clear the current form. Continue?');
  }

  // Check if any rating has been changed from default (0)
  const dynamicFields = document.getElementById('dynamic-form-fields');
  if (dynamicFields) {
    const selects = dynamicFields.querySelectorAll('select');
    for (const select of selects) {
      // Only warn if value is not "0" (default)
      if (select.value && select.value !== '0') {
        return confirm('Switching templates will clear the current form. Continue?');
      }
    }
  }

  // Check if any character checkboxes are checked
  const characterOptions = document.getElementById('characterOptions');
  if (characterOptions) {
    const characterChecked = characterOptions.querySelectorAll('input:checked');
    if (characterChecked.length > 0) {
      return confirm('Switching templates will clear the current form. Continue?');
    }
  }

  // Check if any areas checkboxes are checked
  const areasOptions = document.getElementById('areasOptions');
  if (areasOptions) {
    const areasChecked = areasOptions.querySelectorAll('input:checked');
    if (areasChecked.length > 0) {
      return confirm('Switching templates will clear the current form. Continue?');
    }
  }

  // Check if "Other Points" has content
  const otherPoints = document.getElementById('other-points');
  if (otherPoints && otherPoints.value.trim() !== '') {
    return confirm('Switching templates will clear the current form. Continue?');
  }

  // No data entered, safe to switch without warning
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

  // Listen for template updates (from other sources)
  window.addEventListener('templates-updated', () => {
    populateTemplateSelector();
  });

  // Listen for template changes (to update description)
  window.addEventListener('template-changed', () => {
    updateTemplateDescription();
  });

  console.log('✅ Template selector initialized');
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTemplateSelector);
} else {
  initializeTemplateSelector();
}
