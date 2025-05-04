// ResumeDownloadModal.js
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';

export default function ResumeDownloadModal({ ensName, poaps = [], nfts = [], bio = '', avatar = '', experience = '', twitterHandle = '', onClose }) {
  const modalRef = useRef(null);

  useEffect(() => {
    async function generatePDF() {
      if (typeof window !== 'undefined') {
        const html2pdf = (await import('html2pdf.js')).default;

        const element = modalRef.current;
        const opt = {
          margin:       0.3,
          filename:     `${ensName || 'resume'}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2 },
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
      }
    }
    generatePDF();
  }, []);

  const efpLink = `https://efp.app/${ensName}?search=${ensName}&ssr=false`;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative" ref={modalRef}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>
        <div className="text-center">
          <img src={avatar} alt="Avatar" className="mx-auto w-20 h-20 rounded-full mb-4" />
          <h2 className="text-xl font-bold text-purple-700">{ensName}</h2>
          <p className="text-sm text-gray-600 mb-4">{bio}</p>
        </div>

        <h3 className="font-semibold text-gray-800 mb-1">Work Experience</h3>
        <p className="text-sm text-gray-700 mb-4">{experience || 'No experience listed.'}</p>

        <div className="text-sm text-gray-600 mb-4">
          {twitterHandle && (
            <span className="inline-block mr-2">
              <a
                href={`https://x.com/${twitterHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                @{twitterHandle}
              </a>
            </span>
          )}
          <span className="inline-block">
            <a
              href={efpLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline"
            >
              ↗ EFP Profile
            </a>
          </span>
        </div>

        <h4 className="font-semibold text-gray-800 mt-4 mb-1">POAPs</h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {poaps.length > 0 ? (
            poaps.slice(0, 5).map((poap, idx) => (
              <img
                key={idx}
                src={poap.image_url}
                alt={poap.name || 'POAP'}
                title={poap.name}
                className="w-10 h-10 rounded-full border"
              />
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">No POAPs found.</p>
          )}
        </div>

        <h4 className="font-semibold text-gray-800 mt-4 mb-1">NFTs</h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {nfts.length > 0 ? (
            nfts.slice(0, 5).map((nft, idx) => (
              <img
                key={idx}
                src={nft.media?.[0]?.gateway || '/placeholder.png'}
                alt={nft.title || 'NFT'}
                title={nft.title}
                className="w-10 h-10 rounded border"
              />
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">No NFTs found.</p>
          )}
        </div>

        <p className="text-xs text-center text-gray-500 mt-6 italic">
          Resume powered by ENS, POAPs, NFTs and verified onchain identity.
        </p>
      </div>
    </div>,
    document.body
  );
}
