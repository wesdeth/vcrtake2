// /components/ResumeSections.js
export default function ResumeSections({ poaps, gitcoinGrants, daos }) {
  return (
    <div className="space-y-6">
      {poaps && poaps.length > 0 && (
        <section>
          <h3 className="text-lg font-bold mb-2">POAPs</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-300">
            {poaps.map((poap, index) => (
              <li key={index}>{poap.event?.name || 'POAP'}</li>
            ))}
          </ul>
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
