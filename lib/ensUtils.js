import { ethers } from 'ethers';
import { namehash as viemNamehash } from 'viem';
import axios from 'axios';

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

    // Fetch POAPs via internal API to avoid CORS
    let poaps = [];
    try {
      const poapRes = await axios.get(`/api/poap?address=${address}`);
      poaps = poapRes.data || [];
    } catch (err) {
      console.warn('❌ Failed to fetch POAPs:', err.message);
    }

    // Fake Gitcoin Grants (mocked for now)
    const gitcoinGrants = name?.toLowerCase().includes('gitcoin')
      ? [{ name: 'Gitcoin Supporter Round' }]
      : [];

    // Mock DAO memberships
    const daos = name?.toLowerCase().includes('dao')
      ? [{ name: 'ExampleDAO' }]
      : [];

    return {
      name,
      address,
      avatar,
      twitter,
      website,
      bio,
      lookingForWork,
      tag: lookingForWork ? 'Looking for Work' : 'Active Builder',
      summary: null,
      poaps,
      gitcoinGrants,
      daos
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
      daos: []
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
