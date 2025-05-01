import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");

export async function getENSData(name) {
  // ✅ Prevent invalid inputs
  if (!name || typeof name !== 'string' || name.trim() === '') {
    console.error('Invalid ENS name provided to getENSData:', name);
    return {};
  }

  try {
    const address = await provider.resolveName(name);
    if (!address) {
      console.warn(`Could not resolve address for ENS name: ${name}`);
      return {};
    }

    const resolver = await provider.getResolver(name);
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
    console.error('Error resolving ENS in getENSData:', err);
    return {};
  }
}
