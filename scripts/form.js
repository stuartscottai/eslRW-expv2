// scripts/form.js - UPDATED to use template system

import { getActiveTemplate } from './templates.js';

// ------- Language list used by Step 1 dropdown -------
// This will now be loaded from the active template
export let LANGUAGES = [];

export function populateLanguageSelect() {
  const sel = document.getElementById('language');
  if (!sel) return;
  
  // Get languages from active template
  const template = getActiveTemplate();
  LANGUAGES = template.languages || ["English", "Spanish"]; // Fallback if missing
  
  sel.innerHTML = ""; // clear any placeholder options
  LANGUAGES.forEach((label, i) => {
    const opt = document.createElement('option');
    opt.value = label;
    opt.textContent = label;
    if (i === 0) opt.selected = true; // default to first
    sel.appendChild(opt);
  });
}

// ------- Template-based data (loaded dynamically) -------
export let characterOptionsData = [];
export let ratingFieldsData = [];
export let areasToImproveData = [];

// Function to load data from active template
function loadTemplateData() {
  const template = getActiveTemplate();
  
  characterOptionsData = template.characterOptions || [];
  ratingFieldsData = template.ratingFields || [];
  areasToImproveData = template.areasToImprove || [];
  
  console.log('✅ Loaded template data:', template.name);
}

// Load template data when module loads
loadTemplateData();

// Listen for template changes and reload data
window.addEventListener('template-changed', () => {
  console.log('🔄 Template changed, reloading form...');
  loadTemplateData();
  populateLanguageSelect();
  populateFormFields();
});

// Multiselect containers (live bindings exported for use in main.js)
export let characterMultiselect = null;
export let areasMultiselect = null;

export function populateMultiselect(container, optionsArray, updateDisplayFn) {
  container.innerHTML = "";
  optionsArray.forEach(optionValue => {
    const label = document.createElement("label");
    // Use slate hover (light mode) and rely on dark CSS override for dark mode
    label.className = "flex items-center space-x-2 p-2 hover:bg-slate-100 rounded-md cursor-pointer";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = optionValue;
    checkbox.className = "form-checkbox h-4 w-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500 cursor-pointer";
    checkbox.addEventListener("change", updateDisplayFn);

    const span = document.createElement("span");
    span.textContent = optionValue;
    span.className = "text-slate-700 text-sm";

    label.appendChild(checkbox);
    label.appendChild(span);
    container.appendChild(label);
  });
}

// Renders Step 2 fields with a fixed 2-column layout:
// LEFT  -> all rating selects (in ratingFieldsData order)
// RIGHT -> Character, Areas to Improve, Other Points, Salutation
export function populateFormFields() {
  const root = document.getElementById("dynamic-form-fields");
  if (!root) return;

  // Reload template data in case it changed
  loadTemplateData();

  // Two static columns so order is deterministic
  root.innerHTML = `
    <div id="perf-left"  class="space-y-6"></div>
    <div id="perf-right" class="space-y-6"></div>
  `;

  const left  = document.getElementById("perf-left");
  const right = document.getElementById("perf-right");

  // LEFT: all ratings (0–10) from template
  // Render sliders by default for consistency; only use selects if the
  // template explicitly sets inputType to 'select' or 'dropdown'.
  ratingFieldsData.forEach(field => {
    const id = (field.id || '').toLowerCase();
    const labelKey = (field.label || '').toLowerCase().replace(/\s+/g,'-');
    const typeHint = typeof field.inputType === 'string' ? field.inputType.toLowerCase() : '';
    const useSlider = !(typeHint === 'select' || typeHint === 'dropdown');
    if (useSlider) {
      left.insertAdjacentHTML("beforeend", `
        <div class="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          <label for="${field.id}" class="font-medium text-slate-700 md:text-right">${field.label}:</label>
          <div class="col-span-2 flex items-center gap-3">
            <input id="${field.id}" type="range" min="1" max="10" value="5"
                   class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none" />
            <span id="${field.id}-value" class="inline-block w-8 text-center text-slate-700 font-medium">5</span>
          </div>
        </div>
      `);
    } else {
      left.insertAdjacentHTML("beforeend", `
        <div class="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          <label for="${field.id}" class="font-medium text-slate-700 md:text-right">${field.label}:</label>
          <select id="${field.id}"
                  class="col-span-2 w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500">
            ${Array.from({ length: 11 }, (_, i) => `<option value="${i}">${i}</option>`).join("")}
          </select>
        </div>
      `);
    }
  });

  // RIGHT: Character (multiselect)
  right.insertAdjacentHTML("beforeend", `
    <div class="grid grid-cols-1 md:grid-cols-3 items-start gap-4">
      <label class="font-medium text-slate-700 md:text-right pt-3">Character:</label>
      <div class="multiselect col-span-2 relative w-full" id="character-multiselect">
        <div class="selectBox p-3 border border-slate-300 rounded-lg shadow-sm bg-white cursor-pointer flex justify-between items-center"
             onclick="window.__showCheckboxes && window.__showCheckboxes('character')">
          <span id="character-selected" class="text-slate-500">Select options</span>
          <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
        <div class="checkboxes hidden absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto p-3 space-y-2"
             id="characterOptions"></div>
      </div>
    </div>
  `);

  // RIGHT: Areas to Improve (multiselect)
  right.insertAdjacentHTML("beforeend", `
    <div class="grid grid-cols-1 md:grid-cols-3 items-start gap-4">
      <label class="font-medium text-slate-700 md:text-right pt-3">Areas to Improve:</label>
      <div class="multiselect col-span-2 relative w-full" id="areas-multiselect">
        <div class="selectBox p-3 border border-slate-300 rounded-lg shadow-sm bg-white cursor-pointer flex justify-between items-center"
             onclick="window.__showCheckboxes && window.__showCheckboxes('areas')">
          <span id="areas-selected" class="text-slate-500">Select options</span>
          <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
        <div class="checkboxes hidden absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-48 overflow-y-auto p-3 space-y-2"
             id="areasOptions"></div>
      </div>
    </div>
  `);

  // RIGHT: Other Points
  right.insertAdjacentHTML("beforeend", `
    <div class="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
      <label for="other-points" class="font-medium text-slate-700 md:text-right">Other Points:</label>
      <input type="text" id="other-points" placeholder="Additional notes (optional)"
             class="col-span-2 w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500">
    </div>
  `);

  // RIGHT: Salutation
  right.insertAdjacentHTML("beforeend", `
    <div class="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
      <label for="salutation" class="font-medium text-slate-700 md:text-right">Salutation:</label>
      <select id="salutation"
              class="col-span-2 w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500">
        <option value="None">None</option>
        <option value="Christmas">Christmas</option>
        <option value="Easter">Easter</option>
        <option value="Summer">Summer</option>
      </select>
    </div>
  `);

  // Wire up the two multiselects
  characterMultiselect = document.getElementById("character-multiselect");
  areasMultiselect     = document.getElementById("areas-multiselect");

  populateMultiselect(
    document.getElementById("characterOptions"),
    characterOptionsData,
    () => updateSelectedDisplay(document.getElementById("characterOptions"), document.getElementById("character-selected"))
  );

  populateMultiselect(
    document.getElementById("areasOptions"),
    areasToImproveData,
    () => updateSelectedDisplay(document.getElementById("areasOptions"), document.getElementById("areas-selected"))
  );

  // Wire slider displays for the chosen slider fields
  try {
    ratingFieldsData.forEach(field => {
      const input = document.getElementById(field.id);
      const val = document.getElementById(`${field.id}-value`);
      if (input && input.type === 'range' && val) {
        const sync = () => { val.textContent = input.value; };
        input.addEventListener('input', sync);
        sync();
      }
    });
  } catch (e) { /* no-op */ }
}

// Dropdown state
let expandedCheckboxes = { character: false, areas: false };

export function showCheckboxes(type) {
  const container = type === "character"
    ? document.getElementById("characterOptions")
    : document.getElementById("areasOptions");

  expandedCheckboxes[type] = !expandedCheckboxes[type];
  container.classList.toggle("hidden", !expandedCheckboxes[type]);
}

export function updateSelectedDisplay(checkboxContainer, selectedSpan) {
  if (!checkboxContainer || !selectedSpan) return;
  const values = Array.from(
    checkboxContainer.querySelectorAll('input:checked')
  ).map(cb => cb.value);
  const text = values.length ? values.join(", ") : "Select options";
  selectedSpan.textContent = text;
  selectedSpan.className = values.length ? "text-slate-800" : "text-slate-500";
}

// Expose dropdown handler to inline onclick in the rendered HTML
if (typeof window !== "undefined") {
  window.__showCheckboxes = showCheckboxes;
}
