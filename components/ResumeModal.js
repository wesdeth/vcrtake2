// /components/ResumeModal.js
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function ResumeModal({ ensName, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-3xl shadow-xl relative p-8 overflow-y-auto max-h-[90vh]"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="text-center space-y-4">
          <img
            src="/Avatar.jpg"
            alt="avatar"
            className="mx-auto w-24 h-24 rounded-full border-4 border-blue-400 shadow-lg"
          />
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-pink-400">
            {ensName}
          </h1>
          <p className="text-gray-700 dark:text-gray-300">
            Web3 builder with a passion for decentralized tech and community innovation.
          </p>
        </div>

        <div className="mt-6 text-sm space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-blue-600 dark:text-blue-300">Summary</h2>
            <p>
              {ensName} is a proven contributor to the Ethereum ecosystem. They've built at ETHGlobal events, received
              Gitcoin Grants, and helped scale DAOs from the ground up.
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-purple-600 dark:text-purple-300">Experience</h2>
            <ul className="list-disc list-inside mt-2">
              <li>🧾 Multisig signer – DeveloperDAO</li>
              <li>🔧 Core contributor – ENS DAO</li>
              <li>🪪 Identity work – Namewrapper, EFP, POAP integrations</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-yellow-600 dark:text-yellow-300">Achievements</h2>
            <ul className="list-disc list-inside mt-2">
              <li>🏆 Winner – ETHGlobal Tokyo 2024</li>
              <li>💸 Grant Recipient – Gitcoin Grants Round 18</li>
              <li>📜 Speaker – frENSday Bangkok 2024</li>
            </ul>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-400">Resume preview only. Wallet ownership required to download PDF.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
