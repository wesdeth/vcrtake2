// lib/ensUtils.js
import { ethers } from 'ethers';
import { namehash as viemNamehash } from 'viem';

/**
 * Create a v5 style JsonRpcProvider
 * (ethers v5 => ethers.providers.JsonRpcProvider)
 */
const provider = new ethers.providers.JsonRpcProvider('https://eth.llamarpc.com');
const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const ENS_ABI = ['function owner(bytes32 node) view returns (address)'];

/**
 * Attempt to resolve an ENS name or 0x address to { name, address, avatar, etc. }
 * This is a fairly minimal example; adapt as needed.
 */
export async function getEnsData(nameOrAddress) {
  try {
    if (!nameOrAddress || typeof nameOrAddress !== 'string') {
      throw new Error('Invalid input: nameOrAddress must be a string');
    }

    let name = null;
    let address = null;

    if (nameOrAddress.endsWith('.eth')) {
      name = nameOrAddress;
      address = await provider.resolveName(name); // v5 call
    } else if (nameOrAddress.startsWith('0x')) {
      address = nameOrAddress;
      name = await provider.lookupAddress(address);
    }

    console.log('🧠 ENS Lookup:', { input: nameOrAddress, name, address });

    if (!address) {
      throw new Error('Could not resolve a valid address.');
    }

    const resolvedName = name || null;
    // If name is valid, fetch a simple text record or avatar
    let avatar = null;
    let twitter = null;
    let website = null;

    if (resolvedName) {
      const resolver = await provider.getResolver(resolvedName);
      if (resolver) {
        avatar = await resolver.getText('avatar'); // v5 => returns string or null
        twitter = await resolver.getText('com.twitter');
        website = await resolver.getText('url');
      }
    }

    return {
      name: resolvedName,
      address,
      avatar: avatar || null,
      twitter: twitter || null,
      website: website || null
    };
  } catch (err) {
    console.error('❌ getEnsData error:', err.message);
    return { name: null, address: null, avatar: null, twitter: null, website: null };
  }
}

/**
 * Return the current owner of `name` (must be *.eth),
 * using old v5 calls.
 */
export async function getENSOwner(name) {
  try {
    if (!name || !name.endsWith('.eth')) {
      throw new Error('Invalid ENS name');
    }
    const hashed = viemNamehash(name);
    const registry = new ethers.Contract(ENS_REGISTRY, ENS_ABI, provider);
    const owner = await registry.owner(hashed);
    console.log(`🔍 Owner of ${name} is ${owner}`);
    return owner.toLowerCase();
  } catch (err) {
    console.error('❌ getENSOwner error:', err.message);
    return null;
  }
}
