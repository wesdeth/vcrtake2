// pages/api/poap.js
import axios from 'axios';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');

export default async function handler(req, res) {
  let { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid address' });
  }

  // If ENS name, resolve it
  if (address.endsWith('.eth')) {
    try {
      address = await provider.resolveName(address);
      if (!address) throw new Error('ENS resolution failed');
    } catch (err) {
      return res.status(400).json({ error: 'ENS resolution failed' });
    }
  }

  try {
    const response = await axios.get(`https://api.poap.tech/actions/scan/${address}`, {
      headers: {
        'X-API-Key': '6YLnGhXNzy1eNsIY1mjzRLGnzpAsSMfb2FcSdLZZE4f6fPx7tzXJqF4BujHqvEBuRwdyivUhfoRnUsYzYpu1lpGZTEGEwz8vNVGbcVDfs4G9sDFaySF6bLNK3s1CKXM5'
      }
    });

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error fetching POAPs:', error.message);
    res.status(500).json({ error: 'Failed to fetch POAP data' });
  }
}
