import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");

export async function getENSData(name) {
  try {
    const address = await provider.resolveName(name);
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
    console.error('Error resolving ENS', err);
    return {};
  }
}
