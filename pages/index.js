// pages/index.js

import Head from 'next/head';
import Link from 'next/link';     // <--- IMPORTANT: import Link from next/link
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function Home() {
  const router = useRouter();

  // For user input (ENS or 0x wallet)
  const [input, setInput] = useState('');

  // Floating profiles data
  const [floatingProfiles, setFloatingProfiles] = useState([]);
  const [currentIndexes, setCurrentIndexes] = useState([0, 1, 2, 3, 4]);  // 5-card rotation
  const [fade, setFade] = useState(true);
  const timerRef = useRef(null);

  // Badge count for “onchain resumes created”
  const [resumeCount, setResumeCount] = useState(12380);

  /**
   * 1) Randomly Increase Badge Count in localStorage once every 24hrs
   */
  useEffect(() => {
    const storageKey = 'resumeCountData';
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      const { count, lastUpdate } = parsed;

      // If it’s been more than 24 hrs, increment by 5–10
      if (now - lastUpdate > oneDay) {
        const randomIncrement = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
        const newCount = count + randomIncrement;
        setResumeCount(newCount);

        localStorage.setItem(
          storageKey,
          JSON.stringify({ count: newCount, lastUpdate: now })
        );
      } else {
        setResumeCount(count);
      }
    } else {
      // Nothing in localStorage, store initial
      localStorage.setItem(
        storageKey,
        JSON.stringify({ count: 12380, lastUpdate: now })
      );
    }
  }, []);

  /**
   * 2) Fetch recent updates from /api/recent-updates & 
   *    also fetch POAP data + ENS name for each profile
   */
  useEffect(() => {
    const fetchRecentUpdates = async () => {
      try {
        const res = await fetch('/api/recent-updates?limit=15');
        const data = await res.json();
        let updatedData = data || [];

        const enrichedData = await Promise.all(
          updatedData.map(async (profile) => {
            let hasPoaps = false;
            let tagColor = 'text-[#635BFF]';
            let borderColor = 'border-[#A5B4FC]';
            let tag = profile.tag || 'Active Builder';

            // POAP fetch
            try {
              const poapRes = await axios.get(
                `https://api.poap.tech/actions/scan/${profile.address}`,
                {
                  headers: {
                    'X-API-Key': process.env.NEXT_PUBLIC_POAP_API_KEY || 'demo'
                  }
                }
              );
              hasPoaps = (poapRes.data || []).length > 0;
              if (hasPoaps) {
                tag = 'POAP Verified';
                tagColor = 'text-[#A259FF]';
                borderColor = 'border-[#D8B4FE]';
              }
            } catch {
              // fallback
            }

            // ENS name fetch
            let resolvedEns = profile.name;
            try {
              const ensRes = await axios.get(
                `https://api.ensideas.com/ens/resolve/${profile.address}`
              );
              if (ensRes.data?.name) {
                resolvedEns = ensRes.data.name;
              }
            } catch {
              // fallback
            }

            return {
              ...profile,
              name: resolvedEns,
              tag,
              color: tagColor,
              border: borderColor
            };
          })
        );

        // 5 placeholders in case no real data
        const placeholders = [
          {
            address: '0xPLACEHOLDER1',
            name: 'validator.eth',
            tag: 'Active Builder',
            color: 'text-[#635BFF]',
            border: 'border-[#A5B4FC]'
          },
          {
            address: '0xPLACEHOLDER2',
            name: 'evanmoyer.eth',
            tag: 'Active Builder',
            color: 'text-[#635BFF]',
            border: 'border-[#A5B4FC]'
          },
          {
            address: '0xPLACEHOLDER3',
            name: 'brantly.eth',
            tag: 'Active Builder',
            color: 'text-[#635BFF]',
            border: 'border-[#A5B4FC]'
          },
          {
            address: '0xPLACEHOLDER4',
            name: 'dragonmaster.eth',
            tag: 'Active Builder',
            color: 'text-[#635BFF]',
            border: 'border-[#A5B4FC]'
          },
          {
            address: '0xPLACEHOLDER5',
            name: 'rainbowlover.eth',
            tag: 'Active Builder',
            color: 'text-[#635BFF]',
            border: 'border-[#A5B4FC]'
          }
        ];

        // Ensure at least 5 items
        let finalData = enrichedData;
        if (finalData.length < 5) {
          finalData = [...finalData, ...placeholders].slice(0, 5);
        }

        // Ensure at least one “Looking for Work”
        const noneTagged = finalData.every((p) => p.tag !== 'Looking for Work');
        if (finalData.length > 0 && noneTagged) {
          const index = Math.floor(Math.random() * finalData.length);
          finalData[index].tag = 'Looking for Work';
          finalData[index].color = 'text-[#FFC542]';
          finalData[index].border = 'border-[#FDE68A]';
        }

        setFloatingProfiles(finalData);
      } catch (err) {
        console.error('Failed to fetch recent updates:', err);
        // If fetch fails, just show placeholders
        setFloatingProfiles([
          {
            address: '0xPLACEHOLDER1',
            name: 'validator.eth',
            tag: 'Active Builder',
            color: 'text-[#635BFF]',
            border: 'border-[#A5B4FC]'
          },
          {
            address: '0xPLACEHOLDER2',
            name: 'evanmoyer.eth',
            tag: 'Active Builder',
            color: 'text-[#635BFF]',
            border: 'border-[#A5B4FC]'
          },
          {
            address: '0xPLACEHOLDER3',
            name: 'brantly.eth',
            tag: 'Active Builder',
            color: 'text-[#635BFF]',
            border: 'border-[#A5B4FC]'
          },
          {
            address: '0xPLACEHOLDER4',
            name: 'dragonmaster.eth',
            tag: 'Active Builder',
            color: 'text-[#635BFF]',
            border: 'border-[#A5B4FC]'
          },
          {
            address: '0xPLACEHOLDER5',
            name: 'rainbowlover.eth',
            tag: 'Active Builder',
            color: 'text-[#635BFF]',
            border: 'border-[#A5B4FC]'
          }
        ]);
      }
    };

    fetchRecentUpdates();
  }, []);

  /**
   * 3) Rotate the "floating profiles" every 7 seconds
   */
  useEffect(() => {
    if (!floatingProfiles.length) return;

    timerRef.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        // shift indexes by 5
        setCurrentIndexes((prev) =>
          prev.map((i) => (i + 5) % floatingProfiles.length)
        );
        setFade(true);
      }, 400);
    }, 7000);

    return () => clearInterval(timerRef.current);
  }, [floatingProfiles]);

  const pauseRotation = () => clearInterval(timerRef.current);
  const resumeRotation = () => {
    timerRef.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndexes((prev) =>
          prev.map((i) => (i + 5) % floatingProfiles.length)
        );
        setFade(true);
      }, 400);
    }, 7000);
  };

  /**
   * 4) Form Handler
   */
  const handleSearch = (e) => {
    e.preventDefault();
    if (input.endsWith('.eth') || input.startsWith('0x')) {
      router.push(`/preview/${input}`);
    }
  };

  // Current visible profiles
  const currentProfiles = currentIndexes
    .map((i) => floatingProfiles[i])
    .filter(Boolean);

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
        <link
          href="https://fonts.googleapis.com/css2?family=Cal+Sans:wght@600&display=swap"
          rel="stylesheet"
        />
      </Head>

      {/* Main container */}
      <div
        className="
          min-h-screen 
          w-full 
          bg-gradient-to-br from-white via-[#FAF9FE] to-[#D0EFFC]
          text-[#1F2937] 
          font-calsans
          pt-20
          relative
          overflow-hidden
        "
      >
        {/* Badge: # of onchain resumes */}
        <div
          className="
            absolute top-10 left-6 
            bg-gradient-to-r from-[#A259FF] via-[#635BFF] to-[#FFC542]
            text-white text-xs font-bold 
            px-4 py-2
            rounded-full
            shadow-lg 
            animate-pulse
            z-10
          "
        >
          {resumeCount.toLocaleString()} onchain resumes created
        </div>

        {/* Floating profile cards (5) on the right */}
        <div
          className="
            absolute top-28 right-6
            space-y-4 
            max-h-[calc(100vh-10rem)] 
            overflow-hidden 
            hidden sm:block
            z-10
          "
          onMouseEnter={pauseRotation}
          onMouseLeave={resumeRotation}
        >
          {currentProfiles.map((profile, index) => {
            const gotoSlug = profile.name && profile.name.trim() 
              ? profile.name 
              : profile.address;

            return (
              <Link key={index} href={`/preview/${gotoSlug}`}>
                <div
                  className={`
                    cursor-pointer
                    w-44
                    bg-white/80
                    backdrop-blur-md
                    border ${profile.border}
                    rounded-xl
                    shadow-md
                    hover:shadow-lg
                    p-3
                    transition-all
                    duration-500
                    ease-in-out
                    transform
                    hover:scale-105
                    ${fade ? 'opacity-100' : 'opacity-0'}
                  `}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <p className="font-semibold text-sm truncate text-black">
                    {profile.name}
                  </p>
                  <p className={`text-xs ${profile.color}`}>{profile.tag}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Hero / main content */}
        <div className="flex flex-col items-center justify-center px-4 sm:px-6 py-16 z-10 relative">
          <div
            className="
              max-w-2xl w-full 
              bg-white
              bg-opacity-80
              backdrop-blur-xl
              border border-[#E5E7EB]
              shadow-2xl 
              rounded-3xl 
              px-8 py-10 sm:p-12 
              text-center 
              text-[#1F2937]
            "
          >
            <h1
              className="
                text-4xl sm:text-5xl 
                font-extrabold 
                mb-4 
                text-transparent 
                bg-clip-text 
                bg-gradient-to-r from-[#A259FF] via-[#635BFF] to-[#FFC542]
              "
            >
              Verified Chain Resume
            </h1>
            <p className="text-lg sm:text-xl text-[#4B5563] mb-3 font-medium">
              Your Web3 identity, beautifully packaged.
            </p>
            <p className="text-sm sm:text-md text-[#6B7280] mb-6 leading-relaxed">
              Discover a new kind of resume—fully onchain. 
              Powered by ENS, POAPs, Gitcoin Grants, and DAOs.
              <br className="hidden sm:block" />
              Enter your ENS or wallet to preview a Web3 resume.
            </p>

            {/* ENS / 0x search form */}
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-3 justify-center mt-2"
            >
              <input
                type="text"
                placeholder="Enter ENS or wallet (e.g. yourname.eth)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="
                  w-full sm:w-80 
                  px-5 py-3 
                  border border-[#D1D5DB] 
                  rounded-lg 
                  shadow-inner 
                  focus:ring-2 
                  focus:ring-[#A259FF] 
                  focus:outline-none 
                  bg-white
                  text-[#1F2937]
                "
              />
              <button
                type="submit"
                className="
                  px-6 py-3 
                  bg-gradient-to-r from-[#A259FF] to-[#635BFF] 
                  text-white 
                  font-semibold 
                  rounded-lg 
                  shadow 
                  hover:scale-105 
                  transition 
                "
              >
                View Resume
              </button>
            </form>

            <div className="mt-8 text-xs text-[#9CA3AF]">
              ⚡ Powered by Ethereum. Loved by builders.
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer
          className="
            text-center 
            text-xs 
            text-[#9CA3AF] 
            py-8
            z-10 
            relative
          "
        >
          © {new Date().getFullYear()} Verified Chain Resume — Built with ❤️ for the Web3 community.
          <br />
          <span className="text-[#6B7280]">
            Created by wesd.eth
          </span>
        </footer>
      </div>
    </>
  );
}
