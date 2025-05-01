import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');

export async function getENSData(nameOrAddress) {
  try {
    let address = nameOrAddress;
    let name = null;

    // if it's an ENS name
    if (nameOrAddress.endsWith('.eth')) {
      name = nameOrAddress;
      address = await provider.resolveName(nameOrAddress);
    }

    // if it's an address
    else if (nameOrAddress.startsWith('0x')) {
      address = nameOrAddress;
      name = await provider.lookupAddress(nameOrAddress);
    }

    if (!address) {
      throw new Error("Address couldn't be resolved.");
    }

    const resolver = await provider.getResolver(name || address);
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
    console.error('❌ Error resolving ENS or address:', err);
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
