// components/WorkExperienceDisplay.js
import { useAccount } from 'wagmi';
import { Pencil, Save } from 'lucide-react';
import { useState } from 'react';

export default function WorkExperienceDisplay({
  experience = '',
  title = '',
  company = '',
  startDate = '',
  location = '',
  logo = '',
  showDownload = false,
  ownsProfile = false,
  onSave = () => {}
}) {
  const [editing, setEditing] = useState(false);
  const [localExp, setLocalExp] = useState(experience);

  const handleSave = () => {
    onSave(localExp);
    setEditing(false);
  };

  if (!title && !company && !startDate && !location && !experience && !editing) return null;

  return (
    <section className="mt-8 px-6 py-5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Work Experience</h3>
        <div className="flex items-center gap-3">
          {showDownload && (
            <a
              href="/resume/download"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#635BFF] hover:underline"
            >
              Download Resume ↗
            </a>
          )}
          {ownsProfile && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-[#635BFF] flex items-center gap-1 hover:underline"
            >
              <Pencil size={14} /> Edit
            </button>
          )}
        </div>
      </div>

      <div className="flex items-start gap-4">
        {logo && (
          <img
            src={logo}
            alt="Company Logo"
            className="w-14 h-14 rounded-lg border border-gray-300 object-contain"
          />
        )}

        <div>
          {title && <h4 className="text-md font-semibold text-gray-800">{title}</h4>}
          {company && <p className="text-sm text-gray-700">{company}</p>}
          {startDate && <p className="text-sm text-gray-500">{startDate}</p>}
          {location && <p className="text-sm text-gray-500">{location}</p>}
        </div>
      </div>

      {editing ? (
        <div className="mt-4">
          <textarea
            rows={4}
            value={localExp}
            onChange={(e) => setLocalExp(e.target.value)}
            className="w-full px-3 py-2 text-sm text-gray-800 border border-gray-300 rounded-md shadow-inner focus:ring-2 focus:ring-[#A259FF] focus:outline-none"
          />
          <button
            onClick={handleSave}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[#635BFF] text-white rounded-full hover:bg-[#5146cc] transition"
          >
            <Save size={16} /> Save
          </button>
        </div>
      ) : (
        experience && (
          <p className="mt-4 text-sm text-gray-700 whitespace-pre-line">{experience}</p>
        )
      )}

      {!ownsProfile && !editing && (
        <p className="mt-4 text-xs text-gray-500 italic">
          Connect your wallet to edit this section.
        </p>
      )}
    </section>
  );
}
