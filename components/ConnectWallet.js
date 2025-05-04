// components/ConnectWallet.js
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function ConnectWallet() {
  return (
    <div className="mb-4">
      <ConnectButton
        accountStatus="address"
        showBalance={false}
        chainStatus="icon"
      />
    </div>
  );
}
