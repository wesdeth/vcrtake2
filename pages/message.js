// pages/messages.js

import { useState } from 'react';
import Head from 'next/head';
import { useSigner } from 'wagmi';
import { motion } from 'framer-motion';

// XMTP React SDK
import { XmtpProvider, Inbox, Conversation } from '@xmtp/react-sdk';

export default function Messages() {
  const { data: signer } = useSigner();
  const [selectedConvo, setSelectedConvo] = useState(null);

  return (
    <>
      <Head>
        <title>Messages | Verified Chain Resume</title>
      </Head>

      {/* Main container, styled for VCR's gradient background */}
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

          {/* If no signer => prompt user to connect wallet */}
          {!signer ? (
            <p className="text-center text-gray-500">
              Please connect your wallet to load your inbox.
            </p>
          ) : (
            /* XMTP context providing the inbox + conversation */
            <XmtpProvider signer={signer}>
              <div className="flex flex-col sm:flex-row gap-8">
                {/* Left column: Inbox (list of conversations) */}
                <div className="sm:w-1/3 bg-gray-50 dark:bg-gray-700 
                                rounded-xl shadow-inner 
                                p-4 sm:p-6 h-[480px] overflow-auto">
                  <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                    My Conversations
                  </h2>
                  <Inbox
                    onConversationSelected={(convo) => setSelectedConvo(convo)}
                    // You can pass additional props to style the list
                    className="h-full"
                  />
                </div>

                {/* Right column: Selected conversation */}
                <div className="sm:w-2/3 bg-gray-50 dark:bg-gray-700 
                                rounded-xl shadow-inner 
                                p-4 sm:p-6 h-[480px] flex flex-col">
                  {selectedConvo ? (
                    <>
                      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                        Conversation
                      </h2>
                      <Conversation
                        conversation={selectedConvo}
                        // Let conversation fill available space
                        className="flex-1 overflow-auto"
                      />
                    </>
                  ) : (
                    <div className="flex items-center justify-center flex-1">
                      <p className="text-gray-500 dark:text-gray-300 text-sm">
                        Select a conversation to view messages…
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </XmtpProvider>
          )}
        </div>
      </motion.div>
    </>
  );
}
