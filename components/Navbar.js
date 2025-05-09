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
    <header
      className="
        sticky top-0 z-50 
        w-full 
        bg-white/50 
        dark:bg-gray-900/30 
        backdrop-blur-sm 
        shadow-sm
      "
    >
      <div className="max-w-7xl mx-auto py-4 px-4">
        {/* Center the nav with a “pill” shape */}
        <nav
          className="
            mx-auto 
            flex items-center justify-center 
            gap-8
            px-6 py-2 
            rounded-full 
            border border-gray-200 dark:border-gray-700 
            bg-white dark:bg-gray-800 
            text-gray-700 dark:text-gray-300
            font-semibold 
            shadow-md
          "
        >
          {navItems.map(({ label, href }) => {
            const isActive = router.pathname === href;
            return (
              <Link key={href} href={href}>
                <span
                  className={`
                    relative 
                    cursor-pointer 
                    px-3 py-1 
                    rounded 
                    transition-all duration-200 
                    hover:scale-105
                    hover:text-indigo-600 dark:hover:text-indigo-400
                    ${
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400 font-bold underline decoration-2'
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
