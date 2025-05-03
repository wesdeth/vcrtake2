import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';

export default function Home() {
  const [input, setInput] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const router = useRouter();
  const [floatingProfiles, setFloatingProfiles] = useState([]);

  useEffect(() => {
    const fetchRecentUpdates = async () => {
      try {
        const res = await fetch('/api/recent-updates');
        const data = await res.json();

        const enrichedData = await Promise.all(
          data.map(async (profile) => {
            try {
              const poapRes = await axios.get(`https://api.poap.tech/actions/scan/${profile.address}`, {
                headers: { 'X-API-Key': process.env.NEXT_PUBLIC_POAP_API_KEY || 'demo' }
              });
              const poaps = poapRes.data || [];
              const hasPoaps = poaps.length > 0;

              return {
                ...profile,
                tag: hasPoaps ? 'POAP Verified' : profile.tag || 'Active Builder',
                color: hasPoaps ? 'text-purple-500' : 'text-blue-500',
                border: hasPoaps ? 'border-purple-300' : 'border-blue-300',
              };
            } catch (poapError) {
              console.warn(`Failed to fetch POAPs for ${profile.name}`, poapError);
              return {
                ...profile,
                tag: profile.tag || 'Active Builder',
                color: 'text-blue-500',
                border: 'border-blue-300',
              };
            }
          })
        );

        const noneTagged = enrichedData.every(p => p.tag !== 'Looking for Work');
        if (enrichedData.length > 0 && noneTagged) {
          const index = Math.floor(Math.random() * enrichedData.length);
          enrichedData[index].tag = 'Looking for Work';
          enrichedData[index].color = 'text-orange-500';
          enrichedData[index].border = 'border-orange-300';
        }

        setFloatingProfiles(enrichedData);
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
    <div className={darkMode ? 'dark' : ''}>
      <Head>
        <title>Verified Chain Resume</title>
        <meta name="description" content="Generate your Web3 resume powered by ENS and POAP." />
        <meta property="og:title" content="Verified Chain Resume" />
        <meta property="og:image" content="/social-preview.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/social-preview.png" />
        <meta name="twitter:title" content="Verified Chain Resume" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#fef6fb] via-[#eef4ff] to-[#fffce6] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-200 flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden transition-colors duration-500">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="absolute top-6 right-6 bg-gray-100 dark:bg-gray-700 text-xs font-medium px-3 py-1 rounded-full shadow hover:scale-105 transition"
        >
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>

        <div className="absolute top-8 left-6 animate-pulse bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-full shadow-md">
          12,380 onchain resumes created
        </div>

        <div className="absolute top-28 right-4 space-y-4">
          {floatingProfiles.map((profile, index) => (
            <div
              key={index}
              onClick={() => router.push(`/${profile.name}`)}
              className={`cursor-pointer w-44 bg-white dark:bg-gray-800 border ${profile.border} rounded-xl shadow-md hover:shadow-lg p-3 transition transform hover:scale-105 animate-fadeIn`}
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <p className="font-semibold text-sm truncate">{profile.name}</p>
              <p className={`text-xs ${profile.color}`}>{profile.tag}</p>
            </div>
          ))}
        </div>

        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 opacity-10 dark:opacity-5">
          <img src="/hero-graphic.png" alt="Hero Graphic" className="max-w-lg" />
        </div>

        <div className="max-w-2xl w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-2xl rounded-3xl p-10 text-center animate-fadeIn z-10">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-blue-500 to-yellow-400 dark:from-purple-300 dark:via-blue-300 dark:to-yellow-200 mb-4">
            Verified Chain Resume
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-200 mb-3 font-medium">
            Your Web3 identity, beautifully packaged.
          </p>
          <p className="text-md text-gray-600 dark:text-gray-300 mb-4">
            Discover a new kind of resume — one that's fully onchain. Powered by ENS, POAPs, Gitcoin Grants, and DAOs.
          </p>
          <p className="text-sm text-gray-500 italic dark:text-gray-400 mb-6">
            Enter your ENS or wallet to create a PDF-ready resume that shows what you've actually done in Web3.
          </p>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 justify-center">
            <input
              type="text"
              placeholder="Enter ENS or wallet (e.g. yourname.eth)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full sm:w-80 px-5 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg shadow-inner focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg shadow hover:scale-105 transition"
            >
              Generate Resume
            </button>
          </form>

          <div className="mt-10 text-xs text-gray-400 dark:text-gray-500">
            ⚡ Powered by Ethereum. Loved by builders.
          </div>
        </div>
      </div>
    </div>
  );
}
