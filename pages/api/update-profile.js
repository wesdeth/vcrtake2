import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { name, address, tag = 'Active Builder' } = req.body;

  if (!name || !address) {
    return res.status(400).json({ error: 'Missing name or address' });
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        { name, address, tag, updated_at: new Date().toISOString() },
        { onConflict: ['name'] }
      );

    if (error) {
      console.error('Supabase upsert error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    return res.status(200).json({ message: 'Profile updated', data });
  } catch (err) {
    console.error('Unexpected error in update-profile API:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
 
