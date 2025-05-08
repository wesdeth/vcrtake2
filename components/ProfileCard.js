// components/ProfileCard.js
import { useState, useEffect } from 'react';
import {
  Copy, ShieldCheck, Twitter, Link as LinkIcon, UserPlus2,
  MessageSquare, Save, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function shortenAddress(addr) {
  return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
}

export default function ProfileCard({ data }) {
  const {
    name, address, avatar, twitter, website, tag = '', efpLink,
    farcaster, poaps = [], ownsProfile = false
  } = data;

  const { address: connected } = useAccount();
  const isOwner = connected?.toLowerCase() === address?.toLowerCase();

  const [editTwitter, setEditTwitter] = useState(twitter);
  const [editWebsite, setEditWebsite] = useState(website);
  const [editTag, setEditTag] = useState(tag);
  const [editWork, setEditWork] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setEditTwitter(twitter);
    setEditWebsite(website);
    setEditTag(tag);
  }, [twitter, website, tag]);

  const handleSave = async () => {
    if (!connected) return;
    const { error } = await supabase.from('ProfileCard').upsert({
      address: connected,
      twitter: editTwitter,
      website: editWebsite,
      tag: editTag,
      updated_at: new Date().toISOString()
    });
    if (error) alert('Error saving: ' + error.message);
    else alert('Changes saved.');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-xl border border-white/20 bg-white/90 p-6 text-center backdrop-blur-lg"
    >
      <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white shadow-md">
        <img src={avatar || '/default-avatar.png'} alt="avatar" className="object-cover w-full h-full" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 truncate">{name || shortenAddress(address)}</h2>
      <p onClick={() => navigator.clipboard.writeText(address)}
         className="text-xs text-gray-500 mt-1 cursor-pointer flex items-center justify-center gap-1"
         title="Click to copy address">
        {shortenAddress(address)} <Copy size={12} />
      </p>

      {isOwner && <p className="mt-2 text-sm text-purple-600 font-medium cursor-pointer"><ShieldCheck size={14} className="inline" /> Edit Profile</p>}

      {editTag && (
        <p className="inline-block mt-3 text-xs font-semibold text-white bg-blue-600 px-4 py-1 rounded-full">
          {editTag}
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {editTwitter && (
          <a href={`https://twitter.com/${editTwitter}`} target="_blank" rel="noopener noreferrer" className="text-[#635BFF] text-sm flex items-center gap-1">
            <Twitter size={16} /> Twitter
          </a>
        )}
        {editWebsite && (
          <a href={editWebsite} target="_blank" rel="noopener noreferrer" className="text-green-500 text-sm flex items-center gap-1">
            <LinkIcon size={16} /> Website
          </a>
        )}
        {efpLink && (
          <a href={efpLink} target="_blank" rel="noopener noreferrer" className="text-purple-500 text-sm flex items-center gap-1">
            <UserPlus2 size={16} /> Follow on EFP
          </a>
        )}
        {farcaster && (
          <a href={farcaster} target="_blank" rel="noopener noreferrer" className="text-fuchsia-500 text-sm flex items-center gap-1">
            <MessageSquare size={16} /> Farcaster
          </a>
        )}
      </div>

      <div className="mt-6 text-left">
        <h4 className="text-lg font-semibold text-gray-800 mb-2">POAPs</h4>
        <div className="grid grid-cols-2 gap-3">
          {poaps.map((poap, i) => (
            <div key={i} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
              <img src={poap.image} alt={poap.name} className="w-8 h-8 rounded-full object-cover" />
              <span className="text-sm font-medium text-gray-700 truncate">{poap.name}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 text-sm">
        <a href={`https://opensea.io/${address}`} target="_blank" rel="noopener noreferrer" className="text-[#635BFF] hover:underline">
          View NFTs on OpenSea ↗
        </a>
      </p>

      {isOwner && (
        <button
          onClick={handleSave}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#635BFF] text-white rounded-full hover:bg-[#5146cc] transition text-sm"
        >
          <Save size={16} /> Save Changes
        </button>
      )}
    </motion.div>
  );
}
