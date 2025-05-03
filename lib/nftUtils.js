export async function fetchAlchemyNFTs(address) {
  const apiKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY; // ✅ make sure this env var is set in Vercel
  const url = `https://eth-mainnet.g.alchemy.com/nft/v2/${apiKey}/getNFTs?owner=${address}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    const nfts = data.ownedNfts?.map((nft) => ({
      name: nft.metadata?.name || 'NFT',
      image:
        nft.media?.[0]?.gateway ||
        nft.metadata?.image ||
        'https://via.placeholder.com/150',
    })) || [];

    return nfts;
  } catch (err) {
    console.error('❌ Error fetching NFTs from Alchemy:', err.message);
    return [];
  }
}
