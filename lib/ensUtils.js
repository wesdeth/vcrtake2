import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');

export async function getENSData(nameOrAddress) {
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
      throw new Error("Could not resolve a valid address.");
    }

    const resolverTarget = name || address;
    const resolver = await provider.getResolver(resolverTarget);

    const avatar = resolver ? await resolver.getText('avatar') : null;
    const twitter = resolver ? await resolver.getText('com.twitter') : null;
    const website = resolver ? await resolver.getText('url') : null;
    const bio = resolver ? await resolver.getText('description') : null;
    const lookingForWork = resolver ? await resolver.getText('lookingForWork') : null;

    return {
      name,
      address,
      avatar,
      twitter,
      website,
      bio,
      lookingForWork,
      summary: null
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
      summary: null
    };
  }
}
