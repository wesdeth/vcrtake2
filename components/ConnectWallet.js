// ConnectWallet.js (wagmi only)
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';

export default function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();

  return (
    <div className="mb-4">
      {isConnected ? (
        <button onClick={() => disconnect()} className="px-4 py-2 bg-gray-800 text-white rounded">
          Disconnect ({address.slice(0, 6)}...{address.slice(-4)})
        </button>
      ) : (
        <button onClick={() => connect()} className="px-4 py-2 bg-blue-600 text-white rounded">
          Connect Wallet
        </button>
      )}
    </div>
  );
}
