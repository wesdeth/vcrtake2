// pages/api/generate-bio.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ensName } = req.body;

  if (!ensName || typeof ensName !== 'string') {
    return res.status(400).json({ error: 'ENS name is required and must be a string' });
  }

  try {
    const prompt = `Create a short professional bio for someone with the ENS name "${ensName}". Keep it Web3-focused and under 30 words.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant creating concise, professional bios for Ethereum builders.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 60,
      temperature: 0.8
    });

    const response = completion.choices?.[0]?.message?.content?.trim();

    if (!response) {
      return res.status(500).json({ error: 'No bio was returned by OpenAI' });
    }

    return res.status(200).json({ bio: response });
  } catch (err) {
    console.error('❌ OpenAI error:', err);
    return res.status(500).json({ error: 'Failed to generate bio' });
  }
}
