// components/WorkExperienceDisplay.js
import { useAccount } from 'wagmi';
import { Eye, Pencil } from 'lucide-react';

export default function WorkExperienceDisplay({
  experience = '',
  title = '',
  company = '',
  startDate = '',
  location = '',
  logo = '',
  showDownload = false,
  ownsProfile = false
}) {
  if (!title && !company && !startDate && !location && !experience) return null;

  return (
    <section className="mt-8 px-6 py-5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Work Experience</h3>
        {showDownload && (
          <a
            href="/resume/download"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            Download Resume ↗
          </a>
        )}
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
          <h4 className="text-md font-semibold text-gray-800">{title}</h4>
          <p className="text-sm text-gray-700">{company}</p>
          <p className="text-sm text-gray-500">{startDate}</p>
          <p className="text-sm text-gray-500">{location}</p>
        </div>
      </div>

      {experience && (
        <p className="mt-4 text-sm text-gray-700 whitespace-pre-line">{experience}</p>
      )}

      {!ownsProfile && (
        <p className="mt-4 text-xs text-gray-500 italic">Connect your wallet to edit this section.</p>
      )}
    </section>
  );
}
