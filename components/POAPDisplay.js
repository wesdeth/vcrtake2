// components/POAPDisplay.js
export default function POAPDisplay({ poaps = [] }) {
  if (!poaps.length) return null;

  const displayedPoaps = poaps.slice(0, 5);

  return (
    <section className="mt-12 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-3xl p-6 shadow-lg max-w-4xl mx-auto">
      <h2 className="text-center text-xl font-semibold text-gray-800 mb-6">Recent POAPs</h2>
      <div className="overflow-x-auto">
        <div className="flex gap-4 px-2 pb-2">
          {displayedPoaps.map((poap) => (
            <div
              key={poap.id}
              className="flex-shrink-0 bg-white rounded-2xl shadow border border-gray-100 p-3 w-28 h-36 flex flex-col items-center justify-between text-center transition-transform hover:scale-105 hover:shadow-md"
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
    </section>
  );
}
