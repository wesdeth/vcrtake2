// pages/api/generate-bio.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ensName, experience, poaps = [], nfts = [] } = req.body;

  if (!ensName || typeof ensName !== 'string') {
    return res.status(400).json({ error: 'ENS name is required and must be a string' });
  }

  if (!experience || experience.trim().length < 10) {
    return res.status(400).json({ error: 'Work experience is required to generate a resume bio.' });
  }

  const poapLocations = poaps
    .map((p) => p?.event?.city || p?.event?.name)
    .filter(Boolean)
    .join(', ') || 'various Web3 events';

  const nftSummary = nfts.length > 0
    ? 'They also own NFTs that reflect their onchain activity.'
    : '';

  const prompt = `
Create a polished Web3-focused resume summary for "${ensName}". 
They have professional experience in: ${experience}. 
They’ve attended these events: ${poapLocations}. 
${nftSummary}
Summarize their onchain credibility in under 100 words, emphasizing their involvement in the Web3 ecosystem, DAOs, grant receipts, and or attendance at community events.
Make it feel like a verified Web3 résumé intro, similar to a college degree blurb.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a resume assistant generating professional, concise bios based on Ethereum activity, POAPs, and verified work history.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 150,
      temperature: 0.75,
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
