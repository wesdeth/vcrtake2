// components/ProfileCard.js
import { useState, useEffect } from 'react';
import Image from 'next/image';
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

function shortenAddress(addr) {
  return addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : '';
}

function parseDateString(dateString) {
  const parsed = Date.parse(dateString.replace(/\//g, '-'));
  return isNaN(parsed) ? null : new Date(parsed);
}

function formatDateRange(startDate, endDate, currentlyWorking) {
  if (!startDate) return '';
  const start = parseDateString(startDate)?.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  const end = currentlyWorking ? 'Present' : parseDateString(endDate)?.toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) || '';
  return `${start} – ${end}`;
}

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
  const [displayedPoaps, setDisplayedPoaps] = useState([]);
  const [editing, setEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [uploadedAvatar, setUploadedAvatar] = useState(avatar || '');
  const [editTwitter, setEditTwitter] = useState(twitter);
  const [editWebsite, setEditWebsite] = useState(website);
  const [editWarpcast, setEditWarpcast] = useState(warpcast);
  const [editTag, setEditTag] = useState(tag);
  const [editBio, setEditBio] = useState(bio || ensBio);
  const [editWorkExperience, setEditWorkExperience] = useState(workExperience);

  const { address: connected } = useAccount();
  const isOwner = ownsProfile || connected?.toLowerCase() === address?.toLowerCase();

  useEffect(() => {
    const fetchPoapImages = async () => {
      try {
        const res = await axios.get(`https://api.poap.tech/actions/scan/${address}`, {
          headers: {
            'X-API-Key': process.env.NEXT_PUBLIC_POAP_API_KEY || 'demo'
          }
        });
        setDisplayedPoaps(res.data || []);
      } catch (error) {
        console.error('Failed to fetch POAPs', error);
        setDisplayedPoaps([]);
      }
    };

    const fetchDefaultAvatar = async () => {
      if (avatar) return;
      try {
        const res = await axios.get(`https://api.opensea.io/api/v1/user/${address}`);
        const openseaAvatar = res.data?.account?.profile_img_url;
        if (openseaAvatar) setUploadedAvatar(openseaAvatar);
      } catch {
        setUploadedAvatar('/default-avatar.png');
      }
    };

    if (address) {
      fetchPoapImages();
      fetchDefaultAvatar();
    }
  }, [address, avatar]);

  const poapsToShow = showAllPoaps ? displayedPoaps : displayedPoaps.slice(0, 4);

  const handleSave = async () => {
  try {
    const res = await fetch('/api/save-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ensName: name,
        address, // ✅ Include the address here
        twitter: editTwitter,
        warpcast: editWarpcast,
        website: editWebsite,
        tag: editTag,
        bio: editBio,
        custom_avatar: uploadedAvatar,
        experience: editWorkExperience.map(exp => ({
          ...exp,
          startDate: exp.startDate || '',
          endDate: exp.currentlyWorking ? null : exp.endDate || '',
          currentlyWorking: !!exp.currentlyWorking,
          location: exp.location || '',
          description: exp.description || ''
        }))
      })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error);
    setEditing(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 3000);
  } catch (err) {
    console.error('Failed to save profile:', err.message);
  }
};

  const resetBio = () => setEditBio(ensBio);

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setUploadedAvatar(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleWorkChange = (i, field, val) => {
    const copy = [...editWorkExperience];
    copy[i][field] = val;
    setEditWorkExperience(copy);
  };

  const toggleCurrentlyWorking = (i) => {
    const copy = [...editWorkExperience];
    copy[i].currentlyWorking = !copy[i].currentlyWorking;
    if (copy[i].currentlyWorking) copy[i].endDate = '';
    setEditWorkExperience(copy);
  };

  const addWorkExperience = () => setEditWorkExperience([
    ...editWorkExperience,
    { title: '', company: '', startDate: '', endDate: '', location: '', description: '', currentlyWorking: false }
  ]);

  const removeWorkExperience = (i) => setEditWorkExperience(editWorkExperience.filter((_, idx) => i !== idx));

  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-xl border border-white/20">
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white via-purple-100 to-yellow-100 opacity-30 animate-gradient-radial blur-2xl" />
      <div className="relative z-10 p-6 text-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <div className="w-24 h-24 mx-auto mb-4 relative">
          <img src={uploadedAvatar || '/default-avatar.png'} alt="avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
          {editing && (
            <label className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow cursor-pointer">
              <Upload size={16} className="text-blue-500" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          )}
        </div>

        {justSaved && (
          <div className="absolute top-4 right-4 flex items-center gap-1 text-green-600 text-sm font-semibold">
            <CheckCircle size={16} /> Saved
          </div>
        )}

        <h2 className="text-2xl font-black text-gray-800 dark:text-white truncate">{name || shortenAddress(address)}</h2>
        <p onClick={() => navigator.clipboard.writeText(address)} className="text-xs text-gray-500 dark:text-gray-400 mt-1 cursor-pointer flex items-center gap-1" title="Click to copy address">
          {shortenAddress(address)} <Copy size={12} />
        </p>

        {editing ? (
          <>
            <div className="my-3">
              <textarea className="w-full rounded p-2 border border-gray-300 text-sm" rows={3} value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Enter your bio" />
              <button onClick={resetBio} className="flex items-center text-sm text-blue-500 hover:underline gap-1 mt-1">
                <RefreshCw size={14} /> Reset to ENS Bio
              </button>
            </div>
            <div className="flex flex-col gap-2 text-left text-sm">
              <input className="p-2 border rounded" value={editTwitter} onChange={(e) => setEditTwitter(e.target.value)} placeholder="Twitter handle" />
              <input className="p-2 border rounded" value={editWarpcast} onChange={(e) => setEditWarpcast(e.target.value)} placeholder="Warpcast username" />
              <input className="p-2 border rounded" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} placeholder="Website URL" />
              <input className="p-2 border rounded" value={editTag} onChange={(e) => setEditTag(e.target.value)} placeholder="Your Tag or Title" />
            </div>
            <div className="mt-4 text-left">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-2">Work Experience</h3>
              {editWorkExperience.map((exp, index) => (
                <div key={index} className="mb-2 space-y-1">
                  <input className="w-full p-2 border rounded text-sm" placeholder="Title" value={exp.title} onChange={(e) => handleWorkChange(index, 'title', e.target.value)} />
                  <input className="w-full p-2 border rounded text-sm" placeholder="Company" value={exp.company} onChange={(e) => handleWorkChange(index, 'company', e.target.value)} />
                  <input className="w-full p-2 border rounded text-sm" placeholder="Start Date" value={exp.startDate} onChange={(e) => handleWorkChange(index, 'startDate', e.target.value)} />
                  {!exp.currentlyWorking && (
                    <input className="w-full p-2 border rounded text-sm" placeholder="End Date" value={exp.endDate} onChange={(e) => handleWorkChange(index, 'endDate', e.target.value)} />
                  )}
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={exp.currentlyWorking} onChange={() => toggleCurrentlyWorking(index)} /> Currently Working Here
                  </label>
                  <input className="w-full p-2 border rounded text-sm" placeholder="Location" value={exp.location} onChange={(e) => handleWorkChange(index, 'location', e.target.value)} />
                  <textarea className="w-full p-2 border rounded text-sm" placeholder="Description" value={exp.description} onChange={(e) => handleWorkChange(index, 'description', e.target.value)} />
                  <button onClick={() => removeWorkExperience(index)} className="text-red-500 text-xs flex items-center gap-1"><Trash2 size={12} /> Remove</button>
                </div>
              ))}
              <button onClick={addWorkExperience} className="flex items-center gap-1 text-blue-500 text-sm mt-2"><PlusCircle size={14} /> Add Work Experience</button>
            </div>
          </>
        ) : (
          <>
            <div className="mt-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{editBio}</div>
            {workExperience.length > 0 && (
              <div className="mt-6 text-left">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-2">Work Experience</h3>
                <ul className="space-y-4">
                  {workExperience.map((exp, i) => (
                    <li key={i} className="text-sm text-left">
                      <div className="font-semibold text-gray-800 dark:text-white">{exp.title} at {exp.company}</div>
                      <div className="text-gray-600 dark:text-gray-400">{formatDateRange(exp.startDate, exp.endDate, exp.currentlyWorking)} • {exp.location}</div>
                      {exp.description && <div className="text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap">{exp.description}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {displayedPoaps.length > 0 && (
          <div className="mt-6 text-left">
            <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-2">POAPs</h3>
            <div className="grid grid-cols-2 gap-2">
              {poapsToShow.map((poap, i) => (
                <div key={i} className="flex items-center gap-2 bg-white rounded-lg shadow p-2 text-sm text-gray-700">
                  <img src={poap.event.image_url} alt={poap.event.name} className="w-6 h-6 rounded-full" />
                  <span className="truncate">{poap.event.name}</span>
                </div>
              ))}
            </div>
            {displayedPoaps.length > 4 && (
              <div className="flex justify-end mt-2">
                <button onClick={() => setShowAllPoaps(!showAllPoaps)} className="flex items-center text-xs text-blue-500 hover:underline">
                  {showAllPoaps ? <ChevronUp size={12} /> : <ChevronDown size={12} />} View All
                </button>
              </div>
            )}
          </div>
        )}

        {address && (
          <div className="mt-4 text-center">
            <a href={`https://opensea.io/${address}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
              <ExternalLink size={14} /> View NFTs on OpenSea
            </a>
          </div>
        )}

        {isOwner && (
          <div className="mt-6">
            {editing ? (
              <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition">
                <Save size={16} className="inline mr-2" /> Save Changes
              </button>
            ) : (
              <button onClick={() => setEditing(true)} className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
                <Edit size={16} className="inline mr-2" /> Edit Profile
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
