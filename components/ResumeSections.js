// /components/ResumeSections.js
export default function ResumeSections({ data }) {
  const { poaps, gitcoinGrants, daos } = data || {};

  return (
    <div className="space-y-6">
      {poaps && poaps.length > 0 && (
        <section>
          <h3 className="text-lg font-bold mb-2">POAPs</h3>
          <div className="flex flex-wrap gap-3">
            {poaps.map((poap, index) => (
              <a
                key={index}
                href={poap.event_url || poap.event_url_fallback}
                target="_blank"
                rel="noopener noreferrer"
                title={poap.name}
              >
                <img
                  src={poap.image_url || '/default-poap.png'}
                  alt={poap.name || 'POAP'}
                  className="w-14 h-14 rounded-full border shadow hover:scale-110 transition duration-200"
                />
              </a>
            ))}
          </div>
        </section>
      )}

      {gitcoinGrants && gitcoinGrants.length > 0 && (
        <section>
          <h3 className="text-lg font-bold mb-2">Gitcoin Grants</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
            {gitcoinGrants.map((grant, index) => (
              <li key={index}>{grant.name || 'Grant'}</li>
            ))}
          </ul>
        </section>
      )}

      {daos && daos.length > 0 && (
        <section>
          <h3 className="text-lg font-bold mb-2">DAOs</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
            {daos.map((dao, index) => (
              <li key={index}>{dao.name || 'DAO Member'}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
