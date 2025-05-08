// components/ENSProfile.js
import { useEffect, useState, useCallback, useMemo } from 'react';
import { getAddress, ethers } from 'ethers';
import { namehash } from 'viem';
import { getEnsData } from '../lib/ensUtils';
import { createClient } from '@supabase/supabase-js';
import { useAccount } from 'wagmi';
import Head from 'next/head';
import toast from 'react-hot-toast';
import ProfileCard from './ProfileCard';
import { Eye, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

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
  const [customAvatar, setCustomAvatar] = useState('');
  const [farcaster, setFarcaster] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAllPoaps, setShowAllPoaps] = useState(false);

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

    let poapList = [];
    try {
      const res = await axios.get(`https://api.poap.tech/actions/scan/${ens.address}`, {
        headers: { 'X-API-Key': process.env.NEXT_PUBLIC_POAP_API_KEY || 'demo' }
      });
      poapList = (res.data || []).map((poap) => ({
        name: poap.event.name,
        image: poap.event.image_url
      }));
    } catch (err) {
      console.error('Failed to fetch POAPs', err);
    }

    setEnsData(ens);
    setPoaps(poapList);

    const { data } = await supabase.from('VCR').select('*').eq('ens_name', profileKey).single();
    if (data) {
      if (data.custom_avatar) setCustomAvatar(data.custom_avatar);
      if (data.farcaster) setFarcaster(data.farcaster);
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

  const visiblePoaps = showAllPoaps ? poaps : poaps.slice(0, 4);

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
                twitter: ensData.twitter || '',
                website: ensData.website || '',
                tag: ensData.tag || 'Active Builder',
                efpLink,
                farcaster,
                poaps: visiblePoaps,
                ownsProfile
              }}
            />
          </motion.div>
        )}

        {poaps.length > 4 && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setShowAllPoaps(!showAllPoaps)}
              className="text-sm font-medium text-[#635BFF] hover:underline flex items-center gap-1"
            >
              {showAllPoaps ? 'Show Less' : 'Show More'}
              <span className={`transform transition-transform ${showAllPoaps ? 'rotate-180' : 'rotate-0'}`}>▼</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
