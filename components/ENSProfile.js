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
    <div className="min-h-screen bg-gradient-to-br from-[#f9f5ff] via-[#ecf4ff] to-[#fffbe6] flex justify-center items-start px-4 py-12">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-3xl p-8 space-y-6 border border-gray-200">
        <div className="flex justify-end">
          <ConnectWallet onConnect={setConnected} />
        </div>

        <div className="flex flex-col items-center text-center space-y-2">
          <img
            src={ensData.avatar || '/avatar.png'}
            alt="avatar"
            className="w-20 h-20 rounded-full border-4 border-purple-200 shadow"
          />
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-400">
            {ensName}
          </h1>
          <p className="text-sm text-gray-500">{ensData.name}</p>
          <div className="flex space-x-3 mt-1">
            {ensData.twitter && (
              <a
                href={`https://twitter.com/${ensData.twitter.replace('@', '')}`}
                target="_blank"
                className="text-blue-400 hover:opacity-80"
              >
                <img src="/icons/twitter.svg" className="w-5 h-5" alt="twitter" />
              </a>
            )}
            {ensData.website && (
              <a href={ensData.website} target="_blank" className="text-gray-600 hover:opacity-80">
                <img src="/icons/link.svg" className="w-5 h-5" alt="website" />
              </a>
            )}
          </div>
          {ensData.lookingForWork === 'true' && (
            <p className="mt-1 px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
              ✅ Open to Work
            </p>
          )}
        </div>

        <div className="text-center text-gray-700">
          {ownsProfile ? (
            <EditableBio initialBio={ensData.bio} />
          ) : (
            <p>{ensData.bio || 'Web3 builder passionate about decentralization ✨'}</p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {poaps.slice(0, 5).map((poap, idx) => (
            <img
              key={idx}
              src={poap.image_url}
              alt={poap.event.name}
              title={poap.event.name}
              className="w-10 h-10 rounded-full border border-gray-300 shadow-sm"
            />
          ))}
        </div>

        <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-900 text-sm p-4 rounded">
          {ensData.summary || `${ensName} is a recognized contributor in the Ethereum ecosystem. They've participated in top events like ETHGlobal and Gitcoin, and worked on meaningful DAO initiatives.`}
        </div>

        <div>
          <h2 className="text-lg font-bold text-purple-700 mb-2">Hackathons & Grants</h2>
          <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
            <li>🏆 Winner – ETHGlobal Tokyo 2024</li>
            <li>💸 Grant Recipient – Gitcoin Grants Round 18</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-purple-700 mb-2">DAO Roles & Attestations</h2>
          <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
            <li>🧾 Multisig signer – DeveloperDAO</li>
            <li>🔧 Core contributor – ENS DAO</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-purple-700 mb-2">NFTs</h2>
          <div className="grid grid-cols-3 gap-3">
            {nfts.length > 0 ? (
              nfts.slice(0, 3).map((nft, idx) => (
                <div key={idx} className="flex flex-col items-center text-center text-xs text-gray-600">
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="rounded-xl w-20 h-20 border border-gray-200 shadow-sm"
                  />
                  <p className="mt-1">{nft.name?.slice(0, 20) || 'NFT'}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">No NFTs found.</p>
            )}
          </div>
        </div>

        <button className="w-full py-3 mt-4 font-bold text-white rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow hover:opacity-90">
          🔒 Download PDF – $10
        </button>
      </div>
    </div>
  );
}
