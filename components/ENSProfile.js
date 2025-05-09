// components/ENSProfile.js
import { useEffect, useState, useCallback, useMemo } from 'react';
import { getAddress, ethers } from 'ethers';
import { namehash } from 'viem';

import { getEnsData } from '../lib/ensUtils';  // minimal version that only returns name/address/avatar/poaps
import { getPOAPs } from '../lib/poapUtils';   // if you still want it
import { createClient } from '@supabase/supabase-js';
import { useAccount } from 'wagmi';
import Head from 'next/head';
import toast from 'react-hot-toast';
import ProfileCard from './ProfileCard';
import { Pencil } from 'lucide-react';
import { motion } from 'framer-motion';

const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const NAME_WRAPPER = '0x114D4603199df73e7D157787f8778E21fCd13066';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ENSProfile({ ensName, forceOwnerView = false, overrideRecord = null }) {
  const [ensData, setEnsData] = useState({});
  const [poaps, setPoaps] = useState([]);     // fallback from getEnsData or getPOAPs
  const [connected, setConnected] = useState(null);
  const [ownsProfile, setOwnsProfile] = useState(false);

  // DB fields from Supabase
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

  /* ---------------------------------------------------------
     1) fetchData: minimal call to getEnsData + supabase record
  --------------------------------------------------------- */
  const fetchData = useCallback(async () => {
    setLoading(true);

    let ens = null;
    if (ensName) {
      ens = await getEnsData(ensName);       // minimal: name, address, avatar, poaps
    } else if (connected) {
      ens = await getEnsData(connected);
    }

    // fallback if still empty:
    ens = ens || { address: connected };
    // optionally also get POAPs from local code if you want
    const poapList = ens.address ? await getPOAPs(ens.name || ens.address) : [];

    setEnsData(ens);      // store name/address/avatar
    setPoaps(poapList);   // store fallback POAPs if you want them

    // Now fetch the DB record
    const { data, error } =
      overrideRecord
        ? { data: overrideRecord, error: null }
        : await supabase
            .from('VCR')
            .select('*')
            .eq('ens_name', ens.name || ensName || connected)
            .single();

    if (error) console.warn('Supabase fetch error:', error);

    if (data) {
      if (data.custom_avatar) setCustomAvatar(data.custom_avatar);
      if (data.warpcast) setWarpcast(data.warpcast);
      if (data.twitter) setTwitter(data.twitter);
      if (data.website) setWebsite(data.website);
      if (data.tag) setTag(data.tag);
      if (data.bio) setBio(data.bio);
      if (data.experience) setWorkExperience(data.experience);
    }

    setLoading(false);
  }, [connected, ensName, overrideRecord]);

  /* ---------------------------------------------------------
     2) Handle wallet connect 
  --------------------------------------------------------- */
  useEffect(() => {
    if (address) setConnected(address);
  }, [address]);

  /* ---------------------------------------------------------
     3) Whenever ensName or connected changes → fetch data
  --------------------------------------------------------- */
  useEffect(() => {
    if (ensName || connected) fetchData();
  }, [fetchData, ensName, connected]);

  /* ---------------------------------------------------------
     4) checkOwnership: see if connected user owns this .eth
  --------------------------------------------------------- */
  useEffect(() => {
    const checkOwnership = async () => {
      if (!connected) return;
      if (isWalletOnly) return setOwnsProfile(true);

      try {
        if (!ensName) {
          // fallback if we have no .eth name
          setOwnsProfile(false);
          return;
        }

        const hashedName = namehash(ensName);
        const registry = new ethers.Contract(
          ENS_REGISTRY,
          ['function owner(bytes32 node) view returns (address)', 'function getApproved(bytes32 node) view returns (address)'],
          provider
        );
        const wrapper = new ethers.Contract(
          NAME_WRAPPER,
          ['function ownerOf(uint256 id) view returns (address)'],
          provider
        );

        const [registryOwner, manager] = await Promise.all([
          registry.owner(hashedName),
          registry.getApproved(hashedName)
        ]);

        let wrapperOwner = null;
        let ethRecord = null;

        try {
          wrapperOwner = await wrapper.ownerOf(BigInt(hashedName));
        } catch {}
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

  /* ---------------------------------------------------------
     5) Prepare data to pass to ProfileCard
  --------------------------------------------------------- */
  const resolvedAvatar =
    customAvatar ||
    (ensData.avatar && ensData.avatar.startsWith('http') ? ensData.avatar : '/Avatar.jpg');

  // Possibly an EFP link if you want
  const efpLink = ensData.address ? `https://efp.social/profile/${ensData.address}` : '';

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Comic+Relief&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cal+Sans:wght@600&display=swap"
          rel="stylesheet"
        />
        <style>{`body { font-family: 'Comic Relief', cursive; }`}</style>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] via-[#F3E8FF] to-[#74E0FF] p-4">
        {/* Edit mode badge if user owns the profile */}
        <div className="flex justify-center mb-6">
          {ownsProfile && (
            <span className="flex items-center gap-2 text-xs px-3 py-1 rounded-full font-medium bg-[#D1FAE5] text-[#065F46]">
              <Pencil size={12} />
              Edit&nbsp;Mode
            </span>
          )}
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
                // fallback name or address
                name: ensData.name || ensName || address,
                address: ensData.address || address,

                // final avatar
                avatar: resolvedAvatar,

                // DB-based fields
                twitter,
                website,
                tag: tag || 'Active Builder',
                warpcast,
                bio,

                // pass any fallback POAP data from ensData or getPOAPs
                poaps,

                // pass ownership
                ownsProfile,
                // pass the experience array from DB
                workExperience,

                // old "ensBio" is no longer needed if you want EFP for that,
                // but we can keep it if you want some fallback
                ensBio: '',

                // optionally pass an EFP link
                efpLink
              }}
            />
          </motion.div>
        )}
      </div>
    </>
  );
}
