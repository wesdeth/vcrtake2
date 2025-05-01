// pages/api/generate-bio.js
import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ensName } = req.body;

  if (!ensName) {
    return res.status(400).json({ error: 'ENS name is required' });
  }

  try {
    const prompt = `Create a short professional bio for someone with the ENS name: ${ensName}. Include Web3 or Ethereum-related experience, open source contributions, or DAO involvement if possible. Keep it under 30 words.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
      max_tokens: 60,
      temperature: 0.8,
    });

    const response = completion.choices[0].message.content.trim();
    res.status(200).json({ bio: response });
  } catch (err) {
    console.error("❌ OpenAI error:", err);
    res.status(500).json({ error: 'Failed to generate bio' });
  }
}
