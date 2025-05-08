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
  CheckCircle,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import axios from 'axios';

/* ============================================================
   Helper utilities
   ============================================================ */
const shortenAddress = (addr = '') => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '');

const parseDate = (d) => {
  if (!d) return null;
  const p = Date.parse(d.replace(/\//g, '-'));
  return Number.isNaN(p) ? null : new Date(p);
};

const formatRange = (s, e, current) => {
  if (!s) return '';
  const start = parseDate(s)?.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  const end = current
    ? 'Present'
    : parseDate(e)?.toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) || '';
  return `${start} – ${end}`;
};

/* ============================================================
   Component
   ============================================================ */
export default function ProfileCard({ data = {} }) {
  /* --------------------- props ---------------------------- */
  const {
    name,
    address,
    avatar,
    twitter,
    website,
    tag,
    efpLink,
    warpcast,
    poaps = [], // pre‑fetched POAPs (optional)
    nfts = [],  // pre‑fetched NFTs  (optional)
    ownsProfile = false,
    workExperience = [],
    bio = '',
    ensBio = ''
  } = data;

  /* --------------------- state ---------------------------- */
  const [showAllPoaps, setShowAllPoaps] = useState(false);
  const [poapData, setPoapData] = useState(poaps);
  const [editing, setEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  // editable fields
  const [uploadedAvatar, setUploadedAvatar] = useState(avatar || '');
  const [editTwitter, setEditTwitter] = useState(twitter || '');
  const [editWebsite, setEditWebsite] = useState(website || '');
  const [editWarpcast, setEditWarpcast] = useState(warpcast || '');
  const [editTag, setEditTag] = useState(tag || '');
  const [editBio, setEditBio] = useState(bio || ensBio);
  const [editExp, setEditExp] = useState(workExperience);

  /* -------------------- derived --------------------------- */
  const { address: connected } = useAccount();
  const isOwner = ownsProfile || (connected && connected.toLowerCase() === (address || '').toLowerCase());

  /* -------------------- effects --------------------------- */
  useEffect(() => {
    const fetchPoaps = async () => {
      try {
        const r = await axios.get(`https://api.poap.tech/actions/scan/${address}`, {
          headers: {
            'X-API-Key': process.env.NEXT_PUBLIC_POAP_API_KEY || 'demo'
          }
        });
        setPoapData(r.data || []);
      } catch (err) {
        console.error('POAP fetch error', err);
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
  const nftsToShow  = nfts.slice(0, 6);

  /* -------------------- handlers ------------------------- */
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
      if (!res.ok) throw new Error((await res.json()).error || 'Unknown error');
      setEditing(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      console.error('save-profile error', err);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setUploadedAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  /* ---------- work‑experience field helpers -------------- */
  const updateExp = (i, field, val) =>
    setEditExp((prev) => prev.map((e, idx) => (idx === i ? { ...e, [field]: val } : e)));

  const toggleCurrent = (i) =>
    setEditExp((prev) =>
      prev.map((e, idx) =>
        idx === i ? { ...e, currentlyWorking: !e.currentlyWorking, endDate: e.currentlyWorking ? '' : e.endDate } : e
      )
    );

  const addExp = () =>
    setEditExp((prev) => [
      ...prev,
      { title: '', company: '', startDate: '', endDate: '', location: '', description: '', currentlyWorking: false }
    ]);

  const removeExp = (i) => setEditExp((prev) => prev.filter((_, idx) => idx !== i));

  /* --------------------------- UI ------------------------ */
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl ring-1 ring-indigo-200/60 border border-white/10"
    >
      {/* gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-100 to-cyan-100 opacity-40 animate-gradient-radial blur-2xl" />

      {/* card body */}
      <div className="relative z-10 p-8 sm:p-10 text-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        {/* edit / save controls */}
        {isOwner && (
          <div className="absolute top-4 left-4 flex gap-2">
            <button
              onClick={editing ? handleSave : () => setEditing(true)}
              title={editing ? 'Save' : 'Edit'}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur p-1.5 rounded-full shadow"
            >
              {editing ? <Save size={18} /> : <Edit size={18} />}
            </button>
            {editing && (
              <button
                onClick={() => setEditing(false)}
                title="Cancel"
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur p-1.5 rounded-full shadow"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* ─── Avatar ──────────────────────────────────────── */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto mb-6 relative">
          <img
            src={uploadedAvatar || '/default-avatar.png'}
            alt="avatar"
            className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
          />
          {editing && (
            <label className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow cursor-pointer">
              <Upload size={18} className="text-indigo-500" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          )}
        </div>

        {/* save toast */}
        {justSaved && (
          <div className="absolute top-4 right-4 flex items-center gap-1 text-green-600 text-sm font-semibold">
            <CheckCircle size={16} /> Saved
          </div>
        )}

        {/* name + address */}
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-800 dark:text-white">
          {name || shortenAddress(address)}
        </h2>
        {address && (
          <p
            className="inline-flex items-center gap-1 text-xs sm:text-sm mx-auto text-indigo-600 dark:text-indigo-300 mt-1 cursor-pointer justify-center"
            title="Copy address"
            onClick={() => navigator.clipboard.writeText(address)}
          >
            {shortenAddress(address)} <Copy size={12} />
          </p>
        )}
        {tag && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{tag}</p>}

        {/* ===================== Bio & Socials ===================== */}
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

            {/* ---------------- Work Experience Editor ---------------- */}
            <div className="mt-4 text-left">
              <h3 className="text-lg md:text-xl font-extrabold tracking-tight text-gray-800 dark:text-white mb-2">
                Work Experience
              </h3>
              {editExp.map((exp, idx) => (
                <div key={idx} className="mb-2 space-y-1">
                  <input
                    className="w-full p-2 border rounded text-sm"
                    placeholder="Title"
                    value={exp.title}
                    onChange={(e) => updateExp(idx, 'title', e.target.value)}
                  />
                  <input
                    className="w-full p-2 border rounded text-sm"
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) => updateExp(idx, 'company', e.target.value)}
                  />
                  <input
                    className="w-full p-2 border rounded text-sm"
                    placeholder="Start Date"
                    value={exp.startDate}
                    onChange={(e) => updateExp(idx, 'startDate', e.target.value)}
                  />
                  {!exp.currentlyWorking && (
                    <input
                      className="w-full p-2 border rounded text-sm"
                      placeholder="End Date"
                      value={exp.endDate}
                      onChange={(e) => updateExp(idx, 'endDate', e.target.value)}
                    />
                  )}
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={exp.currentlyWorking} onChange={() => toggleCurrent(idx)} /> Currently Working
                  </label>
                  <input
                    className="w-full p-2 border rounded text-sm"
                    placeholder="Location"
                    value={exp.location}
                    onChange
