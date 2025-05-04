// ResumeDownloadModal.js
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import QRCode from 'qrcode.react';

export default function ResumeDownloadModal({ ensName, avatar, bio, poaps = [], nfts = [], experience, onClose }) {
  const lensLink = `https://lens.xyz/u/${ensName?.replace('.eth', '')}`;
  const efpLink = `https://efp.social/u/${ensName?.replace('.eth', '')}`;

  const printRef = useRef();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const win = window.open('', '', 'height=700,width=900');
      win.document.write('<html><head><title>Resume</title>');
      win.document.write('<style>body{font-family:sans-serif;padding:40px;} img{border-radius:12px;}</style>');
      win.document.write('</head><body>');
      win.document.write(printContents);
      win.document.write('</body></html>');
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 flex justify-center items-center">
      <div className="relative bg-white dark:bg-gray-900 rounded-xl p-8 max-w-3xl w-full mx-4 shadow-2xl border border-purple-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
          <X size={24} />
        </button>

        <div ref={printRef} className="flex flex-col items-center text-center">
          <img src={avatar || '/Avatar.jpg'} alt="avatar" className="w-28 h-28 rounded-full border-4 border-purple-400 shadow-md" />

          <h1 className="text-3xl font-bold mt-4 text-purple-700">{ensName}</h1>

          <p className="mt-2 text-gray-700 dark:text-gray-300 text-base max-w-xl">{bio || 'Web3 builder and contributor'}</p>

          <div className="mt-6 w-full text-left">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Work Experience</h2>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{experience || 'No experience listed.'}</p>
          </div>

          {poaps.length > 0 && (
            <div className="mt-6 w-full text-left">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Recent POAPs</h2>
              <div className="flex flex-wrap gap-2">
                {poaps.slice(0, 5).map((poap, idx) => (
                  <img
                    key={idx}
                    src={poap.image_url}
                    alt={poap.name}
                    title={poap.name}
                    className="w-12 h-12 rounded-full border"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">Lens Profile</p>
              <QRCode value={lensLink} size={80} />
              <a href={lensLink} target="_blank" rel="noopener noreferrer" className="block mt-2 text-blue-600 text-sm underline">{lensLink}</a>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-600 mb-1">EFP Profile</p>
              <QRCode value={efpLink} size={80} />
              <a href={efpLink} target="_blank" rel="noopener noreferrer" className="block mt-2 text-green-600 text-sm underline">{efpLink}</a>
            </div>
          </div>

          <div className="mt-8 text-xs text-gray-400 italic">
            Resume powered by ENS, POAP, EFP, Lens and verified onchain identity.
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={handlePrint}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg shadow hover:bg-purple-700 transition"
          >
            🖨️ Print to PDF
          </button>
        </div>
      </div>
    </div>
  );
}
