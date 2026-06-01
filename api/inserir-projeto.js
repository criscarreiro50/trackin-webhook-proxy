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
    const response = await fetch('https://trackin.app.n8n.cloud/webhook/inserir-projeto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { sucesso: true, mensagem: text };
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ erro: true, mensagem: 'Erro ao conectar com o n8n: ' + err.message });
  }
}
