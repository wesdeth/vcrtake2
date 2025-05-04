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
import { FileText, Loader2, Link2 } from 'lucide-react';
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
  const [workExperience, setWorkExperience] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const { connect } = useConnect();

  useEffect(() => {
    async function fetchData() {
      const ens = await getEnsData(ensName);
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
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.request({ method: 'eth_requestAccounts' }).then((accounts) => {
        if (accounts.length > 0) setConnected(accounts[0]);
      });
    }
  }, []);

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

  const handleDownloadClick = async () => {
    toast.success('✨ PDF download is free and coming soon!');
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

      <div className="flex justify-center my-10 bg-gradient-to-tr from-purple-100 to-indigo-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-md">
        <ProfileCard
          data={{
            name: ensName,
            address: ensData.address,
            avatar: resolvedAvatar,
            bio: ensData.bio || '',
            twitter: ensData.twitter || '',
            website: ensData.website || '',
            tag: ensData.tag || 'Active Builder',
          }}
        />
      </div>

      <div className="max-w-2xl mx-auto mt-10 px-4">
        <h3 className="text-lg font-semibold mb-2 text-purple-700 dark:text-purple-300">Work Experience</h3>
        {ownsProfile ? (
          <>
            <textarea
              value={workExperience}
              onChange={(e) => setWorkExperience(e.target.value)}
              placeholder="Share your experience..."
              className="w-full h-32 p-3 rounded-xl border border-purple-300 dark:border-purple-500 bg-gradient-to-br from-purple-50 to-white dark:from-gray-900 dark:to-gray-800 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-400"
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
          <p className="text-gray-600 dark:text-gray-300">
            {workExperience || 'No experience listed yet.'}
          </p>
        )}
      </div>

      <div className="max-w-2xl mx-auto mt-10 px-4">
        <h3 className="text-lg font-semibold mb-3 text-purple-700 dark:text-purple-300">POAPs</h3>
        {poaps.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {poaps.slice(0, 6).map((poap, i) => (
              <img
                key={i}
                src={poap.image_url}
                alt={poap.event.name}
                title={poap.event.name}
                className="w-16 h-16 rounded-2xl border-2 border-purple-300 dark:border-purple-600 shadow-md transition-transform hover:scale-105"
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No POAPs found.</p>
        )}
      </div>

      {nfts.length > 0 && (
        <div className="max-w-2xl mx-auto mt-10 px-4">
          <a
            href={`https://opensea.io/${ensData.address}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-full shadow-lg hover:opacity-90 transition"
          >
            <Link2 size={16} /> View NFTs on OpenSea
          </a>
        </div>
      )}

      <div className="w-full mt-10 mb-20 px-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-lg py-8">
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
