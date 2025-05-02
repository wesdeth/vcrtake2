import { useEffect, useState } from 'react';
import { getAddress, ethers } from 'ethers';
import { namehash } from 'viem';
import { getENSData } from '../lib/ensUtils';
import { getPOAPs } from '../lib/poapUtils';
import { getAlchemyNFTs } from '../lib/nftUtils';
import ConnectWallet from './ConnectWallet';
import EditableBio from './EditableBio';
import { Pencil, BadgeCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip } from 'react-tooltip';

const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const NAME_WRAPPER = '0x114D4603199df73e7D157787f8778E21fCd13066';

const ENS_REGISTRY_ABI = ['function owner(bytes32 node) external view returns (address)'];
const NAME_WRAPPER_ABI = ['function ownerOf(uint256 id) external view returns (address)'];

export default function ENSProfile({ ensName }) {
  const [ensData, setEnsData] = useState({});
  const [poaps, setPoaps] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [connected, setConnected] = useState(null);
  const [ownsProfile, setOwnsProfile] = useState(false);
  const [customName, setCustomName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('customName') || '';
    }
    return '';
  });
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const ens = await getENSData(ensName);
      const poapList = ens.address ? await getPOAPs(ens.address) : [];
      const nftList = ens.address ? await getAlchemyNFTs(ens.address) : [];
      setEnsData(ens);
      setPoaps(poapList);
      setNfts(nftList);
    }
    if (ensName) fetchData();
  }, [ensName]);

  useEffect(() => {
    async function checkOwnership() {
      if (!connected || !ensName || !ensName.endsWith('.eth')) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const hashedName = namehash(ensName);

        const registry = new ethers.Contract(ENS_REGISTRY, ENS_REGISTRY_ABI, provider);
        const wrapper = new ethers.Contract(NAME_WRAPPER, NAME_WRAPPER_ABI, provider);

        const registryOwner = await registry.owner(hashedName);
        let wrapperOwner = null;
        let ethRecord = null;

        try {
          wrapperOwner = await wrapper.ownerOf(BigInt(hashedName));
        } catch (e) {
          console.log('Not a wrapped name or wrapper check failed.');
        }

        try {
          const resolver = await provider.getResolver(ensName);
          ethRecord = resolver ? await resolver.getAddress() : null;
        } catch (e) {
          console.log('Resolver or addr() check failed.');
        }

        const normalizedConnected = getAddress(connected);
        const normalizedRegistry = getAddress(registryOwner);
        const normalizedWrapper = wrapperOwner ? getAddress(wrapperOwner) : null;
        const normalizedEthRecord = ethRecord ? getAddress(ethRecord) : null;

        const owns =
          normalizedConnected === normalizedRegistry ||
          normalizedConnected === normalizedWrapper ||
          normalizedConnected === normalizedEthRecord;

        setOwnsProfile(owns);
      } catch (err) {
        console.error('❌ Ownership check failed:', err);
        setOwnsProfile(false);
      }
    }

    checkOwnership();
  }, [connected, ensName]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('customName', customName);
    }
  }, [customName]);

  const resolvedAvatar =
    ensData.avatar && ensData.avatar.startsWith('http')
      ? ensData.avatar
      : '/Avatar.jpg';

  const profileLabel = ensName || customName || (connected && `${connected.slice(0, 6)}...${connected.slice(-4)}`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef7ff] via-[#eaf4ff] to-[#fffbe7] flex justify-center items-start px-4 py-12">
      <div className="w-full max-w-md bg-white shadow-xl rounded-3xl p-8 space-y-6 border border-gray-200">
        <div className="flex justify-end">
          <ConnectWallet onConnect={setConnected} />
        </div>

        <div className="flex flex-col items-center text-center space-y-3">
          <motion.img
            src={resolvedAvatar}
            alt="avatar"
            onError={(e) => { e.target.onerror = null; e.target.src = '/Avatar.jpg'; }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-24 h-24 rounded-full border-4 border-purple-300 shadow-md"
          />

          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-400">
              {profileLabel}
            </h1>
            {connected && (
              <motion.button
                onClick={() => setEditingName(!editingName)}
                whileHover={{ rotate: -10, scale: 1.3 }}
                whileTap={{ scale: 0.95 }}
                className="text-blue-600 hover:text-blue-800 transition-transform duration-300"
                data-tooltip-id="editNameTooltip"
                data-tooltip-content="Click to edit name"
              >
                <Pencil size={18} />
              </motion.button>
            )}
            <Tooltip id="editNameTooltip" />
          </div>

          {editingName && (
            <input
              type="text"
              placeholder="Enter a custom profile name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="mt-1 px-3 py-2 border rounded-lg w-full text-sm"
            />
          )}

          <div className="flex justify-center items-center gap-3 mt-2">
            {ensData.twitter && (
              <a href={`https://twitter.com/${ensData.twitter.replace('@', '')}`} target="_blank" rel="noreferrer">
                <motion.img whileHover={{ scale: 1.2 }} src="/icons/twitter.svg" className="w-6 h-6" alt="Twitter" />
              </a>
            )}
            {ensData.website && (
              <a href={ensData.website} target="_blank" rel="noreferrer">
                <motion.img whileHover={{ scale: 1.2 }} src="/icons/link.svg" className="w-6 h-6" alt="Website" />
              </a>
            )}
            {ownsProfile && (
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                <BadgeCheck size={14} /> Verified Owner
              </span>
            )}
          </div>

          {ensData.lookingForWork === 'true' && (
            <motion.p
              className="mt-1 px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              ✅ Open to Work
            </motion.p>
          )}
        </div>

        <div className="text-center text-gray-700">
          {ownsProfile ? (
            <EditableBio
              ensName={ensName}
              connectedAddress={connected}
              initialBio={ensData.bio}
              initialLooking={ensData.lookingForWork === 'true'}
              showAIGenerator={true}
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

        <div className="flex flex-wrap justify-center gap-3">
          {poaps.slice(0, 5).map((poap, idx) => (
            <motion.img
              whileHover={{ scale: 1.15, boxShadow: '0 0 10px #ffb703' }}
              key={idx}
              src={poap.image_url}
              alt={poap.event.name}
              title={poap.event.name}
              className="w-10 h-10 rounded-full border border-gray-300 shadow-sm"
            />
          ))}
        </div>

        <div className="bg-yellow-100 border-l-4 border-yellow-400 text-yellow-900 text-sm p-4 rounded">
          {ensData.summary || `${profileLabel} is a recognized contributor in the Ethereum ecosystem. They've participated in top events like ETHGlobal and Gitcoin, and worked on meaningful DAO initiatives.`}
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-purple-700 mb-2">Hackathons & Grants</h2>
          <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
            <li>🏆 Winner – ETHGlobal Tokyo 2024</li>
            <li>💸 Grant Recipient – Gitcoin Grants Round 18</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-purple-700 mb-2">DAO Roles & Attestations</h2>
          <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
            <li>🧾 Multisig signer – DeveloperDAO</li>
            <li>🔧 Core contributor – ENS DAO</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-purple-700 mb-2">NFTs</h2>
          <div className="grid grid-cols-3 gap-3">
            {nfts.length > 0 ? (
              nfts.slice(0, 3).map((nft, idx) => (
                <motion.div
                  key={idx}
                  className="flex flex-col items-center text-center text-xs text-gray-600"
                  whileHover={{ scale: 1.08, boxShadow: '0 0 8px #999' }}
                >
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="rounded-xl w-20 h-20 border border-gray-200 shadow-sm"
                  />
                  <p className="mt-1 font-semibold">{nft.name?.slice(0, 20) || 'NFT'}</p>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-gray-400">No NFTs found.</p>
            )}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 mt-6 font-bold text-white rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 shadow hover:opacity-90"
        >
          🔒 Download PDF – $10
        </motion.button>
      </div>
    </div>
  );
}
 
