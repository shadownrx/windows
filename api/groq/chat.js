// api/chat.js
// Vercel Serverless Function — corre por request, no es un servidor persistente.
// La GROQ_API_KEY se configura en Vercel: Project → Settings → Environment Variables.

export default async function handler(req, res) {
  // CORS básico (útil si en algún momento el frontend vive en otro dominio).
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usá POST.' });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return res.status(500).json({
      error: 'GROQ_API_KEY no configurada. Agregala en Vercel → Settings → Environment Variables.',
    });
  }

  const { messages, model = 'llama-3.3-70b-versatile', maxTokens = 700, temperature = 0.25 } =
    req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Se requiere un array "messages" no vacío.' });
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!groqRes.ok) {
      const text = await groqRes.text().catch(() => '');
      return res
        .status(groqRes.status)
        .json({ error: `Groq ${groqRes.status}: ${text.slice(0, 300)}` });
    }

    const data = await groqRes.json();
    const content = data.choices?.[0]?.message?.content ?? '';
    return res.status(200).json({ content });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}