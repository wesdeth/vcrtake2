// pages/messages.js
import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { ethers } from 'ethers' // v5 style
import { Client } from '@xmtp/xmtp-js' // core XMTP library

/**
 * Example "messages" page with a basic LinkedIn-like 2‑column UI:
 * - Left column: user search, conversation list
 * - Right column: active conversation
 * - Compose new message with optional subject & body
 * - "Send an onchain message powered by XMTP" at top
 */

export default function MessagesPage() {
  const router = useRouter()
  
  // X‑states
  const [loading, setLoading] = useState(false)
  const [xmtp, setXmtp] = useState(null)      // XMTP client
  const [allConversations, setAllConversations] = useState([]) // conversation list
  const [activeConvo, setActiveConvo] = useState(null)          // currently viewed conversation
  const [messages, setMessages] = useState([])

  // For searching/compose
  const [searchInput, setSearchInput] = useState('')   // for searching ENS/addresses
  const [recipient, setRecipient] = useState('')       // user chosen from search
  const [subject, setSubject] = useState('')
  const [bodyText, setBodyText] = useState('')

  // If we are streaming or listening for new messages in the active conversation
  const [streaming, setStreaming] = useState(false)

  // On mount, attempt to connect wallet & create XMTP client
  useEffect(() => {
    (async () => {
      if (typeof window === 'undefined') return
      if (!window.ethereum) {
        console.warn('No injected wallet found for XMTP.')
        return
      }
      try {
        setLoading(true)
        // Create an ethers v5 provider + signer
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        await provider.send('eth_requestAccounts', [])
        const signer = provider.getSigner()

        // Create XMTP client
        const xmtpClient = await Client.create(signer, {
          // optional config
        })
        setXmtp(xmtpClient)

        // Fetch existing conversations
        const convos = await xmtpClient.conversations.list()
        setAllConversations(convos)
      } catch (err) {
        console.error('XMTP init error:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Whenever we pick an existing conversation in left column => load messages
  useEffect(() => {
    if (!activeConvo || !xmtp) return
    ;(async () => {
      setLoading(true)
      try {
        const msgs = await activeConvo.messages()
        setMessages(msgs)

        // Real-time streaming
        if (!streaming) {
          setStreaming(true)
          activeConvo.streamMessages().then(async (stream) => {
            for await (const msg of stream) {
              setMessages((prev) => [...prev, msg])
            }
          })
        }
      } catch (err) {
        console.error('Error loading messages:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [activeConvo, xmtp, streaming])

  /**
   * Handler: user picks an existing conversation from the left side
   */
  const handleSelectConversation = async (c) => {
    setActiveConvo(c)
    setSubject('') // subject might apply only to newly composed messages
    setBodyText('')
  }

  /**
   * Handler: user clicks "Compose" after searching an ENS/wallet => create new conversation
   */
  const handleCompose = async () => {
    if (!xmtp || !searchInput.trim()) return
    try {
      setLoading(true)
      // For a brand-new conversation with searchInput as recipient
      const newConvo = await xmtp.conversations.newConversation(searchInput.trim())
      // Add to allConversations if not already present
      setAllConversations((prev) => {
        const found = prev.find((c) => c.peerAddress === newConvo.peerAddress)
        if (found) return prev
        return [...prev, newConvo]
      })
      // Switch to it
      setActiveConvo(newConvo)
      setSearchInput('')
      setSubject('')
      setBodyText('')
    } catch (err) {
      console.error('Compose new conversation error:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handler: send the typed message to the active conversation
   */
  const handleSend = async () => {
    if (!activeConvo || !bodyText.trim()) return
    try {
      setLoading(true)
      let finalContent = bodyText.trim()
      if (subject.trim()) {
        // Prepend subject in some simple format
        finalContent = `Subject: ${subject.trim()}\n\n${bodyText.trim()}`
      }
      await activeConvo.send(finalContent)
      setBodyText('')
      // subject typically remains (or you might reset it each time)
      setSubject('')
    } catch (err) {
      console.error('Send message error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Messages | Verified Chain Resume</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-800 dark:text-white pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6">
            Send an onchain message powered by XMTP
          </h1>

          {loading && (
            <p className="text-sm text-gray-500 text-center mb-2">Loading…</p>
          )}

          {/* 2-column layout */}
          <div className="flex flex-col sm:flex-row gap-6">
            {/* LEFT COLUMN: conversation list + search/compose */}
            <div className="flex-shrink-0 sm:w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <h2 className="text-md font-semibold mb-3">Conversations</h2>

              {/* Search + Compose */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search ENS or wallet…"
                  className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm mb-2"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <button
                  className="w-full bg-indigo-600 text-white py-2 rounded-md text-sm hover:bg-indigo-700 transition"
                  onClick={handleCompose}
                  disabled={!xmtp || !searchInput.trim()}
                >
                  Compose
                </button>
              </div>

              {/* Conversation list */}
              <div className="h-64 overflow-auto border-t border-gray-200 dark:border-gray-700 pt-3">
                {(!allConversations || allConversations.length === 0) ? (
                  <p className="text-sm text-gray-500">No conversations yet.</p>
                ) : (
                  allConversations.map((c) => {
                    const isActive = activeConvo && (c.peerAddress === activeConvo.peerAddress)
                    return (
                      <div
                        key={c.peerAddress}
                        onClick={() => handleSelectConversation(c)}
                        className={`px-3 py-2 mb-2 rounded-md cursor-pointer text-sm
                          ${isActive ? 'bg-indigo-100 dark:bg-indigo-700/30' : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
                      >
                        {c.peerAddress}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: active conversation detail */}
            <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col">
              {/* If no active convo */}
              {!activeConvo ? (
                <div className="m-auto text-center text-sm text-gray-500">
                  Select or compose a conversation…
                </div>
              ) : (
                <>
                  {/* top bar: conversation peer + subject (optional) */}
                  <div className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-3">
                    <p className="text-xs text-gray-400 dark:text-gray-500">Chat with</p>
                    <h3 className="text-sm font-semibold break-all">
                      {activeConvo.peerAddress}
                    </h3>
                  </div>

                  {/* MESSAGES */}
                  <div className="flex-1 overflow-auto mb-4 border border-gray-200 dark:border-gray-700 rounded-md p-3">
                    {messages.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No messages yet. Start the conversation below.
                      </p>
                    ) : (
                      messages.map((msg, idx) => {
                        const fromMe = (msg.senderAddress === xmtp.address)
                        return (
                          <div
                            key={idx}
                            className={`mb-2 flex ${
                              fromMe ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`px-3 py-2 rounded-md text-sm max-w-xs break-words whitespace-pre-line
                                ${fromMe
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

                  {/* COMPOSE BOX: subject + body => handleSend */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <input
                      type="text"
                      placeholder="Subject (optional)"
                      className="block w-full px-3 py-2 text-sm mb-2
                        border border-gray-300 dark:border-gray-700
                        rounded-md bg-white dark:bg-gray-900 placeholder-gray-400"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                    <textarea
                      rows={2}
                      placeholder="Write a message…"
                      className="block w-full px-3 py-2 text-sm
                        border border-gray-300 dark:border-gray-700
                        rounded-md bg-white dark:bg-gray-900 placeholder-gray-400 mb-2"
                      value={bodyText}
                      onChange={(e) => setBodyText(e.target.value)}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!bodyText.trim()}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
