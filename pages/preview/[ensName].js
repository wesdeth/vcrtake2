import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import DownloadButton from '../../components/DownloadButton';
import ProfileCard from '../../components/ProfileCard';
import ResumeSections from '../../components/ResumeSections';
import { getEnsData, getENSOwner } from '../../lib/ensUtils';

export default function PreviewPage() {
  const router = useRouter();
  const { ensName } = router.query;
  const { isReady } = router;
  const { address: connectedWallet, isConnected } = useAccount();
  const { connect } = useConnect({ connector: new InjectedConnector() });
  const { disconnect } = useDisconnect();

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

        let isOwner = false;
        if (connectedWallet) {
          const ensOwner = await getENSOwner(data.name || '');
          isOwner = connectedWallet.toLowerCase() === (data.address?.toLowerCase() || '') || connectedWallet.toLowerCase() === (ensOwner || '');
        }
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
        <div className="text-red-500 text-center mt-10 text-lg font-medium animate-pulse">{error}</div>
      ) : !ensData ? (
        <div className="text-center text-gray-500 dark:text-gray-400 text-lg">Loading resume...</div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Resume Preview</h1>
            {isConnected && (
              <span className="text-green-600 dark:text-green-400 text-sm bg-green-100 dark:bg-green-800 px-3 py-1 rounded-full">
                ✅ Connected
              </span>
            )}
          </div>

          <ProfileCard data={ensData} />
          <ResumeSections
            poaps={ensData.poaps}
            gitcoinGrants={ensData.gitcoinGrants}
            daos={ensData.daos}
          />
          {ownsProfile ? (
            <DownloadButton ensData={ensData} />
          ) : (
            <div className="mt-6 text-center text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900 p-4 rounded-lg shadow-md max-w-md mx-auto">
              {isConnected ? (
                'You are connected but not the owner of this profile.'
              ) : (
                <>
                  Connect your wallet to verify ownership and unlock the resume download feature.
                  <button
                    onClick={() => connect()}
                    className="ml-2 underline text-purple-600 dark:text-purple-400 hover:text-purple-800"
                  >
                    Connect Wallet
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
 
