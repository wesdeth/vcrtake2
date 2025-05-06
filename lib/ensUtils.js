// lib/ensUtils.js
import { ethers } from 'ethers';
import { namehash as viemNamehash } from 'viem';

const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const ENS_ABI = ['function owner(bytes32 node) view returns (address)'];

async function getENSData(nameOrAddress) {
  try {
    let address = null;
    let name = null;

    if (!nameOrAddress || typeof nameOrAddress !== 'string') {
      throw new Error('Invalid input: nameOrAddress must be a string');
    }

    if (nameOrAddress.endsWith('.eth')) {
      name = nameOrAddress;
      address = await provider.resolveName(name);
    } else if (nameOrAddress.startsWith('0x')) {
      address = nameOrAddress;
      name = await provider.lookupAddress(address);
    }

    console.log('🧠 ENS Lookup:', { input: nameOrAddress, name, address });

    if (!address) {
      throw new Error('Could not resolve a valid address.');
    }

    const resolverTarget = name || address;
    const resolver = await provider.getResolver(resolverTarget);

    const avatar = resolver ? await resolver.getText('avatar') : null;
    const twitter = resolver ? await resolver.getText('com.twitter') : null;
    const website = resolver ? await resolver.getText('url') : null;
    const bio = resolver ? await resolver.getText('description') : null;
    const lookingForWork = resolver ? await resolver.getText('lookingForWork') : null;

    const tag = lookingForWork ? 'Looking for Work' : 'Active Builder';

    let poaps = [];
    let gitcoinGrants = [];
    let daos = [];

    try {
      const poapRes = await fetch(`/api/poap?address=${address}`);
      const poapData = await poapRes.json();
      poaps = poapData?.poaps || [];
    } catch (e) {
      console.warn('❌ Failed to load POAPs:', e);
    }

    return {
      name,
      address,
      avatar,
      twitter,
      website,
      bio,
      lookingForWork,
      tag,
      summary: null,
      poaps,
      gitcoinGrants,
      daos,
      profileKey: name || address // ensure consistency in profile lookups
    };
  } catch (err) {
    console.error('❌ Error resolving ENS data:', err.message);
    return {
      name: null,
      address: null,
      avatar: null,
      twitter: null,
      website: null,
      bio: null,
      lookingForWork: null,
      tag: 'Active Builder',
      summary: null,
      poaps: [],
      gitcoinGrants: [],
      daos: [],
      profileKey: nameOrAddress || null
    };
  }
}

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
