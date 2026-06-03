export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ erro: true, mensagem: 'Método não permitido' });
  }

  try {
    const { texto, campos } = req.body;

    const systemPrompt = `Você é um assistente que extrai informações estruturadas de textos sobre projetos.
Retorne APENAS um JSON válido, sem markdown, sem explicações, sem texto adicional.
Campos possíveis: ${campos.join(', ')}.
Para campos claramente não aplicáveis ao projeto, use "N/A".
Para campos não mencionados ou incertos, use string vazia "".
Valores de tipo válidos: LP, Bot, Automação, Infra, Config.
Valores de status válidos: Em produção, Em desenvolvimento, Com pendência, Pausado, Arquivado.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: texto }],
        system: systemPrompt
      })
    });

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return res.status(422).json({ erro: true, mensagem: 'Não foi possível interpretar o texto.' });
    }

    return res.status(200).json({ sucesso: true, dados: parsed });

  } catch (err) {
    return res.status(500).json({ erro: true, mensagem: 'Erro interno: ' + err.message });
  }
}
