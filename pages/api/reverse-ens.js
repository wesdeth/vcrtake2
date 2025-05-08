// pages/api/reverse-ens.js
import { ethers } from 'ethers';

export default async function handler(req, res) {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL); // or use Alchemy/Infura
    const ensName = await provider.lookupAddress(address);

    if (!ensName) {
      return res.status(200).json({ ensName: null });
    }

    return res.status(200).json({ ensName });
  } catch (error) {
    console.error('Failed to resolve ENS:', error);
    return res.status(500).json({ error: 'ENS resolution failed' });
  }
}
