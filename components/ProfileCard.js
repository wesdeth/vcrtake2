// components/ProfileCard.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import axios from 'axios';

// Example icons from lucide-react
import {
  Copy, Upload, Edit, Save, X, CheckCircle, ChevronDown, ChevronUp,
  ExternalLink, PlusCircle, Trash2
} from 'lucide-react';

/**
 * Helper: shorten "0xabc123...def" addresses
 */
function shortenAddress(addr = '') {
  return addr ? addr.slice(0, 6) + '…' + addr.slice(-4) : '';
}

/**
 * For date-like strings: "YYYY-MM-DD" => parse to JS Date (v5 safe)
 */
function parseDate(d) {
  if (!d) return null;
  const p = Date.parse(d.replace(/\//g, '-'));
  return Number.isNaN(p) ? null : new Date(p);
}

/**
 * Format range "May 2023 – Present" if currentlyWorking
 */
function formatRange(s, e, current) {
  if (!s) return '';
  const start = parseDate(s)?.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  const end = current
    ? 'Present'
    : parseDate(e)?.toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) || '';
  return `${start} – ${end}`;
}

export default function ProfileCard({ data = {} }) {
  const {
    name,
    address,
    avatar,
    // Possibly some social fields from your DB or from getEnsData
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
    // If the connected user is the owner
    ownsProfile = false
  } = data;

  const router = useRouter();

  // local states
  const [showAllPoaps, setShowAllPoaps] = useState(false);
  const [poapData, setPoapData] = useState(poaps);
  const [editing, setEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // "Looking for Work"
  const [editLookingForWork, setEditLookingForWork] = useState(lookingForWork);

  // Avatar
  const [uploadedAvatar, setUploadedAvatar] = useState(avatar || '/default-avatar.png');

  // Social fields
  const [editTwitter, setEditTwitter] = useState(twitter || '');
  const [editWebsite, setEditWebsite] = useState(website || '');
  const [editWarpcast, setEditWarpcast] = useState(warpcast || '');
  const [editTag, setEditTag] = useState(tag || '');
  const [editBio, setEditBio] = useState(bio || ensBio);
  const [editExp, setEditExp] = useState(workExperience);

  // 1) fetch POAPs if address
  useEffect(() => {
    if (!address) return;
    axios
      .get(`https://api.poap.tech/actions/scan/${address}`, {
        headers: { 'X-API-Key': process.env.NEXT_PUBLIC_POAP_API_KEY || 'demo' }
      })
      .then((r) => setPoapData(r.data || []))
      .catch(() => setPoapData([]));

    // fallback avatar from OpenSea if none
    if (!avatar) {
      axios
        .get(`https://api.opensea.io/api/v1/user/${address}`)
        .then((r) => {
          const img = r.data?.account?.profile_img_url || r.data?.profile_img_url;
          if (img) setUploadedAvatar(img);
        })
        .catch(() => {/* fallback */});
    }
  }, [address, avatar]);

  // handle upload
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setUploadedAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  // handle Save (POST to /api/save-profile or similar)
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
      if (!res.ok) throw new Error('Failed saving profile');
      setEditing(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  // Experience updaters
  const updateExp = (i, field, val) => {
    setEditExp((prev) => prev.map((item, idx) => (idx === i ? { ...item, [field]: val } : item)));
  };
  const toggleCurrent = (i) => {
    setEditExp((prev) =>
      prev.map((item, idx) => {
        if (idx === i) {
          return {
            ...item,
            currentlyWorking: !item.currentlyWorking,
            endDate: item.currentlyWorking ? item.endDate : ''
          };
        }
        return item;
      })
    );
  };
  const addExp = () => {
    setEditExp((prev) => [...prev, {
      title: '', company: '', startDate: '',
      endDate: '', location: '', description: '',
      currentlyWorking: false
    }]);
  };
  const removeExp = (i) => {
    setEditExp((prev) => prev.filter((_, idx) => idx !== i));
  };

  // derived
  const poapsToShow = Array.isArray(poapData)
    ? showAllPoaps ? poapData : poapData.slice(0, 4)
    : [];
  const nftsToShow = Array.isArray(nfts) ? nfts.slice(0, 6) : [];

  // if user is owner
  const isOwner = ownsProfile; // or do your own check with wagmi if needed

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full max-w-3xl mx-auto rounded-3xl overflow-visible
                 shadow-xl border border-gray-100 ring-1 ring-gray-200/70
                 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800"
    >
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
            <label className="absolute bottom-2 right-2 p-1 bg-gray-800/80 rounded-full cursor-pointer hover:bg-gray-700/80">
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

        {/* Name */}
        <h2 className="text-4xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
          {name || shortenAddress(address)}
        </h2>

        {/* Address copy */}
        {address && (
          <p
            className="inline-flex items-center gap-1 text-xs sm:text-sm mx-auto text-indigo-600 dark:text-indigo-300 mt-1 cursor-pointer justify-center"
            onClick={() => navigator.clipboard.writeText(address)}
          >
            {shortenAddress(address)} <Copy size={12} />
          </p>
        )}

        {/* Message button => /messages?to=... */}
        {address && !isOwner && (
          <div className="mt-3">
            <button
              onClick={() => router.push(`/messages?to=${address}`)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm rounded-lg shadow-sm"
            >
              Message
            </button>
          </div>
        )}

        {/* Bio */}
        {editing ? (
          <textarea
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            rows={4}
            className="mt-4 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm placeholder-gray-400"
            placeholder="Add a short bio..."
          />
        ) : (
          editBio && (
            <p className="mt-4 text-base text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {editBio}
            </p>
          )
        )}

        {/* Social / Tag */}
        <div className="mt-6">
          {editing ? (
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
              <input
                placeholder="Custom Tag"
                value={editTag}
                onChange={(e) => setEditTag(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm w-full placeholder-gray-400"
              />
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 justify-center">
              {editTwitter && <p className="text-sm text-blue-600">@{editTwitter}</p>}
              {editWarpcast && <p className="text-sm text-blue-600">Warpcast: {editWarpcast}</p>}
              {editWebsite && (
                <a
                  href={editWebsite.startsWith('http') ? editWebsite : `https://${editWebsite}`}
                  className="text-sm text-blue-600 underline"
                  target="_blank" rel="noopener noreferrer"
                >
                  {editWebsite}
                </a>
              )}
              {editTag && (
                <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                  {editTag}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Looking for Work */}
        <div className="mt-4">
          {editing ? (
            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
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

        {/* Experience */}
        <div className="mt-10 text-left">
          <h3 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-100 flex items-center">
            Experience{' '}
            {editing && (
              <button
                onClick={addExp}
                className="ml-2 inline-flex items-center text-xs text-blue-600 hover:underline"
              >
                <PlusCircle size={14} /> Add
              </button>
            )}
          </h3>
          {editExp.length === 0 && !editing && (
            <p className="text-sm text-gray-500">No experience added yet.</p>
          )}
          {editExp.map((exp, i) => (
            <div key={i} className="mb-6">
              {editing ? (
                <>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input
                      value={exp.title}
                      onChange={(e) => updateExp(i, 'title', e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg p-2 text-sm"
                      placeholder="Job Title"
                    />
                    <input
                      value={exp.company}
                      onChange={(e) => updateExp(i, 'company', e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg p-2 text-sm"
                      placeholder="Company"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 mt-2">
                    <input
                      type="date"
                      value={exp.startDate}
                      onChange={(e) => updateExp(i, 'startDate', e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg p-2 text-sm"
                    />
                    {!exp.currentlyWorking && (
                      <input
                        type="date"
                        value={exp.endDate}
                        onChange={(e) => updateExp(i, 'endDate', e.target.value)}
                        className="bg-white border border-gray-200 rounded-lg p-2 text-sm"
                      />
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-xs flex items-center gap-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={exp.currentlyWorking}
                        onChange={() => toggleCurrent(i)}
                        className="h-4 w-4 text-indigo-600 rounded"
                      />
                      Currently here
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
                    value={exp.description}
                    onChange={(e) => updateExp(i, 'description', e.target.value)}
                    className="mt-2 w-full bg-white border border-gray-200 rounded-lg p-2 text-sm"
                    placeholder="Describe your role..."
                  />
                </>
              ) : (
                <>
                  <p className="font-semibold text-md">
                    {exp.title}
                    {exp.company && ` • ${exp.company}`}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatRange(exp.startDate, exp.endDate, exp.currentlyWorking)}
                  </p>
                  {exp.description && (
                    <p className="text-sm mt-2 text-gray-600 whitespace-pre-line">
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
              {poapsToShow.map((poap, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white rounded-lg p-2 text-sm">
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
              <button
                onClick={() => setShowAllPoaps(!showAllPoaps)}
                className="mt-2 text-xs text-blue-600 hover:underline flex items-center"
              >
                {showAllPoaps ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showAllPoaps ? 'Hide' : 'View all'}
              </button>
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
              {nftsToShow.map((nft, idx) => (
                <img
                  key={idx}
                  src={nft.image || nft.image_url || '/nft-placeholder.png'}
                  alt={nft.name || `NFT ${idx}`}
                  className="w-full h-24 object-cover rounded-lg shadow-sm"
                />
              ))}
            </div>
          </div>
        )}

        {/* Link to OpenSea */}
        {address && (
          <div className="mt-6 text-center">
            <a
              href={`https://opensea.io/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-500"
            >
              <ExternalLink size={14} />
              View full collection on OpenSea
            </a>
          </div>
        )}

        {/* Action Buttons */}
        {isOwner && (
          <div className="mt-8 flex justify-center gap-3">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg shadow-sm hover:bg-indigo-700"
                >
                  <Save size={16} />
                  Save
                </button>
                <button
                  onClick={() => {
                    // revert
                    setEditing(false);
                    setEditBio(bio || ensBio);
                    setEditExp(workExperience);
                    setEditTag(tag || '');
                    setEditTwitter(twitter || '');
                    setEditWarpcast(warpcast || '');
                    setEditWebsite(website || '');
                    setEditLookingForWork(lookingForWork);
                  }}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-gray-300 text-gray-800 text-sm rounded-lg shadow-sm hover:bg-gray-400"
                >
                  <X size={16} />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg shadow-sm hover:bg-indigo-700"
              >
                <Edit size={16} />
                Edit Profile
              </button>
            )}
          </div>
        )}

        {justSaved && (
          <div className="mt-4 text-sm text-green-600 flex justify-center items-center">
            <CheckCircle size={16} className="mr-1" />
            Profile saved!
          </div>
        )}
      </div>
    </motion.div>
  );
}
