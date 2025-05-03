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
  const printRef = useRef();
  const [copied, setCopied] = useState(false);

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
    async function checkOwnership() {
      if (!connected || !ensName || !ensName.endsWith('.eth')) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const hashedName = namehash(ensName);

        const registry = new ethers.Contract(ENS_REGISTRY, ENS_REGISTRY_ABI, provider);
        const wrapper = new ethers.Contract(NAME_WRAPPER, NAME_WRAPPER_ABI, provider);

        const registryOwner = await registry.owner(hashedName);
        let wrapperOwner = null;
        let ethRecord = null;

        try {
          wrapperOwner = await wrapper.ownerOf(BigInt(hashedName));
        } catch (e) {
          console.log('Not a wrapped name or wrapper check failed.');
        }

        try {
          const resolver = await provider.getResolver(ensName);
          ethRecord = resolver ? await resolver.getAddress() : null;
        } catch (e) {
          console.log('Resolver or addr() check failed.');
        }

        const normalizedConnected = getAddress(connected);
        const normalizedRegistry = getAddress(registryOwner);
        const normalizedWrapper = wrapperOwner ? getAddress(wrapperOwner) : null;
        const normalizedEthRecord = ethRecord ? getAddress(ethRecord) : null;

        const owns =
          normalizedConnected === normalizedRegistry ||
          normalizedConnected === normalizedWrapper ||
          normalizedConnected === normalizedEthRecord;

        setOwnsProfile(owns);
      } catch (err) {
        console.error('❌ Ownership check failed:', err);
        setOwnsProfile(false);
      }
    }
    checkOwnership();
  }, [connected, ensName]);

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

      <div className="min-h-screen bg-gradient-to-tr from-purple-50 via-yellow-50 to-blue-50 py-12 px-4">
        <div
          ref={printRef}
          className="mx-auto max-w-md bg-white border border-gray-100 rounded-3xl shadow-2xl p-6 transition-all duration-500 hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
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
            <p className="text-sm text-gray-500 mt-1">{ensData.name || 'Ethereum User'}</p>
            {ensData.bio && (
              <p className="text-sm text-gray-700 mt-3 italic">{ensData.bio}</p>
            )}
          </div>

          <div className="mt-6">
            <h2 className="text-md font-semibold text-purple-700 mb-2">POAP Achievements</h2>
            {poaps.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {poaps.slice(0, 4).map((poap, idx) => (
                  <a
                    key={idx}
                    href={poap.event_url || poap.event_url_fallback}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center bg-gray-50 rounded-xl p-3 hover:bg-yellow-50 transition border border-gray-100 shadow-sm hover:scale-105 duration-200 ease-in-out"
                  >
                    <img
                      src={poap.image_url}
                      alt={poap.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border"
                    />
                    <p className="text-xs font-medium text-gray-700 mt-2 text-center truncate">
                      {poap.name}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 text-center">
                      {poap.date} · {poap.location}
                    </p>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No POAPs found.</p>
            )}
          </div>

          <div className="mt-6 text-center">
            <a
              href={openseaLink}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              View this wallet on OpenSea ↗
            </a>
          </div>

          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-900 p-3 rounded-xl">
            {ensData.summary || `${ensName} is a recognized contributor in the Ethereum ecosystem. They’ve participated in top events like ETHGlobal and Gitcoin, and worked on meaningful DAO initiatives.`}
          </div>

          <div className="mt-6 flex flex-col gap-2 items-center">
            <button
              onClick={handleDownload}
              className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-2 px-4 rounded-full shadow hover:scale-105 transition duration-200 ${!ownsProfile && 'opacity-50 cursor-not-allowed'}`}
            >
              📄 Download PDF Resume
            </button>
            <button
              onClick={handleCopyLink}
              className="text-xs text-blue-500 underline hover:text-blue-700"
            >
              {copied ? '✅ Link Copied!' : '🔗 Copy Share Link'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
 
