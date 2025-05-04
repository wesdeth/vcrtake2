// pages/cancel.js
import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function CancelPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black text-center px-6">
      <XCircle size={72} className="text-red-500 mb-4" />
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
        Payment canceled
      </h1>
      <p className="text-md text-gray-600 dark:text-gray-300 max-w-md">
        You didn’t finish checking out. No charges were made.
        You can return anytime to unlock your verified resume.
      </p>
      <Link
        href="/"
        className="mt-6 px-6 py-2 text-white font-semibold bg-gray-700 hover:bg-gray-800 rounded-full transition"
      >
        Return to Profile
      </Link>
    </div>
  );
}
