import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('name, address, tag, updated_at')
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Supabase fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Unexpected error in recent-updates API:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
