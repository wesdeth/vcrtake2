import { useEffect, useState } from 'react';
import { getAddress, ethers } from 'ethers';
import { namehash } from 'viem';
import { getENSData } from '../lib/ensUtils';
import { getPOAPs } from '../lib/poapUtils';
import { fetchAlchemyNFTs } from '../lib/nftUtils';
import ResumeModal from './ResumeModal';
import EditableBio from './EditableBio';
import ProfileCard from './ProfileCard';
import { FileText, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { useConnect } from 'wagmi';

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

  const handlePreviewClick = () => {
    if (!workExperience || workExperience.trim().length < 10) {
      alert('Please enter work experience before previewing your resume.');
      return;
    }
    setShowPreviewModal(true);
  };

  const handleDownloadClick = async () => {
    toast.success('✨ Resume download coming soon!');
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

      {/* 🪪 ProfileCard Section */}
      <div className="flex justify-center my-10">
        <ProfileCard
          data={{
            name: ensName,
            address: ensData.address,
            avatar: resolvedAvatar,
            bio: ensData.bio || '',
            twitter: ensData.twitter || '',
            website: ensData.website || '',
            tag: 'Active Builder',
          }}
        />
      </div>

      {/* 🔧 Editable bio if owner */}
      {ownsProfile && (
        <div className="max-w-2xl mx-auto mt-6 px-4">
          <EditableBio
            ensName={ensName}
            initialBio={ensData.bio}
            onUpdate={(newBio) => setEnsData(prev => ({ ...prev, bio: newBio }))}
          />
        </div>
      )}

      {/* 📜 Work Experience */}
      <div className="max-w-2xl mx-auto mt-8 px-4">
        <h3 className="text-lg font-semibold mb-2">Work Experience</h3>
        {ownsProfile ? (
          <>
            <textarea
              value={workExperience}
              onChange={(e) => setWorkExperience(e.target.value)}
              placeholder="Share your experience..."
              className="w-full h-32 p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            />
            <div className="flex justify-between mt-2">
              <button
                onClick={handleSaveExperience}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
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
          <p className="text-gray-600 dark:text-gray-300">{workExperience || 'No experience listed yet.'}</p>
        )}
      </div>

      {/* 🏅 POAPs */}
      <div className="max-w-2xl mx-auto mt-10 px-4">
        <h3 className="text-lg font-semibold mb-3">POAPs</h3>
        {poaps.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {poaps.slice(0, 6).map((poap, i) => (
              <img
                key={i}
                src={poap.image_url}
                alt={poap.event.name}
                title={poap.event.name}
                className="w-14 h-14 rounded-full border shadow"
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No POAPs found.</p>
        )}
      </div>

      {/* 📄 Download + Preview */}
      <div className="w-full mt-10 mb-20 px-4">
        <div className="flex flex-col gap-4 max-w-2xl mx-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownloadClick}
            className="w-full flex items-center justify-center gap-2 py-3 font-bold text-white rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 shadow-lg hover:opacity-95 transition"
          >
            <FileText size={18} /> Download PDF
          </motion.button>
        </div>
      </div>
    </>
  );
}
