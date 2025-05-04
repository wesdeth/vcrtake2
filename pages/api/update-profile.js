// pages/api/update-profile.js

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with env vars
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ⚠️ Ensure this is server-side only
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, address, tag } = req.body;

  if (!name || !address) {
    return res.status(400).json({ error: 'Missing name or address' });
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .upsert(
        [{
          name,
          address,
          tag: tag || 'Active Builder',
          updated_at: new Date().toISOString()
        }],
        { onConflict: 'address' } // Match on wallet address
      );

    if (error) {
      console.error('Supabase update error:', error.message);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    return res.status(200).json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Unexpected server error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
