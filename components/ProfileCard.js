// ProfileCard.js
import { Copy, Users, Landmark, ShieldCheck, Twitter, Link as LinkIcon, UserPlus2, MessageSquare } from 'lucide-react';

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

  return (
    <div className="relative bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300">
      <img
        src={avatar || '/default-avatar.png'}
        alt="avatar"
        className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-700 mb-4 object-cover shadow-md"
      />

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
  );
}
