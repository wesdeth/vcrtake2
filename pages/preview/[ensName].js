import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import DownloadButton from '../../components/DownloadButton';
import ProfileCard from '../../components/ProfileCard';
import ResumeSections from '../../components/ResumeSections';
import { getEnsData } from '../../lib/ensUtils';

export default function PreviewPage() {
  const router = useRouter();
  const { ensName } = router.query;
  const { isReady } = router;
  const { address: connectedWallet, isConnected } = useAccount();

  const [ensData, setEnsData] = useState(null);
  const [error, setError] = useState(null);
  const [ownsProfile, setOwnsProfile] = useState(false);

  useEffect(() => {
    if (!isReady || !ensName) return;

    const fetchData = async () => {
      try {
        const data = await getEnsData(ensName);

        if (!data || !data.address) {
          throw new Error('ENS resolution failed');
        }

        setEnsData(data);

        const lowerAddr = data.address?.toLowerCase();
        const isOwner = connectedWallet && connectedWallet.toLowerCase() === lowerAddr;
        setOwnsProfile(isOwner);

        await fetch('/api/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name || data.address,
            address: data.address,
            tag: data.tag || 'Active Builder',
          }),
        });
      } catch (err) {
        console.error('Error fetching ENS data:', err);
        setError('Failed to load resume. Please check the ENS name or try again later.');
      }
    };

    fetchData();
  }, [ensName, isReady, connectedWallet]);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white p-6">
      {error ? (
        <div className="text-red-500 text-center mt-10">{error}</div>
      ) : !ensData ? (
        <div className="text-center text-gray-500">Loading resume...</div>
      ) : (
        <>
          <ProfileCard data={ensData} />
          <ResumeSections
            poaps={ensData.poaps}
            gitcoinGrants={ensData.gitcoinGrants}
            daos={ensData.daos}
          />
          {ownsProfile && <DownloadButton ensData={ensData} />}
          {!isConnected && (
            <div className="mt-6 text-center text-sm text-yellow-600 dark:text-yellow-400">
              Connect your wallet to verify ownership and unlock download.
            </div>
          )}
        </>
      )}
    </div>
  );
}
