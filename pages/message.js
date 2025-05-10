// pages/messages.js

import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { ethers } from 'ethers' // v5 style
import { Client } from '@xmtp/xmtp-js' // core XMTP library

export default function MessagesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // The address or ENS we want to chat with
  const [recipient, setRecipient] = useState('')
  // XMTP client instance
  const [xmtp, setXmtp] = useState(null)
  // Active conversation
  const [conversation, setConversation] = useState(null)
  // Array of messages
  const [messages, setMessages] = useState([])
  // Our typed message
  const [inputText, setInputText] = useState('')

  /**
   * On mount, parse “?to=addressOrEns” from query
   */
  useEffect(() => {
    if (router.query.to) {
      setRecipient(router.query.to)
    }
  }, [router.query.to])

  /**
   * On mount or if user interacts, attempt to connect wallet & create XMTP client
   * No wagmi "useSigner" is used; we do a direct ethers v5 approach in the browser.
   */
  useEffect(() => {
    const initXmtp = async () => {
      if (typeof window === 'undefined') return // SSR guard
      if (!window.ethereum) {
        console.warn('No injected wallet found.')
        return
      }
      try {
        setLoading(true)
        // Create an ethers v5 provider + signer
        const provider = new ethers.providers.Web3Provider(window.ethereum) // v5 style
        await provider.send('eth_requestAccounts', [])
        const signer = provider.getSigner()

        // Create XMTP client
        const xmtpClient = await Client.create(signer, {
          // optional configuration
        })
        setXmtp(xmtpClient)
      } catch (err) {
        console.error('XMTP init error:', err)
      } finally {
        setLoading(false)
      }
    }
    initXmtp()
  }, [])

  /**
   * Whenever xmtp + recipient are ready, load or create conversation
   */
  useEffect(() => {
    const loadConversation = async () => {
      if (!xmtp || !recipient) return
      try {
        setLoading(true)
        // Create/fetch the conversation
        const convo = await xmtp.conversations.newConversation(recipient)
        setConversation(convo)

        // Load existing messages
        const msgs = await convo.messages()
        setMessages(msgs)

        // Optionally: stream new messages in real-time
        convo.streamMessages().then(async (stream) => {
          for await (const msg of stream) {
            setMessages((prev) => [...prev, msg])
          }
        })
      } catch (err) {
        console.error('loadConversation error:', err)
      } finally {
        setLoading(false)
      }
    }
    loadConversation()
  }, [xmtp, recipient])

  /**
   * Handle sending new message
   */
  const handleSend = async () => {
    if (!conversation || !inputText.trim()) return
    try {
      setLoading(true)
      await conversation.send(inputText.trim())
      setInputText('')
    } catch (err) {
      console.error('Send message error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Messages - Verified Chain Resume</title>
      </Head>

      <div className="min-h-screen pt-20 px-4 bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-white">
        <div className="max-w-2xl mx-auto mt-10">
          <h1 className="text-3xl font-bold mb-4 text-center">On‑chain Messages</h1>

          {loading && <p className="text-center text-sm text-gray-500 mb-2">Loading…</p>}

          {/* If no XMTP or no conversation */}
          {!xmtp ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-md text-center">
              <p className="text-gray-500 dark:text-gray-400">Connect wallet to initiate XMTP chat.</p>
            </div>
          ) : (
            <>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-md mb-6">
                <p className="text-sm text-gray-500 dark:text-gray-400">Recipient:</p>
                <p className="text-md font-medium text-gray-800 dark:text-white break-words">
                  {recipient || 'No recipient specified'}
                </p>
              </div>

              {/* Messages list */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-md mb-4 h-64 overflow-auto">
                {messages.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No messages yet.</p>
                ) : (
                  messages.map((msg, idx) => {
                    const fromMe = msg.senderAddress === xmtp.address
                    return (
                      <div
                        key={idx}
                        className={`mb-2 flex ${
                          fromMe ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`px-3 py-2 rounded-lg ${
                            fromMe
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Input to send new message */}
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 placeholder-gray-400 text-sm"
                  placeholder="Type a message…"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={!conversation}
                />
                <button
                  onClick={handleSend}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={!conversation || !inputText.trim()}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
