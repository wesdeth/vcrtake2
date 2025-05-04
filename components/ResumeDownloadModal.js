// components/ResumeDownloadModal.js
import { useRef } from 'react';
import { X } from 'lucide-react';
import QRCode from 'qrcode.react';
import html2pdf from 'html2pdf.js';

export default function ResumeDownloadModal({ ensName, bio, avatar, experience, poaps = [], nfts = [], onClose, twitterHandle }) {
  const modalRef = useRef(null);

  const handleDownload = () => {
    if (!modalRef.current) return;
    html2pdf(modalRef.current, {
      margin: 0.5,
      filename: `${ensName || 'resume'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    });
  };

  const address = nfts?.[0]?.owner?.address || '0x0';
  const efpLink = `https://efp.app/${address}?search=${ensName}&ssr=false`;
  const xHandle = twitterHandle || ensName?.replace('.eth', '') || '';
  const twitterLink = `https://x.com/${xHandle}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 text-center" ref={modalRef}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black">
          <X size={24} />
        </button>

        <img
          src={avatar || '/Avatar.jpg'}
          alt="avatar"
          className="w-24 h-24 rounded-full mx-auto border-4 border-purple-500 shadow-md"
        />

        <h1 className="text-3xl font-bold text-purple-700 mt-4">{ensName}</h1>
        <p className="text-gray-700 mt-2 text-sm max-w-xl mx-auto">{bio}</p>

        <div className="mt-6 text-left">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Work Experience</h2>
          <p className="text-sm text-gray-700 whitespace-pre-line">
            {experience || 'No experience listed.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-6 items-center">
          <div>
            <QRCode value={twitterLink} size={80} />
            <p className="text-xs mt-2">X/Twitter Profile</p>
            <a href={twitterLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs break-all">
              {twitterLink}
            </a>
          </div>

          <div>
            <QRCode value={efpLink} size={80} />
            <p className="text-xs mt-2">EFP Profile</p>
            <a href={efpLink} target="_blank" rel="noopener noreferrer" className="text-green-600 text-xs break-all">
              {efpLink}
            </a>
          </div>
        </div>

        <p className="text-xs text-gray-500 italic mt-6">
          Resume powered by ENS, POAP, EFP, and verified onchain identity.
        </p>

        <button
          onClick={handleDownload}
          className="mt-6 bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition-all"
        >
          🖨️ Print to PDF
        </button>
      </div>
    </div>
  );
}
