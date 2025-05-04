// pages/_app.js
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import '@rainbow-me/rainbowkit/styles.css';

import {
  WagmiConfig,
  createConfig,
  configureChains
} from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';

import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Chain & provider setup
const { chains, publicClient } = configureChains(
  [mainnet],
  [publicProvider()]
);

// RainbowKit wallet connector setup
const { connectors } = getDefaultWallets({
  appName: 'Lookup.xyz',
  projectId: 'REPLACE_WITH_YOUR_WALLETCONNECT_PROJECT_ID',
  chains
});

// wagmi config
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
});

const queryClient = new QueryClient();

export default function App({ Component, pageProps }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={chains}>
          <Component {...pageProps} />
          <Toaster position="top-right" />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
}
