// pages/_app.js
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { publicProvider } from 'wagmi/providers/public';
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
import { Web3Modal } from '@web3modal/react';

// Chains & Providers
const chains = [mainnet];
const projectId = 'YOUR_PROJECT_ID_HERE'; // Get this from https://cloud.walletconnect.com/

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient: configureChains(chains, [w3mProvider({ projectId }), publicProvider()]).publicClient
});

const ethereumClient = new EthereumClient(wagmiConfig, chains);
const queryClient = new QueryClient();

export default function App({ Component, pageProps }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
        <Toaster position="top-right" />
        <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
      </QueryClientProvider>
    </WagmiConfig>
  );
}
