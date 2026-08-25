// api/groq/assistant.js
// Vercel Serverless Function — backend de "Nex Assistant", el asistente de IA
// que puede operar NEX OS (abrir apps, crear notas, cambiar tema, volumen…)
// usando tool calling de Groq. La GROQ_API_KEY vive solo acá (variable de
// entorno en Vercel) — el navegador nunca la ve. El frontend maneja el loop
// de tool calls: manda los mensajes, ejecuta las tools localmente contra el
// estado real del OS (WindowManager, FileSystem, Settings) y reenvía los
// resultados como mensajes role:"tool".

export default async function handler(req, res) {
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

  const { messages, model = 'llama-3.3-70b-versatile', maxTokens = 700, temperature = 0.3 } =
    req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Se requiere un array "messages" no vacío.' });
  }

  // Única fuente de verdad para las tools: el frontend NO manda su propio
  // schema, así el contrato entre lo que el modelo puede pedir y lo que
  // NexAssistantPanel sabe ejecutar queda fijo acá.
  const TOOLS = [
    {
      type: 'function',
      function: {
        name: 'open_app',
        description: 'Abre o enfoca una aplicación de NEX OS por su appId exacto (ver la lista de apps disponibles en el mensaje de sistema).',
        parameters: {
          type: 'object',
          properties: { appId: { type: 'string', description: 'appId exacto de la app a abrir.' } },
          required: ['appId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'close_app',
        description: 'Cierra la ventana de una app que esté abierta, por su appId.',
        parameters: {
          type: 'object',
          properties: { appId: { type: 'string' } },
          required: ['appId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'minimize_all_windows',
        description: 'Minimiza todas las ventanas abiertas (mostrar escritorio).',
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'create_note',
        description: 'Crea un archivo de texto en Documentos y lo abre en el Bloc de notas.',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Nombre del archivo sin extensión, ej: "Ideas". Opcional.' },
            content: { type: 'string', description: 'Contenido de la nota.' },
          },
          required: ['content'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'set_neon_theme',
        description: 'Cambia el tema neon del sistema.',
        parameters: {
          type: 'object',
          properties: { theme: { type: 'string', enum: ['none', 'cyberpunk', 'matrix', 'synthwave'] } },
          required: ['theme'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'set_volume',
        description: 'Ajusta el volumen del sistema, de 0 a 100.',
        parameters: {
          type: 'object',
          properties: { level: { type: 'number' } },
          required: ['level'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'set_brightness',
        description: 'Ajusta el brillo de pantalla, de 0 a 100.',
        parameters: {
          type: 'object',
          properties: { level: { type: 'number' } },
          required: ['level'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_desktop_state',
        description: 'Devuelve las ventanas abiertas actualmente (appId, título, si está minimizada/maximizada). Usalo si no estás seguro de qué hay abierto antes de cerrar o enfocar algo.',
        parameters: { type: 'object', properties: {} },
      },
    },
  ];

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
        tools: TOOLS,
        tool_choice: 'auto',
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
    const message = data.choices?.[0]?.message ?? { role: 'assistant', content: '' };
    return res.status(200).json({ message });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
