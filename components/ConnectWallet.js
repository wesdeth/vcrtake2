// ConnectWallet.js (Final version with RainbowKit)
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function ConnectWallet() {
  return (
    <div className="mb-4">
      <ConnectButton 
        showBalance={false} 
        accountStatus="address"
        chainStatus="icon"
      />
    </div>
  );
}
