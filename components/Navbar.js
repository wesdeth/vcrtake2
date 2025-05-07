// components/Navbar.js
import Link from 'next/link';
import { useAccount } from 'wagmi';

export default function Navbar() {
  const { isConnected } = useAccount();

  return (
    <nav className="w-full bg-white shadow-sm dark:bg-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center space-x-10 py-4">
          <Link href="/">
            <span className="cursor-pointer hover:text-blue-600 transition">Home</span>
          </Link>
          <Link href="/jobs">
            <span className="cursor-pointer hover:text-blue-600 transition">Jobs</span>
          </Link>
          <Link href="/messages">
            <span className="cursor-pointer hover:text-blue-600 transition">Messaging</span>
          </Link>
          <Link href="/profile">
            <span className="cursor-pointer hover:text-blue-600 transition">Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
