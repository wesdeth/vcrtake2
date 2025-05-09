// components/ProfileCard.js
import { useState, useEffect } from 'react';
import {
  Copy,
  Twitter,
  Link as LinkIcon,
  UserPlus2,
  ChevronDown,
  ChevronUp,
  Edit,
  Save,
  Upload,
  ExternalLink,
  PlusCircle,
  Trash2,
  CheckCircle,
  X,
  Github,
  MessageCircle
} from 'lucide-react'; // add any icons you need
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import axios from 'axios';

/* -----------------------------------------------------------------------------------------------
   ProfileCard

   - Pulls DB fields for Twitter, website, warpcast, etc.
   - Also fetches all ENS text records for .eth names, merges them into "ensSocials".
   - Shows expanded social links for known platforms.
   - POAP & NFT display
   - EFP (Ethereum Follow Protocol) fallback (ens => address)
------------------------------------------------------------------------------------------------*/

/* ------------------------------------------------------------------
   Utility Helpers
-------------------------------------------------------------------*/

/** Shorten an Ethereum address for display, e.g. "0x1234…ABCD". */
const shortenAddress = (addr = '') =>
  addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';

/** Parse possible "MM/DD/YYYY" or "YYYY-MM-DD", returns Date or null. */
const parseDate = (d) => {
  if (!d) return null;
  const p = Date.parse(d.replace(/\//g, '-'));
  return Number.isNaN(p) ? null : new Date(p);
};

/** Format "May 2023 – Present" for start/end, with a "current" check. */
const formatRange = (s, e, current) => {
  if (!s) return '';
  const start = parseDate(s)?.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short'
  });
  const end = current
    ? 'Present'
    : parseDate(e)?.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short'
      }) || '';
  return `${start} – ${end}`;
};

/** Known social record keys → (label, icon, prefix or null if we can't link). */
const SOCIAL_KEY_MAP = {
  'com.twitter': {
    label: 'Twitter',
    icon: Twitter,
    prefix: 'https://twitter.com/'
  },
  'io.farcaster': {
    label: 'Farcaster',
    icon: UserPlus2,
    prefix: 'https://warpcast.com/'
  },
  'com.github': {
    label: 'GitHub',
    icon: Github,
    prefix: 'https://github.com/'
  },
  'com.discord': {
    label: 'Discord',
    icon: MessageCircle,
    prefix: null // can't make a direct link
  },
  'com.telegram': {
    label: 'Telegram',
    icon: MessageCircle,
    prefix: 'https://t.me/'
  },
  'url': {
    label: 'Website',
    icon: LinkIcon,
    prefix: '' // direct link to the record itself
  }
};

/**
 * Simple wrapper for a single social link
 * If prefix is null, we show text. If prefix is non-empty, we build a link.
 */
function DisplaySocial({ recordKey, recordValue }) {
  const mapping = SOCIAL_KEY_MAP[recordKey];
  if (!mapping) {
    // Unknown record, fallback
    return (
      <div className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
        <LinkIcon size={16} />
        {recordKey}: {recordValue}
      </div>
    );
  }

  const { label, icon: Icon, prefix } = mapping;

  if (!prefix) {
    // e.g. Discord "username#1234" can't be a link
    return (
      <div className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
        <Icon size={16} />
        {label}: {recordValue}
      </div>
    );
  } else {
    // clickable link
    return (
      <a
        href={prefix + recordValue.replace(/^@/, '')}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        <Icon size={16} />
        {label}
      </a>
    );
  }
}

/** A small link helper for the DB or fallback social link. */
function SocialLink({ href, icon: Icon, label }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline transition-colors"
    >
      <Icon size={16} />
      {label}
    </a>
  );
}

/* ------------------------------------------------------------------
   Main ProfileCard
-------------------------------------------------------------------*/
export default function ProfileCard({ data = {} }) {
  const {
    name,
    address,
    avatar,
    twitter,
    website,
    warpcast,
    tag,
    poaps = [],
    nfts = [],
    bio = '',
    ensBio = '',
    workExperience = [],
    lookingForWork = false,
    ownsProfile = false
  } = data;

  // Wagmi
  const { address: connected } = useAccount();
  const isOwner =
    ownsProfile ||
    (connected && address && connected.toLowerCase() === address.toLowerCase());

  /* ----------------------------------
     State
  ----------------------------------*/
  const [showAllPoaps, setShowAllPoaps] = useState(false);
  const [poapData, setPoapData] = useState(poaps);
  const [editing, setEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // "Looking for Work"
  const [editLookingForWork, setEditLookingForWork] = useState(lookingForWork);

  // Avatar
  const [uploadedAvatar, setUploadedAvatar] = useState(avatar || '/default-avatar.png');

  // Social fields from DB ( fallback ), possibly overridden by ENS text records
  const [editTwitter, setEditTwitter] = useState(twitter || '');
  const [editWebsite, setEditWebsite] = useState(website || '');
  const [editWarpcast, setEditWarpcast] = useState(warpcast || '');

  // Tag
  const [editTag, setEditTag] = useState(tag || '');

  // Bio
  const [editBio, setEditBio] = useState(bio || ensBio);

  // Work Experience
  const [editExp, setEditExp] = useState(workExperience);

  // EFP
  const [followersCount, setFollowersCount] = useState(null);

  // We'll store the full ENS record map here, so we can display all known keys.
  // e.g. { 'com.twitter': '...', 'com.github': '...', 'com.discord': '...', url: '...' }
  const [ensSocialRecords, setEnsSocialRecords] = useState({});

  /* ------------------------------------------------------------------
     Effects
  ------------------------------------------------------------------*/

  // 1) Fetch POAPs & fallback Avatar
  useEffect(() => {
    const fetchPoaps = async () => {
      if (!address) return;
      try {
        const r = await axios.get(`https://api.poap.tech/actions/scan/${address}`, {
          headers: {
            'X-API-Key': process.env.NEXT_PUBLIC_POAP_API_KEY || 'demo'
          }
        });
        setPoapData(r.data || []);
      } catch {
        setPoapData([]);
      }
    };

    const fetchAvatar = async () => {
      if (avatar || !address) return;
      try {
        const r = await axios.get(`https://api.opensea.io/api/v1/user/${address}`);
        const img = r.data?.account?.profile_img_url || r.data?.profile_img_url;
        if (img) setUploadedAvatar(img);
      } catch {
        // fallback
      }
    };

    fetchPoaps();
    fetchAvatar();
  }, [address, avatar]);

  // 2) Fetch **all** ENS text records if name ends with .eth
  //    We'll store them in `ensSocialRecords` to display everything.
  //    We'll also optionally override DB fields if record is non-empty
  useEffect(() => {
    const fetchEnsRecords = async () => {
      if (!name || !name.endsWith('.eth')) return;

      try {
        const res = await axios.get(`https://api.ensideas.com/ens/resolve/${name.toLowerCase()}`);
        const allRecords = res.data?.records || {};
        // Store them for display
        setEnsSocialRecords(allRecords);

        // Optionally override DB fields if non-empty
        if (allRecords['com.twitter']?.trim()) {
          setEditTwitter(allRecords['com.twitter']);
        }
        if (allRecords['io.farcaster']?.trim()) {
          setEditWarpcast(allRecords['io.farcaster']);
        }
        if (allRecords['url']?.trim()) {
          setEditWebsite(allRecords['url']);
        }
      } catch (err) {
        console.error('Failed to fetch full ENS text records', err);
      }
    };

    fetchEnsRecords();
  }, [name]);

  // 3) EFP fetch w/ fallback (ens => address)
  useEffect(() => {
    const fetchEfpFollowers = async () => {
      if (!address && (!name || !name.endsWith('.eth'))) return;

      // If .eth name, try EFP by ens first
      if (name && name.endsWith('.eth')) {
        const efpUrl = `https://api.ethfollow.xyz/api/v1/followers?ens=${name.toLowerCase()}`;
        try {
          const res = await axios.get(efpUrl);
          setFollowersCount(res.data?.count ?? 0);
          return; // success
        } catch (err1) {
          console.warn(`EFP by ENS failed for ${name}, trying address fallback...`);
        }
      }

      // fallback by address
      if (address) {
        try {
          const efpUrl2 = `https://api.ethfollow.xyz/api/v1/followers?address=${address}`;
          const res2 = await axios.get(efpUrl2);
          setFollowersCount(res2.data?.count ?? 0);
        } catch (err2) {
          console.error('EFP fallback by address also failed', err2);
          setFollowersCount(0);
        }
      }
    };

    fetchEfpFollowers();
  }, [address, name]);

  /* ------------------------------------------------------------------
     Handlers
  ------------------------------------------------------------------*/
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setUploadedAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/save-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ensName: name,
          address,
          twitter: editTwitter,
          warpcast: editWarpcast,
          website: editWebsite,
          tag: editTag,
          bio: editBio,
          custom_avatar: uploadedAvatar,
          lookingForWork: editLookingForWork,
          experience: editExp.map((e) => ({
            ...e,
            startDate: e.startDate || '',
            endDate: e.currentlyWorking ? null : e.endDate || '',
            currentlyWorking: !!e.currentlyWorking,
            location: e.location || '',
            description: e.description || ''
          }))
        })
      });
      if (!res.ok) {
        const errorMsg = (await res.json()).error || 'Unknown error';
        throw new Error(errorMsg);
      }
      setEditing(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      console.error('save-profile error', err);
    }
  };

  // Work Experience
  const updateExp = (i, field, val) => {
    setEditExp((prev) =>
      prev.map((expItem, idx) => (idx === i ? { ...expItem, [field]: val } : expItem))
    );
  };

  const toggleCurrent = (i) => {
    setEditExp((prev) =>
      prev.map((expItem, idx) => {
        if (idx === i) {
          return {
            ...expItem,
            currentlyWorking: !expItem.currentlyWorking,
            endDate: expItem.currentlyWorking ? expItem.endDate : ''
          };
        }
        return expItem;
      })
    );
  };

  const addExp = () => {
    setEditExp((prev) => [
      ...prev,
      {
        title: '',
        company: '',
        startDate: '',
        endDate: '',
        location: '',
        description: '',
        currentlyWorking: false
      }
    ]);
  };

  const removeExp = (i) => {
    setEditExp((prev) => prev.filter((_, idx) => idx !== i));
  };

  /* ------------------------------------------------------------------
     Derived
  ------------------------------------------------------------------*/
  const poapsToShow = Array.isArray(poapData)
    ? showAllPoaps
      ? poapData
      : poapData.slice(0, 4)
    : [];
  const nftsToShow = Array.isArray(nfts) ? nfts.slice(0, 6) : [];

  // We'll build an array of "all ENS socials" from `ensSocialRecords`.
  // This can include Twitter, GitHub, Discord, etc.
  const allEnsSocialEntries = Object.entries(ensSocialRecords).filter(([key, val]) => {
    // Only keep if val is non-empty string
    if (typeof val !== 'string' || !val.trim()) return false;
    // e.g. key = 'com.twitter', val = 'brantlymillegan'
    return true;
  });

  /* ------------------------------------------------------------------
     Render
  ------------------------------------------------------------------*/
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="
        relative w-full max-w-3xl mx-auto 
        rounded-3xl overflow-visible
        shadow-xl border border-gray-100 ring-1 ring-gray-200/70
        bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800
      "
    >
      {/* Subtle background behind content */}
      <div className="absolute inset-0 opacity-40 animate-pulse-slow pointer-events-none" />

      <div className="relative z-10 p-10 sm:p-12 text-center backdrop-blur-xl">
        {/* Avatar */}
        <div className="relative w-36 h-36 mx-auto -mt-16 mb-4">
          <img
            src={uploadedAvatar}
            alt="avatar"
            className="w-36 h-36 rounded-full border-4 border-white dark:border-gray-700 shadow-md object-cover"
          />
          {isOwner && editing && (
            <label className="absolute bottom-2 right-2 p-1 bg-gray-800/80 rounded-full cursor-pointer hover:bg-gray-700/80 transition-colors">
              <Upload size={14} className="text-white" />
              <input type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
            </label>
          )}
        </div>

        {/* Name or fallback */}
        <h2 className="text-4xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
          {name || shortenAddress(address)}
        </h2>

        {/* Address copy */}
        {address && (
          <p
            className="inline-flex items-center gap-1 text-xs sm:text-sm mx-auto text-indigo-600 dark:text-indigo-300 mt-1 cursor-pointer justify-center hover:text-indigo-500 transition-colors"
            title="Copy address"
            onClick={() => navigator.clipboard.writeText(address)}
          >
            {shortenAddress(address)} <Copy size={12} />
          </p>
        )}

        {/* EFP Followers */}
        {followersCount !== null && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {followersCount} Follower{followersCount === 1 ? '' : 's'}
          </p>
        )}

        {/* Bio */}
        {editing ? (
          <textarea
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            rows={4}
            className="
              mt-4 w-full bg-white dark:bg-gray-900 
              border border-gray-200 dark:border-gray-700 
              rounded-lg p-3 text-sm placeholder-gray-400
            "
            placeholder="Add a short bio..."
          />
        ) : (
          editBio && (
            <p className="mt-4 text-base text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {editBio}
            </p>
          )
        )}

        {/* Socials & Tag in "View" mode or "Edit" mode */}
        <div className="mt-6">
          {editing ? (
            /* If editing, show input fields for DB-based Twitter, Warpcast, Website, Tag */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <input
                placeholder="Twitter handle"
                value={editTwitter}
                onChange={(e) => setEditTwitter(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm w-full placeholder-gray-400"
              />
              <input
                placeholder="Warpcast handle"
                value={editWarpcast}
                onChange={(e) => setEditWarpcast(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm w-full placeholder-gray-400"
              />
              <input
                placeholder="Website"
                value={editWebsite}
                onChange={(e) => setEditWebsite(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm w-full placeholder-gray-400"
              />
              <select
                value={editTag}
                onChange={(e) => setEditTag(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm w-full"
              >
                <option value="">Select a Tag</option>
                {TAG_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            /* If viewing, display DB or ENS-based main socials plus Tag. 
               Then also display any "extra" ENS records we found. */
            <div className="flex flex-col gap-2 items-center justify-center mt-2">
              {/* The "Primary" DB fields (Twitter, Warpcast, Website) */}
              <div className="flex flex-wrap gap-3 justify-center">
                <SocialLink
                  href={
                    editTwitter
                      ? `https://twitter.com/${editTwitter.replace(/^@/, '')}`
                      : null
                  }
                  icon={Twitter}
                  label="Twitter"
                />
                <SocialLink
                  href={
                    editWarpcast
                      ? `https://warpcast.com/${editWarpcast.replace(/^@/, '')}`
                      : null
                  }
                  icon={UserPlus2}
                  label="Warpcast"
                />
                <SocialLink
                  href={
                    editWebsite
                      ? editWebsite.startsWith('http')
                        ? editWebsite
                        : `https://${editWebsite}`
                      : null
                  }
                  icon={LinkIcon}
                  label="Website"
                />
                {editTag && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-800/20 dark:text-indigo-200">
                    {editTag}
                  </span>
                )}
              </div>

              {/* Additional ENS text records not covered by DB fields */}
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {Object.entries(ensSocialRecords)
                  .filter(([key]) => !['com.twitter', 'io.farcaster', 'url'].includes(key))
                  .map(([key, val]) => {
                    if (!val?.trim()) return null;
                    return <DisplaySocial key={key} recordKey={key} recordValue={val} />;
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Looking for Work */}
        <div className="mt-4">
          {editing ? (
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={editLookingForWork}
                onChange={() => setEditLookingForWork(!editLookingForWork)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              Looking for Work
            </label>
          ) : (
            editLookingForWork && (
              <div className="mt-1">
                <span className="inline-block px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">
                  Looking for Work
                </span>
              </div>
            )
          )}
        </div>

        {/* Work Experience */}
        <div className="mt-10 text-left">
          <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100 flex items-center">
            Experience{' '}
            {editing && (
              <button
                onClick={addExp}
                className="ml-2 inline-flex items-center text-xs text-blue-600 hover:underline transition-colors"
              >
                <PlusCircle size={14} className="mr-0.5" /> Add
              </button>
            )}
          </h3>

          {editExp.length === 0 && !editing && (
            <p className="text-sm text-gray-500">No experience added yet.</p>
          )}

          {editExp.map((exp, i) => (
            <div key={i} className="mb-6 last:mb-0">
              {editing ? (
                <>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm placeholder-gray-400"
                      placeholder="Job title"
                      value={exp.title}
                      onChange={(e) => updateExp(i, 'title', e.target.value)}
                    />
                    <input
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm placeholder-gray-400"
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) => updateExp(i, 'company', e.target.value)}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 mt-3">
                    <input
                      type="date"
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm placeholder-gray-400"
                      value={exp.startDate}
                      onChange={(e) => updateExp(i, 'startDate', e.target.value)}
                    />

                    {!exp.currentlyWorking && (
                      <input
                        type="date"
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm placeholder-gray-400"
                        value={exp.endDate}
                        onChange={(e) => updateExp(i, 'endDate', e.target.value)}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <label className="flex items-center text-xs gap-1 cursor-pointer select-none text-gray-600 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={exp.currentlyWorking}
                        onChange={() => toggleCurrent(i)}
                        className="h-4 w-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      Currently working here
                    </label>

                    <button
                      onClick={() => removeExp(i)}
                      className="ml-auto text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Role description"
                    value={exp.description}
                    onChange={(e) => updateExp(i, 'description', e.target.value)}
                    className="w-full mt-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm placeholder-gray-400"
                  />
                </>
              ) : (
                <>
                  <p className="font-semibold text-md text-gray-800 dark:text-gray-100">
                    {exp.title}
                    {exp.company && ` • ${exp.company}`}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formatRange(exp.startDate, exp.endDate, exp.currentlyWorking)}
                    {exp.location && ` • ${exp.location}`}
                  </p>
                  {exp.description && (
                    <p className="text-sm mt-2 text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                      {exp.description}
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* POAPs */}
        {poapsToShow.length > 0 && (
          <div className="mt-12 text-left">
            <h3 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">
              POAPs
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {poapsToShow.map((poap, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm p-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <img
                    src={poap.event?.image_url || '/default-poap.png'}
                    alt={poap.event?.name || 'POAP'}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="truncate max-w-[9rem]">{poap.event?.name}</span>
                </div>
              ))}
            </div>

            {poapData.length > 4 && (
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => setShowAllPoaps(!showAllPoaps)}
                  className="flex items-center text-xs text-blue-600 hover:underline transition-colors"
                >
                  {showAllPoaps ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {showAllPoaps ? 'View Less' : 'View All'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* NFTs */}
        {nftsToShow.length > 0 && (
          <div className="mt-12 text-left">
            <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100">
              NFTs (recent)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {nftsToShow.map((nft, i) => (
                <img
                  key={i}
                  src={nft.image || nft.image_url || '/nft-placeholder.png'}
                  alt={nft.name || `NFT ${i}`}
                  className="w-full h-24 object-cover rounded-lg shadow-sm"
                />
              ))}
            </div>
          </div>
        )}

        {/* Link to OpenSea if address present */}
        {address && (
          <div className="mt-6 text-center">
            <a
              href={`https://opensea.io/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              <ExternalLink size={14} /> View full collection on OpenSea
            </a>
          </div>
        )}

        {/* Edit / Save / Cancel (if user is owner) */}
        {isOwner && (
          <div className="mt-8 flex justify-center gap-3">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="
                    inline-flex items-center gap-1 px-4 py-2 
                    bg-indigo-600 hover:bg-indigo-700 
                    text-white text-sm font-medium 
                    rounded-lg shadow-sm transition-colors
                  "
                >
                  <Save size={16} /> Save
                </button>
                <button
                  onClick={() => {
                    // revert changes
                    setEditing(false);
                    setEditBio(bio || ensBio);
                    setEditExp(workExperience);
                    setEditTag(tag || '');
                    setEditTwitter(twitter || '');
                    setEditWarpcast(warpcast || '');
                    setEditWebsite(website || '');
                    setEditLookingForWork(lookingForWork);
                  }}
                  className="
                    inline-flex items-center gap-1 px-4 py-2 
                    bg-gray-300 hover:bg-gray-400 
                    text-gray-800 text-sm font-medium 
                    rounded-lg shadow-sm transition-colors
                  "
                >
                  <X size={16} /> Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="
                  inline-flex items-center gap-1 px-4 py-2 
                  bg-indigo-600 hover:bg-indigo-700 
                  text-white text-sm font-medium 
                  rounded-lg shadow-sm transition-colors
                "
              >
                <Edit size={16} /> Edit Profile
              </button>
            )}
          </div>
        )}

        {/* Save confirmation */}
        {justSaved && (
          <div className="mt-4 flex justify-center items-center text-green-600 text-sm">
            <CheckCircle size={16} className="mr-1" /> Profile saved!
          </div>
        )}
      </div>
    </motion.div>
  );
}
