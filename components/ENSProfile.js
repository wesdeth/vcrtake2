
import { useEffect, useState } from 'react';
import { getENSData } from '../lib/ensUtils';
import { getPOAPs } from '../lib/poapUtils';
import { getAlchemyNFTs } from '../lib/nftUtils';
import ConnectWallet from './ConnectWallet';
import EditableBio from './EditableBio';

export default function ENSProfile({ ensName }) {
  const [ensData, setEnsData] = useState({});
  const [poaps, setPoaps] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [connected, setConnected] = useState(null);
  const [ownsProfile, setOwnsProfile] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const ens = await getENSData(ensName);
      const poapList = await getPOAPs(ens.address);
      const nftList = await getAlchemyNFTs(ens.address);
      setEnsData(ens);
      setPoaps(poapList);
      setNfts(nftList);
    }
    fetchData();
  }, [ensName]);

  useEffect(() => {
    if (connected && ensData.address) {
      setOwnsProfile(connected.toLowerCase() === ensData.address.toLowerCase());
    }
  }, [connected, ensData]);

  return (
    <div className="min-h-screen bg-[#fafafa] flex justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl shadow-xl bg-white p-6 space-y-6 border border-gray-200">
        <div className="flex justify-end">
          <ConnectWallet onConnect={setConnected} />
        </div>

        <div className="flex items-center gap-4">
          <img
            src={ensData.avatar || '/avatar.png'}
            alt="avatar"
            className="w-20 h-20 rounded-full border-4 border-blue-200 shadow"
          />
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">{ensName}</h1>
            <p className="text-sm text-gray-500">{ensData.name}</p>
            {ensData.website && (
              <a href={ensData.website} target="_blank" className="text-blue-500 hover:underline text-sm">
                {ensData.website}
              </a>
            )}
            <div className="flex items-center gap-2 mt-1">
              {ensData.twitter && (
                <a href={`https://twitter.com/${ensData.twitter.replace('@', '')}`} target="_blank" className="text-blue-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.954 4.569c-.885.389-1.83.654-2.825.775..."/></svg>
                </a>
              )}
              {ensData.website && (
                <a href={ensData.website} target="_blank" className="text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5"/></svg>
                </a>
              )}
            </div>
          </div>
        </div>

        {ownsProfile ? (
          <EditableBio initialBio={ensData.bio} />
        ) : (
          <p className="text-gray-700">{ensData.bio || 'Web3 builder passionate about decentralization ✨'}</p>
        )}

        <div className="flex flex-wrap gap-2">
          {poaps.slice(0, 5).map((poap, idx) => (
            <img
              key={idx}
              src={poap.image_url}
              alt={poap.event.name}
              title={poap.event.name}
              className="w-10 h-10 rounded-full border shadow-sm"
            />
          ))}
        </div>

        {ensData.summary && (
          <div className="bg-yellow-100 text-sm text-yellow-800 p-4 rounded-lg">
            {ensData.summary}
          </div>
        )}

        <div>
          <h2 className="text-md font-semibold text-gray-700 mb-2">Hackathons & Grants</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
            <li>Winner – ETHGlobal Tokyo 2024</li>
            <li>Grant Recipient – Gitcoin Grants Round 18</li>
          </ul>
        </div>

        <div>
          <h2 className="text-md font-semibold text-gray-700 mb-2">DAO Roles & Attestations</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
            <li>Multisig signer – DeveloperDAO</li>
            <li>Core contributor – ENS DAO</li>
          </ul>
        </div>

        <div>
          <h2 className="text-md font-semibold text-gray-700 mb-2">NFTs</h2>
          <div className="grid grid-cols-3 gap-2">
            {nfts.slice(0, 3).map((nft, idx) => (
              <div key={idx} className="flex flex-col items-center text-center text-xs text-gray-600">
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="rounded-lg w-20 h-20 border border-gray-200 shadow"
                />
                <p className="mt-1">{nft.name?.slice(0, 18) || 'NFT'}</p>
              </div>
            ))}
          </div>
        </div>

        <button className="w-full py-3 mt-4 text-white font-bold rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow hover:opacity-90">
          Download PDF – $10
        </button>
      </div>
    </div>
  );
}
