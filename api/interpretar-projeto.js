export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ erro: true });

  try {
    const { texto, campos } = req.body;

    const systemPrompt = `Retorne APENAS um JSON válido sem markdown, sem blocos de código, sem explicações. Campos: ${campos.join(', ')}. Use "N/A" para não aplicável, "" para desconhecido. Tipo: LP|Bot|Automação|Infra|Config. Status: Em produção|Em desenvolvimento|Com pendência|Pausado|Arquivado.`;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: texto }]
      })
    });

    const data = await r.json();
    console.log('STATUS:', r.status);
    console.log('RESPONSE:', JSON.stringify(data));

    if (data.error) {
      return res.status(500).json({ erro: true, mensagem: data.error.message, debug: data });
    }

    const content = (data.content?.[0]?.text || '').replace(/```json|```/gi, '').trim();
    console.log('CONTENT:', content);

    const parsed = JSON.parse(content);
    return res.status(200).json({ sucesso: true, dados: parsed });

  } catch (err) {
    console.log('ERROR:', err.message);
    return res.status(500).json({ erro: true, mensagem: err.message });
  }
}
