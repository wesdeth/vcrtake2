// pages/success.js
import Link from 'next/link';

export default function SuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black text-center px-6">
      <h1 className="text-4xl font-bold text-green-600 mb-4">✅ Subscription Successful!</h1>
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
        You're now subscribed and can download your Verified Web3 Resume.
      </p>
      <Link href="/">
        <a className="text-blue-600 hover:underline">← Return to Home</a>
      </Link>
    </div>
  );
}
