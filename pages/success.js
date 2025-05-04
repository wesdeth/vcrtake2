// pages/success.js
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black text-center px-6">
      <CheckCircle size={72} className="text-green-500 mb-4" />
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
        You're officially Verified ✅
      </h1>
      <p className="text-md text-gray-600 dark:text-gray-300 max-w-md">
        Your Web3 resume is now unlocked and ready for download. Show the world your onchain achievements.
      </p>
      <Link href="/">
        <a className="mt-6 px-6 py-2 text-white font-semibold bg-gradient-to-r from-blue-600 to-purple-500 rounded-full shadow hover:opacity-90 transition">
          Back to Profile
        </a>
      </Link>
    </div>
  );
}
