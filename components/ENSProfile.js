// ENSProfile.js
import { useEffect, useState } from 'react';
import { getAddress, ethers } from 'ethers';
import { namehash } from 'viem';
import { getENSData } from '../lib/ensUtils';
import { getPOAPs } from '../lib/poapUtils';
import { fetchAlchemyNFTs } from '../lib/nftUtils';
import ConnectWallet from './ConnectWallet';
import EditableBio from './EditableBio';
import ResumeModal from './ResumeModal';
import { Pencil, BadgeCheck, FileText, Eye, Share2, ShieldCheck, Loader2, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip } from 'react-tooltip';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { useConnect } from 'wagmi';
import { injected, walletConnect } from 'wagmi/connectors';
import { loadStripe } from '@stripe/stripe-js';

const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const NAME_WRAPPER = '0x114D4603199df73e7D157787f8778E21fCd13066';
const ENS_REGISTRY_ABI = ['function owner(bytes32 node) external view returns (address)'];
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
  const [customName, setCustomName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('customName') || '';
    }
    return '';
  });
  const [editingName, setEditingName] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [workExperience, setWorkExperience] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const { connect } = useConnect();

  useEffect(() => {
    async function fetchData() {
      const ens = await getENSData(ensName);
      const poapList = ens.address ? await getPOAPs(ens.address) : [];
      const nftList = ens.address ? await fetchAlchemyNFTs(ens.address) : [];
      setEnsData(ens);
      setPoaps(poapList);
      setNfts(nftList);

      const { data } = await supabase.from('VCR').select('*').eq('ens_name', ensName).single();
      if (data && data.experience) {
        setWorkExperience(data.experience);
        setLastSaved(data.updated_at);
      }
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
        } catch {}

        try {
          const resolver = await provider.getResolver(ensName);
          ethRecord = resolver ? await resolver.getAddress() : null;
        } catch {}

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

  const handleSaveExperience = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('VCR')
      .upsert({ ens_name: ensName, experience: workExperience, updated_at: new Date().toISOString() });

    if (error) {
      console.error('❌ Supabase update failed:', error);
      toast.error('Failed to save experience');
    } else {
      toast.success('Experience saved!');
      setLastSaved(new Date().toISOString());
    }
    setSaving(false);
  };

  const resolvedAvatar =
    ensData.avatar && ensData.avatar.startsWith('http') ? ensData.avatar : '/Avatar.jpg';

  const profileLabel = ensName || customName || (connected && `${connected.slice(0, 6)}...${connected.slice(-4)}`);

  const handlePreviewClick = () => {
    if (!workExperience || workExperience.trim().length < 10) {
      alert('Please enter work experience before previewing your resume.');
      return;
    }
    setShowPreviewModal(true);
  };

  const handleDownloadClick = async () => {
    const isSubscriptionRequired = process.env.NEXT_PUBLIC_REQUIRE_SUBSCRIPTION === 'true';

    if (!ownsProfile) {
      toast.error('You must be the profile owner to download your resume.');
      return;
    }

    if (isSubscriptionRequired) {
      const res = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: connected, priceId: 'price_1RKtIvIpFYZ1F8gdS6fPLiJ9' }),
      });

      const data = await res.json();
      if (data.sessionId) {
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
      } else {
        toast.error('Failed to initiate Stripe checkout');
      }
    } else {
      toast.success('✨ Resume download coming soon!');
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/preview/${ensName}`;
    navigator.clipboard.writeText(link);
    toast.success('Profile link copied to clipboard!');
  };

  const isSubscriptionRequired = process.env.NEXT_PUBLIC_REQUIRE_SUBSCRIPTION === 'true';

  return (
    <>
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

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleDownloadClick}
        disabled={isSubscriptionRequired}
        className={`w-full flex items-center justify-center gap-2 py-3 font-bold text-white rounded-xl 
          ${isSubscriptionRequired ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-pink-500'} 
          shadow-lg hover:opacity-95 transition`}
      >
        <FileText size={18} /> Download PDF – $10
      </motion.button>
    </>
  );
}
