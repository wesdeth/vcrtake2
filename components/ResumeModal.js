import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function ResumeModal({ ensName, avatar, bio, poaps = [], nfts = [], onClose }) {
  const openSeaLink = nfts.length > 0 ? `https://opensea.io/${nfts[0].contractAddress}` : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
          <X size={24} />
        </button>

        <div className="text-center space-y-4">
          <motion.img
            src={avatar || '/Avatar.jpg'}
            alt="avatar"
            className="w-24 h-24 rounded-full mx-auto border-4 border-purple-300"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
          />

          <h1 className="text-3xl font-extrabold text-gray-900">{ensName}</h1>

          <div className="text-gray-700 text-md leading-relaxed">
            {bio || 'A recognized contributor in Web3 with active roles across DAOs, hackathons, and community events.'}
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-purple-700 mb-2">Recent POAPs</h2>
            {poaps.length > 0 ? (
              <div className="flex justify-center gap-2 flex-wrap">
                {poaps.slice(0, 4).map((poap, idx) => (
                  <img
                    key={idx}
                    src={poap.image_url}
                    alt={poap.event.name}
                    title={poap.event.name}
                    className="w-10 h-10 rounded-full border border-gray-300 shadow-sm"
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No POAPs available.</p>
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

          <div className="mt-6 text-sm text-gray-500 italic">
            Resume powered by onchain identity — built with ENS + POAP
          </div>
        </div>
      </div>
    </div>
  );
}
