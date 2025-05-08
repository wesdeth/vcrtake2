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
  RefreshCw,
  ExternalLink,
  PlusCircle,
  Trash2,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import axios from 'axios';

const shortenAddress = (addr) => (addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '');

const parseDate = (d) => {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl ring-1 ring-indigo-200/60 border border-white/10"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-100 to-cyan-100 opacity-40 animate-gradient-radial blur-2xl" />

      <div className="relative z-10 p-8 sm:p-10 text-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        {/* SOCIALS + BIO */}
        {editing ? (
          <>
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
            <input className="p-2 border rounded mt-3" value={editTwitter} onChange={(e) => setEditTwitter(e.target.value)} placeholder="Twitter" />
            <input className="p-2 border rounded mt-2" value={editWarpcast} onChange={(e) => setEditWarpcast(e.target.value)} placeholder="Warpcast" />
            <input className="p-2 border rounded mt-2" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} placeholder="Website" />
            <input className="p-2 border rounded mt-2" value={editTag} onChange={(e) => setEditTag(e.target.value)} placeholder="Tag / Title" />
          </>
        ) : (
          <>
            {editBio && <p className="mt-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{editBio}</p>}
            <div className="mt-4 flex justify-center gap-4 text-gray-600 dark:text-gray-300">
              {twitter && (
                <a href={`https://x.com/${twitter.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer">
                  <Twitter size={20} />
                </a>
              )}
              {warpcast && (
                <a href={`https://warpcast.com/${warpcast.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer">
                  <UserPlus2 size={20} />
                </a>
              )}
              {website && (
                <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer">
                  <LinkIcon size={20} />
                </a>
              )}
              {efpLink && (
                <a href={efpLink} target="_blank" rel="noopener noreferrer">
                  <UserPlus2 size={20} />
                </a>
              )}
            </div>
          </>
        )}

        {/* POAPs */}
        {poapData.length > 0 && (
          <div className="mt-6 text-left">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">POAPs</h3>
            <div className="grid grid-cols-2 gap-2">
              {poapsToShow.map((poap, i) => (
                <div key={i} className="flex items-center gap-2 bg-white rounded shadow p-2 text-sm text-gray-700">
                  <img src={poap.event.image_url} alt={poap.event.name} className="w-6 h-6 rounded-full" />
                  <span className="truncate">{poap.event.name}</span>
                </div>
              ))}
            </div>
            {poapData.length > 4 && (
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => setShowAllPoaps(!showAllPoaps)}
                  className="flex items-center text-xs text-blue-500 hover:underline"
                >
                  {showAllPoaps ? <ChevronUp size={12} /> : <ChevronDown size={12} />} View All
                </button>
              </div>
            )}
          </div>
        )}

        {/* WORK EXPERIENCE */}
        {editing ? (
          <div className="mt-6 text-left">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Work Experience</h3>
            {editExp.map((exp, idx) => (
              <div key={idx} className="mb-4 space-y-1">
                <input className="w-full p-2 border rounded text-sm" placeholder="Title" value={exp.title} onChange={(e) => updateExp(idx, 'title', e.target.value)} />
                <input className="w-full p-2 border rounded text-sm" placeholder="Company" value={exp.company} onChange={(e) => updateExp(idx, 'company', e.target.value)} />
                <input className="w-full p-2 border rounded text-sm" placeholder="Start Date" value={exp.startDate} onChange={(e) => updateExp(idx, 'startDate', e.target.value)} />
                {!exp.currentlyWorking && <input className="w-full p-2 border rounded text-sm" placeholder="End Date" value={exp.endDate} onChange={(e) => updateExp(idx, 'endDate', e.target.value)} />}
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={exp.currentlyWorking} onChange={() => toggleCurrent(idx)} /> Currently Working
                </label>
                <input className="w-full p-2 border rounded text-sm" placeholder="Location" value={exp.location} onChange={(e) => updateExp(idx, 'location', e.target.value)} />
                <textarea className="w-full p-2 border rounded text-sm" placeholder="Description" value={exp.description} onChange={(e) => updateExp(idx, 'description', e.target.value)} />
                <button onClick={() => removeExp(idx)} className="text-red-500 text-xs flex items-center gap-1">
                  <Trash2 size={12} /> Remove
                </button>
              </div>
            ))}
            <button onClick={addExp} className="flex items-center gap-1 text-blue-500 text-sm mt-2">
              <PlusCircle size={14} /> Add Work Experience
            </button>
          </div>
        ) : (
          workExperience.length > 0 && (
            <div className="mt-6 text-left">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Work Experience</h3>
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
          )
        )}
      </div>
    </motion.div>
  );
}
