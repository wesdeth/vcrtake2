// pages/_app.js
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { WagmiConfig, configureChains, createConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useEffect, useState } from 'react';
import { Moon } from 'lucide-react';

// 1) Wagmi config
const { chains, publicClient } = configureChains([mainnet], [publicProvider()]);
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [new InjectedConnector({ chains })],
  publicClient,
});

// 2) React Query
const queryClient = new QueryClient();

/* ------------------------------------------------------------------
   WalletConnectButton
   Shows “Connect Wallet” or “Disconnect” with optional ENS name/avatar
------------------------------------------------------------------*/
function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({ connector: new InjectedConnector() });
  const { disconnect } = useDisconnect();
  const [ensName, setEnsName] = useState('');
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    const resolveENS = async () => {
      if (!address) return;
      try {
        const res = await fetch(`/api/reverse-ens?address=${address}`);
        const data = await res.json();
        if (data.ensName) setEnsName(data.ensName);
        if (data.avatar) setAvatar(data.avatar);
      } catch (err) {
        console.error('Failed to resolve ENS name:', err);
      }
    };
    if (isConnected && address) resolveENS();
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <button
        onClick={() => connect()}
        className="text-sm bg-[#635BFF] text-white px-5 py-2 rounded-full shadow hover:bg-[#5146cc] transition font-semibold"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-gray-100 text-gray-900 px-4 py-2 rounded-full shadow">
      {avatar && (
        <img
          src={avatar}
          alt="avatar"
          className="w-6 h-6 rounded-full object-cover"
        />
      )}
      <span className="text-sm font-medium">
        {ensName || `${address.slice(0, 6)}…${address.slice(-4)}`}
      </span>
      <button
        onClick={() => disconnect()}
        className="text-gray-500 hover:text-red-400 text-xs ml-2"
      >
        Disconnect
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------
   DarkModeToggle
   Toggles “dark” class on <html> element
------------------------------------------------------------------*/
function DarkModeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="flex items-center gap-2 bg-[#635BFF] text-white px-5 py-2 rounded-full shadow hover:bg-[#5146cc] transition text-sm font-semibold"
    >
      <Moon size={16} />
      {dark ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}

/* ------------------------------------------------------------------
   Main App
   Renders a top Navbar, dark mode + wallet connect, and a Toaster
------------------------------------------------------------------*/
export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cal+Sans:wght@600&display=swap"
          rel="stylesheet"
        />
      </Head>

      <WagmiConfig config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen bg-gradient-to-br from-[#F9FAFB] via-[#F9FAFB] to-[#74E0FF] text-[#1F2937] font-calsans">
            {/* Top bar with Navbar, DarkMode, and Wallet */}
            <div className="flex items-center justify-between px-8 py-6 sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-[#E5E7EB] shadow-md">
              <Navbar />
              <div className="flex items-center gap-4">
                <DarkModeToggle />
                <WalletConnectButton />
              </div>
            </div>

            {/* Page content */}
            <main className="pt-10 px-4">
              <Component {...pageProps} />
            </main>

            {/* Toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#fff',
                  color: '#1a1a1a',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  padding: '16px',
                },
                success: {
                  iconTheme: {
                    primary: '#4ade80',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#f87171',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </QueryClientProvider>
      </WagmiConfig>
    </>
  );
}
