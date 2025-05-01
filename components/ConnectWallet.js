import { useEffect, useState } from 'react';

export default function ConnectWallet({ onConnect }) {
  const [account, setAccount] = useState(null);

  // ✅ Handle auto-connection after page reload
  useEffect(() => {
    async function checkConnection() {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          onConnect(accounts[0]); // ✅ ensure ensProfile gets connected wallet
        }
      }
    }
    checkConnection();
  }, [onConnect]);

  const connect = async () => {
    if (typeof window.ethereum !== 'undefined') {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      onConnect(accounts[0]);
    }
  };

  return (
    <div className="mb-4">
      {account ? (
        <p className="text-green-600 font-semibold">
          Connected: {account.slice(0, 6)}...{account.slice(-4)}
        </p>
      ) : (
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          onClick={connect}
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
}
