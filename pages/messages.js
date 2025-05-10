// pages/messages.js

import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { ethers } from 'ethers' // v5 style
import { Client } from '@xmtp/xmtp-js' // core XMTP library

// Example local list of ENS names for demonstration
const MOCK_ENS_NAMES = [
  'vitalik.eth',
  'validator.eth',
  'evanmoyer.eth',
  'wesd.eth',
  'valhalla.eth',
  'valeri.eth',
  'valorant.eth',
  'vitaldow.eth',
  // add or remove as needed
]

export default function MessagesPage() {
  // XMTP states
  const [loading, setLoading] = useState(false)
  const [xmtp, setXmtp] = useState(null)
  const [allConversations, setAllConversations] = useState([])
  const [activeConvo, setActiveConvo] = useState(null)
  const [messages, setMessages] = useState([])

  // Searching + composing
  const [searchInput, setSearchInput] = useState('')
  const [searchResults, setSearchResults] = useState([]) // suggestions
  const [subject, setSubject] = useState('')
  const [bodyText, setBodyText] = useState('')

  // For streaming new messages in real-time
  const [streaming, setStreaming] = useState(false)

  /* ------------------------------------------------------------------------------
     1) On mount, connect wallet & create XMTP client
  -------------------------------------------------------------------------------*/
  useEffect(() => {
    async function initXmtp() {
      if (typeof window === 'undefined') return
      if (!window.ethereum) {
        console.warn('No injected wallet found for XMTP.')
        return
      }
      try {
        setLoading(true)
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        await provider.send('eth_requestAccounts', [])
        const signer = provider.getSigner()

        // Create XMTP client
        const xmtpClient = await Client.create(signer)
        setXmtp(xmtpClient)

        // Fetch any existing conversations
        const convos = await xmtpClient.conversations.list()
        setAllConversations(convos)
      } catch (err) {
        console.error('XMTP init error:', err)
      } finally {
        setLoading(false)
      }
    }
    initXmtp()
  }, [])

  /* ------------------------------------------------------------------------------
     2) Load messages when activeConvo changes
  -------------------------------------------------------------------------------*/
  useEffect(() => {
    if (!activeConvo || !xmtp) return

    async function loadMessages() {
      setLoading(true)
      try {
        const msgs = await activeConvo.messages()
        setMessages(msgs)

        // Set up streaming for real-time new messages
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
    }

    loadMessages()
  }, [activeConvo, xmtp, streaming])

  /* ------------------------------------------------------------------------------
     3) Auto-suggest whenever the user types in searchInput
  -------------------------------------------------------------------------------*/
  useEffect(() => {
    const query = searchInput.trim().toLowerCase()
    if (!query) {
      setSearchResults([])
      return
    }
    // Filter local mock array
    const results = MOCK_ENS_NAMES.filter((name) =>
      name.toLowerCase().includes(query)
    ).slice(0, 5) // Show up to 5 matches
    setSearchResults(results)
  }, [searchInput])

  /* ------------------------------------------------------------------------------
     Handlers
  -------------------------------------------------------------------------------*/

  // User picks a suggestion → fill search input + hide suggestions
  const handleSelectSuggestion = (ensName) => {
    setSearchInput(ensName)
    setSearchResults([])
  }

  // Left column: pick an existing conversation
  const handleSelectConversation = (c) => {
    setActiveConvo(c)
    setSubject('')
    setBodyText('')
  }

  // Compose a new conversation w/ the searchInput
  const handleCompose = async () => {
    if (!xmtp || !searchInput.trim()) return
    try {
      setLoading(true)
      const newConvo = await xmtp.conversations.newConversation(searchInput.trim())

      // Add to conversation list if not already present
      setAllConversations((prev) => {
        const found = prev.find((c) => c.peerAddress === newConvo.peerAddress)
        return found ? prev : [...prev, newConvo]
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

  // Send a message into the active conversation
  const handleSend = async () => {
    if (!activeConvo || !bodyText.trim()) return
    try {
      setLoading(true)
      let finalContent = bodyText.trim()
      if (subject.trim()) {
        finalContent = `Subject: ${subject.trim()}\n\n${bodyText.trim()}`
      }
      await activeConvo.send(finalContent)
      setBodyText('')
      setSubject('')
    } catch (err) {
      console.error('Send message error:', err)
    } finally {
      setLoading(false)
    }
  }

  /* ------------------------------------------------------------------------------
     Render
  -------------------------------------------------------------------------------*/
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
            {/* LEFT COLUMN */}
            <div className="flex-shrink-0 sm:w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <h2 className="text-md font-semibold mb-3">Conversations</h2>

              {/* Search with suggestions + Compose */}
              <div className="mb-4 relative">
                <input
                  type="text"
                  placeholder="Search ENS or wallet…"
                  className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />

                {/* Auto-suggest dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-md z-10 max-h-40 overflow-auto">
                    {searchResults.map((ensName) => (
                      <div
                        key={ensName}
                        className="px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => handleSelectSuggestion(ensName)}
                      >
                        {ensName}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  className="w-full mt-2 bg-indigo-600 text-white py-2 rounded-md text-sm hover:bg-indigo-700 transition"
                  onClick={handleCompose}
                  disabled={!xmtp || !searchInput.trim()}
                >
                  Compose
                </button>
              </div>

              {/* Conversation list */}
              <div className="h-64 overflow-auto border-t border-gray-200 dark:border-gray-700 pt-3">
                {allConversations.length === 0 ? (
                  <p className="text-sm text-gray-500">No conversations yet.</p>
                ) : (
                  allConversations.map((c) => {
                    const isActive = activeConvo && c.peerAddress === activeConvo.peerAddress
                    return (
                      <div
                        key={c.peerAddress}
                        onClick={() => handleSelectConversation(c)}
                        className={`px-3 py-2 mb-2 rounded-md cursor-pointer text-sm
                          ${
                            isActive
                              ? 'bg-indigo-100 dark:bg-indigo-700/30'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                          }`}
                      >
                        {c.peerAddress}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col">
              {/* If no convo selected */}
              {!activeConvo ? (
                <div className="m-auto text-center text-sm text-gray-500">
                  Select or compose a conversation…
                </div>
              ) : (
                <>
                  {/* top bar */}
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
                                ${
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

                  {/* COMPOSE box */}
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
