// pages/jobs.js
import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch('https://remoteok.com/api'); // Example API
        if (!res.ok) throw new Error('Failed to fetch jobs');
        const data = await res.json();
        const filtered = data.filter((job) => job.position);
        setJobs(filtered);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return (
    <>
      <Head>
        <title>Jobs | Verified Chain Resume</title>
      </Head>
      <div className="min-h-screen pt-20 px-6 py-10 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white font-calsans">
        <h1 className="text-3xl font-bold mb-6 text-center">🌐 Web3 Job Board</h1>

        {loading && <p className="text-center">Loading jobs...</p>}
        {error && <p className="text-center text-red-500">Error: {error}</p>}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <a
              key={job.id}
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition border border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-lg font-semibold mb-1">{job.position}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{job.company}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {job.location || 'Remote'} — {job.tags?.join(', ')}
              </p>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
