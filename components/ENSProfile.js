
import { useEffect, useState, useRef } from 'react';
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
  const contentRef = useRef(null);

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
    <div className="bg-white w-full max-w-xl rounded-xl shadow-lg p-6 space-y-6">
      <ConnectWallet onConnect={setConnected} />

      <div className="flex items-center space-x-4">
        <img src={ensData.avatar || '/avatar.png'} alt="avatar" className="w-16 h-16 rounded-full border border-gray-300" />
        <div>
          <h1 className="text-2xl font-bold">{ensName}</h1>
          <p className="text-gray-600">{ensData.twitter || '@username'}</p>
          <a href={ensData.website || '#'} className="text-blue-600 text-sm">{ensData.website || 'website.link'}</a>
        </div>
      </div>

      {ownsProfile ? (
        <EditableBio initialBio={ensData.bio} />
      ) : (
        <p className="text-gray-700">{ensData.bio || 'Web3 builder passionate about decentralization ✨'}</p>
      )}

      <div className="flex space-x-2 overflow-x-auto">
        {poaps.map((poap, idx) => (
          <img key={idx} src={poap.image_url} alt={poap.event.name} title={poap.event.name} className="w-12 h-12" />
        ))}
      </div>

      <div className="bg-yellow-100 text-yellow-800 text-sm rounded p-4">
        {ensData.summary || 'This person is a skilled contributor in the Ethereum ecosystem with participation in major Web3 events.'}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Hackathons & Grants</h2>
        <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
          <li>Winner - ETHGlobal Tokyo 2024</li>
          <li>Grant Recipient - Gitcoin Grants Round 18</li>
        </ul>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">DAO Roles & Attestations</h2>
        <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
          <li>Multisig signer - DeveloperDAO</li>
          <li>Core contributor - ENS DAO</li>
        </ul>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">NFTs</h2>
        <div className="grid grid-cols-3 gap-3">
          {nfts.slice(0, 3).map((nft, idx) => (
            <img key={idx} src={nft.image} alt={nft.name} className="rounded shadow border" />
          ))}
        </div>
      </div>
    </div>
  );
}
