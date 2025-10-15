// scripts/templates.js - Template Management System

// ============================================================
// TEMPLATE DATA STRUCTURE
// ============================================================
// Each template is an object with this structure:
// {
//   id: "unique-id",
//   name: "Template Name",
//   description: "What this template is for",
//   isDefault: true/false,
//   isLocked: true/false (can't be deleted/edited),
//   ratingFields: [{id, label}, ...],
//   characterOptions: ["trait1", "trait2", ...],
//   areasToImprove: ["area1", "area2", ...],
//   languages: ["English", "Spanish", ...],
//   customInstruction: "Optional extra context passed to the AI",
//   createdDate: timestamp
// }

const STORAGE_KEY = 'esl_report_templates';
const ACTIVE_TEMPLATE_KEY = 'esl_active_template';

// ============================================================
// PRE-MADE TEMPLATES
// ============================================================

const DEFAULT_ESL_TEMPLATE = {
  id: "default-esl",
  name: "ESL Teacher Report",
  description: "Standard ESL student assessment with progress, behaviour, and language skills",
  isDefault: true,
  isLocked: true,
  ratingFields: [
    { id: "progress", label: "Progress" },
    { id: "behaviour", label: "Behaviour" },
    { id: "participation", label: "Participation" },
    { id: "english-level", label: "English Level" },
    { id: "exam-performance", label: "Exam Performance" }
  ],
  characterOptions: [
    "hard-working", "friendly", "attentive", "lively", "active", "quiet", 
    "energetic", "studious", "sociable", "motivated", "respectful", 
    "confident", "organised", "positive", "focused", "determined", 
    "disinterested", "demotivated", "lazy", "shy"
  ],
  areasToImprove: [
    "grammar", "vocabulary", "Use of English", "Reading", "Listening", 
    "Writing", "Speaking fluency", "Pronunciation", "Spelling", 
    "Participation", "Paying attention", "Sitting still", 
    "Completing classwork", "Completing homework", "Speak less Spanish", 
    "Motivation", "Focus/Concentration"
  ],
  languages: [
    "English", "Spanish", "Catalan", "French", "German", "Italian", 
    "Portuguese", "Dutch", "Polish", "Arabic", "Chinese (Simplified)", 
    "Chinese (Traditional)", "Japanese", "Korean"
  ],
  customInstruction: '',
  createdDate: Date.now()
};

const GENERAL_ACADEMIC_TEMPLATE = {
  id: "general-academic",
  name: "General Academic Report",
  description: "Suitable for any subject teacher - focuses on academic performance and study skills",
  isDefault: false,
  isLocked: true,
  ratingFields: [
    { id: "academic-performance", label: "Academic Performance" },
    { id: "homework-quality", label: "Homework Quality" },
    { id: "class-participation", label: "Class Participation" },
    { id: "study-skills", label: "Study Skills" },
    { id: "time-management", label: "Time Management" }
  ],
  characterOptions: [
    "hard-working", "friendly", "attentive", "lively", "active", "quiet", 
    "energetic", "studious", "sociable", "motivated", "respectful", 
    "confident", "organised", "positive", "focused", "determined", 
    "disinterested", "demotivated", "lazy", "shy"
  ],
  areasToImprove: [
    "Understanding concepts", "Completing assignments", "Active participation",
    "Note-taking", "Test preparation", "Asking questions", "Time management",
    "Organization skills", "Following instructions", "Working independently",
    "Group work", "Meeting deadlines", "Attention to detail", "Critical thinking",
    "Self-assessment", "Seeking help when needed"
  ],
  languages: [
    "English", "Spanish", "Catalan", "French", "German", "Italian", 
    "Portuguese", "Dutch", "Polish", "Arabic", "Chinese (Simplified)", 
    "Chinese (Traditional)", "Japanese", "Korean"
  ],
  customInstruction: '',
  createdDate: Date.now()
};

const PRIMARY_SCHOOL_TEMPLATE = {
  id: "primary-school",
  name: "Primary School Report",
  description: "Designed for elementary/primary teachers - covers developmental areas and foundational skills",
  isDefault: false,
  isLocked: true,
  ratingFields: [
    { id: "reading-skills", label: "Reading Skills" },
    { id: "math-skills", label: "Math Skills" },
    { id: "social-skills", label: "Social Skills" },
    { id: "physical-development", label: "Physical Development" },
    { id: "creativity", label: "Creativity" }
  ],
  characterOptions: [
    "hard-working", "friendly", "attentive", "lively", "active", "quiet", 
    "energetic", "studious", "sociable", "motivated", "respectful", 
    "confident", "organised", "positive", "focused", "determined", 
    "disinterested", "demotivated", "lazy", "shy"
  ],
  areasToImprove: [
    "Reading comprehension", "Phonics", "Writing skills", "Number recognition",
    "Basic math operations", "Sharing with others", "Taking turns", "Listening skills",
    "Following directions", "Fine motor skills", "Gross motor skills", "Concentration",
    "Completing tasks", "Speaking clearly", "Expressing ideas", "Problem solving",
    "Independence", "Tidying up"
  ],
  languages: [
    "English", "Spanish", "Catalan", "French", "German", "Italian", 
    "Portuguese", "Dutch", "Polish", "Arabic", "Chinese (Simplified)", 
    "Chinese (Traditional)", "Japanese", "Korean"
  ],
  customInstruction: '',
  createdDate: Date.now()
};

const BEHAVIOUR_FOCUSED_TEMPLATE = {
  id: "behaviour-focused",
  name: "Behaviour-Focused Report",
  description: "For homeroom teachers and counselors - emphasizes social behavior and classroom conduct",
  isDefault: false,
  isLocked: true,
  ratingFields: [
    { id: "classroom-behavior", label: "Classroom Behavior" },
    { id: "respect-for-others", label: "Respect for Others" },
    { id: "following-rules", label: "Following Rules" },
    { id: "self-control", label: "Self-Control" },
    { id: "cooperation", label: "Cooperation" }
  ],
  characterOptions: [
    "hard-working", "friendly", "attentive", "lively", "active", "quiet", 
    "energetic", "studious", "sociable", "motivated", "respectful", 
    "confident", "organised", "positive", "focused", "determined", 
    "disinterested", "demotivated", "lazy", "shy"
  ],
  areasToImprove: [
    "Listening to others", "Raising hand before speaking", "Staying in seat",
    "Respecting personal space", "Using kind words", "Managing frustration",
    "Accepting consequences", "Being honest", "Helping classmates", "Sharing materials",
    "Waiting patiently", "Controlling impulses", "Resolving conflicts peacefully",
    "Following directions first time", "Respecting teacher authority", "Taking responsibility",
    "Accepting feedback", "Managing emotions"
  ],
  languages: [
    "English", "Spanish", "Catalan", "French", "German", "Italian", 
    "Portuguese", "Dutch", "Polish", "Arabic", "Chinese (Simplified)", 
    "Chinese (Traditional)", "Japanese", "Korean"
  ],
  customInstruction: '',
  createdDate: Date.now()
};

// ============================================================
// TEMPLATE STORAGE FUNCTIONS
// ============================================================

/**
 * Initialize template storage - run once on first load
 * Sets up default template if none exists
 */
export function initializeTemplates() {
  const existing = localStorage.getItem(STORAGE_KEY);
  
  if (!existing) {
    // First time - save all 4 templates
    const templates = [
      DEFAULT_ESL_TEMPLATE,
      GENERAL_ACADEMIC_TEMPLATE,
      PRIMARY_SCHOOL_TEMPLATE,
      BEHAVIOUR_FOCUSED_TEMPLATE
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    localStorage.setItem(ACTIVE_TEMPLATE_KEY, DEFAULT_ESL_TEMPLATE.id);
    console.log('Templates initialized with 4 pre-made templates');
  } else {
    // Check if all default templates exist, add any missing ones
    const templates = JSON.parse(existing);
    const templateIds = templates.map(t => t.id);
    
    const defaultTemplates = [
      DEFAULT_ESL_TEMPLATE,
      GENERAL_ACADEMIC_TEMPLATE,
      PRIMARY_SCHOOL_TEMPLATE,
      BEHAVIOUR_FOCUSED_TEMPLATE
    ];
    
    let added = false;
    defaultTemplates.forEach(defaultTemplate => {
      if (!templateIds.includes(defaultTemplate.id)) {
        templates.push(defaultTemplate);
        added = true;
        console.log('Added missing template:', defaultTemplate.name);
      }
    });
    
    if (added) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    }
  }
}
/**
 * Get all templates
 * @returns {Array} Array of template objects
 */
export function getAllTemplates() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    initializeTemplates();
    return [DEFAULT_ESL_TEMPLATE];
  }
  const parsed = JSON.parse(stored);
  return parsed.map(template => {
    const normalised = {
      ...template,
      customInstruction: typeof template.customInstruction === 'string' ? template.customInstruction : ''
    };
    normalised.ratingFields = Array.isArray(template.ratingFields)
      ? template.ratingFields.map(field => (field && typeof field === 'object' ? { ...field } : field))
      : [];
    return normalised;
  });
}

/**
 * Get a specific template by ID
 * @param {string} templateId 
 * @returns {Object|null} Template object or null if not found
 */
export function getTemplateById(templateId) {
  const templates = getAllTemplates();
  return templates.find(t => t.id === templateId) || null;
}

/**
 * Get the currently active template
 * @returns {Object} Active template object
 */
export function getActiveTemplate() {
  const activeId = localStorage.getItem(ACTIVE_TEMPLATE_KEY);
  
  if (!activeId) {
    // No active template set, use default
    setActiveTemplate(DEFAULT_ESL_TEMPLATE.id);
    return DEFAULT_ESL_TEMPLATE;
  }
  
  const template = getTemplateById(activeId);
  
  if (!template) {
    // Active template doesn't exist, fall back to default
    console.warn('Active template not found, reverting to default');
    setActiveTemplate(DEFAULT_ESL_TEMPLATE.id);
    return DEFAULT_ESL_TEMPLATE;
  }
  
  return template;
}

/**
 * Set which template is currently active
 * @param {string} templateId 
 * @returns {boolean} Success
 */
export function setActiveTemplate(templateId) {
  const template = getTemplateById(templateId);
  
  if (!template) {
    console.error('Template not found:', templateId);
    return false;
  }
  
  localStorage.setItem(ACTIVE_TEMPLATE_KEY, templateId);
  console.log('Active template set to:', template.name);
  
  // Dispatch event so other parts of the app know template changed
  window.dispatchEvent(new CustomEvent('template-changed', { 
    detail: { template } 
  }));
  
  return true;
}

/**
 * Save a new template or update existing one
 * @param {Object} template - Template object
 * @returns {boolean} Success
 */
export function saveTemplate(template) {
  // Validate template has required fields
  if (!template.id || !template.name || !template.ratingFields) {
    console.error('Invalid template - missing required fields');
    return false;
  }
  
  const templates = getAllTemplates();
  const existingIndex = templates.findIndex(t => t.id === template.id);
  
  if (existingIndex >= 0) {
    // Update existing template
    // Don't allow editing locked templates
    if (templates[existingIndex].isLocked) {
      console.error('Cannot edit locked template');
      return false;
    }
    templates[existingIndex] = template;
    console.log('Template updated:', template.name);
  } else {
    // Add new template
    templates.push(template);
    console.log('New template saved:', template.name);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  
  // Dispatch event
  window.dispatchEvent(new CustomEvent('templates-updated'));
  
  return true;
}

/**
 * Delete a template
 * @param {string} templateId 
 * @returns {boolean} Success
 */
export function deleteTemplate(templateId) {
  const templates = getAllTemplates();
  const template = templates.find(t => t.id === templateId);
  
  if (!template) {
    console.error('Template not found');
    return false;
  }
  
  if (template.isLocked) {
    console.error('Cannot delete locked template');
    return false;
  }
  
  // If deleting active template, switch to default
  const activeId = localStorage.getItem(ACTIVE_TEMPLATE_KEY);
  if (activeId === templateId) {
    setActiveTemplate(DEFAULT_ESL_TEMPLATE.id);
  }
  
  const filtered = templates.filter(t => t.id !== templateId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  console.log('Template deleted:', template.name);
  
  // Dispatch event
  window.dispatchEvent(new CustomEvent('templates-updated'));
  
  return true;
}

/**
 * Duplicate a template (useful for creating variations)
 * @param {string} templateId 
 * @returns {Object|null} New template or null if failed
 */
export function duplicateTemplate(templateId) {
  const original = getTemplateById(templateId);
  
  if (!original) {
    console.error('Template not found');
    return null;
  }
  
  // Create copy with new ID
  const copy = {
    ...original,
    id: `template-${Date.now()}`,
    name: `${original.name} (Copy)`,
    isDefault: false,
    isLocked: false,
    createdDate: Date.now()
  };
  
  if (saveTemplate(copy)) {
    console.log('Template duplicated:', copy.name);
    return copy;
  }
  
  return null;
}

/**
 * Export template as JSON file (for sharing)
 * @param {string} templateId 
 */
export function exportTemplate(templateId) {
  const template = getTemplateById(templateId);
  
  if (!template) {
    console.error('Template not found');
    return false;
  }

  if (template.isLocked) {
    console.warn('Export blocked for locked template:', template.name);
    return false;
  }
  
  const dataStr = JSON.stringify(template, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${template.id}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
  console.log('Template exported:', template.name);
  return true;
}

/**
 * Import template from JSON file
 * @param {File} file 
 * @returns {Promise<boolean>} Success
 */
export async function importTemplate(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const template = JSON.parse(e.target.result);
        
        // Validate it's a proper template
        if (!template.id || !template.name || !template.ratingFields) {
          console.error('Invalid template file');
          resolve(false);
          return;
        }
        
        // Generate new ID to avoid conflicts
        template.id = `imported-${Date.now()}`;
        template.isDefault = false;
        template.isLocked = false;
        template.createdDate = Date.now();
        
        if (saveTemplate(template)) {
          console.log('Template imported:', template.name);
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (error) {
        console.error('Failed to parse template file:', error);
        resolve(false);
      }
    };
    
    reader.onerror = () => {
      console.error('Failed to read file');
      resolve(false);
    };
    
    reader.readAsText(file);
  });
}

/**
 * Reset to default templates only (useful for troubleshooting)
 */
export function resetToDefaults() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([DEFAULT_ESL_TEMPLATE]));
  localStorage.setItem(ACTIVE_TEMPLATE_KEY, DEFAULT_ESL_TEMPLATE.id);
  console.log('Templates reset to defaults');
  window.dispatchEvent(new CustomEvent('templates-updated'));
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Validate template structure
 * @param {Object} template 
 * @returns {Object} { valid: boolean, errors: [] }
 */
export function validateTemplate(template) {
  const errors = [];
  
  if (!template.id) errors.push('Missing template ID');
  if (!template.name || template.name.trim() === '') errors.push('Template name is required');
  if (!template.ratingFields || template.ratingFields.length === 0) {
    errors.push('At least one rating field is required');
  }
  
  // Check rating fields are valid
  if (template.ratingFields) {
    template.ratingFields.forEach((field, index) => {
      if (!field.id) errors.push(`Rating field ${index + 1} missing ID`);
      if (!field.label) errors.push(`Rating field ${index + 1} missing label`);
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get template statistics
 * @returns {Object} Stats about templates
 */
export function getTemplateStats() {
  const templates = getAllTemplates();
  const active = getActiveTemplate();
  
  return {
    totalTemplates: templates.length,
    customTemplates: templates.filter(t => !t.isDefault).length,
    lockedTemplates: templates.filter(t => t.isLocked).length,
    activeTemplate: active.name
  };
}

// Initialize templates on module load
initializeTemplates();
