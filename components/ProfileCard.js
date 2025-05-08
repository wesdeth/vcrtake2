// components/ProfileCard.js
import { useState, useEffect } from 'react';
import {
  Copy,
  ShieldCheck,
  Twitter,
  Link as LinkIcon,
  UserPlus2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Edit,
  Save,
  Trash2,
  Upload,
  RefreshCw
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
    farcaster,
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
  const [editFarcaster, setEditFarcaster] = useState(farcaster);
  const [editTag, setEditTag] = useState(tag);
  const [editBio, setEditBio] = useState(bio || ensBio);
  const [editWorkExperience, setEditWorkExperience] = useState(workExperience);

  const { address: connected } = useAccount();

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
      farcaster: editFarcaster,
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

  const isOwner = ownsProfile || connected?.toLowerCase() === address?.toLowerCase();

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
          <div className="flex justify-center mt-4">
            <button onClick={resetBio} className="flex items-center text-sm text-blue-500 hover:underline gap-1">
              <RefreshCw size={14} /> Reset to ENS Bio
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
