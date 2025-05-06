// components/POAPDisplay.js
export default function POAPDisplay({ poaps = [] }) {
  if (!poaps.length) return null;

  const displayedPoaps = poaps.slice(0, 5);

  return (
    <div className="mt-8">
      <h2 className="text-center text-lg font-semibold text-gray-800 mb-4">Recent POAPs</h2>
      <div className="overflow-x-auto">
        <div className="flex gap-4 px-2 pb-2">
          {displayedPoaps.map((poap) => (
            <div
              key={poap.id}
              className="flex-shrink-0 bg-white rounded-2xl shadow-md border border-gray-200 p-3 w-28 h-36 flex flex-col items-center justify-between text-center transition-transform hover:scale-105 hover:shadow-lg"
            >
              <img
                src={poap.image_url}
                alt={poap.name}
                className="w-16 h-16 object-contain rounded-full border border-gray-300"
              />
              <div className="mt-1">
                <p className="text-[10px] font-medium text-gray-700 leading-tight line-clamp-2">
                  {poap.name}
                </p>
                <a
                  href={poap.event_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-600 hover:underline mt-1 block"
                >
                  View ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
