// lib/ensUtils.js
import { ethers } from 'ethers'
import { namehash as viemNamehash } from 'viem'

// Create a v5‑style JsonRpcProvider:
const provider = new ethers.providers.JsonRpcProvider('https://eth.llamarpc.com')

// Example: The main ENS registry address + minimal ABI
const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
const ENS_ABI = ['function owner(bytes32 node) view returns (address)']

/**
 * getEnsData(nameOrAddress)
 * 
 * Attempts to resolve an ENS name or 0x address to an object containing:
 *   - name: the ENS name (or null if we only had a 0x)
 *   - address: the resolved 0x
 *   - avatar, twitter, website (if we find those via resolver text records)
 */
export async function getEnsData(nameOrAddress) {
  try {
    if (!nameOrAddress || typeof nameOrAddress !== 'string') {
      throw new Error('Invalid input: must be a string')
    }

    let name = null
    let address = null

    // If it ends with '.eth', treat it as an ENS name
    if (nameOrAddress.endsWith('.eth')) {
      name = nameOrAddress
      address = await provider.resolveName(name) // ethers v5
    } else if (nameOrAddress.startsWith('0x')) {
      // Otherwise assume it's a 0x, and try reverse lookup
      address = nameOrAddress
      name = await provider.lookupAddress(address) // e.g. 'something.eth' or null
    }

    console.log('🧠 ENS Lookup:', { input: nameOrAddress, name, address })

    if (!address) {
      throw new Error('Could not resolve a valid address.')
    }

    // If we do have an ENS name, we can try fetching some text records
    let avatar = null
    let twitter = null
    let website = null

    if (name) {
      // In ethers v5, getResolver() returns a resolver object or null
      const resolver = await provider.getResolver(name)
      if (resolver) {
        avatar = await resolver.getText('avatar')
        twitter = await resolver.getText('com.twitter')
        website = await resolver.getText('url')
      }
    }

    return {
      name: name || null,
      address,
      avatar: avatar || null,
      twitter: twitter || null,
      website: website || null
    }
  } catch (err) {
    console.error('❌ getEnsData error:', err.message)
    return {
      name: null,
      address: null,
      avatar: null,
      twitter: null,
      website: null
    }
  }
}

/**
 * getENSOwner(name)
 * 
 * Return the current owner of the given *.eth name via the ENS registry,
 * or null if not found.
 */
export async function getENSOwner(name) {
  try {
    if (!name || !name.endsWith('.eth')) {
      throw new Error('Invalid ENS name')
    }
    const hashedName = viemNamehash(name)
    const registry = new ethers.Contract(ENS_REGISTRY, ENS_ABI, provider)
    const owner = await registry.owner(hashedName) // v5 call
    console.log(`🔍 Owner of ${name}: ${owner}`)
    return owner ? owner.toLowerCase() : null
  } catch (err) {
    console.error('❌ getENSOwner error:', err.message)
    return null
  }
}
