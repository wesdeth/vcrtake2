// ENSProfile.js
import { useEffect, useState } from 'react';
import { getAddress, ethers } from 'ethers';
import { namehash } from 'viem';
import { getEnsData } from '../lib/ensUtils';
import { getPOAPs } from '../lib/poapUtils';
import { fetchAlchemyNFTs } from '../lib/nftUtils';
import ResumeModal from './ResumeModal';
import EditableBio from './EditableBio';
import ProfileCard from './ProfileCard';
import { FileText, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { useAccount, useConnect } from 'wagmi';
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
  const [customTitle, setCustomTitle] = useState('');
  const [customAvatar, setCustomAvatar] = useState('');

  const { address } = useAccount();
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

  useEffect(() => {
    async function fetchData() {
      const ens = ensName ? await getEnsData(ensName) : { address: connected };
      const poapList = ens.address ? await getPOAPs(ens.address) : [];
      const nftList = ens.address ? await fetchAlchemyNFTs(ens.address) : [];
      setEnsData(ens);
      setPoaps(poapList);
      setNfts(nftList);

      const { data } = await supabase.from('VCR').select('*').eq('ens_name', profileKey).single();
      if (data) {
        if (data.experience) setWorkExperience(data.experience);
        if (data.custom_title) setCustomTitle(data.custom_title);
        if (data.custom_avatar) setCustomAvatar(data.custom_avatar);
        setLastSaved(data.updated_at);
      }
    }
    if (profileKey) fetchData();
  }, [profileKey]);

  useEffect(() => {
    if (address) setConnected(address);
  }, [address]);

  useEffect(() => {
    async function checkOwnership() {
      if (!connected) return;
      if (isWalletOnly) {
        setOwnsProfile(true);
        return;
      }
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const hashedName = namehash(ensName);

        const registry = new ethers.Contract(ENS_REGISTRY, ENS_REGISTRY_ABI, provider);
        const wrapper = new ethers.Contract(NAME_WRAPPER, NAME_WRAPPER_ABI, provider);

        const registryOwner = await registry.owner(hashedName);
        let wrapperOwner = null;
        let ethRecord = null;

        try { wrapperOwner = await wrapper.ownerOf(BigInt(hashedName)); } catch {}
        try {
          const resolver = await provider.getResolver(ensName);
          ethRecord = resolver ? await resolver.getAddress() : null;
        } catch {}

        const manager = await registry.getApproved(hashedName);

        const normalizedConnected = getAddress(connected);
        const normalizedRegistry = getAddress(registryOwner);
        const normalizedWrapper = wrapperOwner ? getAddress(wrapperOwner) : null;
        const normalizedEthRecord = ethRecord ? getAddress(ethRecord) : null;
        const normalizedManager = manager ? getAddress(manager) : null;

        const owns =
          normalizedConnected === normalizedRegistry ||
          normalizedConnected === normalizedWrapper ||
          normalizedConnected === normalizedEthRecord ||
          normalizedConnected === normalizedManager;

        setOwnsProfile(owns);
      } catch (err) {
        console.error('❌ Ownership check failed:', err);
        setOwnsProfile(false);
      }
    }
    checkOwnership();
  }, [connected, ensName, isWalletOnly]);

  useEffect(() => {
    if (ownsProfile) handleSaveExperience();
  }, [customTitle, customAvatar]);

  const handleSaveExperience = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('VCR')
      .upsert({
        ens_name: profileKey,
        experience: workExperience,
        custom_title: customTitle,
        custom_avatar: customAvatar,
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

  const handleDownloadClick = async () => {
    toast.success('✨ Resume download coming soon!');
  };

  return <div>{/* ... unchanged UI rendering code ... */}</div>;
}
