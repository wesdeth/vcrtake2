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

const { chains, publicClient } = configureChains([mainnet], [publicProvider()]);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [new InjectedConnector({ chains })],
  publicClient,
});

const queryClient = new QueryClient();

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
            <Navbar />
            <main className="pt-20 px-4">
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
