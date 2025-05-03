import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { getENSData } from '../../lib/ensUtils';
import { getPOAPs } from '../../lib/poapUtils';
import { fetchAlchemyNFTs } from '../../lib/nftUtils';
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
  const [nfts, setNfts] = useState([]);
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
      const nftList = ens.address ? await fetchAlchemyNFTs(ens.address) : [];
      setEnsData(ens);
      setPoaps(poapList);
      setNfts(nftList);
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

  if (!ensData) return <p className="p-8 text-center">Loading preview...</p>;

  const resolvedAvatar =
    ensData.avatar && ensData.avatar.startsWith('http') ? ensData.avatar : '/Avatar.jpg';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ecf4ff] via-[#fffbe6] to-[#f9f5ff] py-12 px-4">
      <div
        ref={printRef}
        className="max-w-3xl mx-auto bg-white shadow-2xl rounded-3xl p-10 relative border border-gray-100"
      >
        <div className="absolute top-4 right-4 text-[10px] text-gray-300 uppercase tracking-widest rotate-6 select-none">
          VCR Preview
        </div>

        <div className="flex flex-col items-center text-center animate-fade-in">
          <img
            src={resolvedAvatar}
            alt="avatar"
            className="w-28 h-28 rounded-full border-4 border-purple-300 shadow mb-4 hover:scale-105 transition-transform duration-200"
          />
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-400">
            {ensName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{ensData.name || 'Ethereum User'}</p>
          {ensData.bio && (
            <p className="text-base text-gray-700 mt-4 italic max-w-lg">{ensData.bio}</p>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-bold text-purple-700 mb-2">POAPs</h2>
          <div className="flex flex-wrap gap-2">
            {poaps.length > 0 ? (
              poaps.slice(0, 5).map((poap, idx) => (
                <img
                  key={idx}
                  src={poap.image_url}
                  alt={poap.event.name}
                  className="w-10 h-10 rounded-full border shadow-sm hover:scale-105 transition"
                />
              ))
            ) : (
              <p className="text-sm text-gray-400">No POAPs found.</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-bold text-purple-700 mb-2">NFT Highlights</h2>
          <div className="grid grid-cols-3 gap-4">
            {nfts.length > 0 ? (
              nfts.slice(0, 3).map((nft, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="rounded-xl w-24 h-24 object-cover border hover:scale-105 transition"
                  />
                  <span className="text-xs mt-1 text-gray-500 text-center">
                    {nft.name || 'NFT'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">No NFTs found.</p>
            )}
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-900 p-4 rounded-xl">
          {ensData.summary || `${ensName} is a recognized contributor in the Ethereum ecosystem. They’ve participated in top events like ETHGlobal and Gitcoin, and worked on meaningful DAO initiatives.`}
        </div>
      </div>

      <div className="text-center mt-8 space-y-4">
        <button
          onClick={handleDownload}
          className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 px-6 rounded-full shadow-xl hover:scale-105 transition duration-200 ${!ownsProfile && 'opacity-50 cursor-not-allowed'}`}
        >
          📄 Download Resume as PDF
        </button>

        <div>
          <button
            onClick={handleCopyLink}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-2 px-4 rounded-full shadow-md hover:scale-105 transition duration-200"
          >
            {copied ? '✅ Link Copied!' : '🔗 Copy Share Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
