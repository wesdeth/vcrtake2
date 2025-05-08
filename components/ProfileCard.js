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
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import axios from 'axios';

/* -------------------------------------------------------------------------------------------------
   ProfileCard Component
   -----------------------------------------------------------------------------------------------

   This component displays a user's profile information:
     - Name, Address, Avatar, Bio
     - Social Links (Twitter, Warpcast, Website)
     - Custom Tag (now a dropdown for selection)
     - Work Experience
     - POAPs
     - NFTs

   It also allows editing if:
     - The connected wallet address matches this user's profile address, OR
     - The profile explicitly sets "ownsProfile" = true.

   When editing, the user can:
     - Upload/change their avatar
     - Update social links
     - Select a Tag from TAG_OPTIONS
     - Add/Edit Work Experience
     - View/hide POAPs
     - See recent NFTs
     - Save changes (POST to `/api/save-profile`)

   This revised code specifically addresses the Tag input as a dropdown
   from a predefined set of tags in TAG_OPTIONS. On saving, the selected
   tag value is included in the request body to your Supabase logic.

   Usage:
     <ProfileCard data={profileData} />

   Make sure you have the appropriate environment variables or mocks in place.
-------------------------------------------------------------------------------------------------*/

/* ------------------------------------------------------------------
   Utility Helpers
   ------------------------------------------------------------------*/

/**
 * Shorten an Ethereum address for display, e.g. "0x1234...ABCD".
 * @param {string} addr
 * @returns {string}
 */
const shortenAddress = (addr = '') => {
  if (!addr) return '';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
};

/**
 * Parse a date string and handle "MM/DD/YYYY" or "YYYY-MM-DD" formats.
 * @param {string} d
 * @returns {Date|null}
 */
const parseDate = (d) => {
  if (!d) return null;
  // Replace "/" with "-" for uniform parsing
  const p = Date.parse(d.replace(/\//g, '-'));
  return Number.isNaN(p) ? null : new Date(p);
};

/**
 * Format a date range given start, end, and a boolean indicating 'current' job.
 * @param {string} s - Start date
 * @param {string} e - End date
 * @param {boolean} current - Whether the user is currently in this role
 * @returns {string} e.g. "Sep 2023 – Present"
 */
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

/* ------------------------------------------------------------------
   Tag options (capitalized)
   ------------------------------------------------------------------
   Used in the select dropdown for "Tag" when editing.
-------------------------------------------------------------------*/
const TAG_OPTIONS = [
  'Front-End Developer',
  'Back-End Developer',
  'Full-Stack Engineer',
  'Smart Contract Engineer',
  'Solidity Auditor',
  'Protocol Researcher',
  'DevOps & Infra',
  'Security Engineer',
  'Product Manager',
  'Designer / UX',
  'Technical Writer',
  'Growth Lead',
  'Marketing Manager',
  'Social Media Strategist',
  'Community Manager',
  'Developer Relations',
  'DAO Governor',
  'Governance Analyst',
  'Tokenomics Designer',
  'Partnerships Lead',
  'Business Development',
  'Support',
  'Discord',
  'Memecoins',
  'Trader',
  'Ecosystem',
  'Legal',
  'Protocol',
  'CEO',
  'COO',
  'CFO',
  'Founder / Co-Founder'
];

/* ------------------------------------------------------------------
   SocialLink Sub‑component
   ------------------------------------------------------------------
   Renders a small social link with an icon, label, and clickable href.
-------------------------------------------------------------------*/
function SocialLink({ href, icon: Icon, label }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
    >
      <Icon size={16} /> {label}
    </a>
  );
}

/* ------------------------------------------------------------------
   Main ProfileCard Component
   ------------------------------------------------------------------
   Exports a default function that takes a "data" prop, containing user info.
-------------------------------------------------------------------*/
export default function ProfileCard({ data = {} }) {
  // Destructure important fields from 'data'
  const {
    name,
    address,
    avatar,
    twitter,
    website,
    tag,
    efpLink,
    warpcast,
    poaps = [],
    nfts = [],
    ownsProfile = false,
    workExperience = [],
    bio = '',
    ensBio = ''
  } = data;

  /* ------------------------------------------------------------------
     React State Variables
     ------------------------------------------------------------------
     Keep track of editing, user inputs, and toggles for expansions (e.g. POAPs).
  -------------------------------------------------------------------*/
  const [showAllPoaps, setShowAllPoaps] = useState(false);
  const [poapData, setPoapData] = useState(poaps);

  // Whether the user is currently in "edit" mode
  const [editing, setEditing] = useState(false);

  // Simple flag to show "Profile Saved!" confirmation
  const [justSaved, setJustSaved] = useState(false);

  // The avatar either from data OR a default image
  const [uploadedAvatar, setUploadedAvatar] = useState(avatar || '/default-avatar.png');

  // Social fields for editing
  const [editTwitter, setEditTwitter] = useState(twitter || '');
  const [editWebsite, setEditWebsite] = useState(website || '');
  const [editWarpcast, setEditWarpcast] = useState(warpcast || '');

  // Now a dropdown select for the custom Tag
  const [editTag, setEditTag] = useState(tag || '');

  // Bio can come from user input or fallback to 'ensBio'
  const [editBio, setEditBio] = useState(bio || ensBio);

  // Work Experience
  const [editExp, setEditExp] = useState(workExperience);

  // Wagmi hook to get the connected wallet address
  const { address: connected } = useAccount();

  // Check if connected user can edit this profile
  const isOwner =
    ownsProfile ||
    (connected && address && connected.toLowerCase() === address.toLowerCase());

  /* ------------------------------------------------------------------
     Effects: Fetch POAPs and fallback Avatar
     ------------------------------------------------------------------
     This effect runs on mount or whenever 'address' or 'avatar' changes.
  -------------------------------------------------------------------*/
  useEffect(() => {
    const fetchPoaps = async () => {
      if (!address) return;
      try {
        // Make a GET request to the Poap.tech API
        const r = await axios.get(`https://api.poap.tech/actions/scan/${address}`, {
          headers: {
            'X-API-Key': process.env.NEXT_PUBLIC_POAP_API_KEY || 'demo'
          }
        });
        setPoapData(r.data || []);
      } catch (err) {
        console.error('POAP fetch error', err);
        setPoapData([]);
      }
    };

    const fetchAvatar = async () => {
      if (avatar || !address) return;
      try {
        // Attempt a fetch from the OpenSea user endpoint
        const r = await axios.get(`https://api.opensea.io/api/v1/user/${address}`);
        const img = r.data?.account?.profile_img_url || r.data?.profile_img_url;
        if (img) setUploadedAvatar(img);
      } catch {
        // Fallback is already set in state
      }
    };

    fetchPoaps();
    fetchAvatar();
  }, [address, avatar]);

  /* ------------------------------------------------------------------
     Handlers
     ------------------------------------------------------------------*/

  /**
   * Handle "Save" button when editing. 
   * We POST to '/api/save-profile' with the updated fields.
   */
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
          tag: editTag, // <--- our updated tag field
          bio: editBio,
          custom_avatar: uploadedAvatar,
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
        // Attempt to parse an error from JSON; fallback is generic
        const errorMsg = (await res.json()).error || 'Unknown error';
        throw new Error(errorMsg);
      }

      // If successful:
      setEditing(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      console.error('save-profile error', err);
    }
  };

  /**
   * Handle user uploading a new avatar image
   * Convert file to a DataURL and set in state
   */
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  /**
   * Update the "editExp" (work experience array) at index i, on a given field
   */
  const updateExp = (i, field, val) => {
    setEditExp((prev) => {
      return prev.map((e, idx) => {
        if (idx === i) {
          return { ...e, [field]: val };
        }
        return e;
      });
    });
  };

  /**
   * Toggle "currentlyWorking" for a given experience row
   * If we switch to "true", we clear the end date. If we switch to "false", 
   * we keep the existing or let the user set a new one.
   */
  const toggleCurrent = (i) => {
    setEditExp((prev) => {
      return prev.map((e, idx) => {
        if (idx === i) {
          if (e.currentlyWorking) {
            // was true, user toggled off
            return { ...e, currentlyWorking: false };
          } else {
            // was false, user toggled on
            return { ...e, currentlyWorking: true, endDate: '' };
          }
        }
        return e;
      });
    });
  };

  /**
   * Add a new blank work experience entry
   */
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

  /**
   * Remove a specific experience entry by index
   */
  const removeExp = (i) => {
    setEditExp((prev) => prev.filter((_, idx) => idx !== i));
  };

  /* ------------------------------------------------------------------
     Derived Data
     ------------------------------------------------------------------
     - POAPs to show: either limited to 4 or all if "showAllPoaps"
     - NFTs limited to 6
  -------------------------------------------------------------------*/
  const poapsToShow = Array.isArray(poapData)
    ? showAllPoaps
      ? poapData
      : poapData.slice(0, 4)
    : [];

  const nftsToShow = Array.isArray(nfts)
    ? nfts.slice(0, 6)
    : [];

  /* ------------------------------------------------------------------
     Render the component
     ------------------------------------------------------------------*/
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full max-w-lg mx-auto rounded-3xl overflow-hidden shadow-2xl ring-1 ring-indigo-200/60 border border-white/10"
    >
      {/*
        Animated background behind the card
      */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-100 to-cyan-100 opacity-40 animate-gradient-radial blur-2xl" />

      {/*
        Content wrapper
      */}
      <div className="relative z-10 p-8 sm:p-10 text-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        
        {/*
          Avatar
        */}
        <div className="relative w-32 h-32 mx-auto -mt-24 mb-4">
          <img
            src={uploadedAvatar}
            alt="avatar"
            className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
          />

          {isOwner && editing && (
            <label className="absolute bottom-0 right-0 p-1 bg-gray-800/80 rounded-full cursor-pointer hover:bg-gray-700/80">
              <Upload size={14} className="text-white" />
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleAvatarUpload}
              />
            </label>
          )}
        </div>

        {/*
          Name (ENS or fallback address)
        */}
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-800 dark:text-white">
          {name || shortenAddress(address)}
        </h2>

        {/*
          Address copy (if address is present)
        */}
        {address && (
          <p
            className="inline-flex items-center gap-1 text-xs sm:text-sm mx-auto text-indigo-600 dark:text-indigo-300 mt-1 cursor-pointer justify-center"
            title="Copy address"
            onClick={() => navigator.clipboard.writeText(address)}
          >
            {shortenAddress(address)} <Copy size={12} />
          </p>
        )}

        {/*
          Bio (textarea if editing, else just text)
        */}
        {editing ? (
          <textarea
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            rows={3}
            className="mt-3 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-sm"
            placeholder="Add a short bio..."
          />
        ) : (
          editBio && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {editBio}
            </p>
          )
        )}

        {/*
          Socials & Tag (in editing mode, show inputs; otherwise show clickable links)
        */}
        {editing ? (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <input
              placeholder="Twitter handle"
              value={editTwitter}
              onChange={(e) => setEditTwitter(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm w-full"
            />

            <input
              placeholder="Warpcast handle"
              value={editWarpcast}
              onChange={(e) => setEditWarpcast(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm w-full"
            />

            <input
              placeholder="Website"
              value={editWebsite}
              onChange={(e) => setEditWebsite(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm w-full"
            />

            {/*
              TAG SELECTION (Dropdown)
              Replaces the simple text input.
            */}
            <select
              value={editTag}
              onChange={(e) => setEditTag(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm w-full"
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
          <div className="mt-4 flex flex-wrap justify-center gap-3">
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

            {/*
              Show tag as a small pill if it exists
            */}
            {editTag && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs bg-indigo-100 text-indigo-800">
                {editTag}
              </span>
            )}
          </div>
        )}

        {/*
          Work Experience Section
        */}
        <div className="mt-8 text-left">
          <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-white flex items-center">
            Experience{' '}
            {editing && (
              <button
                onClick={addExp}
                className="ml-2 inline-flex items-center text-xs text-blue-500 hover:underline"
              >
                <PlusCircle size={14} className="mr-0.5" /> Add
              </button>
            )}
          </h3>

          {editExp.length === 0 && !editing && (
            <p className="text-sm text-gray-500">No experience added yet.</p>
          )}

          {editExp.map((exp, i) => (
            <div key={i} className="mb-4 last:mb-0">
              {editing ? (
                <>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm w-full"
                      placeholder="Job title"
                      value={exp.title}
                      onChange={(e) => updateExp(i, 'title', e.target.value)}
                    />
                    <input
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm w-full"
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) => updateExp(i, 'company', e.target.value)}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 mt-2">
                    <input
                      type="date"
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm w-full"
                      value={exp.startDate}
                      onChange={(e) => updateExp(i, 'startDate', e.target.value)}
                    />

                    {!exp.currentlyWorking && (
                      <input
                        type="date"
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm w-full"
                        value={exp.endDate}
                        onChange={(e) => updateExp(i, 'endDate', e.target.value)}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <label className="flex items-center text-xs gap-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={exp.currentlyWorking}
                        onChange={() => toggleCurrent(i)}
                        className="h-4 w-4 text-indigo-600 rounded"
                      />
                      Currently working here
                    </label>

                    <button
                      onClick={() => removeExp(i)}
                      className="ml-auto text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Role description"
                    value={exp.description}
                    onChange={(e) => updateExp(i, 'description', e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm mt-2"
                  />
                </>
              ) : (
                <>
                  <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                    {exp.title}
                    {exp.company && ` • ${exp.company}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatRange(exp.startDate, exp.endDate, exp.currentlyWorking)}
                    {exp.location && ` • ${exp.location}`}
                  </p>
                  {exp.description && (
                    <p className="text-sm mt-1 text-gray-600 dark:text-gray-300 whitespace-pre-line">
                      {exp.description}
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/*
          POAPs
        */}
        {poapsToShow.length > 0 && (
          <div className="mt-8 text-left">
            <h3 className="text-lg font-bold mb-1 text-gray-800 dark:text-white">POAPs</h3>
            <div className="grid grid-cols-2 gap-2">
              {poapsToShow.map((poap, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-white rounded-lg shadow p-2 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  <img
                    src={poap.event?.image_url || '/default-poap.png'}
                    alt={poap.event?.name || 'POAP'}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="truncate max-w-[9rem]">
                    {poap.event?.name}
                  </span>
                </div>
              ))}
            </div>

            {poapData.length > 4 && (
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => setShowAllPoaps(!showAllPoaps)}
                  className="flex items-center text-xs text-blue-500 hover:underline"
                >
                  {showAllPoaps ? <ChevronUp size={12} /> : <ChevronDown size={12} />} 
                  {showAllPoaps ? 'View Less' : 'View All'}
                </button>
              </div>
            )}
          </div>
        )}

        {/*
          NFTs
        */}
        {nftsToShow.length > 0 && (
          <div className="mt-8 text-left">
            <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-white">NFTs (recent)</h3>
            <div className="grid grid-cols-3 gap-2">
              {nftsToShow.map((nft, i) => (
                <img
                  key={i}
                  src={nft.image || nft.image_url || '/nft-placeholder.png'}
                  alt={nft.name || `NFT ${i}`}
                  className="w-full h-24 object-cover rounded-lg shadow"
                />
              ))}
            </div>
          </div>
        )}

        {/*
          OpenSea link if address is present
        */}
        {address && (
          <div className="mt-4 text-center">
            <a
              href={`https://opensea.io/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              <ExternalLink size={14} /> View full collection on OpenSea
            </a>
          </div>
        )}

        {/*
          Action buttons (Edit / Save / Cancel), only if user is owner
        */}
        {isOwner && (
          <div className="mt-6 flex justify-center gap-3">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow"
                >
                  <Save size={16} /> Save
                </button>
                <button
                  onClick={() => {
                    // Revert to original data if we cancel
                    setEditing(false);
                    setEditBio(bio || ensBio);
                    setEditExp(workExperience);
                    setEditTag(tag || '');
                    setEditTwitter(twitter || '');
                    setEditWarpcast(warpcast || '');
                    setEditWebsite(website || '');
                  }}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm font-medium rounded-lg shadow"
                >
                  <X size={16} /> Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow"
              >
                <Edit size={16} /> Edit Profile
              </button>
            )}
          </div>
        )}

        {/*
          Save confirmation message
        */}
        {justSaved && (
          <div className="mt-4 flex justify-center items-center text-green-600 text-sm">
            <CheckCircle size={16} className="mr-1" /> Profile saved!
          </div>
        )}
      </div>
    </motion.div>
  );
}
