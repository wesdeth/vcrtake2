// components/Navbar.js
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';

export default function Navbar() {
  const { isConnected } = useAccount();
  const router = useRouter();

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Jobs', href: '/jobs' },
    { label: 'Messaging', href: '/messages' },
    { label: 'Profile', href: '/profile' },
  ];

  return (
    <div className="w-full flex justify-center py-6">
      <nav className="flex items-center gap-8 bg-black text-white px-8 py-3 rounded-full border border-gray-700 shadow-lg text-sm font-semibold">
        {navItems.map(({ label, href }) => (
          <Link key={href} href={href}>
            <span
              className={`cursor-pointer hover:text-purple-400 transition ${router.pathname === href ? 'text-purple-400' : ''}`}
            >
              {label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
