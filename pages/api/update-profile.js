import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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
    const { error } = await supabase.from('profiles').upsert(
      [{ name, address, tag: tag || 'Active Builder' }],
      { onConflict: 'address' }
    );

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    return res.status(200).json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Unexpected error in update-profile API:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
