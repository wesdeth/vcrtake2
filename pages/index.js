import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const [input, setInput] = useState('');
  const router = useRouter();
  const [floatingProfiles, setFloatingProfiles] = useState([]);

  useEffect(() => {
    const fetchRecentUpdates = async () => {
      try {
        const res = await fetch('/api/recent-updates');
        const data = await res.json();
        setFloatingProfiles(data);
      } catch (err) {
        console.error('Failed to fetch recent updates:', err);
      }
    };
    fetchRecentUpdates();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (input.endsWith('.eth') || input.startsWith('0x')) {
      router.push(`/${input}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9f5ff] via-[#ecf4ff] to-[#fffbe6] relative flex items-center justify-center px-6 py-16 overflow-hidden">
      {/* Floating Stat Bubble */}
      <div className="absolute top-6 left-6 animate-pulse bg-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-md">
        12,380 onchain resumes created
      </div>

      {/* Floating ENS Profiles */}
      <div className="absolute top-24 right-4 space-y-3">
        {floatingProfiles.map((profile, index) => (
          <div
            key={index}
            onClick={() => router.push(`/${profile.name}`)}
            className={`cursor-pointer w-44 bg-white border ${profile.border} rounded-xl shadow hover:shadow-lg p-2 transition-all duration-500 transform hover:scale-105 animate-fadeIn`}
            style={{ animationDelay: `${index * 0.3}s` }}
          >
            <p className="font-semibold text-sm truncate">{profile.name}</p>
            <p className={`text-xs ${profile.color}`}>{profile.tag}</p>
          </div>
        ))}
      </div>

      {/* Main Box */}
      <div className="text-center max-w-2xl rounded-3xl p-10 shadow-xl bg-white/60 backdrop-blur-md border border-gray-200 animate-fadeIn">
        <h1 className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-400">
          Verified Chain Resume
        </h1>
        <p className="text-lg text-gray-800 mb-4 font-medium">
          The first real onchain resume — auto-generated from your ENS, POAPs, Gitcoin Grants, hackathons, and DAO roles.
        </p>
        <p className="text-md text-gray-600 mb-6">
          No more LinkedIn. No more résumé templates. Just connect your wallet or input your ENS, and we’ll show the world what you’ve accomplished in Web3.
        </p>
        <p className="text-sm text-gray-500 mb-8 italic">
          Generate your profile. Download a PDF. Get seen by hiring managers. Your chain activity tells your story — we just format it.
        </p>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 justify-center">
          <input
            type="text"
            placeholder="Enter ENS or wallet (e.g. abigail.eth)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full sm:w-80 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition"
          >
            View Resume
          </button>
        </form>
        <div className="mt-10 text-xs text-gray-400">
          ✨ Built for builders. Respected by the chain.
        </div>
      </div>
    </div>
  );
}
