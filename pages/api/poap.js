// pages/api/poap.js
import axios from 'axios';

export default async function handler(req, res) {
  const { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid address' });
  }

  try {
    const response = await axios.get(`https://api.poap.tech/actions/scan/${address}`, {
      headers: {
        'X-API-Key': process.env.NEXT_PUBLIC_POAP_API_KEY || 'demo'
      }
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching POAPs:', error.message);
    res.status(500).json({ error: 'Failed to fetch POAP data' });
  }
}
