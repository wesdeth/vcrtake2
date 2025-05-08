// pages/profile.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useAccount } from 'wagmi';
import ENSProfile from '../components/ENSProfile';

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const [ensOrAddress, setEnsOrAddress] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrimaryName = async () => {
      if (!address) return;

      try {
        const res = await fetch(`https://metadata.ens.domains/mainnet/address/${address}`);
        const json = await res.json();
        if (json.name) {
          setEnsOrAddress(json.name);
        } else {
          setEnsOrAddress(address);
        }
      } catch (err) {
        console.error('❌ Failed to resolve ENS name from address:', err);
        setEnsOrAddress(address);
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchPrimaryName();
    } else {
      setLoading(false);
    }
  }, [address]);

  return (
    <>
      <Head>
        <title>Your Profile - Verified Chain Resume</title>
      </Head>
      <div className="min-h-screen pt-20 px-4 bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white font-calsans">
        <div className="max-w-3xl mx-auto text-center mt-16">
          {loading ? (
            <p className="text-lg text-gray-500 dark:text-gray-400">Loading your profile...</p>
          ) : !ensOrAddress ? (
            <p className="text-lg text-gray-500 dark:text-gray-400">Connect your wallet to view your profile.</p>
          ) : (
            <ENSProfile ensName={ensOrAddress} forceOwnerView={true} />
          )}
        </div>
      </div>
    </>
  );
}
