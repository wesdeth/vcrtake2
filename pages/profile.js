// pages/profile.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useAccount } from 'wagmi';
import ENSProfile from '../components/ENSProfile';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const [ensName, setEnsName] = useState('');
  const [loading, setLoading] = useState(true);
  const [ensRecord, setEnsRecord] = useState(null);

  /* 1️⃣ Resolve ENS name when a wallet is connected */
  useEffect(() => {
    const resolveENS = async () => {
      if (!address) return setLoading(false); // no wallet → stop loading

      try {
        const res = await fetch(`https://mainnet.ensideas.com/ens/resolve/${address}`);
        const data = await res.json();
        setEnsName(data?.name || address);
      } catch (err) {
        console.error('Failed to resolve ENS:', err);
        setEnsName(address);
      }
    };

    resolveENS();
  }, [address]);

  /* 2️⃣ Grab the on‑chain / Supabase VCR record when we have a name */
  useEffect(() => {
    const fetchProfile = async () => {
      if (!ensName) return;
      const { data, error } = await supabase
        .from('VCR')
        .select('*')
        .eq('ens_name', ensName)
        .single();

      if (error) console.error('Supabase fetch error:', error);
      setEnsRecord(data);
      setLoading(false);
    };

    fetchProfile();
  }, [ensName]);

  return (
    <>
      <Head>
        <title>Your Profile – Verified Chain Resume</title>
      </Head>

      <div className="min-h-screen pt-20 px-4 bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white font-calsans">
        <div className="max-w-3xl mx-auto text-center mt-16">
          {/* 3️⃣ UX states */}
          {!isConnected ? (
            <p className="text-lg text-gray-500 dark:text-gray-400">
              Connect your wallet to view&nbsp;&amp;&nbsp;edit your profile.
            </p>
          ) : loading ? (
            <p className="text-lg text-gray-500 dark:text-gray-400">Loading your profile…</p>
          ) : (
            <ENSProfile ensName={ensName} forceOwnerView overrideRecord={ensRecord} />
          )}
        </div>
      </div>
    </>
  );
}
