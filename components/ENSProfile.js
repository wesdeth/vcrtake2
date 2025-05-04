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

  useEffect(() => {
    async function fetchData() {
      const ens = await getENSData(ensName);
      const poapList = ens.address ? await getPOAPs(ens.address) : [];
      const nftList = ens.address ? await fetchAlchemyNFTs(ens.address) : [];
      setEnsData(ens);
      setPoaps(poapList);
      setNfts(nftList);

      const { data, error } = await supabase.from('VCR').select('*').eq('ens_name', ensName).single();
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
    ensData.avatar && ensData.avatar.startsWith('http')
      ? ensData.avatar
      : '/Avatar.jpg';

  const profileLabel = ensName || customName || (connected && `${connected.slice(0, 6)}...${connected.slice(-4)}`);

  const handlePreviewClick = () => {
    if (!workExperience || workExperience.trim().length < 10) {
      alert('Please enter work experience before previewing your resume.');
      return;
    }
    setShowPreviewModal(true);
  };

  const handleDownloadClick = () => {
    if (ownsProfile) {
      alert('This will show a watermarked preview. Stripe + Wallet payments coming soon.');
    } else {
      alert('You must be the owner of this profile to download it.');
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/preview/${ensName}`;
    navigator.clipboard.writeText(link);
    toast.success('Profile link copied to clipboard!');
  };

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

      <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-900 shadow-xl rounded-3xl p-8 space-y-6 border border-gray-200 dark:border-gray-800">
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

          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handleCopyLink}
              className="flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              <Share2 size={14} /> Copy Profile Link
            </motion.button>
            <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-semibold">
              <ShieldCheck size={12} /> Verified Experience (coming soon)
            </span>
          </div>

          {ownsProfile ? (
            <div className="mt-4 w-full">
              <textarea
                rows={6}
                className="w-full text-sm border rounded-lg p-2"
                placeholder="Add your work experience here (required for resume preview)"
                value={workExperience}
                onChange={(e) => setWorkExperience(e.target.value)}
              ></textarea>
              <div className="flex justify-between items-center mt-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={saving}
                  onClick={handleSaveExperience}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md shadow-md disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Experience
                </motion.button>
                {lastSaved && (
                  <p className="text-xs text-gray-400 italic">Last saved: {new Date(lastSaved).toLocaleString()}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4 w-full text-center text-gray-400 text-sm italic">
              Only the ENS name owner or manager can add work experience.
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePreviewClick}
              className="w-full flex items-center justify-center gap-2 py-3 font-bold text-white rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 shadow-md hover:opacity-95"
            >
              <Eye size={18} /> Preview Resume
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadClick}
              className="w-full flex items-center justify-center gap-2 py-3 font-bold text-white rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 shadow-lg hover:shadow-xl hover:opacity-95 transition"
            >
              <FileText size={18} /> Download PDF – $10
            </motion.button>
          </div>
        </div>
      </div>
    </>
  );
}
