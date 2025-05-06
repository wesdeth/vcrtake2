// components/ClipboardCopyButton.js
import { useState } from 'react';
import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export function ClipboardCopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Address copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
      console.error('Clipboard copy failed:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 text-gray-400 hover:text-black transition"
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      <Copy size={14} />
    </button>
  );
}
