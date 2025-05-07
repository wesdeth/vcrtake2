// components/ENSProfile.js
import { useEffect, useState, useCallback, useMemo } from 'react';
import { getAddress, ethers } from 'ethers';
import { namehash } from 'viem';
import { getEnsData } from '../lib/ensUtils';
import { getPOAPs } from '../lib/poapUtils';
import { createClient } from '@supabase/supabase-js';
import { useAccount } from 'wagmi';
import Head from 'next/head';
import toast from 'react-hot-toast';
import EditableBio from './EditableBio';
import EditableWorkExperience from './EditableWorkExperience';
import ProfileCard from './ProfileCard';
import POAPDisplay from './POAPDisplay';
import WorkExperienceDisplay from './WorkExperienceDisplay';
import { Eye, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';

const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const NAME_WRAPPER = '0x114D4603199df73e7D157787f8778E21fCd13066';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ENSProfile({ ensName, forceOwnerView = false }) {
  const [ensData, setEnsData] = useState({});
  const [poaps, setPoaps] = useState([]);
  const [connected, setConnected] = useState(null);
  const [ownsProfile, setOwnsProfile] = useState(false);
  const [workExperience, setWorkExperience] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customAvatar, setCustomAvatar] = useState('');
  const [farcaster, setFarcaster] = useState('');
  const [loading, setLoading] = useState(true);

  const { address, isConnected } = useAccount();
  const provider = useMemo(() => new ethers.BrowserProvider(window.ethereum), []);

  const isWalletOnly = !ensName && !!connected;
  const profileKey = ensName || connected;

  const fetchData = useCallback(async () => {
    setLoading(true);
    let ens;
    if (ensName) {
      ens = await getEnsData(ensName);
    } else if (connected) {
      ens = await getEnsData(connected);
    }
    ens = ens || { address: connected };
    const poapList = ens.address ? await getPOAPs(ens.name || ens.address) : [];
    setEnsData(ens);
    setPoaps(poapList);

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
      if (!connected) {
        if (forceOwnerView) {
          toast.error('Connect your wallet to view or edit your profile.', {
            icon: '🔒',
            style: {
              borderRadius: '10px',
              background: '#1F2937',
              color: '#FFC542',
              fontFamily: 'Cal Sans, sans-serif',
              border: '1px solid #FFC542'
            },
            duration: 5000
          });
        }
        return;
      }
      if (isWalletOnly) return setOwnsProfile(true);

      try {
        const hashedName = namehash(ensName);
        const registry = new ethers.Contract(ENS_REGISTRY, ['function owner(bytes32 node) view returns (address)', 'function getApproved(bytes32 node) view returns (address)'], provider);
        const wrapper = new ethers.Contract(NAME_WRAPPER, ['function ownerOf(uint256 id) view returns (address)'], provider);

        const [registryOwner, manager] = await Promise.all([
          registry.owner(hashedName),
          registry.getApproved(hashedName)
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

        if (forceOwnerView && !owns) {
          toast.error('You must be the ENS owner or manager to view this profile.', {
            icon: '🚫',
            style: {
              borderRadius: '10px',
              background: '#1F2937',
              color: '#FFC542',
              fontFamily: 'Cal Sans, sans-serif',
              border: '1px solid #FFC542'
            },
            duration: 5000
          });
          setOwnsProfile(false);
        } else {
          setOwnsProfile(owns);
        }
      } catch (err) {
        console.error('❌ Ownership check failed:', err);
        setOwnsProfile(false);
      }
    };
    checkOwnership();
  }, [connected, ensName, isWalletOnly, provider, ensData.address, forceOwnerView]);

  const resolvedAvatar = customAvatar || (ensData.avatar && ensData.avatar.startsWith('http') ? ensData.avatar : '/Avatar.jpg');
  const efpLink = ensData.address ? `https://efp.social/profile/${ensData.address}` : '';
  const openSeaLink = ensData.address ? `https://opensea.io/${ensData.address}` : '';

  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Comic+Relief&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Cal+Sans:wght@600&display=swap" rel="stylesheet" />
        <style>{`body { font-family: 'Comic Relief', cursive; }`}</style>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] via-[#F3E8FF] to-[#74E0FF] p-4">
        <div className="flex justify-center mb-6">
          <span className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full font-medium ${ownsProfile ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#E5E7EB] text-[#4B5563]'}`}>
            {ownsProfile ? <><Pencil size={12} /> Edit Mode</> : <><Eye size={12} /> View Only</>}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <p className="text-[#6B7280]">Loading...</p>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex justify-center"
            >
              <ProfileCard
                data={{
                  name: ensData.name || ensName || address,
                  address: ensData.address || address,
                  avatar: resolvedAvatar,
                  bio: '',
                  twitter: ensData.twitter || '',
                  website: ensData.website || '',
                  tag: ensData.tag || 'Active Builder',
                  efpLink,
                  farcaster
                }}
              />
            </motion.div>

            <div className="max-w-2xl mx-auto mt-8">
              {ownsProfile ? (
                <EditableBio
                  ensName={profileKey}
                  connectedAddress={address}
                  initialBio={ensData.bio}
                  initialLooking={ensData.lookingForWork === 'true'}
                  showAIGenerator={true}
                  experience={workExperience}
                  setExperience={setWorkExperience}
                  lastSaved={lastSaved}
                  setLastSaved={setLastSaved}
                />
              ) : (
                <div className="px-4 py-4 bg-white/80 border border-[#E5E7EB] rounded-xl text-sm text-[#6B7280] text-center">
                  <p className="text-lg" style={{ fontFamily: 'Cal Sans, sans-serif' }}>
                    Connect your wallet to customize your profile page
                  </p>
                </div>
              )}

              <WorkExperienceDisplay
                experience={workExperience}
                title={customTitle}
                company="ENS Labs"
                startDate="Jul 2024 - Present"
                location="Remote"
                logo="/enslabs.png"
                showDownload={true}
                ownsProfile={ownsProfile}
                address={address}
                ensName={ensName}
              />
            </div>

            <POAPDisplay poaps={poaps} address={ensData.address} />

            <div className="mt-6 text-center space-y-3">
              <p className="text-sm">
                <a
                  href={openSeaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#635BFF] hover:underline"
                >
                  View NFTs on OpenSea ↗
                </a>
              </p>
              {ownsProfile && (
                <p>
                  <a
                    href={`/api/download-resume?ensName=${profileKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 text-white bg-[#635BFF] rounded-lg hover:bg-[#5146cc] text-sm"
                  >
                    Download Resume ↗
                  </a>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
