
import axios from 'axios';
import { ethers } from 'ethers';

const ETHERSCAN_API_KEY = '4EYWZZX5ZXQGQ15NFRB81UIA9K69SIUXEJ';
const PUBLIC_RESOLVER_ADDRESS = '0x226159d592E2b063810a10Ebf6dcbADA94Ed68b8';

export default async function handler(req, res) {
  try {
    const response = await axios.get(
      `https://api.etherscan.io/api`,
      {
        params: {
          module: 'account',
          action: 'txlist',
          address: PUBLIC_RESOLVER_ADDRESS,
          startblock: 0,
          endblock: 99999999,
          sort: 'desc',
          apikey: ETHERSCAN_API_KEY
        }
      }
    );

    const recentWrites = response.data.result
      .filter(tx => tx.input.startsWith('0x5c3b2b2f')) // function selector for setText(string,string)
      .slice(0, 5); // limit to most recent

    const profiles = recentWrites.map(tx => ({
      name: tx.from.slice(0, 6) + '...' + tx.from.slice(-4),
      tag: 'Recently Updated',
      color: 'text-blue-500',
      border: 'border-blue-300'
    }));

    res.status(200).json(profiles);
  } catch (error) {
    console.error('Error fetching ENS updates:', error);
    res.status(500).json({ error: 'Failed to fetch ENS updates' });
  }
}
