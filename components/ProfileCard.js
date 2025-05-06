// components/ProfileCard.js
import { useState, useEffect } from 'react';
import { Copy, ShieldCheck, Twitter, Link as LinkIcon, UserPlus2, MessageSquare, Save, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { utils } from 'ethers';
import { useAccount } from 'wagmi';
import { createClient } from '@supabase/supabase-js';

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

const TAG_OPTIONS = [
  'Ai', 'Analyst', 'Backend', 'Bitcoin', 'Blockchain', 'Community Manager', 'Crypto', 'Cryptography',
  'Cto', 'Customer Support', 'Dao', 'Data Science', 'Defi', 'Design', 'Developer Relations', 'Devops',
  'Discord', 'Economy Designer', 'Entry Level', 'Erc', 'Erc 20', 'Evm', 'Front End', 'Full Stack',
  'Gaming', 'Ganache', 'Golang', 'Hardhat', 'Intern', 'Java', 'Javascript', 'Layer 2', 'Marketing',
  'Mobile', 'Moderator', 'Nft', 'Node', 'Non Tech', 'Open Source', 'Openzeppelin', 'Pay In Crypto',
  'Product Manager', 'Project Manager', 'React', 'Refi', 'Research', 'Ruby', 'Rust', 'Sales',
  'Smart Contract', 'Solana', 'Solidity', 'Truffle', 'Web3 Py', 'Web3js', 'Zero Knowledge', 'Founder'
];

export default function ProfileCard({ data }) {
  const {
    name,
    address,
    avatar,
    bio,
    efpLink,
    farcaster,
    twitter: ensTwitter,
    website: ensWebsite,
    poaps = []
  } = data;

  const { address: connected } = useAccount();
  const isOwner = connected?.toLowerCase() === address?.toLowerCase();

  const shortenAddress = (addr) =>
    addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
  };

  const [editTwitter, setEditTwitter] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editTag, setEditTag] = useState('');
  const [editWork, setEditWork] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('ProfileCard')
        .select('*')
        .eq('address', address)
        .single();

      if (data) {
        setEditTwitter(data.twitter || ensTwitter || '');
        setEditWebsite(data.website || ensWebsite || '');
        setEditTag(data.tag || '');
        setEditWork(data.work || '');
      } else {
        setEditTwitter(ensTwitter || '');
        setEditWebsite(ensWebsite || '');
      }
      setLoading(false);
    };

    if (address) fetchProfile();
  }, [address, ensTwitter, ensWebsite]);

  const isAdmin = name?.toLowerCase() === 'wesd.eth';
  const seed = generateColorSeed(name || address);
  const bgGradient = getGradientFromSeed(seed);

  const handleSave = async () => {
    if (!connected) return;
    const { error } = await supabase.from('ProfileCard').upsert({
      address: connected,
      twitter: editTwitter,
      website: editWebsite,
      tag: editTag,
      work: editWork,
      updated_at: new Date().toISOString()
    });
    if (error) {
      alert('Error saving: ' + error.message);
    } else {
      alert('Changes saved to Supabase.');
    }
  };

  const handleGenerateAI = async () => {
    const poapName = poaps.length > 0 ? poaps[0].event?.name : '';
    const prompt = `Write a 2-3 sentence bio for a Web3 user named ${name}. They attended ${poapName}, are interested in ${editTag}, and work on interesting crypto projects.`;
    try {
      const res = await fetch('/api/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const json = await res.json();
      setEditWork(json.bio);
    } catch (err) {
      alert('Failed to generate bio.');
    }
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
          <img
            src={avatar || `/default-avatar.png`}
            alt="avatar"
            className="object-cover w-full h-full"
          />
        </div>

        <h2 className="text-2xl font-black text-gray-800 dark:text-white truncate">{name || shortenAddress(address)}</h2>

        <p
          onClick={handleCopy}
          className="text-xs text-gray-500 dark:text-gray-400 mt-1 cursor-pointer flex items-center gap-1"
          title="Click to copy address"
        >
          {shortenAddress(address)}
          <Copy size={12} />
        </p>

        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {isOwner ? (
            <select
              value={editTag}
              onChange={(e) => setEditTag(e.target.value)}
              className="text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-500 px-4 py-1 rounded-full"
            >
              <option value="">Select a tag</option>
              {TAG_OPTIONS.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          ) : (
            editTag && (
              <span className="text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-500 px-4 py-1 rounded-full">
                {editTag}
              </span>
            )
          )}

          {isAdmin && (
            <span className="text-xs font-semibold text-white bg-gradient-to-r from-yellow-400 to-pink-500 px-4 py-1 rounded-full flex items-center gap-1 shadow-md">
              <ShieldCheck size={14} /> Admin
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3 mt-5 justify-center text-sm items-center">
          <div className="flex gap-4">
            {isOwner ? (
              <input
                type="text"
                placeholder="Twitter username"
                value={editTwitter}
                onChange={(e) => setEditTwitter(e.target.value)}
                className="text-blue-500 bg-transparent border-b border-blue-300 px-2"
              />
            ) : (
              editTwitter && (
                <a
                  href={`https://twitter.com/${editTwitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline flex items-center gap-1"
                >
                  <Twitter size={16} /> X / Twitter
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
              editWebsite && (
                <a
                  href={editWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-500 hover:underline flex items-center gap-1"
                >
                  <LinkIcon size={16} /> Website
                </a>
              )
            )}
          </div>

          {isOwner ? (
            <>
              <textarea
                placeholder="Add a short bio about yourself or generate one via AI"
                value={editWork}
                onChange={(e) => setEditWork(e.target.value)}
                className="w-full px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={4}
              />
              <button
                onClick={handleGenerateAI}
                className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-indigo-600 text-white rounded-full hover:bg-indigo-700"
              >
                <Sparkles size={16} /> Generate with AI
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
            <a
              href={efpLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-500 hover:underline flex items-center gap-1 bg-purple-100 px-3 py-1 rounded-full font-semibold"
            >
              <UserPlus2 size={16} /> Follow on EFP
            </a>
          )}

          {farcaster && (
            <a
              href={farcaster}
              target="_blank"
              rel="noopener noreferrer"
              className="text-fuchsia-600 hover:underline flex items-center gap-1"
            >
              <MessageSquare size={16} /> Farcaster
            </a>
          )}

          {isOwner && (
            <button
              onClick={handleSave}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
            >
              <Save size={16} /> Save Changes
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
