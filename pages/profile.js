// pages/profile.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useAccount } from 'wagmi';
import ENSProfile from '@/components/ENSProfile';

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const [ensName, setEnsName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resolveENS = async () => {
      try {
        const res = await fetch(`/api/reverse-ens?address=${address}`);
        const data = await res.json();
        if (data.ensName) setEnsName(data.ensName);
        else setEnsName(address);
      } catch (err) {
        console.error('Failed to resolve ENS:', err);
        setEnsName(address);
      } finally {
        setLoading(false);
      }
    };

    if (isConnected && address) {
      resolveENS();
    } else {
      setLoading(false);
    }
  }, [address, isConnected]);

  return (
    <>
      <Head>
        <title>Your Profile - Verified Chain Resume</title>
      </Head>
      <div className="min-h-screen pt-20 px-4 bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white font-calsans">
        <div className="max-w-3xl mx-auto text-center mt-16">
          {loading ? (
            <p className="text-lg text-gray-500 dark:text-gray-400">Loading your profile...</p>
          ) : !isConnected ? (
            <p className="text-lg text-gray-500 dark:text-gray-400">Connect your wallet to view your profile.</p>
          ) : (
            <ENSProfile ensName={ensName} />
          )}
        </div>
      </div>
    </>
  );
}
