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
    // Outer container with a vibrant rainbow gradient
    <header className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-400 p-4 shadow-sm">
      {/* Inner wrapper ensures content is centered, with optional max-width for bigger screens */}
      <div className="max-w-7xl mx-auto">
        {/* The "pill" nav bar itself: white background, subtle ring, rounded-full shape */}
        <nav className="flex items-center justify-center gap-6 sm:gap-8 bg-white text-gray-800 px-8 py-3 rounded-full ring-1 ring-white/40 shadow-xl font-semibold">
          {navItems.map(({ label, href }) => {
            const isActive = router.pathname === href;
            return (
              <Link key={href} href={href}>
                <span
                  className={`cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-110 hover:text-purple-600 px-2 sm:px-3
                    ${
                      isActive
                        ? 'text-purple-600 underline decoration-2 underline-offset-4 scale-105'
                        : ''
                    }
                  `}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
