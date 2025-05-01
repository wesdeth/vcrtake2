import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const [input, setInput] = useState('');
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (input.endsWith('.eth') || input.startsWith('0x')) {
      router.push(`/${input}`);
    }
  };

  const floatingProfiles = [
    { name: 'vitalik.eth', status: 'Recently Updated' },
    { name: '184.eth', status: 'Viewed by Recruiter' },
    { name: 'zora.eth', status: 'New Resume' },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#f9f5ff] via-[#ecf4ff] to-[#fffbe6] flex items-center justify-center px-6 py-16">
      
      {/* Floating Stat Bubble */}
      <div className="absolute top-10 left-6 z-10 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-5 py-2 rounded-full text-sm font-semibold shadow-md animate-bounce-slow">
        12,380 onchain resumes created
      </div>

      {/* Floating Recent Profiles */}
      <div className="absolute top-32 right-6 z-10 flex flex-col gap-3">
        {floatingProfiles.map((profile, idx) => (
          <a
            key={idx}
            href={`/${profile.name}`}
            className="bg-white border border-gray-200 px-4 py-2 rounded-xl shadow hover:shadow-lg transition-all duration-200 text-left"
            style={{
              transform: `rotate(${(Math.random() * 3 - 1.5).toFixed(2)}deg)`,
              width: '160px'
            }}
          >
            <div className="text-sm font-bold text-gray-900">{profile.name}</div>
            <div className="text-xs text-purple-600">{profile.status}</div>
          </a>
        ))}
      </div>

      {/* Main Hero Box */}
      <div className="text-center max-w-2xl rounded-3xl p-10 shadow-xl bg-white/60 backdrop-blur-md border border-gray-200 z-0">
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
