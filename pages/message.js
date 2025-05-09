// pages/messages.js
import { useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { useSigner } from 'wagmi';

// XMTP React SDK v2
import {
  XmtpProvider,
  useXmtp,
  useConversations,
  useMessages
} from '@xmtp/react-sdk';

/**
 * Main Messages page:
 *  - If wallet is not connected => prompt to connect
 *  - If connected => wrap in <XmtpProvider> & show InboxLayout
 */
export default function Messages() {
  const { data: signer } = useSigner();

  return (
    <>
      <Head>
        <title>Messages - Verified Chain Resume</title>
      </Head>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="
          min-h-screen 
          pt-20 
          px-4 
          bg-gradient-to-br from-white via-gray-50 to-white 
          dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 
          text-gray-900 dark:text-white 
          font-calsans
        "
      >
        <div className="max-w-5xl mx-auto mt-12 mb-16 p-6 sm:p-10 bg-white/80 dark:bg-gray-800/80 
                        border border-gray-200 dark:border-gray-700 
                        shadow-2xl rounded-3xl relative backdrop-blur-sm">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-4">
            On‑chain Inbox
          </h1>
          <p className="text-center text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-8">
            Powered by XMTP — connect your wallet to begin chatting.
          </p>

          {!signer ? (
            <p className="text-center text-gray-500">
              Please connect your wallet to load your inbox.
            </p>
          ) : (
            <XmtpProvider signer={signer}>
              <InboxLayout />
            </XmtpProvider>
          )}
        </div>
      </motion.div>
    </>
  );
}

/**
 * InboxLayout: 
 * - Show the list of conversations using `useConversations()`.
 * - On click, store the chosen conversation in local state to show in ConversationView.
 */
function InboxLayout() {
  const { client } = useXmtp(); // provides the XMTP client once connected
  const { conversations, loading: convosLoading } = useConversations();
  const [selected, setSelected] = useState(null);

  if (!client) return <p className="text-center">Initializing XMTP client...</p>;
  if (convosLoading) return <p className="text-center">Loading conversations…</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {/* Left: conversation list */}
      <div className="sm:col-span-1 bg-gray-50 dark:bg-gray-700 p-4 rounded-xl h-[480px] overflow-y-auto shadow-inner">
        <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
          My Conversations
        </h2>
        {conversations.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-300">
            No conversations yet.
          </p>
        )}
        {conversations.map((c) => (
          <div
            key={c.topic}
            onClick={() => setSelected(c)}
            className="
              p-2 mb-2 rounded-lg cursor-pointer 
              hover:bg-gray-200 dark:hover:bg-gray-600 
              transition-colors
            "
          >
            {c.peerAddress}
          </div>
        ))}
      </div>

      {/* Right: selected conversation */}
      <div className="sm:col-span-2 bg-gray-50 dark:bg-gray-700 p-4 rounded-xl h-[480px] flex flex-col shadow-inner">
        {selected ? (
          <ConversationView convo={selected} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-300 text-sm">
              Select a conversation to view messages…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ConversationView: 
 *  - uses `useMessages(convo)` to get existing messages & `sendMessage`.
 */
function ConversationView({ convo }) {
  const { messages, loading: msgsLoading, sendMessage } = useMessages(convo);
  const [text, setText] = useState('');

  const handleSend = async () => {
    if (!text.trim()) return;
    await sendMessage(text);
    setText('');
  };

  if (msgsLoading) {
    return <p className="text-gray-500 dark:text-gray-300">Loading messages…</p>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-auto bg-white dark:bg-gray-600 p-3 rounded-lg">
        {messages.map((m, i) => (
          <div key={i} className="mb-2 text-sm">
            <strong>{m.senderAddress}:</strong> {m.content}
          </div>
        ))}
      </div>
      {/* Composer */}
      <div className="mt-3 flex">
        <input
          className="flex-1 border border-gray-300 dark:border-gray-600 rounded-l px-2 text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
        />
        <button
          onClick={handleSend}
          className="
            bg-indigo-600 hover:bg-indigo-700 
            text-white px-4 py-2 text-sm 
            rounded-r shadow-sm transition-colors
          "
        >
          Send
        </button>
      </div>
    </div>
  );
}
