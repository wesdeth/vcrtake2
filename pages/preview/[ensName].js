import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import ENSProfile from '../../components/ENSProfile';

export default function ProfilePage() {
  const router = useRouter();
  const { ensName } = router.query;
  const { isReady } = router;

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white p-6">
      {isReady && ensName ? (
        <ENSProfile ensName={ensName} />
      ) : (
        <div className="text-center text-gray-500">Loading profile...</div>
      )}
    </div>
  );
}
