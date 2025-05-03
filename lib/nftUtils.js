export async function fetchAlchemyNFTs(address) {
  const apiKey = process.env.ALCHEMY_API_KEY;
  const url = `https://eth-mainnet.g.alchemy.com/nft/v2/${apiKey}/getNFTs?owner=${address}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    return data.ownedNfts.map((nft) => ({
      name: nft.title || nft.metadata?.name || 'NFT',
      image:
        nft.media?.[0]?.gateway ||
        nft.metadata?.image ||
        'https://via.placeholder.com/150',
    }));
  } catch (err) {
    console.error('❌ Error fetching NFTs from Alchemy:', err);
    return [];
  }
}
