// pages/cancel.js
import Link from 'next/link';

export default function CancelPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black text-center px-6">
      <h1 className="text-4xl font-bold text-red-600 mb-4">❌ Payment Canceled</h1>
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
        It looks like you canceled your payment. No worries — you can try again anytime.
      </p>
      <Link href="/">
        <a className="text-blue-600 hover:underline">← Return to Home</a>
      </Link>
    </div>
  );
}
