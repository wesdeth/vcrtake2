import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');

export async function getPOAPs(input) {
  if (!input) return [];

  let address = input;

  // Resolve ENS name to address
  if (input.endsWith('.eth')) {
    try {
      const resolved = await provider.resolveName(input);
      if (!resolved) throw new Error('ENS resolution failed');
      address = resolved;
    } catch (err) {
      console.warn('❌ Failed to resolve ENS:', err);
      return [];
    }
  }

  try {
    const res = await fetch(`/api/poap?address=${address}`);
    if (!res.ok) {
      console.warn('⚠️ Failed to fetch POAPs:', res.status);
      return [];
    }

    const data = await res.json();

    // Normalize and sanitize POAP format
    return data.map(poap => {
      const event = poap.event || {};
      const startDate = new Date(event.start_date || Date.now());

      return {
        id: event.id,
        name: event.name || 'Unnamed POAP',
        image_url: event.image_url || '/default-poap.png',
        event_url: `https://poap.gallery/event/${event.id}`,
        location: event.city || 'Unknown',
        date: startDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        fancy_date: startDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        description: event.description || '',
        year: startDate.getFullYear(),
        country: event.country || 'Unknown'
      };
    });
  } catch (err) {
    console.error('❌ Error in getPOAPs:', err);
    return [];
  }
}
