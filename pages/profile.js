// pages/profile.js
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import ENSProfile from '../components/ENSProfile';

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const [walletAddress, setWalletAddress] = useState(null);

  useEffect(() => {
    if (isConnected && address) {
      setWalletAddress(address);
    }
  }, [isConnected, address]);

  return (
    <>
      <Head>
        <title>My Profile - Verified Chain Resume</title>
      </Head>
      <div className="min-h-screen pt-20 px-4 bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white font-calsans">
        <div className="max-w-4xl mx-auto py-10">
          {isConnected && walletAddress ? (
            <ENSProfile ensName={null} />
          ) : (
            <div className="text-center mt-20">
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                Connect your wallet to view and edit your profile.
              </h2>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
