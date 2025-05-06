// components/POAPDisplay.js
export default function POAPDisplay({ poaps = [] }) {
  if (!poaps.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {poaps.map((poap) => (
        <div
          key={poap.id}
          className="bg-white rounded-lg shadow border p-3 text-center"
        >
          <img
            src={poap.image_url}
            alt={poap.name}
            className="w-20 h-20 mx-auto object-contain rounded"
          />
          <h3 className="text-sm font-semibold mt-2">{poap.name}</h3>
          <p className="text-xs text-gray-500">{poap.fancy_date}</p>
          {poap.location !== 'Unknown' && (
            <p className="text-xs text-gray-400">{poap.location}</p>
          )}
          <a
            href={poap.event_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-1 text-xs text-blue-600 hover:underline"
          >
            View on POAP Gallery ↗
          </a>
        </div>
      ))}
    </div>
  );
}
