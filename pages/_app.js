// pages/_app.js
import '../styles/globals.css';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { Web3Modal } from '@web3modal/react';
import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum';
import { Toaster } from 'react-hot-toast';

const projectId = 'YOUR_WALLETCONNECT_PROJECT_ID'; // get it from https://cloud.walletconnect.com

const chains = [mainnet];
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: w3mConnectors({ chains, projectId }),
  publicClient: configureChains(chains, [w3mProvider({ projectId }), publicProvider()]).publicClient
});

const ethereumClient = new EthereumClient(wagmiConfig, chains);

export default function App({ Component, pageProps }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <Component {...pageProps} />
      <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
      <Toaster position="top-right" />
    </WagmiConfig>
  );
}
