// ENSProfile.js
import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getAddress, ethers } from 'ethers';
import { namehash } from 'viem';
import { getEnsData } from '../lib/ensUtils';
import { getPOAPs } from '../lib/poapUtils';
import { fetchAlchemyNFTs } from '../lib/nftUtils';
import ResumeModal from './ResumeModal';
import ResumeDownloadModal from './ResumeDownloadModal';
import EditableBio from './EditableBio';
import ProfileCard from './ProfileCard';
import POAPDisplay from './POAPDisplay';
import NFTDisplay from './NFTDisplay';
import { FileText, Loader2, AlertCircle, LogOut, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import Head from 'next/head';

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
  const [loading, setLoading] = useState(true);

  const { address, isConnected } = useAccount();
  const { connect } = useConnect({ connector: new InjectedConnector() });
  const { disconnect } = useDisconnect();
  const provider = useMemo(() => new ethers.BrowserProvider(window.ethereum), []);

  const isWalletOnly = !ensName && !!connected;
  const profileKey = ensName || connected;

  const fetchData = useCallback(async () => {
    setLoading(true);
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
    setLoading(false);
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

  const handleInputSave = async (field, value) => {
    const updates = {
      ens_name: profileKey,
      updated_at: new Date().toISOString(),
    };
    updates[field] = value;

    const { error } = await supabase.from('VCR').upsert(updates);
    if (error) {
      toast.error(`❌ Failed to save ${field}`);
    } else {
      toast.success(`✅ ${field.charAt(0).toUpperCase() + field.slice(1)} saved!`);
    }
  };

  const resolvedAvatar = customAvatar || (ensData.avatar && ensData.avatar.startsWith('http') ? ensData.avatar : '/Avatar.jpg');
  const efpLink = ensData.address ? `https://efp.social/profile/${ensData.address}` : '';
  const openSeaLink = nfts.length > 0 ? `https://opensea.io/${ensData.address}` : null;

  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Comic+Relief&display=swap" rel="stylesheet" />
        <style>{`body { font-family: 'Comic Relief', cursive; }`}</style>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-[#e0e7ff] via-[#f3e8ff] to-[#ffe4e6] p-4">
        {/* ... wallet controls and header ... */}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={36} className="animate-spin text-purple-600" />
          </div>
        ) : (
          <>
            <motion.div className="flex justify-center">
              <ProfileCard
                data={{
                  name: ensName || address,
                  address: ensData.address || address,
                  avatar: resolvedAvatar,
                  bio: ensData.bio || '',
                  twitter: ensData.twitter || '',
                  website: ensData.website || '',
                  tag: ensData.tag || 'Active Builder',
                  efpLink,
                  farcaster
                }}
              />
            </motion.div>

            {ownsProfile && (
              <div className="max-w-2xl mx-auto mt-6 space-y-4">
                <EditableBio
                  ensName={profileKey}
                  connectedAddress={address}
                  initialBio={ensData.bio}
                  initialLooking={ensData.lookingForWork === 'true'}
                  showAIGenerator={true}
                />

                <input type="text" value={customTitle} onChange={(e) => { setCustomTitle(e.target.value); handleInputSave('custom_title', e.target.value); }} placeholder="Custom Title" />
                <input type="text" value={customAvatar} onChange={(e) => { setCustomAvatar(e.target.value); handleInputSave('custom_avatar', e.target.value); }} placeholder="Avatar URL" />
                <input type="text" value={farcaster} onChange={(e) => { setFarcaster(e.target.value); handleInputSave('farcaster', e.target.value); }} placeholder="Farcaster" />
                <textarea value={workExperience} onChange={(e) => { setWorkExperience(e.target.value); handleInputSave('experience', e.target.value); }} placeholder="Work experience" />
              </div>
            )}

            <div className="max-w-4xl mx-auto mt-10">
              <POAPDisplay poaps={poaps} />
              <NFTDisplay nfts={nfts} />
              {openSeaLink && (
                <div className="text-center mt-4">
                  <a href={openSeaLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    View NFTs on OpenSea ↗
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
