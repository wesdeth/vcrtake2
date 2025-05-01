
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-yellow-50 flex justify-center py-10 px-4">
      <div className="max-w-2xl w-full bg-white shadow-2xl rounded-3xl p-8 space-y-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <ConnectWallet onConnect={setConnected} />
        </div>

        <div className="flex items-center gap-4">
          <img
            src={ensData.avatar || '/avatar.png'}
            alt="avatar"
            className="w-20 h-20 rounded-full border-4 border-purple-200 shadow-sm"
          />
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800">{ensName}</h1>
            <p className="text-sm text-gray-500">{ensData.name}</p>
            {ensData.website && (
              <a href={ensData.website} target="_blank" className="text-blue-500 hover:underline text-sm">
                {ensData.website}
              </a>
            )}
          </div>
        </div>

        {ownsProfile ? (
          <EditableBio initialBio={ensData.bio} />
        ) : (
          <p className="text-gray-700">{ensData.bio || 'Web3 builder passionate about decentralization ✨'}</p>
        )}

        {ensData.summary && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded">
            {ensData.summary}
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-2 text-purple-700">Hackathons & Grants</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
            <li>Winner - ETHGlobal Tokyo 2024</li>
            <li>Grant Recipient - Gitcoin Grants Round 18</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-purple-700">DAO Roles & Attestations</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
            <li>Multisig signer - DeveloperDAO</li>
            <li>Core contributor - ENS DAO</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-purple-700">NFTs</h2>
          <div className="grid grid-cols-3 gap-3">
            {nfts.slice(0, 3).map((nft, idx) => (
              <img
                key={idx}
                src={nft.image}
                alt={nft.name}
                className="rounded-lg border border-gray-200 shadow-sm"
              />
            ))}
          </div>
        </div>

        <div className="pt-4">
          <button className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold shadow-md hover:opacity-90">
            Download PDF – $10
          </button>
        </div>
      </div>
    </div>
  );
}
