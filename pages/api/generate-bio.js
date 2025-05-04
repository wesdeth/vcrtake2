// pages/api/generate-bio.js
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { getPOAPs } from '../../lib/poapUtils';
import { fetchAlchemyNFTs } from '../../lib/nftUtils';
import { getENSData } from '../../lib/ensUtils';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { ensName } = req.body;

  if (!ensName || typeof ensName !== 'string') {
    return res.status(400).json({ error: 'ENS name is required and must be a string' });
  }

  try {
    const ensData = await getENSData(ensName);
    const poaps = ensData.address ? await getPOAPs(ensData.address) : [];
    const nfts = ensData.address ? await fetchAlchemyNFTs(ensData.address) : [];

    const { data, error } = await supabase
      .from('VCR')
      .select('experience')
      .eq('ens_name', ensName)
      .single();

    const experience = data?.experience || '';

    const poapDescriptions = poaps.map((p) => `${p.event.name} in ${p.event.city || 'unknown location'}`).join(', ');
    const nftDescriptions = nfts.slice(0, 3).map((n) => n.name).filter(Boolean).join(', ');

    const prompt = `Create a professional Web3 resume-style bio for someone with the ENS name "${ensName}". 

- Their past work experience includes: ${experience || 'none provided'}.
- They've attended events like: ${poapDescriptions || 'no major events'}.
- Their NFT interests include: ${nftDescriptions || 'no notable NFTs'}.

Summarize this as a sleek Web3-native builder resume bio. Highlight involvement, credibility, and network presence. Limit to 3–4 sentences.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant writing thoughtful, professional bios for Ethereum users based on onchain and community activity.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 200,
      temperature: 0.75
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
