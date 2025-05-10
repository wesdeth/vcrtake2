// lib/poapUtils.js
import { request, gql } from 'graphql-request'
import { ethers } from 'ethers'

// v6 or v5?
// If you’re on ethers v5, do: new ethers.providers.JsonRpcProvider(...)
// If on v6, do: new ethers.JsonRpcProvider(...)
const provider = new ethers.providers.JsonRpcProvider('https://eth.llamarpc.com') 
// ^ Adjust as necessary for your version of ethers

export async function getPOAPs(input) {
  if (!input) return []

  // Step 1: Resolve to a 0x address
  let address = input

  if (input.endsWith('.eth')) {
    try {
      const resolved = await provider.resolveName(input)
      if (!resolved) {
        console.warn(`❌ Could not resolve ENS: ${input}`)
        return []
      }
      address = resolved
    } catch (err) {
      console.warn('❌ ENS resolution failed:', err)
      return []
    }
  }

  // If we still don’t have a valid address, stop
  if (!address || !address.startsWith('0x')) {
    return []
  }

  // Ensure 0x address is lowercased for the subgraph query
  const queryAddress = address.toLowerCase()

  // Step 2: Build the GraphQL query
  const query = gql`
    query GetPOAPs($id: String!) {
      tokens(
        where: { owner: $id }
        orderBy: created
        orderDirection: desc
      ) {
        id
        event {
          id
          name
          image_url
          city
          country
          start_date
          description
        }
      }
    }
  `

  const endpoint = 'https://api.thegraph.com/subgraphs/name/poap-xyz/poap'
  const variables = { id: queryAddress }

  try {
    const data = await request(endpoint, query, variables)
    // shape the result
    return (data.tokens || []).map(({ event }) => {
      const startDate = event?.start_date ? new Date(event.start_date) : new Date()
      return {
        id: event?.id || '',
        name: event?.name || 'Unnamed POAP',
        image_url: event?.image_url || '/default-poap.png',
        event_url: `https://poap.gallery/event/${event?.id ?? ''}`,
        location: event?.city || 'Unknown',
        date: startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        fancy_date: startDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        description: event?.description || '',
        year: startDate.getFullYear(),
        country: event?.country || 'Unknown',
      }
    })
  } catch (err) {
    console.error('❌ POAP GraphQL fetch failed:', err)
    return []
  }
}
