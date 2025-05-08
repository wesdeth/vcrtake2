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
import ProfileCard from './ProfileCard';
import { Eye, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';

const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const NAME_WRAPPER = '0x114D4603199df73e7D157787f8778E21fCd13066';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ENSProfile({ ensName, forceOwnerView = false, overrideRecord = null }) {
  const [ensData, setEnsData] = useState({});
  const [poaps, setPoaps] = useState([]);
  const [connected, setConnected] = useState(null);
  const [ownsProfile, setOwnsProfile] = useState(false);
  const [customAvatar, setCustomAvatar] = useState('');
  const [warpcast, setWarpcast] = useState('');
  const [twitter, setTwitter] = useState('');
  const [website, setWebsite] = useState('');
  const [tag, setTag] = useState('');
  const [bio, setBio] = useState('');
  const [workExperience, setWorkExperience] = useState([]);
  const [loading, setLoading] = useState(true);

  const { address } = useAccount();
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

    const record = overrideRecord || (await supabase.from('VCR').select('*').eq('ens_name', ens.name || ensName || connected).single()).data;
    if (record) {
      if (record.custom_avatar) setCustomAvatar(record.custom_avatar);
      if (record.warpcast) setWarpcast(record.warpcast);
      if (record.twitter) setTwitter(record.twitter);
      if (record.website) setWebsite(record.website);
      if (record.tag) setTag(record.tag);
      if (record.bio) setBio(record.bio);
      if (record.experience) setWorkExperience(record.experience);
    }
    setLoading(false);
  }, [connected, ensName, overrideRecord]);

  useEffect(() => {
    if (address) setConnected(address);
  }, [address]);

  useEffect(() => {
    if (ensName || connected) fetchData();
  }, [fetchData, ensName, connected]);

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
    if (ensName) checkOwnership();
  }, [connected, ensName, isWalletOnly, provider]);

  const resolvedAvatar = customAvatar || (ensData.avatar && ensData.avatar.startsWith('http') ? ensData.avatar : '/Avatar.jpg');
  const efpLink = ensData.address ? `https://efp.social/profile/${ensData.address}` : '';

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
                twitter,
                website,
                tag: tag || 'Active Builder',
                efpLink,
                warpcast,
                poaps,
                ownsProfile,
                bio,
                ensBio: ensData.bio || '',
                workExperience
              }}
            />
          </motion.div>
        )}
      </div>
    </>
  );
}
