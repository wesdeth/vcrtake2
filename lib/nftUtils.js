
import axios from 'axios';

const ALCHEMY_BASE_URL = process.env.NEXT_PUBLIC_ALCHEMY_BASE_URL;

export async function getAlchemyNFTs(address) {
  try {
    const url = `${ALCHEMY_BASE_URL}/getNFTsForOwner?owner=${address}&withMetadata=true`;

    const response = await axios.get(url);
    const nfts = response.data.ownedNfts || [];

    return nfts.map((nft) => ({
      name: nft.title || nft.metadata?.name || '',
      image: nft.media?.[0]?.gateway || '',
      collection: nft.contractMetadata?.name || '',
      metadata: nft.metadata || {},
    }));
  } catch (error) {
    console.error('Error fetching NFTs from Alchemy:', error);
    return [];
  }
}
