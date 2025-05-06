// components/WorkExperienceDisplay.js
export default function WorkExperienceDisplay({ experience = '', title = '', company = '', startDate = '', location = '', logo = '' }) {
  if (!title && !company && !startDate && !location && !experience) return null;

  return (
    <section className="mt-8 px-6 py-5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow max-w-3xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Work Experience</h3>

      <div className="flex items-start gap-4">
        {logo && (
          <img
            src={logo}
            alt="Company Logo"
            className="w-14 h-14 rounded-md border border-gray-300 object-cover"
          />
        )}

        <div className="flex flex-col">
          <h4 className="text-lg font-bold text-gray-800 leading-tight">{title}</h4>
          <span className="text-sm text-gray-700 font-medium">{company}</span>
          <div className="text-sm text-gray-500">
            <span>{startDate}</span>
            {startDate && location && <span className="mx-2">•</span>}
            <span>{location}</span>
          </div>
        </div>
      </div>

      {experience && (
        <div className="mt-4 border-l-4 border-blue-200 pl-4 text-sm text-gray-700 whitespace-pre-line">
          {experience}
        </div>
      )}

      <p className="mt-4 text-xs text-gray-500 italic">Connect your wallet to edit this section.</p>
    </section>
  );
}
