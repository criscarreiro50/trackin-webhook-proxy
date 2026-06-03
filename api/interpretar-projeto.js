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
Retorne APENAS um JSON válido, sem markdown, sem blocos de código, sem explicações, sem texto adicional.
Não use \`\`\`json ou \`\`\` em nenhuma hipótese.
Campos possíveis: ${campos.join(', ')}.
Para campos claramente não aplicáveis ao projeto, use "N/A".
Para campos não mencionados ou incertos, use string vazia "".
Valores de tipo válidos: LP, Bot, Automação, Infra, Config.
Valores de status válidos: Em produção, Em desenvolvimento, Com pendência, Pausado, Arquivado.
Exemplo de resposta esperada: {"cliente":"Reimont","projeto":"LP Petição"}`;

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
    
    // Log para debug
    console.log('Anthropic response:', JSON.stringify(data));
    
    const content = data.content?.[0]?.text || '';
    
    // Limpar markdown se vier
    const cleaned = content
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Parse error:', parseErr.message, 'Content:', cleaned);
      return res.status(422).json({ 
        erro: true, 
        mensagem: 'Não foi possível interpretar o texto.',
        debug: cleaned
      });
    }

    return res.status(200).json({ sucesso: true, dados: parsed });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ erro: true, mensagem: 'Erro interno: ' + err.message });
  }
}
