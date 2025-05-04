// pages/api/poap.js
import axios from 'axios';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');

export default async function handler(req, res) {
  let { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid address' });
  }

  // Resolve ENS to address if needed
  if (address.endsWith('.eth')) {
    try {
      const resolved = await provider.resolveName(address);
      if (!resolved) throw new Error('ENS resolution failed');
      address = resolved;
    } catch (err) {
      console.error('❌ ENS resolution failed:', err.message);
      return res.status(400).json({ error: 'ENS resolution failed' });
    }
  }

  try {
    const response = await axios.get(`https://api.poap.tech/actions/scan/${address}`, {
      headers: {
        'X-API-Key': process.env.NEXT_PUBLIC_POAP_API_KEY
      }
    });

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('❌ POAP fetch failed:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    return res.status(500).json({ error: 'Failed to fetch POAP data' });
  }
}
