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
    <div className="relative w-full py-6 flex items-center justify-between px-6">
      {/* Placeholder for logo or left-aligned space */}
      <div className="w-32" />

      {/* Centered navigation */}
      <nav className="absolute left-1/2 transform -translate-x-1/2 bg-[#635BFF] text-white px-8 py-3 rounded-full border border-[#E5E7EB] shadow-lg flex items-center gap-8 text-sm font-semibold">
        {navItems.map(({ label, href }) => (
          <Link key={href} href={href}>
            <span
              className={`cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-105 hover:text-[#FFC542] ${
                router.pathname === href ? 'text-[#FFC542]' : ''
              }`}
            >
              {label}
            </span>
          </Link>
        ))}
      </nav>

      {/* Right-side controls placeholder (wallet, dark mode, etc.) */}
      <div className="w-32 text-right">
        {/* Add wallet / theme toggle here if needed */}
      </div>
    </div>
  );
}
