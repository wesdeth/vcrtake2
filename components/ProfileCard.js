// ProfileCard.js
import { Copy, ShieldCheck, Twitter, Link as LinkIcon, UserPlus2, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { utils } from 'ethers';

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
    bio,
    twitter,
    website,
    tag,
    efpLink,
    farcaster
  } = data;

  const shortenAddress = (addr) =>
    addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
  };

  const isAdmin = name?.toLowerCase() === 'wesd.eth';
  const seed = generateColorSeed(name || address);
  const bgGradient = getGradientFromSeed(seed);

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
          {tag && (
            <span className="text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-500 px-4 py-1 rounded-full">
              {tag}
            </span>
          )}

          {isAdmin && (
            <span className="text-xs font-semibold text-white bg-gradient-to-r from-yellow-400 to-pink-500 px-4 py-1 rounded-full flex items-center gap-1 shadow-md">
              <ShieldCheck size={14} /> Admin
            </span>
          )}
        </div>

        {bio && (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 italic max-w-sm leading-relaxed">{bio}</p>
        )}

        <div className="flex gap-4 mt-5 justify-center text-sm">
          {twitter && (
            <a
              href={`https://twitter.com/${twitter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline flex items-center gap-1"
            >
              <Twitter size={16} /> X / Twitter
            </a>
          )}
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:underline flex items-center gap-1"
            >
              <LinkIcon size={16} /> Website
            </a>
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
        </div>
      </div>
    </motion.div>
  );
}
