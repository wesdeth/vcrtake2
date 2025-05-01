import { useEffect, useState } from 'react';
import { getAddress, ethers } from 'ethers';
import { namehash } from 'viem'; // make sure viem is installed
import { getENSData } from '../lib/ensUtils';
import { getPOAPs } from '../lib/poapUtils';
import { getAlchemyNFTs } from '../lib/nftUtils';
import ConnectWallet from './ConnectWallet';
import EditableBio from './EditableBio';

const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const ENS_REGISTRY_ABI = ['function owner(bytes32 node) external view returns (address)'];

export default function ENSProfile({ ensName }) {
  const [ensData, setEnsData] = useState({});
  const [poaps, setPoaps] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [connected, setConnected] = useState(null);
  const [ownsProfile, setOwnsProfile] = useState(false);

  // Fetch ENS + POAPs + NFTs
  useEffect(() => {
    async function fetchData() {
      const ens = await getENSData(ensName);
      const poapList = ens.address ? await getPOAPs(ens.address) : [];
      const nftList = ens.address ? await getAlchemyNFTs(ens.address) : [];
      setEnsData(ens);
      setPoaps(poapList);
      setNfts(nftList);
    }
    fetchData();
  }, [ensName]);

  // Check profile ownership via ENS Registry
  useEffect(() => {
    async function checkOwnership() {
      console.log("🔑 Checking profile access:");
      console.log("Connected address:", connected);
      console.log("ENS name:", ensName);

      if (!connected || !ensName || !ensName.endsWith('.eth')) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const ensRegistry = new ethers.Contract(ENS_REGISTRY, ENS_REGISTRY_ABI, provider);
        const hashedName = namehash(ensName);

        const ensOwner = await ensRegistry.owner(hashedName);
        const normalizedConnected = getAddress(connected);
        const normalizedENSOwner = getAddress(ensOwner);

        const owns = normalizedConnected === normalizedENSOwner;
        console.log("✅ ENS Registry owner:", normalizedENSOwner);
        console.log("✅ Connected wallet:", normalizedConnected);
        console.log("🔐 Owns profile via registry:", owns);

        setOwnsProfile(owns);
      } catch (err) {
        console.error("❌ ENS registry check failed:", err);
        setOwnsProfile(false);
      }
    }

    checkOwnership();
  }, [connected, ensName]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9f5ff] via-[#ecf4ff] to-[#fffbe6] flex justify-center items-start px-4 py-12">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-3xl p-8 space-y-6 border border-gray-200">

        {/* Wallet Connection */}
        <div className="flex justify-end">
          <ConnectWallet onConnect={setConnected} />
        </div>

        {/* Profile Header */}
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
              <a href={`https://twitter.com/${ensData.twitter.replace('@', '')}`} target="_blank" rel="noreferrer">
                <img src="/icons/twitter.svg" className="w-5 h-5" alt="Twitter" />
              </a>
            )}
            {ensData.website && (
              <a href={ensData.website} target="_blank" rel="noreferrer">
                <img src="/icons/link.svg" className="w-5 h-5" alt="Website" />
              </a>
            )}
          </div>

          {ensData.lookingForWork === 'true' && (
            <p className="mt-1 px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
              ✅ Open to Work
            </p>
          )}
        </div>

        {/* Bio / Editable */}
        <div className="text-center text-gray-700">
          {ownsProfile ? (
            <EditableBio
              ensName={ensName}
              connectedAddress={connected}
              initialBio={ensData.bio}
              initialLooking={ensData.lookingForWork === 'true'}
            />
          ) : connected ? (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
              <p>You are not the owner of this ENS name or wallet.</p>
              <p className="text-xs mt-1">Make sure you're connected with the correct wallet to edit this profile.</p>
            </div>
          ) : (
            <p>{ensData.bio || 'Web3 builder passionate about decentralization ✨'}</p>
          )}
        </div>

        {/* POAPs */}
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

        {/* AI Summary */}
        <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-900 text-sm p-4 rounded">
          {ensData.summary || `${ensName} is a recognized contributor in the Ethereum ecosystem. They've participated in top events like ETHGlobal and Gitcoin, and worked on meaningful DAO initiatives.`}
        </div>

        {/* Roles / Grants / NFTs */}
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

        {/* CTA */}
        <button className="w-full py-3 mt-4 font-bold text-white rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow hover:opacity-90">
          🔒 Download PDF – $10
        </button>
      </div>
    </div>
  );
}
