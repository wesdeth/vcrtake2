import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import ENSProfile from '../../components/ENSProfile';
import ResumeModal from '../../components/ResumeModal'; // make sure this exists

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
            <ResumeModal ensName={ensName} onClose={() => setShowPreviewModal(false)} />
          )}
        </>
      ) : (
        <div className="text-center text-gray-500">Loading profile...</div>
      )}
    </div>
  );
}
