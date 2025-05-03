// /components/ProfileCard.js
import { Copy } from 'lucide-react';

export default function ProfileCard({ data }) {
  const { name, address, avatar, bio, twitter, website, tag } = data;

  const shortenAddress = (addr) =>
    addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center text-center">
      <img
        src={avatar || '/default-avatar.png'}
        alt="avatar"
        className="w-24 h-24 rounded-full border-2 border-gray-300 dark:border-gray-600 mb-4 object-cover"
      />

      <h2 className="text-xl font-bold truncate">{name || shortenAddress(address)}</h2>

      <p
        onClick={handleCopy}
        className="text-xs text-gray-500 dark:text-gray-400 mt-1 cursor-pointer flex items-center gap-1"
        title="Click to copy address"
      >
        {shortenAddress(address)}
        <Copy size={12} />
      </p>

      {tag && (
        <span className="mt-2 text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-blue-500 px-3 py-1 rounded-full">
          {tag}
        </span>
      )}

      {bio && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 italic max-w-sm">{bio}</p>
      )}

      <div className="flex gap-4 mt-4 justify-center text-sm">
        {twitter && (
          <a
            href={`https://twitter.com/${twitter}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            @{twitter}
          </a>
        )}
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-500 hover:underline"
          >
            Website
          </a>
        )}
      </div>
    </div>
  );
}
