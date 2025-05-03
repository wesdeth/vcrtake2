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

        const noneTagged = data.every(p => p.tag !== 'Looking for Work');
        if (data.length > 0 && noneTagged) {
          const index = Math.floor(Math.random() * data.length);
          data[index].tag = 'Looking for Work';
          data[index].color = 'text-orange-500';
          data[index].border = 'border-orange-300';
        }

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
    <div className="min-h-screen bg-gradient-to-br from-[#fef6fb] via-[#eef4ff] to-[#fffce6] flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      <div className="absolute top-8 left-6 animate-pulse bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md">
        12,380 onchain resumes created
      </div>

      <div className="absolute top-28 right-4 space-y-4">
        {floatingProfiles.map((profile, index) => (
          <div
            key={index}
            onClick={() => router.push(`/${profile.name}`)}
            className={`cursor-pointer w-44 bg-white border ${profile.border} rounded-xl shadow-md hover:shadow-lg p-3 transition transform hover:scale-105 animate-fadeIn`}
            style={{ animationDelay: `${index * 0.2}s` }}
          >
            <p className="font-semibold text-sm truncate">{profile.name}</p>
            <p className={`text-xs ${profile.color}`}>{profile.tag}</p>
          </div>
        ))}
      </div>

      <div className="max-w-2xl w-full bg-white/80 backdrop-blur-md border border-gray-200 shadow-2xl rounded-3xl p-10 text-center animate-fadeIn">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-blue-500 to-yellow-400 mb-4">
          Verified Chain Resume
        </h1>
        <p className="text-lg text-gray-700 mb-3 font-medium">
          Your Web3 identity, beautifully packaged.
        </p>
        <p className="text-md text-gray-600 mb-4">
          Discover a new kind of resume — one that's fully onchain. Powered by ENS, POAPs, Gitcoin Grants, and DAOs.
        </p>
        <p className="text-sm text-gray-500 italic mb-6">
          Enter your ENS or wallet to create a PDF-ready resume that shows what you've actually done in Web3.
        </p>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 justify-center">
          <input
            type="text"
            placeholder="Enter ENS or wallet (e.g. yourname.eth)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full sm:w-80 px-5 py-3 border border-gray-300 rounded-lg shadow-inner focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow hover:scale-105 transition"
          >
            Generate Resume
          </button>
        </form>

        <div className="mt-10 text-xs text-gray-400">
          ⚡ Powered by Ethereum. Loved by builders.
        </div>
      </div>
    </div>
  );
}
