// components/NFTDisplay.js
export default function NFTDisplay({ nfts = [] }) {
  if (!nfts.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {nfts.map((nft, idx) => (
        <div
          key={nft.contractAddress + idx}
          className="bg-white rounded-xl shadow-md border p-4 hover:shadow-lg transition-all"
        >
          <img
            src={nft.image_url || nft.image || '/default-nft.png'}
            alt={nft.name || 'NFT'}
            className="w-full h-48 object-contain rounded"
          />
          <div className="mt-3">
            <h3 className="text-lg font-semibold">{nft.name || 'Unnamed NFT'}</h3>
            {nft.collection && (
              <p className="text-sm text-gray-600">{nft.collection}</p>
            )}
            {nft.description && (
              <p className="text-sm text-gray-700 mt-2 line-clamp-3">{nft.description}</p>
            )}
            {nft.external_url && (
              <a
                href={nft.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 text-sm text-blue-600 hover:underline"
              >
                View NFT ↗
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
