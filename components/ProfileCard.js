// components/ProfileCard.js
import { useState, useEffect } from 'react';
import {
  Copy,
  Twitter, // lucide “bird” icon until an official X logo ships
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

// ---------- helpers --------------------------------------------------------
const shortenAddress = (addr) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '');
const parseDate = (d) => {
  const p = Date.parse(d.replace(/\//g, '-'));
  return Number.isNaN(p) ? null : new Date(p);
};
const formatRange = (start, end, current) => {
  if (!start) return '';
  const s = parseDate(start)?.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  const e = current ? 'Present' : parseDate(end)?.toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) || '';
  return `${s} – ${e}`;
};

// --------------------------------------------------------------------------
export default function ProfileCard({ data }) {
  const {
    name,
    address,
    avatar,
    twitter, // stored as twitter in DB → rendered as X handle
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

  // local state
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

  // effects
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

  // handlers
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
  const toggleCurrent = (i) => setEditExp((prev) => prev.map((e, idx) => (idx === i ? { ...e, currentlyWorking: !e.currentlyWorking, endDate: e.currentlyWorking ? '' : e.endDate } : e)));
  const addExp = () => setEditExp((prev) => [...prev, { title: '', company: '', startDate: '', endDate: '', location: '', description: '', currentlyWorking: false }]);
  const removeExp = (i) => setEditExp((prev) => prev.filter((_, idx) => idx !== i));

  // JSX
  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-xl border border-white/20">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-purple-100 to-yellow-100 opacity-30 animate-gradient-radial blur-2xl" />

      <div className="relative z-10 p-6 text-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        {/* avatar */}
        <div className="w-24 h-24 mx-auto mb-4 relative">
          <img src={uploadedAvatar || '/default-avatar.png'} alt="avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
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
        <h2 className="text-2xl font-black truncate text-gray-800 dark:text-white">{name || shortenAddress(address)}</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 cursor-pointer flex items-center gap-1" title="Copy address" onClick={() => navigator.clipboard.writeText(address)}>
          {shortenAddress(address)} <Copy size={12} />
        </p>

        {/* bio & socials */}
        {editing ? (
          <>
            <div className="my-3">
              <textarea className="w-full p-2 border rounded text-sm" rows={3} value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Enter your bio" />
              <button onClick={() => setEditBio(ensBio)} className="flex items-center gap-1 text-sm text-blue-500 hover:underline mt-1"><RefreshCw size={14} /> Reset to ENS Bio</button>
            </div>
            <div className="flex flex-col gap-2 text-left text-sm">
              <input className="p-2 border rounded" value={editTwitter} onChange={(e) => setEditTwitter(e.target.value)} placeholder="X handle (formerly Twitter)" />
              <input className="p-2 border rounded" value={editWarpcast} onChange={(e
