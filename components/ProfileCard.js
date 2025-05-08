// components/ProfileCard.js — full, fixed and finalized
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
  CheckCircle,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import axios from 'axios';

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

export default function ProfileCard({ data = {} }) {
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

  const [showAllPoaps, setShowAllPoaps] = useState(false);
  const [poapData, setPoapData] = useState(poaps);
  const [editing, setEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [uploadedAvatar, setUploadedAvatar] = useState(avatar || '');
  const [editTwitter, setEditTwitter] = useState(twitter || '');
  const [editWebsite, setEditWebsite] = useState(website || '');
  const [editWarpcast, setEditWarpcast] = useState(warpcast || '');
  const [editTag, setEditTag] = useState(tag || '');
  const [editBio, setEditBio] = useState(bio || ensBio);
  const [editExp, setEditExp] = useState(workExperience);

  const { address: connected } = useAccount();
  const isOwner = ownsProfile || (connected && address && connected.toLowerCase() === address.toLowerCase());

  useEffect(() => {
    const fetchPoaps = async () => {
      if (!address) return;
      try {
        const r = await axios.get(`https://api.poap.tech/actions/scan/${address}`, {
          headers: { 'X-API-Key': process.env.NEXT_PUBLIC_POAP_API_KEY || 'demo' }
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
        const r = await axios.get(`https://api.opensea.io/api/v1/user/${address}`);
        const img = r.data?.account?.profile_img_url || r.data?.profile_img_url;
        if (img) setUploadedAvatar(img);
        else setUploadedAvatar('/default-avatar.png');
      } catch {
        setUploadedAvatar('/default-avatar.png');
      }
    };

    fetchPoaps();
    fetchAvatar();
  }, [address, avatar]);

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

  const poapsToShow = Array.isArray(poapData) ? (showAllPoaps ? poapData : poapData.slice(0, 4)) : [];
  const nftsToShow = Array.isArray(nfts) ? nfts.slice(0, 6) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl ring-1 ring-indigo-200/60 border border-white/10"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-100 to-cyan-100 opacity-40 animate-gradient-radial blur-2xl" />
      <div className="relative z-10 p-8 sm:p-10 text-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
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
        {editBio && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{editBio}</p>
        )}
        {poapsToShow.length > 0 && (
          <div className="mt-4 text-left">
            <h3 className="text-lg font-bold mb-1 text-gray-800 dark:text-white">POAPs</h3>
            <div className="grid grid-cols-2 gap-2">
              {poapsToShow.map((poap, i) => (
                <div key={i} className="flex items-center gap-2 bg-white rounded-lg shadow p-2 text-sm text-gray-700">
                  <img
                    src={poap.event?.image_url || '/default-poap.png'}
                    alt={poap.event?.name || 'POAP'}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="truncate">{poap.event?.name}</span>
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
        {nftsToShow.length > 0 && (
          <div className="mt-6 text-left">
            <h3 className="text-lg md:text-xl font-extrabold tracking-tight text-gray-800 dark:text-white mb-2">
              NFTs
            </h3>
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
      </div>
    </motion.div>
  );
}
