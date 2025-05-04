// /components/ProfileCard.js
import { Copy, Users, Landmark, ShieldCheck, Twitter, Link2, MessageSquareText } from 'lucide-react';
import { useAccount, useConnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { useState, useEffect } from 'react';

export default function ProfileCard({ data, ownsProfile = false, onUpdateFarcaster }) {
  const { name, address, avatar, bio, twitter, website, tag, efpFollows = [], daos = [], efp, farcaster } = data;

  const [editableFarcaster, setEditableFarcaster] = useState(farcaster || '');
  const [isEditing, setIsEditing] = useState(false);

  const shortenAddress = (addr) =>
    addr ? addr.slice(0, 6) + '...' + addr.slice(-4) : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
  };

  const isAdmin = name?.toLowerCase() === 'wesd.eth';

  const { address: connectedAddress, isConnected } = useAccount();
  const { connect } = useConnect({ connector: new InjectedConnector() });

  const handleFarcasterSave = () => {
    if (onUpdateFarcaster) {
      onUpdateFarcaster(editableFarcaster);
    }
    setIsEditing(false);
  };

  useEffect(() => {
    setEditableFarcaster(farcaster || '');
  }, [farcaster]);

  return (
    <div className="relative bg-white dark:bg-gray-800 shadow-2xl border border-gray-200 dark:border-gray-700 rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300">
      {!isConnected && (
        <button
          onClick={() => connect()}
          className="absolute top-4 right-4 px-4 py-1 text-sm font-semibold bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white rounded-full shadow hover:scale-105 transition"
        >
          Connect Wallet
        </button>
      )}

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
            className="flex items-center gap-1 text-blue-500 hover:underline"
          >
            <Twitter size={14} /> X / Twitter
          </a>
        )}
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-green-500 hover:underline"
          >
            <Link2 size={14} /> Website
          </a>
        )}
        {efp && (
          <a
            href={efp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-purple-500 hover:underline"
          >
            <Users size={14} /> EFP
          </a>
        )}
        {ownsProfile ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editableFarcaster}
              onChange={(e) => setEditableFarcaster(e.target.value)}
              placeholder="https://warpcast.com/username"
              className="text-xs px-2 py-1 rounded border border-gray-300"
            />
            <button
              onClick={handleFarcasterSave}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Save
            </button>
          </div>
        ) : (
          farcaster && (
            <a
              href={farcaster}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-pink-500 hover:underline"
            >
              <MessageSquareText size={14} /> Farcaster
            </a>
          )
        )}
      </div>

      {(efpFollows.length > 0 || daos.length > 0) && (
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {efpFollows.map((follow, i) => (
            <a
              key={`efp-${i}`}
              href={`https://efp.social/profile/${follow}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-indigo-100 text-indigo-800 text-xs font-semibold px-3 py-1 rounded-full shadow hover:bg-indigo-200 transition"
              title={`Following ${follow}`}
            >
              <Users size={14} /> {follow}
            </a>
          ))}
          {daos.map((dao, i) => (
            <a
              key={`dao-${i}`}
              href={`https://daosnap.io/dao/${dao}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-semibold px-3 py-1 rounded-full shadow hover:bg-yellow-200 transition"
              title={`Member of ${dao}`}
            >
              <Landmark size={14} /> {dao}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
