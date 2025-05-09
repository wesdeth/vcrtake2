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
        // Example: fetch 50 remote jobs from US,
        // or you can omit &remote=true&country=united-states if you want all.
        // e.g. "https://web3.career/api/v1?token=YOUR_TOKEN_HERE&limit=50&remote=true"
        const response = await fetch(
          'https://web3.career/api/v1?token=uMZCW1SZwZt3kyGd6G9RS8UPVv6dEP3q'
        );
        if (!response.ok) {
          throw new Error('Failed to fetch jobs from web3.career');
        }

        // The data is an array, with the 3rd element (index 2) being the jobs
        const data = await response.json();
        const jobsArray = data[2]; // Grab the actual job listings

        setJobs(jobsArray);
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
              href={job.apply_url} 
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition border border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-lg font-semibold mb-1">
                {job.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {job.company}
              </p>

              {/* For location, web3.career uses 'country' or 'city' fields */}
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
