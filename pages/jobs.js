// pages/jobs.js

import Head from 'next/head';
import { useState } from 'react';

export default function Jobs({ initialJobs, error: serverError }) {
  // Keep the server-fetched data in local state
  const [jobs] = useState(initialJobs || []);
  const [error] = useState(serverError);

  return (
    <>
      <Head>
        <title>Jobs | Verified Chain Resume</title>
      </Head>

      <div className="min-h-screen pt-20 px-6 py-10 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white font-calsans">
        <h1 className="text-3xl font-bold mb-6 text-center">🌐 Web3 Job Board</h1>

        {error && <p className="text-center text-red-500">Error: {error}</p>}
        {!error && (!jobs || jobs.length === 0) && (
          <p className="text-center">No jobs found or still loading…</p>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {jobs.map((job) => (
            <a
              key={job.id}
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition border border-gray-200 dark:border-gray-700"
            >
              <h2 className="text-lg font-semibold mb-1">{job.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{job.company}</p>
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

// Fetch data server-side to avoid CORS issues and hide the token
export async function getServerSideProps() {
  let initialJobs = [];
  let error = null;

  try {
    const token = process.env.WEB3_CAREERS_TOKEN;
    if (!token) {
      throw new Error('Missing WEB3_CAREERS_TOKEN environment variable');
    }

    // Add optional parameters here: &remote=true, &limit=100, &tag=react, etc.
    const url = `https://web3.career/api/v1?token=${token}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`web3.career fetch failed. Status: ${response.status}`);
    }

    // data[2] is the job array
    const data = await response.json();
    initialJobs = data[2] || [];
  } catch (err) {
    console.error('Failed to fetch from web3.career:', err);
    error = err.message || 'Failed to fetch from web3.career';
  }

  return {
    props: {
      initialJobs,
      error
    }
  };
}
