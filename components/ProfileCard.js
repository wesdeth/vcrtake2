// components/ProfileCard.js
import { useEffect, useState } from 'react';
import {
  Copy,
  ShieldCheck,
  Twitter,
  Link as LinkIcon,
  UserPlus2,
  MessageSquare,
  Save,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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
    ownsProfile
  } = data;

  const { address: connected } = useAccount();
  const isOwner = connected?.toLowerCase() === address?.toLowerCase();

  const [editTwitter, setEditTwitter] = useState(twitter);
  const [editWebsite, setEditWebsite] = useState(website);
  const [editTag, setEditTag] = useState(tag);
  const [editFarcaster, setEditFarcaster] = useState(farcaster);
  const [saving, setSaving] = useState(false);

  const handleCopy = () => {
    if (address) navigator.clipboard.writeText(address);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('ProfileCard').upsert({
      address: connected,
      twitter: editTwitter,
      website: editWebsite,
      tag: editTag,
      farcaster: editFarcaster,
      updated_at: new Date().toISOString()
    });
    setSaving(false);
    if (error) alert('Error saving: ' + error.message);
    else alert('Changes saved to Supabase.');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-xl border border-white/20"
    >
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#F9FAFB] via-[#F3E8FF] to-[#74E0FF] opacity-30 animate-gradient-radial blur-2xl" />

      <div className="relative z-10 p-6 text-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-white shadow-md">
          <img
            src={avatar || '/default-avatar.png'}
            alt="avatar"
            className="object-cover w-full h-full"
          />
        </div>

        <h2 className="text-2xl font-black text-gray-800 dark:text-white truncate">
          {name || shortenAddress(address)}
        </h2>

        <p
          onClick={handleCopy}
          className="text-xs text-gray-500 dark:text-gray-400 mt-1 cursor-pointer flex items-center gap-1"
          title="Click to copy address"
        >
          {shortenAddress(address)}
          <Copy size={12} />
        </p>

        <div className="flex flex-wrap justify-center gap-2 mt-3">
          <span className="text-xs font-semibold text-white bg-blue-600 px-4 py-1 rounded-full">
            {editTag || 'Active Builder'}
          </span>
        </div>

        <div className="flex justify-center gap-6 mt-5 flex-wrap text-sm">
          {isOwner ? (
            <input
              type="text"
              placeholder="Twitter username"
              value={editTwitter}
              onChange={(e) => setEditTwitter(e.target.value)}
              className="text-[#A259FF] bg-transparent border-b border-[#A259FF] px-2"
            />
          ) : (
            twitter && (
              <a
                href={`https://twitter.com/${twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#A259FF] hover:underline flex items-center gap-1"
              >
                <Twitter size={16} /> Twitter
              </a>
            )
          )}

          {isOwner ? (
            <input
              type="text"
              placeholder="Website URL"
              value={editWebsite}
              onChange={(e) => setEditWebsite(e.target.value)}
              className="text-green-500 bg-transparent border-b border-green-300 px-2"
            />
          ) : (
            website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-500 hover:underline flex items-center gap-1"
              >
                <LinkIcon size={16} /> Website
              </a>
            )
          )}

          {isOwner ? (
            <input
              type="text"
              placeholder="Farcaster URL"
              value={editFarcaster}
              onChange={(e) => setEditFarcaster(e.target.value)}
              className="text-[#A259FF] bg-transparent border-b border-[#A259FF] px-2"
            />
          ) : (
            farcaster && (
              <a
                href={farcaster}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#A259FF] hover:underline flex items-center gap-1"
              >
                <MessageSquare size={16} /> Farcaster
              </a>
            )
          )}

          {efpLink && (
            <a
              href={efpLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#A259FF] hover:underline flex items-center gap-1"
            >
              <UserPlus2 size={16} /> Follow on EFP
            </a>
          )}
        </div>

        {isOwner && (
          <button
            onClick={handleSave}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#635BFF] text-white rounded-full hover:bg-[#5146cc] transition"
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}

        {poaps.length > 0 && (
          <div className="mt-8 text-left">
            <h3 className="text-lg font-bold text-gray-800 mb-2">POAPs</h3>
            <div className="grid grid-cols-2 gap-2">
              {poaps.map((poap, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 shadow-sm"
                >
                  {poap.image && (
                    <img
                      src={poap.image}
                      alt={poap.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <span className="text-sm text-gray-700 truncate">{poap.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <a
            href={`https://opensea.io/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#635BFF] hover:underline text-sm"
          >
            View NFTs on OpenSea ↗
          </a>
        </div>
      </div>
    </motion.div>
  );
}
