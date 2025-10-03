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

  // Clear the form before switching
  clearStudentForm();

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
 * Clear all student form data (Step 2)
 */
function clearStudentForm() {
  // Clear name field
  const nameField = document.getElementById('name');
  if (nameField) nameField.value = '';

  // Reset gender to default
  const genderField = document.getElementById('gender');
  if (genderField) genderField.selectedIndex = 0;

  // Clear all rating dropdowns (will be regenerated with new template)
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

  // 1. Check name field
  const nameField = document.getElementById('name');
  if (nameField && nameField.value && nameField.value.trim() !== '') {
    console.log('🔍 Data found: Name field has content');
    hasData = true;
  }

  // 2. Check rating dropdowns (0-10 scales only, not salutation)
  // We check the left column (perf-left) which contains only ratings
  const perfLeft = document.getElementById('perf-left');
  if (perfLeft && !hasData) {
    const ratingSelects = perfLeft.querySelectorAll('select');
    for (const select of ratingSelects) {
      const value = select.value;
      // Check if it's been changed from "0" (default for ratings)
      if (value && value !== '0') {
        console.log('🔍 Data found: Rating changed to', value, 'in', select.id);
        hasData = true;
        break;
      }
    }
  }

  // 3. Check character checkboxes
  if (!hasData) {
    const characterOptions = document.getElementById('characterOptions');
    if (characterOptions) {
      const checked = characterOptions.querySelectorAll('input[type="checkbox"]:checked');
      if (checked.length > 0) {
        console.log('🔍 Data found:', checked.length, 'character traits selected');
        hasData = true;
      }
    }
  }

  // 4. Check improvement areas checkboxes
  if (!hasData) {
    const areasOptions = document.getElementById('areasOptions');
    if (areasOptions) {
      const checked = areasOptions.querySelectorAll('input[type="checkbox"]:checked');
      if (checked.length > 0) {
        console.log('🔍 Data found:', checked.length, 'improvement areas selected');
        hasData = true;
      }
    }
  }

  // 5. Check "Other Points" text field
  if (!hasData) {
    const otherPoints = document.getElementById('other-points');
    if (otherPoints && otherPoints.value && otherPoints.value.trim() !== '') {
      console.log('🔍 Data found: Other points has content');
      hasData = true;
    }
  }

  // If data was found, show confirmation
  if (hasData) {
    return confirm('Switching templates will clear the current form. Continue?');
  }

  // No data found, safe to switch
  console.log('✅ No data found, switching templates without warning');
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
