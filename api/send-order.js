export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, body } = req.body || {};

    if (!to || !body) {
      return res.status(400).json({ error: 'Missing "to" or "body" in request' });
    }

    const INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID || 'instance186689';
    const TOKEN = process.env.ULTRAMSG_TOKEN || 'pn7ycxyreph7phs2';

    const ultramsgUrl = `https://api.ultramsg.com/${INSTANCE_ID}/messages/chat`;

    const response = await fetch(ultramsgUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: TOKEN,
        to: to,
        body: body,
      }),
    });

    const data = await response.json();

    if (!response.ok || data.sent === false) {
      return res.status(500).json({
        error: data.error || 'Ultramsg API error',
        details: data,
      });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
