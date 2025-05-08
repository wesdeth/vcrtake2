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
  Briefcase,
  Edit,
  Save,
  Upload,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import axios from 'axios';

function shortenAddress(addr) {
  return addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : '';
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
  const [uploadedAvatar, setUploadedAvatar] = useState('');
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
      if (avatar) return setUploadedAvatar(avatar);
      try {
        const res = await axios.get(`https://api.opensea.io/api/v1/user/${address}`);
        const openseaAvatar = res.data?.account?.profile_img_url;
        if (openseaAvatar) return setUploadedAvatar(openseaAvatar);
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

  const handleSave = () => {
    console.log('Saving profile...', {
      avatar: uploadedAvatar,
      twitter: editTwitter,
      website: editWebsite,
      warpcast: editWarpcast,
      tag: editTag,
      bio: editBio,
      workExperience: editWorkExperience
    });
    setEditing(false);
  };

  const resetBio = () => {
    setEditBio(ensBio);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-xl border border-white/20"
    >
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white via-purple-100 to-yellow-100 opacity-30 animate-gradient-radial blur-2xl" />
      <div className="relative z-10 p-6 text-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <div className="w-24 h-24 mx-auto mb-4 relative">
          <img
            src={uploadedAvatar || '/default-avatar.png'}
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
          />
          {editing && (
            <label className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow cursor-pointer">
              <Upload size={16} className="text-blue-500" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          )}
        </div>

        <h2 className="text-2xl font-black text-gray-800 dark:text-white truncate">{name || shortenAddress(address)}</h2>

        <p
          onClick={() => navigator.clipboard.writeText(address)}
          className="text-xs text-gray-500 dark:text-gray-400 mt-1 cursor-pointer flex items-center gap-1"
          title="Click to copy address"
        >
          {shortenAddress(address)} <Copy size={12} />
        </p>

        {editing && (
          <>
            <div className="my-3">
              <textarea
                className="w-full rounded p-2 border border-gray-300 text-sm"
                rows={3}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Enter your bio"
              />
              <button onClick={resetBio} className="flex items-center text-sm text-blue-500 hover:underline gap-1 mt-1">
                <RefreshCw size={14} /> Reset to ENS Bio
              </button>
            </div>

            <div className="flex flex-col gap-2 text-left text-sm">
              <input type="text" className="p-2 border rounded" value={editTwitter} onChange={(e) => setEditTwitter(e.target.value)} placeholder="Twitter handle" />
              <input type="text" className="p-2 border rounded" value={editWarpcast} onChange={(e) => setEditWarpcast(e.target.value)} placeholder="Warpcast username" />
              <input type="text" className="p-2 border rounded" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} placeholder="Website URL" />
              <input type="text" className="p-2 border rounded" value={editTag} onChange={(e) => setEditTag(e.target.value)} placeholder="Your Tag or Title" />
            </div>
          </>
        )}

        {!editing && (
          <>
            {bio && <div className="mt-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{bio}</div>}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {tag && <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded-full font-semibold">{tag}</span>}
              {twitter && <a href={`https://twitter.com/${twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline"><Twitter size={16} /> Twitter</a>}
              {warpcast && <a href={`https://warpcast.com/${warpcast}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-purple-500 hover:underline"><Image src="/Warpcast.png" alt="Warpcast" width={16} height={16} className="rounded-sm" /> Warpcast</a>}
              {website && <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-500 hover:underline"><LinkIcon size={16} /> Website</a>}
              {efpLink && <a href={efpLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-purple-500 hover:underline"><UserPlus2 size={16} /> Follow on EFP</a>}
            </div>

            {workExperience.length > 0 && (
              <div className="mt-6 text-left">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-2">Work Experience</h3>
                {workExperience.map((exp, i) => (
                  <div key={i} className="flex gap-2 items-start text-sm text-gray-700 dark:text-gray-300 mb-1">
                    <Briefcase size={14} className="mt-0.5" />
                    <div>
                      <div className="font-semibold">{exp.title}</div>
                      <div className="text-xs">{exp.company} &bull; {exp.date} &bull; {exp.location}</div>
                    </div>
                  </div>
                ))}
              </div>
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
                <a
                  href={`https://opensea.io/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink size={14} /> View NFTs on OpenSea
                </a>
              </div>
            )}
          </>
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
