// --- CONFIG ---  (safe for Vercel)
export const GEMINI_API_URL = '/api/generate';
// Compatibility shim in case any old code still references it:
export const GEMINI_API_KEY = undefined;

// --- SYSTEM PROMPTS ---
export const SYSTEM_PROMPT_FOR_MAIN_REPORT = `You are an AI assistant writing teacher's reports. Follow these instructions meticulously:
1.  **Core Principles (Apply to all reports):**
    * **Professionalism:** Regardless of the selected tone, the final report must always be constructive, encouraging, and professionally appropriate. It should offer a balanced view, highlighting strengths while providing clear, supportive guidance on areas for improvement.
    * **Cohesion:** The text must flow logically as a cohesive narrative.
2.  **Language Adherence (CRITICAL):** The student data includes a 'Language' field. The ENTIRE report MUST be written in this specified language (English or Spanish).
3.  **Report Perspective (CRITICAL):** The student data includes a 'Report Perspective' field. If 'ThirdPerson' is specified, refer to the student using third-person pronouns (he/she, him/her). If 'SecondPerson' is specified, address the student directly (you, your).
4.  **Report Tone (CRITICAL):** Adapt your writing style to the specified 'Report Tone':
    * 'Neutral': A balanced, objective, constructive, and encouraging tone suitable for a standard professional report.
    * 'FriendlyConstructive': A friendly, encouraging, and positive tone, while maintaining a professional teacher-student relationship.
    * 'EmpatheticSupportive': Use a gentle and understanding tone. Acknowledge the student's challenges with empathy and focus on building confidence and emotional resilience.
    * 'ConciseDirect': Write in a clear, unambiguous, and succinct style. Get straight to the point, highlighting strengths and areas for improvement without extra commentary.
    * 'GrowthOriented': Frame the report as a roadmap for future development. Emphasize the student's potential and focus on setting clear, actionable goals for them to build upon.
5.  **Structure and Length (CRITICAL):** Use the Output Length value provided in the student data. Produce exactly one short paragraph (2-3 concise sentences) when it is 'short', two short paragraphs when it is 'medium', and three short paragraphs when it is 'long'. Each paragraph must remain succinct, cohesive, and flow logically.
6.  **Interpreting Data (CRITICAL):** * Ratings are 0-10. DO NOT include the numbers. Describe performance qualitatively.
    * **'Use of English' Rule:** The item 'Use of English' is a specific section of an exam focusing on grammar and vocabulary. When mentioning it as an area for improvement, **always refer to it by its English name, 'Use of English', even if the rest of the report is in Spanish.**
7.  **Trimester Context (CRITICAL):**
    * If 'Trimester: 3 (End of Year)' is specified, this indicates the end of the academic year. Frame any comments about 'Areas to Improve' or future development in the context of the 'next academic year' or 'future studies.'
    * If 'Trimester: Course' is specified, treat this as a short course. Refer to the timeframe as the course (not a trimester) and tailor feedback to that condensed period.
8.  **Content Requirements:** Start with the student's name. Comment on each area with data (rating > 0 or attributes listed). Omit areas with no data. Base feedback SOLELY on provided data.
9.  **Salutation:** If the 'Holiday Salutation Theme' is 'None', conclude with a professional non-seasonal closing. Otherwise, end with a holiday-themed salutation matching the provided theme.
10. **Template Custom Instruction (CRITICAL):** If the student data includes a 'Template Custom Instruction', you must follow it precisely.`;

export const SYSTEM_PROMPT_FOR_STRATEGIES = `You are an AI assistant providing practical, constructive improvement strategies.
Instructions:
1. **Language Adherence (CRITICAL):** Generate strategies ONLY in the 'Language' specified.
2. **Perspective Adherence (CRITICAL):** Address the student according to the 'Report Perspective' field ('ThirdPerson' or 'SecondPerson').
3. **Tone Adherence (CRITICAL):** Reflect the specified 'Report Tone'.
4. **'Use of English' Rule:** When creating a strategy for 'Use of English,' clarify that it refers to grammar and vocabulary skills for their exams, and always use the English term 'Use of English'.
5. **Trimester Context for Strategies (CRITICAL):**
   * If 'Trimester: 3 (End of Year)' is specified, frame strategies for the next academic year or future studies.
   * If 'Trimester: Course' is specified, frame guidance for the duration of the course and avoid trimester-specific language.
6. **Focus:** Base suggestions on 'Areas to Improve' and low 'Rating' scores (below 6/10).
7. **Output Format:** Provide 2-4 actionable strategies as a bulleted or numbered list.
8. **Length:** Each strategy must be one or two short sentences.
9. **Content:** Strategies must be specific and practical. If there are no areas for improvement, offer general enrichment ideas.
10. **Template Custom Instruction (CRITICAL):** If the student data includes a 'Template Custom Instruction', apply it faithfully.`;

export const SYSTEM_PROMPT_FOR_EDITING_CHAT = `You are an AI assistant that edits text in a conversation. You will be given a block of original text and a user's instruction on how to change it. Your task is to apply the requested change and return ONLY the full, edited text. Do not add any extra commentary, greetings, or explanations. Apply the edit while preserving the overall context and meaning. The language of the original text must be maintained. Return the complete, modified text.`;

// --- Usage tracker (local + site-wide) ---
const USAGE_API_URL = "https://script.google.com/macros/s/AKfycbyQVnWzEjU5HcG94G5Mr4YpHZDbvCwYKE4j8UGxalbkydy72376h-bBILE4uPV3dm4UWQ/exec";
const USAGE_SHARED_SECRET = "esl-report-writer-2025";
const USAGE_STORAGE_KEY = 'gemini_usage_v1';

function monthKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;
}
function loadUsage() {
  const raw = localStorage.getItem(USAGE_STORAGE_KEY);
  const nowKey = monthKey();
  if (!raw) {
    const init = { month: nowKey, count: 0 };
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(init));
    return init;
  }
  let data = {};
  try { data = JSON.parse(raw); } catch { data = { month: nowKey, count: 0 }; }
  if (data.month !== nowKey) {
    data = { month: nowKey, count: 0 };
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(data));
  }
  return data;
}
function saveUsage(data) {
  localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(data));
}
export function incrementUsage(n = 1) {
  const data = loadUsage();
  data.count += n;
  saveUsage(data);
  renderUsage(); // update badge
}
async function getSiteWideUsage() {
  try {
    const res = await fetch(`${USAGE_API_URL}?month=${monthKey()}`, { method: 'GET' });
    if (!res.ok) throw new Error('GET failed');
    const data = await res.json();
    return Number(data.count || 0);
  } catch {
    return null;
  }
}
export async function incrementSiteWideUsage() {
  try {
    const res = await fetch(USAGE_API_URL, {
      method: 'POST',
      // Use text/plain so the request is a "simple request" (no CORS preflight)
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ secret: USAGE_SHARED_SECRET, month: monthKey(), inc: 1 })
    });
    if (!res.ok) throw new Error('POST failed');
    const data = await res.json();
    return Number(data.count || 0);
  } catch {
    return null;
  }
}
export async function renderUsage() {
  const el = document.getElementById('usageCounter');
  if (!el) return;
  const siteCount = await getSiteWideUsage();
  if (siteCount != null) {
    el.textContent = `This month: ${siteCount}/1500 (site-wide)`;
  } else {
    const { count } = loadUsage();
    el.textContent = `This month: ${count}/1500 (this device)`;
  }
}

// --- Gemini calls (same behavior as before) ---
export async function callGeminiAPI(prompt, data, outputElement) {
  const fullPrompt = `${prompt}\n\nDATA:\n${data}`;
  let chatHistory = [];
  chatHistory.push({ role: "user", parts: [{ text: fullPrompt }] });
  const payload = { contents: chatHistory };
  const apiUrl = GEMINI_API_URL; // now hits /api/generate on Vercel

  // Exponential backoff for API calls
  const maxRetries = 5;
  let retries = 0;
  let response = null;

  while (retries < maxRetries) {
    try {
      response = await fetch(apiUrl, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.status === 429) {
        const delay = Math.pow(2, retries) * 1000;
        retries++;
        console.warn(`API rate limit exceeded. Retrying in ${delay / 1000}s...`);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error ${response.status}: ${errorData?.error?.message || 'Unknown error'}`);
      }
      break;
    } catch (error) {
      if (retries === maxRetries - 1) {
        throw error;
      }
      retries++;
      const delay = Math.pow(2, retries) * 1000;
      console.warn(`API call failed. Retrying in ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }

  if (!response) {
    throw new Error("Failed to get a response from the API after multiple retries.");
  }

  // ✅ Count only successful calls
  incrementUsage();
  incrementSiteWideUsage().then(siteTotal => { const el = document.getElementById('usageCounter'); if (el && siteTotal!=null) el.textContent = `This month: ${siteTotal}/1500 (site-wide)`; });

  const result = await response.json();
  if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
    outputElement.value = result.candidates[0].content.parts[0].text;
    // main will import autoResizeTextarea from ui.js; we won't import it here to avoid circular deps
    if (typeof window !== 'undefined' && window.__autoResizeTextarea) {
      window.__autoResizeTextarea(outputElement);
    }
    return true;
  } else {
    let blockReason = result.candidates?.[0]?.finishReason ? ` (Reason: ${result.candidates[0].finishReason})` : "";
    if (result.candidates?.[0]?.safetyRatings) {
      blockReason += ` - Safety: ${result.candidates[0].safetyRatings.map(r => `${r.category} (${r.probability})`).join(', ')}`;
    }
    throw new Error(`No content in API response or content blocked.${blockReason}`);
  }
}

export async function callChatAPI(systemPrompt, chatHistory, outputElement) {
  const payload = {
    contents: chatHistory,
    systemInstruction: { parts: [{ text: systemPrompt }] }
  };
  const apiUrl = GEMINI_API_URL;

  const maxRetries = 5;
  let retries = 0;
  let response = null;

  while (retries < maxRetries) {
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.status === 429) {
        const delay = Math.pow(2, retries) * 1000;
        retries++;
        console.warn(`API rate limit exceeded. Retrying in ${delay / 1000}s...`);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error ${response.status}: ${errorData?.error?.message || 'Unknown error'}`);
      }
      break;
    } catch (error) {
      if (retries === maxRetries - 1) {
        throw error;
      }
      retries++;
      const delay = Math.pow(2, retries) * 1000;
      console.warn(`API call failed. Retrying in ${delay / 1000}s...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  if (!response) {
    throw new Error("Failed to get a response from the API after multiple retries.");
  }

  // ✅ Count only successful calls
  incrementUsage();
  incrementSiteWideUsage().then(siteTotal => { const el = document.getElementById('usageCounter'); if (el && siteTotal!=null) el.textContent = `This month: ${siteTotal}/1500 (site-wide)`; });

  const result = await response.json();
  if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
    const editedText = result.candidates[0].content.parts[0].text;
    outputElement.value = editedText;
    if (typeof window !== 'undefined' && window.__autoResizeTextarea) {
      window.__autoResizeTextarea(outputElement);
    }
    return editedText;
  } else {
    let blockReason = result.candidates?.[0]?.finishReason ? ` (Reason: ${result.candidates[0].finishReason})` : "";
    if (result.candidates?.[0]?.safetyRatings) {
      blockReason += ` - Safety: ${result.candidates[0].safetyRatings.map(r => `${r.category} (${r.probability})`).join(', ')}`;
    }
    throw new Error(`No content in API response or content blocked.${blockReason}`);
  }
}

