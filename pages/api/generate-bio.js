// pages/api/generate-bio.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, auto = false } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Missing OpenAI API Key' });
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that writes concise and engaging Web3 bios for crypto users.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: auto ? 100 : 150,
        temperature: 0.7
      })
    });

    const data = await openaiRes.json();

    if (!openaiRes.ok) {
      if (openaiRes.status === 429) {
        console.warn('Rate limit hit:', data);
        return res.status(429).json({
          error: 'Rate limit reached. Please wait and try again.'
        });
      }

      console.error('OpenAI error:', data);
      return res.status(openaiRes.status).json({
        error: data?.error?.message || 'Unknown error from OpenAI'
      });
    }

    const text = data?.choices?.[0]?.message?.content?.trim();

    if (!text) {
      return res.status(500).json({ error: 'No response text from OpenAI' });
    }

    return res.status(200).json({ bio: text });
  } catch (err) {
    console.error('Server error in /api/generate-bio:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
