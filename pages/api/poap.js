// pages/api/poap.js
import { request, gql } from 'graphql-request';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
const endpoint = 'https://api.thegraph.com/subgraphs/name/poap-xyz/poap';

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

export default async function handler(req, res) {
  let { address } = req.query;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid address' });
  }

  // If ENS name, resolve it
  if (address.endsWith('.eth')) {
    try {
      const resolved = await provider.resolveName(address);
      if (!resolved) throw new Error('ENS resolution failed');
      address = resolved;
    } catch (err) {
      return res.status(400).json({ error: 'ENS resolution failed' });
    }
  }

  try {
    const variables = { id: address.toLowerCase() };
    const data = await request(endpoint, query, variables);

    const formatted = (data.tokens || []).map(({ event }) => {
      const startDate = new Date(event.start_date || Date.now());
      return {
        id: event.id,
        name: event.name || 'Unnamed POAP',
        image_url: event.image_url || '/default-poap.png',
        event_url: `https://poap.gallery/event/${event.id}`,
        location: event.city || 'Unknown',
        date: startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
        description: event.description || '',
        fancy_date: startDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        year: startDate.getFullYear(),
        country: event.country || 'Unknown'
      };
    });

    return res.status(200).json(formatted);
  } catch (error) {
    console.error('❌ POAP API route error:', error);
    return res.status(500).json({ error: 'Failed to fetch POAPs' });
  }
}
