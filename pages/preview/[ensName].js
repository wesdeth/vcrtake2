import Head from 'next/head';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { getENSData } from '../../lib/ensUtils';
import { getPOAPs } from '../../lib/poapUtils';
import { ethers, getAddress } from 'ethers';
import { namehash } from 'viem';

const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
const NAME_WRAPPER = '0x114D4603199df73e7D157787f8778E21fCd13066';
const ENS_REGISTRY_ABI = ['function owner(bytes32 node) external view returns (address)'];
const NAME_WRAPPER_ABI = ['function ownerOf(uint256 id) external view returns (address)'];

export default function ResumePreview() {
  const router = useRouter();
  const { ensName } = router.query;
  const [ensData, setEnsData] = useState(null);
  const [poaps, setPoaps] = useState([]);
  const [connected, setConnected] = useState(null);
  const [ownsProfile, setOwnsProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [resumeCount, setResumeCount] = useState(null);
  const printRef = useRef();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const prefersDark = localStorage.getItem('theme') === 'dark';
      setDarkMode(prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    }
  };

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
        if (accounts.length > 0) setConnected(accounts[0]);
      });
    }
  }, []);

  useEffect(() => {
    if (!ensName) return;
    async function fetchData() {
      const ens = await getENSData(ensName);
      const poapList = ens.address ? await getPOAPs(ens.address) : [];
      setEnsData(ens);
      setPoaps(poapList);
    }
    fetchData();
  }, [ensName]);

  useEffect(() => {
    async function checkOwnershipAndUpdateProfile() {
      if (!connected || !ensName) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        let resolvedAddress = ensName;
        let hashedName;
        let registryOwner = null;
        let wrapperOwner = null;
        let ethRecord = null;

        if (ensName.endsWith('.eth')) {
          hashedName = namehash(ensName);
          const registry = new ethers.Contract(ENS_REGISTRY, ENS_REGISTRY_ABI, provider);
          const wrapper = new ethers.Contract(NAME_WRAPPER, NAME_WRAPPER_ABI, provider);

          registryOwner = await registry.owner(hashedName);

          try {
            wrapperOwner = await wrapper.ownerOf(BigInt(hashedName));
          } catch (e) {}

          try {
            const resolver = await provider.getResolver(ensName);
            ethRecord = resolver ? await resolver.getAddress() : null;
          } catch (e) {}
        }

        const normalizedConnected = getAddress(connected);
        const normalizedRegistry = registryOwner ? getAddress(registryOwner) : null;
        const normalizedWrapper = wrapperOwner ? getAddress(wrapperOwner) : null;
        const normalizedEthRecord = ethRecord ? getAddress(ethRecord) : null;
        const normalizedENS = ensName.startsWith('0x') ? getAddress(ensName) : null;

        const owns =
          normalizedConnected === normalizedRegistry ||
          normalizedConnected === normalizedWrapper ||
          normalizedConnected === normalizedEthRecord ||
          normalizedConnected === normalizedENS;

        setOwnsProfile(owns);

        if (owns && ensData?.address) {
          await fetch('/api/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: ensName, address: ensData.address, tag: 'Active Builder' })
          });
        }
      } catch (err) {
        console.error('❌ Ownership check failed:', err);
        setOwnsProfile(false);
      }
    }
    checkOwnershipAndUpdateProfile();
  }, [connected, ensName, ensData]);

  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch('/api/recent-updates');
        const json = await res.json();
        setResumeCount(json.length);
      } catch (err) {
        console.error('Failed to fetch resume count:', err);
      }
    }
    fetchCount();
  }, []);

  const handleDownload = async () => {
    if (!ownsProfile) return alert("You can only download your own resume");
    const element = printRef.current;
    const html2pdf = (await import('html2pdf.js')).default;

    const opt = {
      margin: 0,
      filename: `${ensName}-resume.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/preview/${ensName}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!ensData) return <p className="p-8 text-center animate-pulse">Loading preview...</p>;

  const resolvedAvatar =
    ensData.avatar && ensData.avatar.startsWith('http') ? ensData.avatar : '/Avatar.jpg';

  const openseaLink = `https://opensea.io/${ensData.address}`;

  return (
    <>
      <Head>
        <title>{ensName} | Verified Chain Resume</title>
        <meta name="description" content={`Web3 resume for ${ensName}`} />
        <meta property="og:title" content={`${ensName} | VCR`} />
        <meta property="og:description" content={`Explore the Web3 resume of ${ensName}`} />
        <meta property="og:image" content="/social-preview.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="/social-preview.png" />
        <meta name="twitter:title" content={`${ensName} | VCR`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={`${darkMode ? 'dark' : ''} min-h-screen bg-gradient-to-tr from-purple-50 via-yellow-50 to-blue-50 py-12 px-4`}>
        <button
          onClick={toggleTheme}
          className="fixed top-4 right-4 bg-gray-200 dark:bg-gray-800 text-xs px-3 py-1 rounded shadow"
        >
          {darkMode ? '🌙 Light Mode' : '🌞 Dark Mode'}
        </button>

        {resumeCount !== null && (
          <div className="absolute top-6 left-6 bg-purple-600 text-white text-xs px-4 py-1 rounded-full shadow">
            {resumeCount.toLocaleString()} onchain resumes created
          </div>
        )}

        <div
          ref={printRef}
          className="mx-auto max-w-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-3xl shadow-2xl p-6 transition-all duration-500 hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
        >
          <div className="text-center">
            <img
              src={resolvedAvatar}
              alt="avatar"
              className="w-24 h-24 rounded-full border-4 border-purple-300 shadow mb-4 mx-auto hover:scale-110 transition duration-300"
            />
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-400">
              {ensName}
            </h1>
            <p className="text-sm text-gray-500 mt-1 dark:text-gray-400">{ensData.name || 'Ethereum User'}</p>
            {ensData.bio && (
              <p className="text-sm text-gray-700 mt-3 italic dark:text-gray-300">{ensData.bio}</p>
            )}
          </div>

          <div className="mt-6">
            <h2 className="text-md font-semibold text-purple-700 dark:text-purple-300 mb-2">POAP Achievements</h2>
            {poaps.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {poaps.slice(0, 4).map((poap, idx) => (
                  <a
                    key={idx}
                    href={poap.event_url || poap.event_url_fallback}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center bg-gray-50 dark:bg-gray-800 rounded-xl p-3 hover:bg-yellow-50 dark:hover:bg-yellow-900 transition border border-gray-100 dark:border-gray-600 shadow-sm hover:scale-105 duration-200 ease-in-out"
                  >
                    <img
                      src={poap.image_url}
                      alt={poap.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border"
                    />
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-2 text-center truncate">
                      {poap.name}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 text-center">
                      {poap.date} · {poap.location}
                    </p>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">No POAPs found.</p>
            )}
          </div>

          <div className="mt-6 text-center">
            <a
              href={openseaLink}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              View this wallet on OpenSea ↗
            </a>
          </div>

          <div className="mt-6 bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-400 text-yellow-900 dark:text-yellow-100 p-3 rounded-xl">
            {ensData.summary || `${ensName} is a recognized contributor in the Ethereum ecosystem. They’ve participated in top events like ETHGlobal and Gitcoin, and worked on meaningful DAO initiatives.`}
          </div>

          <div className="mt-6 flex flex-col gap-2 items-center">
            <button
              onClick={handleDownload}
              className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-2 px-4 rounded-full shadow hover:scale-105 transition duration-200 ${!ownsProfile && 'hidden'}`}
            >
              📄 Download PDF Resume
            </button>
            <button
              onClick={handleCopyLink}
              className="text-xs text-blue-500 dark:text-blue-300 underline hover:text-blue-700 dark:hover:text-blue-400"
            >
              {copied ? '✅ Link Copied!' : '🔗 Copy Share Link'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
