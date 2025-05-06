// components/POAPDisplay.js
export default function POAPDisplay({ poaps = [] }) {
  if (!poaps.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {poaps.map((poap) => (
        <div
          key={poap.id}
          className="bg-white rounded-xl shadow-md border p-4 hover:shadow-lg transition-all"
        >
          <img
            src={poap.image_url}
            alt={poap.name}
            className="w-full h-48 object-contain rounded"
          />
          <div className="mt-3">
            <h3 className="text-lg font-semibold">{poap.name}</h3>
            <p className="text-sm text-gray-600">{poap.fancy_date}</p>
            {poap.location !== 'Unknown' && (
              <p className="text-sm text-gray-500">{poap.location}</p>
            )}
            {poap.description && (
              <p className="text-sm text-gray-700 mt-2 line-clamp-3">{poap.description}</p>
            )}
            <a
              href={poap.event_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-2 text-sm text-blue-600 hover:underline"
            >
              View on POAP Gallery ↗
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
