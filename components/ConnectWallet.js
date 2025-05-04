// components/ConnectWallet.js
import { useWeb3Modal } from '@web3modal/react';
import { useAccount } from 'wagmi';

export default function ConnectWallet() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();

  return (
    <div className="mb-4">
      {isConnected ? (
        <p className="text-green-600 font-semibold">
          Connected: {address.slice(0, 6)}...{address.slice(-4)}
        </p>
      ) : (
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          onClick={() => open()}
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}
