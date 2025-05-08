// components/ProfileCard.js
import { useState, useEffect } from 'react';
import {
  Copy,
  Twitter, // lucide "bird" icon until an official X logo is available
  Link as LinkIcon,
  UserPlus2,
  ChevronDown,
  ChevronUp,
  Edit,
  Save,
  Upload,
  RefreshCw,
  ExternalLink,
  PlusCircle,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import axios from 'axios';

// ---------- helper utilities ----------------------------------------------
const shortenAddress = (addr) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '');
const parseDate = (d) => {
  const p = Date.parse(d.replace(/\//g, '-'));
  return Number.isNaN(p) ? null : new Date(p);
};
const formatRange = (s, e, current) => {
  if (!s) return '';
  const start = parseDate(s)?.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  const end = current ? 'Present' : parseDate(e)?.toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) || '';
  return `${start} – ${end}`;
};

// --------------------------------------------------------------------------
export default function ProfileCard({ data }) {
  const {
    name,
    address,
    avatar,
    twitter, // stored as twitter in DB, rendered as X handle
    website,
    tag,
    efpLink,
    warpcast,
    poaps = [],
    ownsProfile = false,
    workExperience = [],
    bio = '',
    ensBio = ''
  } = data;

  // ------------- local state ---------------------------------------------
  const [showAllPoaps, setShowAllPoaps] = useState(false);
  const [poapData, setPoapData] = useState([]);
  const [editing, setEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const [uploadedAvatar, setUploadedAvatar] = useState(avatar || '');
  const [editTwitter, setEditTwitter] = useState(twitter);
  const [editWebsite, setEditWebsite] = useState(website);
  const [editWarpcast, setEditWarpcast] = useState(warpcast);
  const [editTag, setEditTag] = useState(tag);
  const [editBio, setEditBio] = useState(bio || ensBio);
  const [editExp, setEditExp] = useState(workExperience);

  const { address: connected } = useAccount();
  const isOwner = ownsProfile || connected?.toLowerCase() === address?.toLowerCase();

  // ------------- effects --------------------------------------------------
  useEffect(() => {
    const fetchPoaps = async () => {
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
      if (avatar) return;
      try {
        const r = await axios.get(`https://api.opensea.io/api/v1/user/${address}`);
        const img = r.data?.account?.profile_img_url;
        if (img) setUploadedAvatar(img);
      } catch {
        setUploadedAvatar('/default-avatar.png');
      }
    };

    if (address) {
      fetchPoaps();
      fetchAvatar();
    }
  }, [address, avatar]);

  const poapsToShow = showAllPoaps ? poapData : poapData.slice(0, 4);

  // ------------- handlers -------------------------------------------------
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
      if (!res.ok) throw new Error((await res.json()).error);
      setEditing(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      console.error('save-profile error', err);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setUploadedAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  // work exp helpers
  const updateExp = (i, field, val) => setEditExp((prev) => prev.map((e, idx) => (idx === i ? { ...e, [field]: val } : e)));
  const toggleCurrent = (i) =>
    setEditExp((prev) =>
      prev.map((e, idx) =>
        idx === i ? { ...e, currentlyWorking: !e.currentlyWorking, endDate: e.currentlyWorking ? '' : e.endDate } : e
      )
    );
  const addExp = () => setEditExp((prev) => [...prev, { title: '', company: '', startDate: '', endDate: '', location: '', description: '', currentlyWorking: false }]);
  const removeExp = (i) => setEditExp((prev) => prev.filter((_, idx) => idx !== i));

  // ------------- JSX ------------------------------------------------------
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-xl border border-white/20"
    >
      {/* background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-purple-100 to-yellow-100 opacity-30 animate-gradient-radial blur-2xl" />

      <div className="relative z-10 p-6 text-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        {/* avatar */}
        <div className="w-24 h-24 mx-auto mb-4 relative">
          <img
            src={uploadedAvatar || '/default-avatar.png'}
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
          />
          {editing && (
            <label className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow cursor-pointer">
              <Upload size={16} className="text-blue-500" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          )}
        </div>

        {justSaved && (
          <div className="absolute top-4 right-4 flex items-center gap-1 text-green-600 text-sm font-semibold">
            <CheckCircle size={16} /> Saved
          </div>
        )}

        {/* name & address */}
        <h2 className="text-2xl font-black truncate text-gray-800 dark:text-white">
          {name || shortenAddress(address)}
        </h2>
        <p
          className="inline-flex items-center gap-1 text-xs mx-auto text-gray-500 dark:text-gray-400 mt-1 cursor-pointer justify-center"
          title="Copy address"
          onClick={() => navigator.clipboard.writeText(address)}
        >
          {shortenAddress(address)} <Copy size={12} />
        </p>

        {/* bio & socials */}
        {editing ? (
          <>
            {/* bio textarea */}
            <div className="my-3">
              <textarea
                className="w-full p-2 border rounded text-sm"
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Enter your bio"
              />
              <button
                onClick={() => setEditBio(ensBio)}
                className="flex items-center gap-1 text-sm text-blue-500 hover:underline mt-1"
              >
                <RefreshCw size={14} /> Reset to ENS Bio
              </button>
            </div>

            {/* social inputs */}
            <div className="flex flex-col gap-2 text-left text-sm">
              <input
                className="p-2 border rounded"
                value={editTwitter}
                onChange={(e) => setEditTwitter(e.target.value)}
                placeholder="X handle (formerly Twitter)"
              />
              <input
                className="p-2 border rounded"
                value={editWarpcast}
                onChange={(e) => setEditWarpcast(e.target.value)}
                placeholder="Warpcast username"
              />
              <input
                className="p-2 border rounded"
                value={editWebsite}
                onChange={(e) => setEditWebsite(e.target.value)}
                placeholder="Website URL"
              />
              <input
                className="p-2 border rounded"
                value={editTag}
                onChange={(e) => setEditTag(e.target.value)}
                placeholder="Tag / Title"
              />
            </div>

            {/* work exp editor */}
            <div className="mt-4 text-left">
              <h3 className="text-lg md:text-xl font-extrabold tracking-tight text-gray-800 dark:text-white mb-2">Work Experience</h3>
              {editExp.map((exp, idx) => (
                <div key={idx} className="mb-2 space-y-1">
                  <input className="w-full p-2 border rounded text-sm" placeholder="Title" value={exp.title} onChange={(e) => updateExp(idx, 'title', e.target.value)} />
                  <input className="w-full p-2 border rounded text-sm" placeholder="Company" value={exp.company} onChange={(e) => updateExp(idx, 'company', e.target.value)} />
                  <input className="w-full p-2 border rounded text-sm" placeholder="Start Date" value={exp.startDate} onChange={(e) => updateExp(idx, 'startDate', e.target.value)} />
                  {!exp.currentlyWorking && (
                    <input className="w-full p-2 border rounded text-sm" placeholder="End Date" value={exp.endDate} onChange={(e) => updateExp(idx, 'endDate', e.target.value)} />
                  )}
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={exp.currentlyWorking} onChange={() => toggleCurrent(idx)} /> Currently Working
                  </label>
                  <input className="w-full p-2 border rounded text-sm" placeholder="Location" value={exp.location} onChange={(e) => updateExp(idx, 'location', e.target.value)} />
                  <textarea className="w-full p-2 border rounded text-sm" placeholder="Description" value={exp.description} onChange={(e) => updateExp(idx, 'description', e.target.value)} />
                  <button onClick={() => removeExp(idx)} className="text-red-500 text-xs flex items-center gap-1"><Trash2 size={12} /> Remove</button>
                </div>
              ))}
              <button onClick={addExp} className="flex items-center gap-1 text-blue-500 text-sm mt-2"><PlusCircle size={14} /> Add Work Experience</button>
            </div>
          </>
        ) : (
          <>
            {/* bio display */}
            {editBio && <div className="mt-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{editBio}</div>}

            {/* social icons */}
            {(twitter || website || warpcast || efpLink) && (
              <div className="mt-4 flex justify-center gap-4 text-gray-600 dark:text-gray-300">
                {twitter && (
                  <a href={`https://x.com/${twitter.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" title="X" className="hover:text-blue-500">
                    <Twitter size={20} />
                  </a>
                )}
                {warpcast && (
                  <a href={`https://warpcast.com/${warpcast.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" title="Warpcast" className="hover:text-violet-500">
                    <UserPlus2 size={20} />
                  </a>
                )}
                {efpLink && (
                  <a href={efpLink} target="_blank" rel="noopener noreferrer" title="Ethereum Follow Profile" className="hover:text-indigo-500">
                    <UserPlus2 size={20} />
                  </a>
                )}
                {website && (
                  <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" title="Website" className="hover:text-emerald-600">
                    <LinkIcon size={20} />
                  </a>
                )}
              </div>
            )}

            {/* work experience display */}
            {workExperience.length > 0 && (
              <div className="mt-6 text-left">
                <h3 className="text-lg md:text-xl font-extrabold tracking-tight text-gray-800 dark:text-white mb-2">Work Experience</h3>
                <ul className="space-y-4">
                  {workExperience.map((exp, i) => (
                    <li key={i} className="text-sm">
                      <div className="font-semibold text-gray-800 dark:text-white">
                        {exp.title} at {exp.company}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {formatRange(exp.startDate, exp.endDate, exp.currentlyWorking)} • {exp.location}
                      </div>
                      {exp.description && <div className="text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap">{exp.description}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* POAP list */}
        {poapData.length > 0 && (
          <div className="mt-6 text-left">
            <h3 className="text-lg md:text-xl font-extrabold tracking-tight text-gray-800 dark:text-white mb-2">POAPs</h3>
            <div className="grid grid-cols-2 gap-2">
              {poapsToShow.map((poap, i) => (
                <div key={i} className="flex items-center gap-2 bg-white rounded-lg shadow p-2 text-sm text-gray-700">
                  <img src={poap.event.image_url} alt={poap.event.name} className="w-6 h-6 rounded-full" />
                  <span className="truncate">{poap.event.name}</span>
                </div>
              ))}
            </div>
            {poapData.length > 4 && (
              <div className="flex justify-end mt-2">
                <button onClick={() => setShowAllPoaps(!showAllPoaps)} className="flex items-center text-xs text-blue-500 hover:underline">
                  {showAllPoaps ? <ChevronUp size={12} /> : <ChevronDown size={12} />} View All
                </button>
              </div>
            )}
          </div>
        )}

        {/* Opensea link */}
        {address && (
          <div className="mt-4 text-center">
            <a href={`https://opensea.io/${address}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
              <ExternalLink size={14} /> View NFTs on OpenSea
            </a>
          </div>
        )}

        {/* edit / save button */}
        {isOwner && (
          <div className="mt-6">
            {editing ? (
              <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition flex items-center gap-2">
                <Save size={16} /> Save Changes
              </button>
            ) : (
              <button onClick={() => setEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition flex items-center gap-2">
                <Edit size={16} /> Edit Profile
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
