// components/ConnectWallet.js
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
        <button
          onClick={disconnect}
          className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 transition"
        >
          Disconnect ({address.slice(0, 6)}...{address.slice(-4)})
        </button>
      ) : (
        <button
          onClick={() => connect()}
          className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}
