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
    <div className="w-full py-4 flex justify-center">
      <nav className="flex items-center justify-center gap-8 bg-[#635BFF] text-white px-8 py-3 rounded-full border border-[#E5E7EB] shadow-lg text-sm font-semibold">
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
    </div>
  );
}
