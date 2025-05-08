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
  ChevronUp
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
    ownsProfile = false
  } = data;

  const [showAllPoaps, setShowAllPoaps] = useState(false);
  const [displayedPoaps, setDisplayedPoaps] = useState([]);

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
    if (address) fetchPoapImages();
  }, [address]);

  const poapsToShow = showAllPoaps ? displayedPoaps : displayedPoaps.slice(0, 4);
  const poapProfileUrl = `https://app.poap.xyz/account/${address}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-xl border border-white/20"
    >
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white via-purple-100 to-yellow-100 opacity-30 animate-gradient-radial blur-2xl" />
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
          onClick={() => navigator.clipboard.writeText(address)}
          className="text-xs text-gray-500 dark:text-gray-400 mt-1 cursor-pointer flex items-center gap-1"
          title="Click to copy address"
        >
          {shortenAddress(address)} <Copy size={12} />
        </p>

        <div className="mt-4">
          <span className="inline-block px-4 py-1 text-sm font-semibold text-white bg-blue-600 rounded-full">
            {tag}
          </span>
        </div>

        <div className="flex justify-center flex-wrap gap-4 mt-4">
          {twitter && (
            <a href={`https://twitter.com/${twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-[#8B5CF6]">
              <Twitter size={16} className="mr-1" /> Twitter
            </a>
          )}
          {farcaster && (
            <a href={`https://warpcast.com/${farcaster}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-[#8B5CF6]">
              <MessageSquare size={16} className="mr-1" /> Farcaster
            </a>
          )}
          {website && (
            <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center text-[#10B981]">
              <LinkIcon size={16} className="mr-1" /> Website
            </a>
          )}
          {efpLink && (
            <a href={efpLink} target="_blank" rel="noopener noreferrer" className="flex items-center text-[#A259FF]">
              <UserPlus2 size={16} className="mr-1" /> Follow on EFP
            </a>
          )}
        </div>

        {poapsToShow.length > 0 && (
          <div className="mt-6 text-left">
            <h3 className="text-lg font-bold text-gray-800 mb-2">POAPs</h3>
            <div className="grid grid-cols-2 gap-2">
              {poapsToShow.map((poap, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow"
                >
                  <img
                    src={poap.event?.image_url || '/default-poap.png'}
                    alt="POAP"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span className="text-xs font-medium text-gray-700 truncate">
                    {poap.event?.name || 'POAP Event'}
                  </span>
                </div>
              ))}
            </div>
            {displayedPoaps.length > 4 && (
              <div className="mt-2 flex justify-center">
                <button
                  onClick={() => setShowAllPoaps(!showAllPoaps)}
                  className="text-sm text-blue-600 flex items-center gap-1 hover:underline"
                >
                  {showAllPoaps ? 'Hide' : 'View All'}
                  {showAllPoaps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-6">
          <a
            href={`https://opensea.io/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:underline"
          >
            View NFTs on OpenSea ↗
          </a>
        </div>
      </div>
    </motion.div>
  );
}
