// pages/preview/[ensName].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getENSData } from '../../lib/ensUtils';
import { getPOAPs } from '../../lib/poapUtils';
import { getAlchemyNFTs } from '../../lib/nftUtils';
import { BadgeCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PreviewResume() {
  const router = useRouter();
  const { ensName } = router.query;
  const [ensData, setEnsData] = useState({});
  const [poaps, setPoaps] = useState([]);
  const [nfts, setNfts] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const ens = await getENSData(ensName);
      const poapList = ens.address ? await getPOAPs(ens.address) : [];
      const nftList = ens.address ? await getAlchemyNFTs(ens.address) : [];
      setEnsData(ens);
      setPoaps(poapList);
      setNfts(nftList);
    }
    if (ensName) fetchData();
  }, [ensName]);

  const avatar =
    ensData.avatar && ensData.avatar.startsWith('http')
      ? ensData.avatar
      : '/Avatar.jpg';

  return (
    <div className="relative min-h-screen bg-white px-6 py-12">
      {/* Watermark */}
      <div className="pointer-events-none fixed top-0 left-0 w-full h-full z-0 flex items-center justify-center opacity-5 select-none text-[4rem] font-extrabold text-gray-300">
        Verified Chain Resume
      </div>

      <div className="relative z-10 mx-auto max-w-2xl bg-gradient-to-br from-[#fef8ff] to-[#f7fbff] border border-gray-200 shadow-xl rounded-3xl p-10 space-y-8">
        <div className="flex flex-col items-center text-center">
          <img
            src={avatar}
            alt="avatar"
            className="w-24 h-24 rounded-full border-4 border-purple-300 shadow"
          />

          <h1 className="mt-4 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-500 to-yellow-400">
            {ensName}
          </h1>

          {ensData.lookingForWork === 'true' && (
            <p className="mt-2 px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
              ✅ Open to Work
            </p>
          )}

          {ensData.twitter && (
            <a
              href={`https://twitter.com/${ensData.twitter.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 text-sm mt-1"
            >
              {ensData.twitter}
            </a>
          )}
        </div>

        <div className="text-sm text-gray-700 text-center">
          {ensData.bio || 'Web3 builder passionate about decentralization ✨'}
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded">
          {ensData.summary || `${ensName} is a recognized contributor in the Ethereum ecosystem. They've participated in top events like ETHGlobal and Gitcoin, and worked on meaningful DAO initiatives.`}
        </div>

        {poaps.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-purple-700 mb-2">POAPs</h2>
            <div className="flex flex-wrap gap-2">
              {poaps.slice(0, 5).map((poap, idx) => (
                <motion.img
                  whileHover={{ scale: 1.1 }}
                  key={idx}
                  src={poap.image_url}
                  alt={poap.event.name}
                  className="w-10 h-10 rounded-full border border-gray-300 shadow-sm"
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-bold text-purple-700 mb-2">Hackathons & Grants</h2>
          <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
            <li>🏆 Winner – ETHGlobal Tokyo 2024</li>
            <li>💸 Grant Recipient – Gitcoin Grants Round 18</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-purple-700 mb-2">DAO Roles & Attestations</h2>
          <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
            <li>🧾 Multisig signer – DeveloperDAO</li>
            <li>🔧 Core contributor – ENS DAO</li>
          </ul>
        </div>

        {nfts.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-purple-700 mb-2">NFTs</h2>
            <div className="grid grid-cols-3 gap-3">
              {nfts.slice(0, 3).map((nft, idx) => (
                <div key={idx} className="flex flex-col items-center text-center text-xs text-gray-600">
                  <img
                    src={nft.image}
                    alt={nft.name}
                    className="rounded-xl w-20 h-20 border border-gray-200 shadow-sm"
                  />
                  <p className="mt-1 font-semibold">{nft.name?.slice(0, 20) || 'NFT'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
