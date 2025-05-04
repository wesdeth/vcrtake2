// components/ResumeModal.js
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

export default function ResumeModal({ ensName, avatar, poaps = [], nfts = [], onClose }) {
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const openSeaLink = nfts.length > 0 ? `https://opensea.io/${nfts[0].contractAddress}` : null;

  useEffect(() => {
    const fetchBio = async () => {
      try {
        const res = await fetch('/api/generate-bio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ensName })
        });

        const data = await res.json();
        setBio(data.bio || '');
      } catch (err) {
        console.error('Bio generation failed:', err);
        setBio('A Web3 builder active in the ecosystem.');
      } finally {
        setLoading(false);
      }
    };

    fetchBio();
  }, [ensName]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-10 border border-gray-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
          <X size={24} />
        </button>

        <div className="text-center space-y-6">
          <motion.img
            src={avatar || '/Avatar.jpg'}
            alt="avatar"
            className="w-28 h-28 rounded-full mx-auto border-4 border-purple-400 shadow-md"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          />

          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{ensName}</h1>

          {loading ? (
            <div className="text-gray-500 flex justify-center items-center gap-2">
              <Loader2 className="animate-spin" size={18} /> Generating bio...
            </div>
          ) : (
            <p className="text-gray-700 text-lg leading-relaxed max-w-2xl mx-auto">
              {bio}
            </p>
          )}

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-purple-700 mb-3">Recent POAPs</h2>
            {poaps.length > 0 ? (
              <div className="flex justify-center gap-3 flex-wrap">
                {poaps.slice(0, 4).map((poap, idx) => (
                  <img
                    key={idx}
                    src={poap.image_url}
                    alt={poap.event.name}
                    title={poap.event.name}
                    className="w-12 h-12 rounded-full border border-gray-300 shadow-sm"
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No POAPs found</p>
            )}
          </div>

          {openSeaLink && (
            <div className="mt-4">
              <a
                href={openSeaLink}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline text-sm"
              >
                View NFTs on OpenSea
              </a>
            </div>
          )}

          <div className="mt-8 text-sm text-gray-500 italic">
            Resume powered by onchain identity — built with ENS, POAP, and verified experience
          </div>
        </div>
      </div>
    </div>
  );
}
