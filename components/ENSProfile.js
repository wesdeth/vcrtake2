// ENSProfile.js

import { useEffect, useState, useCallback, useMemo } from 'react';
import { getAddress, ethers } from 'ethers';
import { namehash } from 'viem';
import { getEnsData } from '../lib/ensUtils';
import { getPOAPs } from '../lib/poapUtils';
import { fetchAlchemyNFTs } from '../lib/nftUtils';
import ResumeModal from './ResumeModal';
import ResumeDownloadModal from './ResumeDownloadModal';
import EditableBio from './EditableBio';
import ProfileCard from './ProfileCard';
import { FileText, Loader2, AlertCircle, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';

const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const NAME_WRAPPER = '0x114D4603199df73e7D157787f8778E21fCd13066';
const ENS_REGISTRY_ABI = [
  'function owner(bytes32 node) external view returns (address)',
  'function getApproved(bytes32 node) external view returns (address)',
  'function resolver(bytes32 node) external view returns (address)',
  'function setOwner(bytes32 node, address owner) external'
];
const NAME_WRAPPER_ABI = ['function ownerOf(uint256 id) external view returns (address)'];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ENSProfile({ ensName }) {
  const [ensData, setEnsData] = useState({});
  const [poaps, setPoaps] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [connected, setConnected] = useState(null);
  const [ownsProfile, setOwnsProfile] = useState(false);
  const [workExperience, setWorkExperience] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customAvatar, setCustomAvatar] = useState('');
  const [farcaster, setFarcaster] = useState('');

  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const provider = useMemo(() => new ethers.BrowserProvider(window.ethereum), []);

  const { connect } = useConnect({
    connector: new WalletConnectConnector({
      options: {
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
        showQrModal: true,
      },
    }),
  });

  const isWalletOnly = !ensName && !!connected;
  const profileKey = ensName || connected;

  const fetchData = useCallback(async () => {
    const ens = ensName ? await getEnsData(ensName) : { address: connected };
    const poapList = ens.address ? await getPOAPs(ensName || ens.address) : [];
    const nftList = ens.address ? await fetchAlchemyNFTs(ens.address) : [];
    setEnsData(ens);
    setPoaps(poapList);
    setNfts(nftList);

    const { data } = await supabase.from('VCR').select('*').eq('ens_name', profileKey).single();
    if (data) {
      if (data.experience) setWorkExperience(data.experience);
      if (data.custom_title) setCustomTitle(data.custom_title);
      if (data.custom_avatar) setCustomAvatar(data.custom_avatar);
      if (data.farcaster) setFarcaster(data.farcaster);
      setLastSaved(data.updated_at);
    }
  }, [connected, ensName, profileKey]);

  useEffect(() => {
    if (profileKey) fetchData();
  }, [fetchData, profileKey]);

  useEffect(() => {
    if (address) setConnected(address);
  }, [address]);

  useEffect(() => {
    const checkOwnership = async () => {
      if (!connected) return;
      if (isWalletOnly) return setOwnsProfile(true);

      try {
        const hashedName = namehash(ensName);
        const registry = new ethers.Contract(ENS_REGISTRY, ENS_REGISTRY_ABI, provider);
        const wrapper = new ethers.Contract(NAME_WRAPPER, NAME_WRAPPER_ABI, provider);

        const [registryOwner, manager] = await Promise.all([
          registry.owner(hashedName),
          registry.getApproved(hashedName),
        ]);

        let wrapperOwner = null;
        let ethRecord = null;

        try { wrapperOwner = await wrapper.ownerOf(BigInt(hashedName)); } catch {}
        try {
          const resolver = await provider.getResolver(ensName);
          ethRecord = resolver ? await resolver.getAddress() : null;
        } catch {}

        const connectedNorm = getAddress(connected);
        const owns = [registryOwner, wrapperOwner, ethRecord, manager]
          .filter(Boolean)
          .map(getAddress)
          .includes(connectedNorm);

        setOwnsProfile(owns);
      } catch (err) {
        console.error('❌ Ownership check failed:', err);
        setOwnsProfile(false);
      }
    };
    checkOwnership();
  }, [connected, ensName, isWalletOnly, provider]);

  const handleSaveExperience = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('VCR')
      .upsert({
        ens_name: profileKey,
        experience: workExperience,
        custom_title: customTitle,
        custom_avatar: customAvatar,
        farcaster,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('❌ Supabase update failed:', error);
      toast.error('Failed to save experience');
    } else {
      toast.success('Profile saved!');
      setLastSaved(new Date().toISOString());
    }
    setSaving(false);
  };

  const resolvedAvatar =
    customAvatar || (ensData.avatar && ensData.avatar.startsWith('http') ? ensData.avatar : '/Avatar.jpg');

  const efpLink = ensData.address ? `https://efp.social/profile/${ensData.address}` : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e0e7ff] via-[#f3e8ff] to-[#ffe4e6] p-4">
      <div className="flex justify-end mb-4">
        {!isConnected ? (
          <button
            onClick={() => connect()}
            className="text-sm bg-white/90 backdrop-blur border border-gray-300 px-4 py-2 rounded-full shadow-md hover:bg-white hover:border-gray-400 transition-all"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-white/90 border border-gray-300 px-3 py-2 rounded-full shadow-md">
            <img
              src={resolvedAvatar || '/Avatar.jpg'}
              alt="avatar"
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-sm font-medium text-gray-800">
              {ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
            </span>
            <button onClick={() => disconnect()} className="text-gray-500 hover:text-red-500">
              <LogOut size={16} />
            </button>
          </div>
        )}

      <div className="flex justify-center">
        <ProfileCard
          data={{
            name: ensName || address,
            address: ensData.address || address,
            avatar: resolvedAvatar,
            bio: ensData.bio || '',
            twitter: ensData.twitter || '',
            website: ensData.website || '',
            tag: ensData.tag || (address === '0x0c07...95cE' ? 'Admin' : 'Active Builder'),
            efpLink,
            farcaster
          }}
          onUpdateFarcaster={(newLink) => setFarcaster(newLink)}
        />
      </div>

      {!ownsProfile && !isConnected && (
        <div className="text-center text-gray-500 mt-6">
          <AlertCircle className="inline mr-2 text-red-500" />
          Connect wallet to edit this profile
        </div>
      )}

      {ownsProfile && (
        <div className="max-w-2xl mx-auto mt-6">
          <EditableBio
            ensName={profileKey}
            connectedAddress={address}
            initialBio={ensData.bio}
            initialLooking={ensData.lookingForWork === 'true'}
            showAIGenerator={true}
          />
        </div>
      )}

      <div className="max-w-2xl mx-auto mt-10 px-4">
        <h3 className="text-lg font-bold text-purple-700 mb-2">Work Experience</h3>
        {ownsProfile ? (
          <>
            <textarea
              value={workExperience}
              onChange={(e) => setWorkExperience(e.target.value)}
              placeholder="Share your experience..."
              className="w-full h-32 p-3 rounded-lg border border-gray-300 bg-white text-sm"
            />
            <div className="flex justify-between mt-2">
              <button
                onClick={handleSaveExperience}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {saving ? <Loader2 size={16} className="animate-spin inline-block" /> : 'Save'}
              </button>
              {lastSaved && (
                <p className="text-sm text-gray-500 italic">
                  Last saved: {new Date(lastSaved).toLocaleString()}
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="text-gray-600 italic">{workExperience || 'No experience listed yet.'}</p>
        )}
      </div>

      <div className="max-w-2xl mx-auto mt-10 px-4">
        <h3 className="text-lg font-bold text-purple-700 mb-2">POAPs</h3>
        {poaps.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {poaps.slice(0, 6).map((poap, i) => (
              <a
                key={i}
                href={poap.event_url}
                target="_blank"
                rel="noopener noreferrer"
                title={poap.name}
              >
                <img
                  src={poap.image_url}
                  alt={poap.name || 'POAP'}
                  className="w-14 h-14 rounded-full border shadow hover:scale-110 transition duration-200"
                />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No POAPs found.</p>
        )}
      </div>

      <div className="flex justify-center mt-6">
        {nfts.length > 0 && (
          <a
            href={`https://opensea.io/${nfts[0].contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow hover:opacity-90"
          >
            ↗ View NFTs on OpenSea
          </a>
        )}
      </div>

      <div className="w-full mt-10 mb-20 px-4">
        <div className="flex flex-col gap-4 max-w-2xl mx-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDownloadModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 font-bold text-white rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 shadow-lg hover:opacity-95 border border-white/30"
          >
            <FileText size={18} /> Download VCR PDF
          </motion.button>
          <p className="text-center text-xs text-gray-500 italic">
            A Verified Chain Resume: Designed for Web3 verification & hiring, backed by ENS, POAP, & onchain data.
          </p>
        </div>
      </div>
    </div>
  );
}
