// lib/ensUtils.js

import { ethers } from 'ethers';
import { namehash as viemNamehash } from 'viem';

// Your mainnet RPC
const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');

// Minimal ABI just for .owner lookups
const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const ENS_ABI = ['function owner(bytes32 node) view returns (address)'];

/**
 * Minimal getENSData:
 * - If name is .eth, resolves to address
 * - If 0x address, looks up reverse record for name
 * - Optionally fetches "avatar" text record from the resolver
 * - Calls local /api/poap to fetch user POAPs
 */
async function getENSData(nameOrAddress) {
  try {
    if (!nameOrAddress || typeof nameOrAddress !== 'string') {
      throw new Error('Invalid input: nameOrAddress must be a string');
    }

    let address = null;
    let name = null;

    // 1) Name => Address or Address => Name
    if (nameOrAddress.endsWith('.eth')) {
      name = nameOrAddress;
      address = await provider.resolveName(name);
    } else if (nameOrAddress.startsWith('0x')) {
      address = nameOrAddress;
      name = await provider.lookupAddress(address);
    }

    console.log('🧠 Minimal ENS Lookup:', { input: nameOrAddress, name, address });

    if (!address) {
      throw new Error('Could not resolve a valid address.');
    }

    // 2) Possibly fetch avatar text record
    let avatar = null;
    try {
      const resolverTarget = name || address;
      const resolver = await provider.getResolver(resolverTarget);
      if (resolver) {
        avatar = await resolver.getText('avatar');
      }
    } catch {
      // no big deal if it fails
    }

    // 3) POAP fetch from local /api/poap
    let poaps = [];
    try {
      const poapRes = await fetch(`/api/poap?address=${address}`);
      const poapData = await poapRes.json();
      poaps = poapData?.poaps || [];
    } catch (e) {
      console.warn('❌ Failed to load POAPs:', e);
    }

    // 4) Return minimal data object
    return {
      name,
      address,
      avatar,
      poaps,
      profileKey: name || address
    };
  } catch (err) {
    console.error('❌ Error resolving ENS data:', err.message);
    return {
      name: null,
      address: null,
      avatar: null,
      poaps: [],
      profileKey: nameOrAddress || null
    };
  }
}

/**
 * getENSOwner: Simple function to look up .eth name owner from the ENS registry.
 */
async function getENSOwner(name) {
  try {
    if (!name || !name.endsWith('.eth')) {
      throw new Error('Invalid ENS name');
    }

    const hashedName = viemNamehash(name);
    const registry = new ethers.Contract(ENS_REGISTRY, ENS_ABI, provider);
    const owner = await registry.owner(hashedName);

    console.log('🔍 ENS Registry Owner:', owner);
    return owner.toLowerCase();
  } catch (err) {
    console.error('❌ Error fetching ENS registry owner:', err.message);
    return null;
  }
}

export { getENSData as getEnsData, getENSOwner };
