// pages/index.js
import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function Home() {
  const [input, setInput] = useState('');
  const router = useRouter();
  const [floatingProfiles, setFloatingProfiles] = useState([]);
  const [currentIndexes, setCurrentIndexes] = useState([0, 1, 2]);
  const [fade, setFade] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchRecentUpdates = async () => {
      try {
        const res = await fetch('/api/recent-updates?limit=15');
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
                color: hasPoaps ? 'text-[#A259FF]' : 'text-[#635BFF]',
                border: hasPoaps ? 'border-[#D8B4FE]' : 'border-[#A5B4FC]',
              };
            } catch {
              return {
                ...profile,
                tag: profile.tag || 'Active Builder',
                color: 'text-[#635BFF]',
                border: 'border-[#A5B4FC]',
              };
            }
          })
        );

        const noneTagged = enrichedData.every(p => p.tag !== 'Looking for Work');
        if (enrichedData.length > 0 && noneTagged) {
          const index = Math.floor(Math.random() * enrichedData.length);
          enrichedData[index].tag = 'Looking for Work';
          enrichedData[index].color = 'text-[#FFC542]';
          enrichedData[index].border = 'border-[#FDE68A]';
        }

        setFloatingProfiles(enrichedData);
      } catch (err) {
        console.error('Failed to fetch recent updates:', err);
      }
    };

    fetchRecentUpdates();
  }, []);

  useEffect(() => {
    if (floatingProfiles.length === 0) return;
    timerRef.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndexes((prev) => {
          return prev.map(i => (i + 3) % floatingProfiles.length);
        });
        setFade(true);
      }, 400);
    }, 7000);

    return () => clearInterval(timerRef.current);
  }, [floatingProfiles]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (input.endsWith('.eth') || input.startsWith('0x')) {
      router.push(`/preview/${input}`);
    }
  };

  const currentProfiles = currentIndexes.map(i => floatingProfiles[i]).filter(Boolean);

  return (
    <>
      <Head>
        <title>Verified Chain Resume</title>
        <meta name="description" content="Web3 resumes powered by ENS, POAPs, and DAOs." />
        <meta property="og:title" content="Verified Chain Resume" />
        <meta property="og:description" content="Build your onchain identity into a polished Web3 resume." />
        <meta property="og:image" content="/social-preview.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/social-preview.png" />
        <meta name="twitter:title" content="Verified Chain Resume" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Cal+Sans:wght@600&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] via-[#F9FAFB] to-[#74E0FF] text-[#1F2937] relative overflow-hidden font-calsans pt-20">
        <div className="absolute top-8 left-6 animate-pulse bg-gradient-to-r from-[#A259FF] via-[#635BFF] to-[#FFC542] text-white text-xs font-bold px-4 py-2 rounded-full shadow-md z-10">
          12,380 onchain resumes created
        </div>

        <div className="absolute top-28 right-4 space-y-4 max-h-[calc(100vh-7rem)] overflow-hidden hidden sm:block z-10"
          onMouseEnter={() => clearInterval(timerRef.current)}
          onMouseLeave={() => timerRef.current = setInterval(() => {
            setFade(false);
            setTimeout(() => {
              setCurrentIndexes((prev) => prev.map(i => (i + 3) % floatingProfiles.length));
              setFade(true);
            }, 400);
          }, 7000)}>
          {currentProfiles.map((profile, index) => (
            <div
              key={index}
              onClick={() => router.push(`/preview/${profile.name}`)}
              className={`cursor-pointer w-44 bg-white border ${profile.border} rounded-xl shadow-md hover:shadow-lg p-3 transition-all duration-500 ease-in-out transform hover:scale-105 ${fade ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <p className="font-semibold text-sm truncate text-black">{profile.name}</p>
              <p className={`text-xs ${profile.color}`}>{profile.tag}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-center px-4 sm:px-6 py-16 z-10 relative">
          <div className="max-w-2xl w-full bg-white backdrop-blur-md border border-[#E5E7EB] shadow-2xl rounded-3xl p-6 sm:p-10 text-center animate-fadeIn text-[#1F2937]">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#A259FF] via-[#635BFF] to-[#FFC542] mb-4">
              Verified Chain Resume
            </h1>
            <p className="text-md sm:text-lg text-[#4B5563] mb-3 font-medium">
              Your Web3 identity, beautifully packaged.
            </p>
            <p className="text-sm sm:text-md text-[#6B7280] mb-4">
              Discover a new kind of resume — one that's fully onchain. Powered by ENS, POAPs, Gitcoin Grants, and DAOs.
            </p>
            <p className="text-xs sm:text-sm text-[#9CA3AF] italic mb-6">
              Enter your ENS or wallet to preview a Web3 resume.
            </p>

            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 justify-center">
              <input
                type="text"
                placeholder="Enter ENS or wallet (e.g. yourname.eth)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full sm:w-80 px-5 py-3 border border-[#D1D5DB] rounded-lg shadow-inner focus:ring-2 focus:ring-[#A259FF] focus:outline-none bg-white text-[#1F2937]"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-[#A259FF] to-[#635BFF] text-white font-semibold rounded-lg shadow hover:scale-105 transition"
              >
                View Resume
              </button>
            </form>

            <div className="mt-10 text-xs text-[#9CA3AF]">
              ⚡ Powered by Ethereum. Loved by builders.
            </div>
          </div>
        </div>

        <footer className="text-center text-xs text-[#9CA3AF] py-6 z-10 relative">
          © {new Date().getFullYear()} Verified Chain Resume — Built with ❤️ for the Web3 community.
        </footer>
      </div>
    </>
  );
}
