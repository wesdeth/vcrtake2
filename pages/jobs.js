// pages/jobs.js
import { useEffect, useState } from 'react';
import Head from 'next/head';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // NEW: category filter state, e.g. "react", "solidity", etc.
  const [category, setCategory] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build the URL dynamically
        let url = 'https://web3.career/api/v1?token=YOUR_TOKEN_HERE';
        
        // If category is chosen, append &tag=category
        if (category.trim() !== '') {
          url += `&tag=${encodeURIComponent(category)}`;
        }

        // Optionally add remote or limit:
        // url += '&remote=true&limit=50';

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch jobs from web3.career');
        }

        const data = await response.json();
        // data[2] is the actual job array
        const jobsArray = data[2];

        setJobs(jobsArray);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [category]); // re-fetch whenever category changes

  return (
    <>
      <Head>
        <title>Jobs | Verified Chain Resume</title>
      </Head>

      <div className="min-h-screen pt-20 px-6 py-10 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white font-calsans">
        <h1 className="text-3xl font-bold mb-6 text-center">🌐 Web3 Job Board</h1>

        {/** Category filter input */}
        <div className="mb-6 flex justify-center items-center gap-2">
          <label className="text-sm text-gray-700 dark:text-gray-300">
            Category / Tag:
          </label>
          <input
            type="text"
            placeholder="e.g. solidity, react..."
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>

        {loading && <p className="text-center">Loading jobs...</p>}
        {error && <p className="text-center text-red-500">Error: {error}</p>}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <a
              key={job.id}
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition border border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-lg font-semibold mb-1">{job.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {job.company}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {job.country || 'Remote'} — {(job.tags || []).join(', ')}
              </p>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
