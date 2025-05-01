import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');

export async function getENSData(name) {
  try {
    const address = name.endsWith('.eth')
      ? await provider.resolveName(name)
      : name.startsWith('0x')
      ? name
      : null;

    if (!address) throw new Error('Invalid ENS name or address');

    const reverseName = await provider.lookupAddress(address);
    const resolver = reverseName ? await provider.getResolver(reverseName) : await provider.getResolver(name);

    const avatar = resolver ? await resolver.getText('avatar').catch(() => null) : null;
    const twitter = resolver ? await resolver.getText('com.twitter').catch(() => null) : null;
    const website = resolver ? await resolver.getText('url').catch(() => null) : null;
    const bio = resolver ? await resolver.getText('description').catch(() => null) : null;
    const lookingForWork = resolver ? await resolver.getText('lookingForWork').catch(() => null) : null;

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
    console.error('Error resolving ENS data:', err);
    return {};
  }
}
