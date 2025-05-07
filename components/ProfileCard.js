// components/ProfileCard.js
import { useState, useEffect } from 'react';
import {
  Copy,
  ShieldCheck,
  Twitter,
  Link as LinkIcon,
  UserPlus2,
  MessageSquare,
  Save,
  Sparkles,
  Pencil
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function generateColorSeed(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 100);
}

function getGradientFromSeed(seed) {
  const gradients = [
    'from-pink-500 via-purple-500 to-indigo-500',
    'from-blue-500 via-cyan-500 to-teal-400',
    'from-yellow-400 via-red-500 to-pink-500',
    'from-emerald-400 via-cyan-400 to-blue-500',
    'from-indigo-500 via-purple-400 to-pink-400',
    'from-fuchsia-500 via-rose-400 to-orange-400'
  ];
  return gradients[seed % gradients.length];
}

export default function ProfileCard({ data }) {
  const {
    name,
    address,
    avatar,
    bio = '',
    twitter: ensTwitter,
    website: ensWebsite,
    tag = '',
    efpLink,
    farcaster,
    poaps = []
  } = data;

  const { address: connected } = useAccount();
  const isOwner = connected?.toLowerCase() === address?.toLowerCase();
  const shortenAddress = (addr) => addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : '';
  const [editMode, setEditMode] = useState(false);
  const [editTwitter, setEditTwitter] = useState(ensTwitter || '');
  const [editWebsite, setEditWebsite] = useState(ensWebsite || '');
  const [editWork, setEditWork] = useState('');
  const [editTag, setEditTag] = useState(tag || '');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const TAG_OPTIONS = ['Frontend', 'Smart Contract', 'DAO', 'Defi', 'NFTs', 'Full Stack', 'Founder'];
  const seed = generateColorSeed(name || address);
  const bgGradient = getGradientFromSeed(seed);
  const openSeaLink = address ? `https://opensea.io/${address}` : '';

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('ProfileCard')
        .select('*')
        .eq('address', address)
        .single();
      if (data) {
        setEditTwitter(data.twitter || ensTwitter || '');
        setEditWebsite(data.website || ensWebsite || '');
        setEditWork(data.work || '');
        setEditTag(data.tag || tag);
      }
      setLoading(false);
    };
    if (address) fetchProfile();
  }, [address]);

  const handleCopy = () => navigator.clipboard.writeText(address);

  const handleGenerateAI = async () => {
    const prompt = `Write a 2-3 sentence Web3 bio for ${name}. They are interested in ${editTag}.`;
    try {
      setGenerating(true);
      const res = await fetch('/api/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const json = await res.json();
      setEditWork(json.bio || 'Could not generate bio.');
    } catch (err) {
      console.error(err);
      setEditWork('Something went wrong.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    const { error } = await supabase.from('ProfileCard').upsert({
      address,
      twitter: editTwitter,
      website: editWebsite,
      tag: editTag,
      work: editWork,
      updated_at: new Date().toISOString()
    });
    if (error) toast.error('Error saving profile');
    else toast.success('Profile saved!');
    setEditMode(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-xl border border-white/20"
    >
      <div className={`absolute inset-0 z-0 bg-gradient-to-br ${bgGradient} opacity-30 animate-gradient-radial blur-2xl`} />

      <div className="relative z-10 p-6 text-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white shadow-md">
          <img src={avatar || '/default-avatar.png'} alt="avatar" className="object-cover w-full h-full" />
        </div>

        <h2 className="text-2xl font-black text-gray-800 dark:text-white truncate">{name || shortenAddress(address)}</h2>
        <p onClick={handleCopy} className="text-xs text-gray-500 dark:text-gray-400 mt-1 cursor-pointer flex items-center gap-1" title="Click to copy address">
          {shortenAddress(address)} <Copy size={12} />
        </p>

        {isOwner && (
          <button
            onClick={() => setEditMode(!editMode)}
            className="mt-2 inline-flex items-center gap-1 text-sm text-[#635BFF] hover:underline"
          >
            <Pencil size={14} /> {editMode ? 'Cancel' : 'Edit Profile'}
          </button>
        )}

        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {editMode ? (
            <select
              value={editTag}
              onChange={(e) => setEditTag(e.target.value)}
              className="text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-500 px-4 py-1 rounded-full"
            >
              <option value="">Select a tag</option>
              {TAG_OPTIONS.map(tag => <option key={tag} value={tag}>{tag}</option>)}
            </select>
          ) : (
            editTag && (
              <span className="text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-500 px-4 py-1 rounded-full">
                {editTag}
              </span>
            )
          )}
        </div>

        <div className="flex flex-col gap-3 mt-5 justify-center text-sm items-center">
          <div className="flex gap-4">
            {editMode ? (
              <input
                type="text"
                placeholder="Twitter username"
                value={editTwitter}
                onChange={(e) => setEditTwitter(e.target.value)}
                className="text-blue-500 bg-transparent border-b border-blue-300 px-2"
              />
            ) : (
              editTwitter && (
                <a href={`https://twitter.com/${editTwitter}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                  <Twitter size={16} /> Twitter
                </a>
              )
            )}

            {editMode ? (
              <input
                type="text"
                placeholder="Website URL"
                value={editWebsite}
                onChange={(e) => setEditWebsite(e.target.value)}
                className="text-green-500 bg-transparent border-b border-green-300 px-2"
              />
            ) : (
              editWebsite && (
                <a href={editWebsite} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:underline flex items-center gap-1">
                  <LinkIcon size={16} /> Website
                </a>
              )
            )}
          </div>

          {editMode ? (
            <>
              <textarea
                placeholder="Add a short bio or generate with AI"
                value={editWork}
                onChange={(e) => setEditWork(e.target.value)}
                className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={4}
              />
              <button
                onClick={handleGenerateAI}
                className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50"
                disabled={generating}
              >
                <Sparkles size={16} /> {generating ? 'Generating...' : 'Generate with AI'}
              </button>
            </>
          ) : (
            editWork && (
              <div className="text-sm text-gray-700 dark:text-gray-300 text-left max-w-md mt-2">
                <strong>Bio:</strong>
                <p className="mt-1 whitespace-pre-line">{editWork}</p>
              </div>
            )
          )}

          {efpLink && (
            <a href={efpLink} target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline flex items-center gap-1 bg-purple-100 px-3 py-1 rounded-full font-semibold">
              <UserPlus2 size={16} /> Follow on EFP
            </a>
          )}

          {farcaster && (
            <a href={farcaster} target="_blank" rel="noopener noreferrer" className="text-fuchsia-600 hover:underline flex items-center gap-1">
              <MessageSquare size={16} /> Farcaster
            </a>
          )}

          {editMode && (
            <button onClick={handleSave} className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
              <Save size={16} /> Save Changes
            </button>
          )}

          {poaps.length > 0 && (
            <div className="mt-6 text-left w-full">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">POAPs</h4>
              <ul className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                {poaps.slice(0, 6).map((poap, idx) => (
                  <li key={idx} className="bg-white p-2 rounded-md shadow-sm border border-gray-200 truncate">
                    {poap.event?.name || 'POAP Event'}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4">
            <a href={openSeaLink} target="_blank" rel="noopener noreferrer" className="text-[#635BFF] hover:underline text-xs">
              View NFTs on OpenSea ↗
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
