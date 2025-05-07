// pages/messages.js
import Head from 'next/head';

export default function Messages() {
  return (
    <>
      <Head>
        <title>Messages - Verified Chain Resume</title>
      </Head>
      <div className="min-h-screen pt-20 px-4 bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white font-calsans">
        <div className="max-w-2xl mx-auto text-center mt-20">
          <h1 className="text-3xl font-bold mb-4">Messages</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Onchain messaging powered by XMTP
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow">
            <p className="text-gray-500 dark:text-gray-400">No messages yet. Start a conversation from someone’s profile.</p>
          </div>
        </div>
      </div>
    </>
  );
}
