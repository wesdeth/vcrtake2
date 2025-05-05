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

  const resolvedAvatar = customAvatar || (ensData.avatar && ensData.avatar.startsWith('http') ? ensData.avatar : '/Avatar.jpg');
  const efpLink = ensData.address ? `https://efp.social/profile/${ensData.address}` : '';

  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Comic+Relief&display=swap" rel="stylesheet" />
        <style>{`body { font-family: 'Comic Relief', cursive; }`}</style>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-[#e0e7ff] via-[#f3e8ff] to-[#ffe4e6] p-4">
        <div className="flex justify-between mb-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm bg-white/90 backdrop-blur border border-gray-300 px-4 py-2 rounded-full shadow-md hover:bg-white hover:border-gray-400 transition-all"
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>

          {!isConnected ? (
            <button
              onClick={() => connect()}
              className="text-sm bg-white/90 backdrop-blur border border-gray-300 px-4 py-2 rounded-full shadow-md hover:bg-white hover:border-gray-400 transition-all"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-white/90 border border-gray-300 px-3 py-2 rounded-full shadow-md">
              <img src={resolvedAvatar} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
              <span className="text-sm font-medium text-gray-800">
                {ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
              </span>
              <button onClick={() => disconnect()} className="text-gray-500 hover:text-red-500">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={36} className="animate-spin text-purple-600" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex justify-center"
          >
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
          </motion.div>
        )}

        {!ownsProfile && !isConnected && (
          <div className="text-center text-gray-500 mt-6">
            <AlertCircle className="inline mr-2 text-red-500" />
            Connect wallet to edit this profile
          </div>
        )}

        {showPreviewModal && (
          <ResumeModal
            ensName={ensName}
            poaps={poaps}
            nfts={nfts}
            bio={ensData.bio}
            avatar={resolvedAvatar}
            experience={workExperience}
            onClose={() => setShowPreviewModal(false)}
          />
        )}

        {showDownloadModal && (
          <ResumeDownloadModal
            ensName={ensName}
            poaps={poaps}
            nfts={nfts}
            bio={ensData.bio}
            avatar={resolvedAvatar}
            experience={workExperience}
            onClose={() => setShowDownloadModal(false)}
          />
        )}
      </div>
    </>
  );
}
