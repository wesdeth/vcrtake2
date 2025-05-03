import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import ENSProfile from '../../components/ENSProfile';

export default function ProfilePage() {
  const router = useRouter();
  const { ensName } = router.query;
  const { isReady } = router;
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white p-6">
      {isReady && ensName ? (
        <>
          <ENSProfile ensName={ensName} setShowPreviewModal={setShowPreviewModal} />

          {showPreviewModal && (
            <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50">
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 w-full max-w-3xl shadow-2xl relative border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-white text-2xl"
                >
                  &times;
                </button>
                <h2 className="text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-blue-500 to-yellow-500">
                  Verified Chain Resume
                </h2>
                <div className="text-center text-gray-700 dark:text-gray-300 text-sm">
                  <p>This is a polished preview of the onchain resume.</p>
                  <p className="mt-2">Connect your wallet to unlock the download feature.</p>
                  {/* Resume components like name, bio, POAPs, etc., can be slotted in here */}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-gray-500">Loading profile...</div>
      )}
    </div>
  );
}
