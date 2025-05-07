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

const { chains, publicClient } = configureChains([mainnet], [publicProvider()]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [new InjectedConnector({ chains })],
  publicClient,
});

const queryClient = new QueryClient();

function WalletConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({ connector: new InjectedConnector() });
  const { disconnect } = useDisconnect();
  const [ensName, setEnsName] = useState('');
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    const resolveENS = async () => {
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

  return (
    <div className="flex items-center gap-4">
      {!isConnected ? (
        <button
          onClick={() => connect()}
          className="text-sm bg-gradient-to-r from-purple-700 via-blue-500 to-yellow-400 text-white px-4 py-2 rounded-full shadow-lg hover:scale-105 transition"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="flex items-center gap-2 bg-gradient-to-r from-purple-700 via-blue-500 to-yellow-400 text-white px-3 py-2 rounded-full shadow-lg">
          {avatar && (
            <img src={avatar} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
          )}
          <span className="text-sm font-medium">
            {ensName || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
          </span>
          <button
            onClick={() => disconnect()}
            className="text-white/80 hover:text-red-300 text-xs ml-2"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

function DarkModeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="flex items-center gap-2 bg-gradient-to-r from-purple-700 via-blue-500 to-yellow-400 text-white px-3 py-2 rounded-full shadow-lg text-sm hover:scale-105 transition"
    >
      <Moon size={16} /> {dark ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}

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
          <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white font-calsans">
            <div className="flex items-center justify-between px-6 py-6 sticky top-0 z-50 backdrop-blur-md bg-gradient-to-br from-[#0f0c29]/80 via-[#302b63]/80 to-[#24243e]/80">
              <Navbar />
              <div className="flex items-center gap-4">
                <DarkModeToggle />
                <WalletConnectButton />
              </div>
            </div>
            <main className="pt-10 px-4">
              <Component {...pageProps} />
            </main>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: '#fff',
                  color: '#1a1a1a',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  padding: '16px'
                },
                success: {
                  iconTheme: {
                    primary: '#4ade80',
                    secondary: '#fff'
                  }
                },
                error: {
                  iconTheme: {
                    primary: '#f87171',
                    secondary: '#fff'
                  }
                }
              }}
            />
          </div>
        </QueryClientProvider>
      </WagmiConfig>
    </>
  );
}
