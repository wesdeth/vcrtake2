// pages/api/generate-bio.js
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
    const text = data?.choices?.[0]?.message?.content?.trim();

    return res.status(200).json({ bio: text });
  } catch (err) {
    console.error('AI generation error:', err);
    return res.status(500).json({ error: 'Failed to generate bio' });
  }
}

// Frontend example to call this API (place in your React component)
// async function handleGenerateBio(name) {
//   setLoading(true);
//   setBio("Generating bio...");
//   try {
//     const response = await fetch('/api/generate-bio', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         prompt: `Write a short Web3 bio for ${name}. Include their role, ENS, and community impact.`,
//         auto: false
//       })
//     });
//     const data = await response.json();
//     if (response.ok && data.bio) setBio(data.bio);
//     else setBio("Failed to generate bio.");
//   } catch (err) {
//     console.error("Error generating bio:", err);
//     setBio("Something went wrong.");
//   }
//   setLoading(false);
// }
