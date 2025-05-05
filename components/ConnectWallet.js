// components/ConnectWallet.js
import { useConnect, useDisconnect, useAccount } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';

export default function ConnectWallet() {
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();
  const { isConnected, address } = useAccount();

  return (
    <div className="mb-4">
      {isConnected ? (
        <button
          onClick={() => disconnect()}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
        >
          Disconnect
        </button>
      ) : (
        <button
          onClick={() => connect()}
          className="bg-white border px-4 py-2 rounded shadow hover:bg-gray-100"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}
