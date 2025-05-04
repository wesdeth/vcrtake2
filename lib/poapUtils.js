// /lib/poapUtils.js
import { request, gql } from 'graphql-request';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');

export async function getPOAPs(input) {
  if (!input) return [];

  let addressOrEns = input;

  // Validate ENS name or resolve address if needed
  if (input.endsWith('.eth')) {
    try {
      const resolved = await provider.resolveName(input);
      if (resolved) addressOrEns = input; // Keep ENS for the GraphQL query
      else addressOrEns = '';
    } catch (err) {
      console.warn('❌ ENS resolution failed:', err);
      return [];
    }
  }

  if (!addressOrEns) return [];

  const query = gql`
    query GetPOAPs($id: String!) {
      tokens(where: { owner: $id }, orderBy: created, orderDirection: desc) {
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
  `;

  try {
    const endpoint = 'https://api.thegraph.com/subgraphs/name/poap-xyz/poap';
    const variables = { id: addressOrEns.toLowerCase() };

    const data = await request(endpoint, query, variables);

    return (data.tokens || []).map(({ event }) => {
      const startDate = new Date(event.start_date || Date.now());
      return {
        id: event.id,
        name: event.name || 'Unnamed POAP',
        image_url: event.image_url || '/default-poap.png',
        event_url: `https://poap.gallery/event/${event.id}`,
        location: event.city || 'Unknown',
        date: startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        description: event.description || '',
        fancy_date: startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        year: startDate.getFullYear(),
        country: event.country || 'Unknown',
      };
    });
  } catch (err) {
    console.error('❌ POAP GraphQL fetch failed:', err);
    return [];
  }
}
