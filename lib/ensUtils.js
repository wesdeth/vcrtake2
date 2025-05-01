import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");

export async function getENSData(name) {
  try {
    const address = await provider.resolveName(name);
    if (!address) throw new Error('Unable to resolve address');

    const resolver = await provider.getResolver(name);
    if (!resolver) throw new Error('Unable to resolve ENS records');

    const [avatar, twitter, website, bio, lookingForWork] = await Promise.all([
      resolver.getText('avatar'),
      resolver.getText('com.twitter'),
      resolver.getText('url'),
      resolver.getText('description'),
      resolver.getText('lookingForWork'),
    ]);

    return {
      name,
      address,
      avatar,
      twitter,
      website,
      bio,
      lookingForWork,
      summary: null, // Placeholder for future AI summary
    };
  } catch (err) {
    console.error('Error resolving ENS:', err);
    return {};
  }
}
