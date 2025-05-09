// /api/recent-updates.js

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const querySchema = z.object({
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 5)),
  tag: z.string().optional()
});

export default async function handler(req, res) {
  try {
    const parseResult = querySchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid query parameters' });
    }

    const { limit, tag } = parseResult.data;

    // 1) Updated supabase query to also select 'looking_for_work'
    let query = supabase
      .from('profiles')
      .select('name, address, tag, updated_at, looking_for_work') 
      .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // last 7 days
      .order('updated_at', { ascending: false });

    if (tag) {
      query = query.eq('tag', tag);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Supabase fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }

    // Shuffle and trim the result
    const shuffled = data.sort(() => 0.5 - Math.random()).slice(0, limit);

    // 2) Map 'looking_for_work' to 'lookingForWork' + timeSince for each
    const enriched = shuffled.map((profile) => {
      const timeAgo = timeSince(new Date(profile.updated_at));
      return {
        ...profile,
        lookingForWork: !!profile.looking_for_work,
        timeAgo
      };
    });

    return res.status(200).json(enriched);
  } catch (err) {
    console.error('Unexpected error in recent-updates API:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

/** timeSince helper */
function timeSince(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 }
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count > 0) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
}
