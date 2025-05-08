// pages/api/save-profile.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    ensName,
    twitter,
    warpcast,
    website,
    tag,
    bio,
    custom_avatar,
    experience
  } = req.body;

  console.log('[Incoming Request Body]', req.body);

  if (!ensName) {
    return res.status(400).json({ error: 'ENS name is required' });
  }

  try {
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
          experience
        },
        { onConflict: 'ens_name', returning: 'representation' }
      );

    if (error) {
      console.error('[Supabase Error]', error);
      throw error;
    }

    console.log('[Supabase Response]', data);
    return res.status(200).json({ message: 'Profile saved successfully', data });
  } catch (err) {
    console.error('[Handler Error]', err);
    return res.status(500).json({ error: 'Failed to save profile' });
  }
}
