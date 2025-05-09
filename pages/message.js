// pages/messages.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSigner } from 'wagmi';
import { motion } from 'framer-motion';
// The XMTP JS (core) library:
import { Client as XmtpClient } from '@xmtp/xmtp-js';

export default function Messages() {
  const { data: signer } = useSigner();
  const router = useRouter();
  const [xmtp, setXmtp] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);

  // For an active conversation
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');

  // 1) On mount, if we have a signer => init XMTP client
  useEffect(() => {
    if (!signer) return;
    let isCancelled = false;

    (async () => {
      try {
        setLoading(true);
        // Create XMTP client (this stores ephemeral keys in memory)
        const client = await XmtpClient.create(signer, {
          env: 'production', // or "dev", see xmtp docs
        });
        if (!isCancelled) {
          setXmtp(client);
        }
      } catch (err) {
        console.error('Error creating XMTP client:', err);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [signer]);

  // 2) Once xmtp is ready, load the user’s existing conversations—unless we’re going straight to `router.query.to`
  useEffect(() => {
    if (!xmtp) return;
    let isCancelled = false;

    (async () => {
      try {
        if (router.query.to) {
          // If there's a `to` param, we skip loading all convos & open directly
          await startConversation(router.query.to);
          return;
        }
        // Otherwise, fetch conversation list
        const convos = await xmtp.conversations.list();
        // Sort them by last message time (descending)
        convos.sort((a, b) => (b.createdAt - a.createdAt));
        if (!isCancelled) {
          setConversations(convos);
        }
      } catch (err) {
        console.error('Error listing convos:', err);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [xmtp, router.query.to]);

  // 3) function to start (or load) a conversation with a given address
  const startConversation = async (peerAddress) => {
    try {
      const convo = await xmtp.conversations.newConversation(peerAddress);
      setActiveConvo(convo);
    } catch (err) {
      console.error('Error creating conversation:', err);
    }
  };

  // 4) Once `activeConvo` is set, load the existing messages + stream new ones
  useEffect(() => {
    if (!activeConvo) {
      setMessages([]);
      return;
    }
    let isCancelled = false;
    let stream;

    (async () => {
      try {
        // fetch existing
        const msgs = await activeConvo.messages();
        // sort by sent time
        msgs.sort((a, b) => a.sent - b.sent);
        if (!isCancelled) setMessages(msgs);

        // stream new
        stream = await activeConvo.streamMessages();
        for await (const newMsg of stream) {
          if (isCancelled) break;
          // add to local state
          setMessages((prev) => [...prev, newMsg]);
        }
      } catch (err) {
        console.error('Error loading or streaming msgs:', err);
      }
    })();

    return () => {
      isCancelled = true;
      if (stream) {
        stream.return(); // close the async generator
      }
    };
  }, [activeConvo]);

  // 5) send a message
  const handleSend = async () => {
    if (!activeConvo || !newMsg.trim()) return;
    try {
      await activeConvo.send(newMsg.trim());
      setNewMsg('');
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  // 6) Basic UI
  return (
    <>
      <Head>
        <title>Messages | Verified Chain Resume</title>
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
        <div className="max-w-4xl mx-auto mt-12 mb-16 p-6 sm:p-10 bg-white/80 dark:bg-gray-800/80 
                        border border-gray-200 dark:border-gray-700 
                        shadow-2xl rounded-3xl relative backdrop-blur-sm">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-4">
            On‑chain Inbox
          </h1>
          <p className="text-center text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-8">
            Powered by XMTP — connect your wallet to begin chatting.
          </p>

          {/* Check signer / xmtp */}
          {!signer ? (
            <p className="text-center">Please connect your wallet.</p>
          ) : loading ? (
            <p className="text-center">Setting up XMTP…</p>
          ) : !xmtp ? (
            <p className="text-center">XMTP client not ready.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Left column: conversation list */}
              <div className="sm:col-span-1 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl shadow-inner h-[480px] overflow-auto">
                {!router.query.to && ( // If user isn't auto-redirected
                  <>
                    <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                      My Conversations
                    </h2>
                    {conversations.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        No conversations yet.
                      </p>
                    ) : (
                      conversations.map((convo) => (
                        <div
                          key={convo.peerAddress}
                          onClick={() => {
                            setActiveConvo(convo);
                          }}
                          className="
                            p-2 mb-2 rounded-lg cursor-pointer 
                            hover:bg-gray-200 dark:hover:bg-gray-600 
                            transition-colors
                          "
                        >
                          {convo.peerAddress}
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>

              {/* Right column: active conversation */}
              <div className="sm:col-span-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl shadow-inner h-[480px] flex flex-col">
                {activeConvo ? (
                  <>
                    <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                      Conversation w/ {activeConvo.peerAddress}
                    </h2>
                    <div className="flex-1 overflow-auto bg-white dark:bg-gray-600 p-3 mb-2 rounded-lg">
                      {messages.map((m, i) => (
                        <div key={i} className="mb-1 text-sm">
                          <strong>{shorten(m.senderAddress)}:</strong> {m.content}
                        </div>
                      ))}
                    </div>
                    <div className="flex">
                      <input
                        className="flex-1 border border-gray-300 dark:border-gray-600 rounded-l px-2 text-sm"
                        placeholder="Type a message..."
                        value={newMsg}
                        onChange={(e) => setNewMsg(e.target.value)}
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
                  </>
                ) : (
                  <div className="flex items-center justify-center flex-1">
                    <p className="text-gray-500 dark:text-gray-300 text-sm">
                      Select a conversation, or use <code>?to=0x…</code> to open a new one.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

// Simple helper to shorten addresses
function shorten(addr = '') {
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}
