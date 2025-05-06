// pages/api/generate-bio.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid prompt' });
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-davinci-003',
        prompt,
        max_tokens: 120,
        temperature: 0.7
      })
    });

    const data = await openaiRes.json();

    if (!data.choices || !data.choices.length) {
      console.error('Invalid OpenAI response:', data);
      return res.status(500).json({ error: 'OpenAI did not return a valid response' });
    }

    const text = data.choices[0].text?.trim();

    if (!text) {
      return res.status(500).json({ error: 'Empty AI response' });
    }

    return res.status(200).json({ bio: text });
  } catch (err) {
    console.error('AI generation error:', err);
    return res.status(500).json({ error: 'Failed to generate bio' });
  }
}
