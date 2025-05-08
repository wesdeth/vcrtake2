// components/ProfileCard.js – fully restored, compile‑ready
// Copy this entire file into /components/ProfileCard.js

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
  RefreshCw,
  ExternalLink,
  PlusCircle,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import axios from 'axios';

/* ------------------------------------------------------------------
   Helper utilities
------------------------------------------------------------------ */
const shortenAddress = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '');
const parseDate = (str) => {
  const t = Date.parse(str.replace(/\//g, '-'));
  return Number.isNaN(t) ? null : new Date(t);
};
const formatRange = (s, e, cur) => {
  if (!s) return '';
  const start = parseDate(s)?.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  const end = cur ? 'Present' : parseDate(e)?.toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) || '';
  return `${start} – ${end}`;
};

/* ------------------------------------------------------------------
   Component
------------------------------------------------------------------ */
export default function ProfileCard({ data }) {
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
    ownsProfile = false,
    workExperience = [],
    bio = '',
    ensBio = ''
  } = data;

  /* ---------------- state ---------------- */
  const [showAll, setShowAll] = useState(false);
  const [poapData, setPoapData] = useState([]);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const [avatarUrl, setAvatarUrl]     = useState(avatar || '');
  const [xHandle, setXHandle]         = useState(twitter);
  const [site, setSite]               = useState(website);
  const [warp, setWarp]               = useState(warpcast);
  const [title, setTitle]             = useState(tag);
  const [about, setAbout]             = useState(bio || ensBio);
  const [exp, setExp]                 = useState(workExperience);

  const { address: connected } = useAccount();
  const isOwner = ownsProfile || connected?.toLowerCase() === address?.toLowerCase();

  /* ---------------- effects -------------- */
  useEffect(() => {
    const fetchPoaps = async () => {
      try {
        const r = await axios.get(`https://api.poap.tech/actions/scan/${address}`, {
          headers: { 'X-API-Key': process.env.NEXT_PUBLIC_POAP_API_KEY || 'demo' }
        });
        setPoapData(r.data || []);
      } catch {
        setPoapData([]);
      }
    };

    const fetchOpenseaAvatar = async () => {
      if (avatar) return;
      try {
        const r = await axios.get(`https://api.opensea.io/api/v1/user/${address}`);
        const img = r.data?.account?.profile_img_url;
        if (img) setAvatarUrl(img);
      } catch {
        setAvatarUrl('/default-avatar.png');
      }
    };

    if (address) {
      fetchPoaps();
      fetchOpenseaAvatar();
    }
  }, [address, avatar]);

  const poapsShown = showAll ? poapData : poapData.slice(0, 4);

  /* ---------------- handlers ------------- */
  const handleSave = async () => {
    try {
      const res = await fetch('/api/save-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ensName: name,
          address,
          twitter: xHandle,
          warpcast: warp,
          website: site,
          tag: title,
          bio: about,
          custom_avatar: avatarUrl,
          experience: exp.map((e) => ({
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
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const uploadAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const updateExp = (i, f, v) => setExp((p) => p.map((e, idx) => (idx === i ? { ...e, [f]: v } : e)));
  const toggleCurrent = (i) => setExp((p) => p.map((e, idx) => (idx === i ? { ...e, currentlyWorking: !e.currentlyWorking, endDate: e.currentlyWorking ? '' : e.endDate } : e))));
  const addExp = () => setExp((p) => [...p, { title: '', company: '', startDate: '', endDate: '', location: '', description: '', currentlyWorking: false }]);
  const removeExp = (i) => setExp((p) => p.filter((_, idx) => idx !== i));

  /* ---------------- JSX ------------------ */
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl ring-indigo-200/60 border border-white/10"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-100 to-cyan-100 opacity-40 animate-gradient-radial blur-2xl" />

      <div className="relative z-10 p-8 sm:p-10 text-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        {/* Avatar */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto mb-6 relative">
          <img src={avatarUrl || '/default-avatar.png'} alt="avatar" className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg" />
          {editing && (
            <label className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow cursor-pointer">
              <Upload size={18} className="text-indigo-500" />
              <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
            </label>
          )}
        </div>

        {saved && (
          <div className="absolute top-4 right-4 flex items-center gap-1 text-green-600 text-sm font-semibold"><CheckCircle size={16} /> Saved</div>
        )}

        {/* Name & address */}
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-800 dark:text-white">{name || shortenAddress(address)}</h2>
        <p className="inline-flex items-center gap-1 text-xs sm:text-sm mx-auto text-indigo-600 dark:text-indigo-300 mt-1 cursor-pointer" title="Copy address" onClick={() => navigator.clipboard.writeText(address)}>{shortenAddress(address)} <Copy size={12} /></p>

        {/* Bio & socials */}
        {editing ? (
          <> {/* EDIT MODE */}
            <div className="my-3">
              <textarea className="w-full p-2 border rounded text-sm" rows={3} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Enter your bio" />
              <button onClick={() => setAbout(ensBio)} className="flex items-center gap-1 text-sm text-blue-500 hover:underline mt-1"><RefreshCw size={14} /> Reset to ENS Bio</button>
            </div>
            <div className="flex flex-col gap-2 text-left text-sm">
              <input className="p-2 border rounded" value={xHandle} onChange={(e) => setXHandle(e.target.value)} placeholder="X handle" />
              <input className="p-2 border rounded" value={warp} onChange={(e) => setWarp(e.target.value)} placeholder="Warpcast username" />
              <input className="p-2 border rounded" value={site} onChange={(e) => setSite(e.target.value)} placeholder="Website URL" />
              <input className="p-2 border rounded" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tag / Title" />
            </div>
            <div className="mt-4 text-left">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Work Experience</h3>
              {exp.map((item, idx) => (
                <div key={idx} className="mb-3 space-y-1">
                  <input className="w-full p-2 border rounded text-sm" placeholder="Title" value={item.title} onChange={(e) => updateExp(idx, 'title', e.target.value)} />
                  <input className="w-full p-2 border rounded text-sm" placeholder="Company" value={item.company} onChange={(e) => updateExp(idx, 'company', e.target.value)} />
                  <div className="flex gap-2">
                    <input className="p-2 border rounded text-sm flex-1" placeholder="Start Date" value={item.startDate} onChange={(e) => updateExp(idx, 'startDate', e.target.value)} />
                    {!item.currentlyWorking && <input className="p-2 border rounded text-sm flex-1" placeholder="End Date" value={item.endDate} onChange={(e) => updateExp(idx, 'endDate', e.target.value)} />}
                  </div>
                  <label className="inline-flex items-center gap-1 text-sm">
                    <input type="checkbox" checked={item.currentlyWorking} onChange={() => toggleCurrent(idx)} /> Currently Working
                  </label>
                  <input className="w-full p-2 border rounded text-sm" placeholder="Location" value={item.location} onChange={(e) => updateExp(idx, 'location', e.target.value)} />
                  <textarea className="w-full p-2 border rounded text-sm" rows={2} placeholder="Description" value={item.description} onChange={(e) => updateExp(idx, 'description', e.target.value)} />
                  <button onClick={() => removeExp(idx)} className="text-red-500 text-xs">Remove</button>
                </div>
              ))}
              <button onClick={addExp} className="text-blue-500 text-sm">+ Add Experience</button>
            </div>
            <div className="mt-6">
              <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700">
                <Save size={16} /> Save Changes
              </button>
            </div>
          </>
        ) : (
          <> {/* VIEW MODE */}
            {about && <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">{about}</p>}
            <div className="mt-4 flex justify-center gap-4 text-gray-600 dark:text-gray-300">
              {xHandle && <a href={`https://x.com/${xHandle.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer"><Twitter size={20} /></a>}
              {warp && <a href={`https://warpcast.com/${warp}`} target="_blank" rel="noopener noreferrer"><UserPlus2 size={20} /></a>}
              {efpLink && <a href={efpLink} target="_blank" rel="noopener noreferrer"><UserPlus2 size={20} /></a>}
              {site && <a href={site.startsWith('http') ? site : `https://${site}`} target="_blank" rel="noopener noreferrer"><LinkIcon size={20} /></a>}
            </div>
            {exp.length > 0 && <div className="mt-6 text-left">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Work Experience</h3>
              <ul className="space-y-4 mt-2">
                {exp.map((item, idx) => (
                  <li key={idx}>
                    <div className="font-semibold text-gray-800 dark:text-white">{item.title} at {item.company}</div>
                    <div className="text-gray-600 dark:text-gray-400">{formatRange(item.startDate, item.endDate, item.currentlyWorking)} • {item.location}</div>
                    {item.description && <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm">{item.description}</p>}
                  </li>
                ))}
              </ul>
            </div>}
            {poapsShown.length > 0 && <div className="mt-6 text-left">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">POAPs</h3>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {poapsShown.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white rounded-lg shadow p-2">
                    <img src={p.event.image_url} alt={p.event.name} className="w-6 h-6 rounded-full" />
                    <span className="truncate text-sm">{p.event.name}</span>
                  </div>
                ))}
              </div>
              {poapData.length > 4 && <button onClick={() => setShowAll(!showAll)} className="mt-2 text-blue-500 text-xs">{showAll ? 'Show Less' : 'View All'}</button>}
            </div>}
            {address && <div className="mt-6 text-center">
              <a href={`https://opensea.io/${address}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                <ExternalLink size={14} /> View NFTs on OpenSea
              </a>
            </div>}
            {isOwner && <div className="mt-6">
              <button onClick={() => setEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                <Edit size={16} /> Edit Profile
              </button>
            </div>}
          </>
        )}
      </div>
    </motion.div>
  );
}

