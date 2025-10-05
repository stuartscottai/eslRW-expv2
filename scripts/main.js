import {
  SYSTEM_PROMPT_FOR_MAIN_REPORT,
  SYSTEM_PROMPT_FOR_STRATEGIES,
  SYSTEM_PROMPT_FOR_EDITING_CHAT,
  callGeminiAPI,
  callChatAPI,
  renderUsage
} from '/scripts/api.js';

import {
  populateFormFields,
  updateSelectedDisplay,
  characterMultiselect,
  areasMultiselect,
  populateLanguageSelect 
} from '/scripts/form.js';

// NEW: Import template system
import { getActiveTemplate } from '/scripts/templates.js';

// NEW: Import template selector
import { initializeTemplateSelector } from '/scripts/template-selector.js';

import {
  showToast,
  setGenButtonState,
  autoResizeTextarea,
  fallbackCopyToClipboard
} from '/scripts/ui.js';

// Expose showToast globally for template-selector
if (typeof window !== 'undefined') {
  window.showToast = showToast;
}

function stripMarkdown(s = "") {
  return s
    .replace(/```[\s\S]*?```/g, m => m.replace(/```/g, ""))
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*[*+-]\s+/gm, "- ")
    .replace(/^\s*(\d+)\.\s+/gm, (_, num) => `${num}. `)
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

// --- DOM Elements ---
let dynamicFormFields, generateReportButton, getStrategiesButton, clearFormButton;
let reportSection, reportOutput, copyReportButton, undoReportButton, redoReportButton;
let strategiesSection, strategiesOutput, copyStrategiesButton, undoStrategiesButton, redoStrategiesButton;
let currentYearSpan, chatSection, chatMessages, chatInput, sendChatButton;
let step3Actions, getStrategiesButtonStep3, clearFormButtonStep3;
let chatTargetToggle, chatTargetReportBtn, chatTargetStrategiesBtn;

let activeChatTextarea = null;

// --- Undo/Redo stacks ---
const undoStacks = { report: [], strategies: [] };
const redoStacks = { report: [], strategies: [] };

function updateUndoRedoButtons() {
  const setDisabled = (el, isDisabled) => {
    if (!el) return;
    el.disabled = isDisabled;
    if (isDisabled) el.setAttribute('disabled', '');
    else el.removeAttribute('disabled');
  };

  setDisabled(undoReportButton, undoStacks.report.length === 0);
  setDisabled(redoReportButton, redoStacks.report.length === 0);
  setDisabled(undoStrategiesButton, undoStacks.strategies.length === 0);
  setDisabled(redoStrategiesButton, redoStacks.strategies.length === 0);
}

function resetHistory(kind) {
  undoStacks[kind] = [];
  redoStacks[kind] = [];
  updateUndoRedoButtons();
}

function updateChatTargetToggle() {
  if (!chatTargetToggle) return;

  const reportVisible = reportSection && !reportSection.classList.contains('hidden');
  const strategiesVisible = strategiesSection && !strategiesSection.classList.contains('hidden');

  if (reportVisible && strategiesVisible) {
    chatTargetToggle.classList.remove('hidden');

    if (activeChatTextarea !== reportOutput && activeChatTextarea !== strategiesOutput) {
      activeChatTextarea = reportOutput;
    }

    const isReport = activeChatTextarea === reportOutput;

    chatTargetReportBtn?.classList.toggle('bg-slate-100', isReport);
    chatTargetReportBtn?.classList.toggle('text-slate-900', isReport);
    chatTargetStrategiesBtn?.classList.toggle('bg-slate-100', !isReport);
    chatTargetStrategiesBtn?.classList.toggle('text-slate-900', !isReport);
  } else {
    chatTargetToggle.classList.add('hidden');
    if (reportVisible) activeChatTextarea = reportOutput;
    else if (strategiesVisible) activeChatTextarea = strategiesOutput;
  }
}

// --- ACTION HANDLERS ---
async function handleGenerateReport() {
  if (!document.getElementById('name').value.trim()) {
    showToast("Student's name is required.", "error");
    return;
  }
  setGenButtonState(generateReportButton, document.getElementById('loading-spinner-report'), true);
  reportSection.classList.remove('hidden');
  chatSection.classList.add('hidden');
  reportOutput.value = "Generating AI report, please wait...";

  const studentData = getStudentDataSummary();

  const lang = document.getElementById('language').value;
  const register = document.getElementById('report-register').value;
  const tone = document.getElementById('report-tone').value;
  const outLen = document.getElementById('output-length').value;

  const languageInstruction = `Write the entire output in ${lang}. Use natural, idiomatic ${lang}, including headings and labels.`;
  const styleInstruction = `Use a ${register.toLowerCase()} register with a ${tone.replaceAll(/([A-Z])/g, ' $1').trim().toLowerCase()} tone.`;
  const lengthInstruction = `Aim for a ${outLen.toLowerCase()} length.`;

  const preamble = [languageInstruction, styleInstruction, lengthInstruction].join('\n');
  const finalInput = `${preamble}\n\n${studentData}`;

  try {
    const success = await callGeminiAPI(SYSTEM_PROMPT_FOR_MAIN_REPORT, finalInput, reportOutput);
    showToast(success ? "Report generated!" : "Error generating report.", success ? 'success' : 'error');
    copyReportButton.disabled = !success;
    if (success) {
       reportOutput.value = stripMarkdown(reportOutput.value);
       autoResizeTextarea(reportOutput);
    }

    if (success) {
      activeChatTextarea = reportOutput;
      startChat();
    }
  } catch (e) {
    reportOutput.value = `Error: ${e.message}\nSee console.`;
    autoResizeTextarea(reportOutput);
    showToast("Error generating report.", "error");
  } finally {
    setGenButtonState(generateReportButton, document.getElementById('loading-spinner-report'), false);
    clearFormButton.disabled = false;
    resetHistory('report');
    updateStep3Actions();
    updateChatTargetToggle();
  }
}

async function handleGetStrategies() {
  if (!document.getElementById('name').value.trim()) {
    showToast("Student's name is required.", "error");
    return;
  }
  setGenButtonState(getStrategiesButton, document.getElementById('loading-spinner-strategies'), true);
  strategiesSection.classList.remove('hidden');
  chatSection.classList.add('hidden');
  strategiesOutput.value = "Generating strategies, please wait...";

  const studentData = getStudentDataSummary();

  const lang = document.getElementById('language').value;
  const register = document.getElementById('report-register').value;
  const tone = document.getElementById('report-tone').value;
  const outLen = document.getElementById('output-length').value;

  const languageInstruction = `Write the entire output in ${lang}. Use natural, idiomatic ${lang}, including headings and labels.`;
  const styleInstruction = `Use a ${register.toLowerCase()} register with a ${tone.replaceAll(/([A-Z])/g, ' $1').trim().toLowerCase()} tone.`;
  const lengthInstruction = `Aim for a ${outLen.toLowerCase()} length.`;

  const preamble = [languageInstruction, styleInstruction, lengthInstruction].join('\n');
  const finalInput = `${preamble}\n\n${studentData}`;

  try {
    const success = await callGeminiAPI(SYSTEM_PROMPT_FOR_STRATEGIES, finalInput, strategiesOutput);
    showToast(success ? "Strategies generated!" : "Error generating strategies.", success ? 'success' : 'error');
    copyStrategiesButton.disabled = !success;
    if (success) {
      strategiesOutput.value = stripMarkdown(strategiesOutput.value);
      autoResizeTextarea(strategiesOutput);
    }

    if (success) {
      activeChatTextarea = strategiesOutput;
      startChat();
    }
  } catch (e) {
    strategiesOutput.value = `Error: ${e.message}\nSee console.`;
    autoResizeTextarea(strategiesOutput);
    showToast("Error generating strategies.", "error");
  } finally {
    setGenButtonState(getStrategiesButton, document.getElementById('loading-spinner-strategies'), false);
    clearFormButton.disabled = false;
    resetHistory('strategies');
    updateStep3Actions();
    updateChatTargetToggle();
  }
}

function startChat() {
  chatSection.classList.remove('hidden');
  chatMessages.innerHTML = '';
  displayChatMessage('AI', 'How can I help you edit this text? For example, tell me to "make it more encouraging" or "add a sentence about their progress in grammar."');
  chatInput.focus();
}

function displayChatMessage(sender, message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `p-3 rounded-lg max-w-[85%] ${sender === 'user' ? 'bg-sky-100 self-end' : 'bg-gray-200 self-start'}`;
  messageDiv.textContent = message;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function handleSendMessage() {
  const userMessage = chatInput.value.trim();
  if (!userMessage || !activeChatTextarea) return;

  chatInput.value = '';
  autoResizeTextarea(chatInput);
  displayChatMessage('user', userMessage);
  
  sendChatButton.disabled = true;
  chatInput.disabled = true;

  const currentText = activeChatTextarea.value;
  const fullPrompt = `ORIGINAL TEXT:\n${currentText}\n\nEDIT INSTRUCTION:\n${userMessage}`;

  if (activeChatTextarea === reportOutput) {
    undoStacks.report.push(currentText);
    redoStacks.report = [];
  } else if (activeChatTextarea === strategiesOutput) {
    undoStacks.strategies.push(currentText);
    redoStacks.strategies = [];
  }
  updateUndoRedoButtons();
  
  try {
    const newText = await callChatAPI(
      SYSTEM_PROMPT_FOR_EDITING_CHAT,
      [{ role: 'user', parts: [{ text: fullPrompt }] }],
      activeChatTextarea
    );
    activeChatTextarea.value = stripMarkdown(activeChatTextarea.value);
    autoResizeTextarea(activeChatTextarea);
    displayChatMessage('AI', 'Okay, the text has been edited.');
  } catch (e) {
    console.error("Chat API error:", e);
    displayChatMessage('AI', `I'm sorry, an error occurred: ${e.message}`);
    showToast("Chat error occurred.", "error");
  } finally {
    sendChatButton.disabled = false;
    chatInput.disabled = false;
    chatInput.focus();
  }
}

// UPDATED: Now dynamically collects data based on active template
function getStudentDataSummary() {
  // Get active template to know what fields exist
  const template = getActiveTemplate();
  
  // Step 1 (pre-form) constants
  const lang = document.getElementById('language').value;
  const register = document.getElementById('report-register').value;
  const tone = document.getElementById('report-tone').value;
  const perspective = document.getElementById('report-perspective').value;
  const outputLen = document.getElementById('output-length').value;
  const trimester = document.getElementById('trimester').value;

  // Step 2 variables
  const name = document.getElementById('name').value;
  const gender = document.getElementById('gender').value;

  const chars = Array.from(
    document.getElementById('characterOptions').querySelectorAll('input:checked')
  ).map(cb => cb.value).join(', ');

  const areas = Array.from(
    document.getElementById('areasOptions').querySelectorAll('input:checked')
  ).map(cb => cb.value).join(', ');

  const notes = document.getElementById('other-points')?.value || '';
  const salutation = document.getElementById('salutation')?.value || '';

  // UPDATED: Dynamically collect ratings from template fields
  let ratings = "";
  template.ratingFields.forEach(field => {
    const el = document.getElementById(field.id);
    if (el) {
      const val = el.value;
      ratings += `${field.label} Rating (0-10): ${val}\n`;
    }
  });

  return (
`Language: ${lang}
Register: ${register}
Tone: ${tone}
Perspective: ${perspective}
Output Length: ${outputLen}
Trimester: ${trimester}
Student Name: ${name}
Gender: ${gender}
${ratings}Character Attributes: ${chars || 'N/A'}
Areas to Improve: ${areas || 'N/A'}
Other Notes: ${notes || 'N/A'}
Holiday Salutation Theme: ${salutation}`
  );
}

function clearForm() {
  document.getElementById('student-form')?.reset();

  document.querySelectorAll('#characterOptions input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('#areasOptions input[type="checkbox"]').forEach(cb => cb.checked = false);

  document.querySelectorAll('#step2 select').forEach(sel => { sel.selectedIndex = 0; });

  document.querySelectorAll('#step2 select[multiple]').forEach(sel => {
    Array.from(sel.options).forEach(o => (o.selected = false));
  });

  const otherPoints = document.getElementById('other-points');
  if (otherPoints) otherPoints.value = '';

  updateSelectedDisplay(document.getElementById('characterOptions'), document.getElementById('character-selected'));
  updateSelectedDisplay(document.getElementById('areasOptions'), document.getElementById('areas-selected'));

  reportSection.classList.add('hidden');
  strategiesSection.classList.add('hidden');
  chatSection.classList.add('hidden');

  reportOutput.value = "";
  strategiesOutput.value = "";
  autoResizeTextarea(reportOutput);
  autoResizeTextarea(strategiesOutput);

  activeChatTextarea = null;
  chatInput.value = "";
  chatMessages.innerHTML = "";

  const inStepMode = (typeof window.isStepMode === 'function')
    ? window.isStepMode()
    : !document.getElementById('stepper-controls')?.classList.contains('hidden');

  if (inStepMode) {
    if (typeof window.goToStep === 'function') {
      window.goToStep(1);
    } else {
      document.getElementById('step1')?.classList.add('hidden');
      document.getElementById('step2')?.classList.remove('hidden');
      document.getElementById('step3')?.classList.add('hidden');
      const indicator = document.getElementById('step-indicator');
      if (indicator) indicator.textContent = 'Step 2 of 3';
    }
  }

  resetHistory('report');
  resetHistory('strategies');

  updateStep3Actions();
  updateChatTargetToggle();
  showToast("Form cleared. Pre-report criteria kept. Ready for the next student!", 'success');
}

function updateStep3Actions() {
  if (!step3Actions) return;

  const stepperVisible = !document.getElementById('stepper-controls')?.classList.contains('hidden');
  const reportVisible = !reportSection.classList.contains('hidden');
  const hasStrategies = (strategiesOutput?.value || '').trim().length > 0;

  if (stepperVisible && reportVisible) step3Actions.classList.remove('hidden');
  else step3Actions.classList.add('hidden');

  if (getStrategiesButtonStep3) {
    getStrategiesButtonStep3.classList.toggle('hidden', hasStrategies);
  }
}

function assignElements() {
  dynamicFormFields = document.getElementById('dynamic-form-fields');
  generateReportButton = document.getElementById('generate-report-button');
  getStrategiesButton = document.getElementById('get-strategies-button');
  clearFormButton = document.getElementById('clear-form-button');
  reportSection = document.getElementById('report-section');
  reportOutput = document.getElementById('report-output');
  copyReportButton = document.getElementById('copy-report-button');
  strategiesSection = document.getElementById('strategies-section');
  strategiesOutput = document.getElementById('strategies-output');
  copyStrategiesButton = document.getElementById('copy-strategies-button');
  currentYearSpan = document.getElementById('currentYear');
  chatSection = document.getElementById('chat-section');
  chatMessages = document.getElementById('chat-messages');
  chatInput = document.getElementById('chat-input');
  sendChatButton = document.getElementById('send-chat-button');
  step3Actions = document.getElementById('step3-actions');
  getStrategiesButtonStep3 = document.getElementById('get-strategies-button-step3');
  clearFormButtonStep3 = document.getElementById('clear-form-button-step3');
  undoReportButton = document.getElementById('undo-report-button');
  redoReportButton = document.getElementById('redo-report-button');
  undoStrategiesButton = document.getElementById('undo-strategies-button');
  redoStrategiesButton = document.getElementById('redo-strategies-button');
  chatTargetToggle = document.getElementById('chat-target-toggle');
  chatTargetReportBtn = document.getElementById('chat-target-report');
  chatTargetStrategiesBtn = document.getElementById('chat-target-strategies');
}

// --- BOOT ---
document.addEventListener('DOMContentLoaded', () => {
  populateLanguageSelect();
  assignElements();
  if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
  populateFormFields();

  window.dispatchEvent(new Event('esl:form-populated'));

  copyReportButton.disabled = true;
  copyStrategiesButton.disabled = true;

  document.addEventListener('click', (event) => {
    if (characterMultiselect && !characterMultiselect.contains(event.target)) {
      const box = document.getElementById('characterOptions');
      if (box && !box.classList.contains('hidden')) box.classList.add('hidden');
    }
    if (areasMultiselect && !areasMultiselect.contains(event.target)) {
      const box = document.getElementById('areasOptions');
      if (box && !box.classList.contains('hidden')) box.classList.add('hidden');
    }
  });
  
  reportOutput.addEventListener('input', () => autoResizeTextarea(reportOutput));
  strategiesOutput.addEventListener('input', () => autoResizeTextarea(strategiesOutput));

  generateReportButton.addEventListener('click', handleGenerateReport);
  getStrategiesButton.addEventListener('click', handleGetStrategies);
  clearFormButton.addEventListener('click', clearForm);
  copyReportButton.addEventListener('click', () => fallbackCopyToClipboard(reportOutput.value, "Report copied!"));
  copyStrategiesButton.addEventListener('click', () => fallbackCopyToClipboard(strategiesOutput.value, "Strategies copied!"));

  getStrategiesButtonStep3?.addEventListener('click', () => {
    getStrategiesButton?.click();
  });
  clearFormButtonStep3?.addEventListener('click', clearForm);

  undoReportButton?.addEventListener('click', () => {
    const current = reportOutput.value;
    const prev = undoStacks.report.pop();
    if (prev != null) {
      redoStacks.report.push(current);
      reportOutput.value = prev;
      autoResizeTextarea(reportOutput);
      updateUndoRedoButtons();
    }
  });
  undoStrategiesButton?.addEventListener('click', () => {
    const current = strategiesOutput.value;
    const prev = undoStacks.strategies.pop();
    if (prev != null) {
      redoStacks.strategies.push(current);
      strategiesOutput.value = prev;
      autoResizeTextarea(strategiesOutput);
      updateUndoRedoButtons();
    }
  });

  redoReportButton?.addEventListener('click', () => {
    const current = reportOutput.value;
    const next = redoStacks.report.pop();
    if (next != null) {
      undoStacks.report.push(current);
      reportOutput.value = next;
      autoResizeTextarea(reportOutput);
      updateUndoRedoButtons();
    }
  });
  redoStrategiesButton?.addEventListener('click', () => {
    const current = strategiesOutput.value;
    const next = redoStacks.strategies.pop();
    if (next != null) {
      undoStacks.strategies.push(current);
      strategiesOutput.value = next;
      autoResizeTextarea(strategiesOutput);
      updateUndoRedoButtons();
    }
  });

  updateUndoRedoButtons();

  chatTargetReportBtn?.addEventListener('click', () => {
    activeChatTextarea = reportOutput;
    updateChatTargetToggle();
    chatInput.focus();
  });
  chatTargetStrategiesBtn?.addEventListener('click', () => {
    activeChatTextarea = strategiesOutput;
    updateChatTargetToggle();
    chatInput.focus();
  });

  sendChatButton.addEventListener('click', handleSendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = (chatInput.scrollHeight) + 'px';
  });

  ['report-section','strategies-section','stepper-controls'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const observer = new MutationObserver(() => {
      updateStep3Actions();
      updateChatTargetToggle();
    });
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });
  });

  updateStep3Actions();
  updateChatTargetToggle();

  renderUsage();
});
