export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, auto = false } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
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

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API error:', data);
      return res.status(response.status).json({ error: data.error?.message || 'OpenAI error' });
    }

    const text = data?.choices?.[0]?.message?.content?.trim();

    return res.status(200).json({ bio: text });
  } catch (err) {
    console.error('AI generation error (server):', err);
    return res.status(500).json({ error: 'Failed to generate bio' });
  }
}
