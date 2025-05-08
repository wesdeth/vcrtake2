// pages/api/save-profile.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { ensName, twitter, warpcast, website, tag, bio, custom_avatar, experience } = req.body;

  if (!ensName) return res.status(400).json({ error: 'ENS name is required' });

  const { data, error } = await supabase
    .from('VCR')
    .upsert(
      {
        ens_name: ensName,
        twitter,
        warpcast,
        website,
        tag,
        bio,
        custom_avatar,
        experience,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'ens_name' }
    );

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ success: true, data });
}
