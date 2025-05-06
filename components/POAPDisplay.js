// components/POAPDisplay.js
export default function POAPDisplay({ poaps = [] }) {
  if (!poaps.length) return null;

  const displayedPoaps = poaps.slice(0, 5);

  return (
    <div className="overflow-x-auto">
      <div className="flex space-x-4">
        {displayedPoaps.map((poap) => (
          <div
            key={poap.id}
            className="flex-shrink-0 bg-white rounded-full shadow border p-2 w-24 h-24 flex flex-col items-center justify-center text-center"
          >
            <img
              src={poap.image_url}
              alt={poap.name}
              className="w-16 h-16 object-contain rounded-full mb-1"
            />
            <a
              href={poap.event_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-blue-600 hover:underline"
            >
              View ↗
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
