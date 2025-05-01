export default async function handler(req, res) {
  const { ensName } = req.body;

  const prompt = `Write a short, professional bio for someone using the ENS name "${ensName}". Keep it under 250 characters.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 80,
      temperature: 0.7
    })
  });

  const data = await response.json();
  const bio = data?.choices?.[0]?.message?.content?.trim();

  res.status(200).json({ bio });
}