// lib/poapUtils.js
import { ethers } from 'ethers'

// Use ethers v5 style: new ethers.providers.JsonRpcProvider
const provider = new ethers.providers.JsonRpcProvider('https://eth.llamarpc.com')

/**
 * getPOAPs(input)
 * - If input is .eth, resolve via provider.resolveName()
 * - If we end with an invalid address (null, short string, 'messages', etc.), return []
 * - Otherwise fetch from /api/poap?address=...
 */
export async function getPOAPs(input) {
  if (!input || typeof input !== 'string') {
    console.warn('POAP fetch: invalid input', input)
    return []
  }

  let address = input.trim()

  // 1) If user gave an ENS name (ends with .eth), resolve via v5 approach
  if (address.endsWith('.eth')) {
    try {
      const resolved = await provider.resolveName(address)
      if (!resolved) throw new Error('ENS resolution returned null')
      address = resolved
    } catch (err) {
      console.warn('❌ Failed to resolve ENS:', address, err)
      return []
    }
  }

  // 2) Check if "address" is a valid 0x address
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    console.warn('POAP fetch: invalid or no address after resolution:', address)
    return []
  }

  // 3) Attempt to fetch from /api/poap?address=...
  try {
    const res = await fetch(`/api/poap?address=${address}`)
    if (!res.ok) {
      console.warn('⚠️ /api/poap fetch error:', res.status)
      return []
    }

    const rawData = await res.json()
    if (!Array.isArray(rawData)) {
      console.warn('POAP fetch: unexpected JSON format', rawData)
      return []
    }

    // 4) Normalize format
    return rawData.map((poap) => {
      const event = poap.event || {}
      const startDate = new Date(event.start_date || Date.now())

      return {
        id: event.id,
        name: event.name || 'Unnamed POAP',
        image_url: event.image_url || '/default-poap.png',
        event_url: `https://poap.gallery/event/${event.id}`,
        location: event.city || 'Unknown',
        date: startDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        fancy_date: startDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        description: event.description || '',
        year: startDate.getFullYear(),
        country: event.country || 'Unknown',
      }
    })
  } catch (err) {
    console.error('❌ Error in getPOAPs:', err)
    return []
  }
}
