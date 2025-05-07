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

  return (
    <div className="ml-auto">
      {!isConnected ? (
        <button
          onClick={() => connect()}
          className="text-sm bg-white/90 backdrop-blur border border-gray-300 px-4 py-2 rounded-full shadow-md hover:bg-white hover:border-gray-400 transition-all"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="flex items-center gap-2 bg-white/90 border border-gray-300 px-3 py-2 rounded-full shadow-md">
          <span className="text-sm font-medium text-gray-800">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
          <button onClick={() => disconnect()} className="text-gray-500 hover:text-red-500">
            Disconnect
          </button>
        </div>
      )}
    </div>
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
          <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-calsans">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50 bg-white dark:bg-gray-900">
              <Navbar />
              <WalletConnectButton />
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
