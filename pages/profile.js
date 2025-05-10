// pages/profile.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useAccount } from 'wagmi';
import ENSProfile from '../components/ENSProfile';

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const [ensInput, setEnsInput] = useState('');
  const [ensResolved, setEnsResolved] = useState('');

  // Example: if connected, default to your own address
  useEffect(() => {
    if (isConnected && address) {
      setEnsInput(address);
      setEnsResolved(address);
    }
  }, [address, isConnected]);

  function handleSubmit(e) {
    e.preventDefault();
    if (ensInput.trim()) {
      setEnsResolved(ensInput.trim());
    }
  }

  return (
    <>
      <Head>
        <title>Your Profile – VCR</title>
      </Head>
      <div className="min-h-screen pt-20 px-4 bg-white text-gray-800">
        <div className="max-w-xl mx-auto text-center mt-10">
          <h1 className="text-3xl font-bold mb-6">Profile</h1>

          <form onSubmit={handleSubmit} className="flex gap-2 justify-center mb-8">
            <input
              type="text"
              value={ensInput}
              onChange={(e) => setEnsInput(e.target.value)}
              placeholder="Enter ENS or 0x address"
              className="border p-2 rounded w-64"
            />
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">
              Load
            </button>
          </form>

          {/* If we have an ensResolved, show the ENSProfile */}
          {ensResolved && <ENSProfile ensNameOrAddress={ensResolved} />}
        </div>
      </div>
    </>
  );
}
