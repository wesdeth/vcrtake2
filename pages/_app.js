// pages/_app.js
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { WagmiConfig, configureChains, createConfig } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Head from 'next/head';

const { chains, publicClient } = configureChains(
  [mainnet],
  [publicProvider()]
);

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({
      chains,
    }),
  ],
  publicClient,
});

const queryClient = new QueryClient();

export default function App({ Component, pageProps }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Head>
          <link
            href="https://fonts.googleapis.com/css2?family=Cal+Sans:wght@600&display=swap"
            rel="stylesheet"
          />
        </Head>
        <Component {...pageProps} />
        <Toaster position="top-right" />
      </QueryClientProvider>
    </WagmiConfig>
  );
}
