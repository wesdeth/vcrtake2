import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { useAccount } from 'wagmi';

import DownloadButton from '../../components/DownloadButton';
import ProfileCard from '../../components/ProfileCard';
import ResumeSections from '../../components/ResumeSections';
import { getEnsData } from '../../lib/ensUtils';

export default function PreviewPage() {
  const router = useRouter();
  const { ensName } = router.query;
  const { address: connectedWallet } = useAccount();

  const [ensData, setEnsData] = useState(null);
  const [error, setError] = useState(null);
  const [ownsProfile, setOwnsProfile] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!ensName) return;
      try {
        const data = await getEnsData(ensName);
        setEnsData(data);

        const lowerEnsName = data.name?.toLowerCase();
        const lowerAddr = data.address?.toLowerCase();
        const isOwner = connectedWallet && (
          connectedWallet.toLowerCase() === lowerAddr ||
          connectedWallet.toLowerCase() === lowerEnsName
        );
        setOwnsProfile(isOwner);

        // Update Supabase
        await fetch('/api/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name || data.address,
            address: data.address,
            tag: data.tag || 'Active Builder'
          })
        });
      } catch (err) {
        console.error('Error fetching ENS data:', err);
        setError('Failed to load resume. Please try again later.');
      }
    };

    fetchData();
  }, [ensName, connectedWallet]);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white p-6">
      {error ? (
        <div className="text-red-500 text-center mt-10">{error}</div>
      ) : !ensData ? (
        <div className="text-center text-gray-500">Loading resume...</div>
      ) : (
        <>
          <ProfileCard data={ensData} />
          <ResumeSections data={ensData} />
          {ownsProfile && <DownloadButton ensData={ensData} />}
        </>
      )}
    </div>
  );
}
