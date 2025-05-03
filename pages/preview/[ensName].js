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
            tag: data.tag || 'Active Builder'
          })
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
          <h1 className="text-2xl font-bold mb-4">{ensData.name || ensData.address}</h1>
          <ProfileCard data={ensData} />
          <ResumeSections
            poaps={ensData.poaps}
            gitcoinGrants={ensData.gitcoinGrants}
            daos={ensData.daos}
          />

          <div className="mt-10 text-center space-y-4">
            <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg shadow hover:scale-105 transition">
              Preview Resume
            </button>

            {!isConnected && (
              <div className="bg-amber-900 text-yellow-300 p-4 rounded-md max-w-md mx-auto">
                Connect your wallet to verify ownership and unlock the resume download feature.{' '}
                <a href="#" className="underline text-purple-300">
                  Connect Wallet
                </a>
              </div>
            )}

            {ownsProfile && <DownloadButton ensData={ensData} />}
          </div>
        </>
      )}
    </div>
  );
}
