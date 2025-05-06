// components/ENSProfile.js
import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { getAddress, ethers } from 'ethers';
import { namehash } from 'viem';
import { getEnsData } from '../lib/ensUtils';
import { getPOAPs } from '../lib/poapUtils';
import { createClient } from '@supabase/supabase-js';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import Head from 'next/head';
import toast from 'react-hot-toast';
import EditableBio from './EditableBio';
import ProfileCard from './ProfileCard';
import POAPDisplay from './POAPDisplay';
import WorkExperienceDisplay from './WorkExperienceDisplay';
import { ClipboardCopyButton } from './ClipboardCopyButton';
import { LogOut, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const NAME_WRAPPER = '0x114D4603199df73e7D157787f8778E21fCd13066';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ENSProfile({ ensName }) {
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
  const [workMeta, setWorkMeta] = useState({
    work_title: '',
    work_company: '',
    work_start: '',
    work_location: '',
    work_logo: ''
  });

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
    setEnsData(ens);
    setPoaps(poapList);

    const { data } = await supabase.from('VCR').select('*').eq('ens_name', profileKey).single();
    if (data) {
      if (data.experience) setWorkExperience(data.experience);
      if (data.custom_title) setCustomTitle(data.custom_title);
      if (data.custom_avatar) setCustomAvatar(data.custom_avatar);
      if (data.farcaster) setFarcaster(data.farcaster);
      setWorkMeta({
        work_title: data.work_title || '',
        work_company: data.work_company || '',
        work_start: data.work_start || '',
        work_location: data.work_location || '',
        work_logo: data.work_logo || ''
      });
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
        const owns = [registryOwner, wrapperOwner, ethRecord, manager].filter(Boolean).map(getAddress).includes(connectedNorm);

        setOwnsProfile(owns);
      } catch (err) {
        console.error('❌ Ownership check failed:', err);
        setOwnsProfile(false);
      }
    };
    checkOwnership();
  }, [connected, ensName, isWalletOnly, provider]);

  const resolvedAvatar = customAvatar || (ensData.avatar && ensData.avatar.startsWith('http') ? ensData.avatar : '/Avatar.jpg');
  const efpLink = ensData.address ? `https://efp.social/profile/${ensData.address}` : '';
  const openSeaLink = ensData.address ? `https://opensea.io/${ensData.address}` : '';

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
            <p className="text-gray-500">Loading...</p>
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
                <WorkExperienceDisplay
                  experience={workExperience}
                  title={workMeta.work_title}
                  company={workMeta.work_company}
                  startDate={workMeta.work_start}
                  location={workMeta.work_location}
                  logo={workMeta.work_logo}
                />
              )}
            </div>

            <POAPDisplay poaps={poaps} address={ensData.address} />

            {ensData.address && (
              <p className="mt-6 text-center text-sm">
                <a
                  href={openSeaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View NFTs on OpenSea ↗
                </a>
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}
