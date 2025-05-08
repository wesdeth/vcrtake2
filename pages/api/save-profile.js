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
    address,
    twitter,
    warpcast,
    website,
    tag,
    bio,
    custom_avatar,
    experience
  } = req.body;

  console.log('[Incoming Request Body]', JSON.stringify(req.body, null, 2));

  if (!ensName || !address) {
    return res.status(400).json({ error: 'ENS name and address are required.' });
  }

  try {
    const normalizedExperience = (experience || []).map((item) => ({
      title: item.title || '',
      company: item.company || '',
      startDate: item.startDate || '',
      endDate: item.currentlyWorking ? null : item.endDate || '',
      currentlyWorking: !!item.currentlyWorking,
      location: item.location || '',
      description: item.description || ''
    }));

    const { data, error } = await supabase
      .from('VCR')
      .upsert(
        {
          ens_name: ensName,
          address,
          twitter,
          warpcast,
          website,
          tag,
          bio,
          custom_avatar,
          experience: normalizedExperience
        },
        { onConflict: 'ens_name', returning: 'representation' }
      );

    if (error) {
      console.error('[Supabase Error]', error.message, error.details, error.hint);
      return res.status(500).json({ error: 'Database error', details: error });
    }

    console.log('[Supabase Response]', data);
    return res.status(200).json({ message: 'Profile saved successfully', data });
  } catch (err) {
    console.error('[Unhandled Exception]', err);
    return res.status(500).json({ error: 'Unexpected server error', message: err.message });
  }
}
