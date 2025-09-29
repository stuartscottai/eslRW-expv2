// /api/generate.js  (Vercel Serverless Function)
export default async function handler(req, res) {
  // Basic CORS for local previews; Vercel previews are fine too
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing GEMINI_API_KEY on server" });

  try {
    const body = req.body && typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");

    // Allow the client to specify a model, else default to a fast one
    const model = body.model || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // Pass through only the fields Gemini expects (ignore anything else)
    const payload = {
      contents: body.contents || [],
      systemInstruction: body.systemInstruction,
      tools: body.tools,
      generationConfig: body.generationConfig,
      safetySettings: body.safetySettings,
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: "Upstream error", details: data });
    }
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
