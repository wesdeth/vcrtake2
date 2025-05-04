// /lib/poapUtils.js
import axios from 'axios';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');

export async function getPOAPs(input) {
  if (!input) return [];

  let address = input;

  // Resolve ENS name if provided
  if (input.endsWith('.eth')) {
    try {
      address = await provider.resolveName(input);
    } catch (err) {
      console.warn('❌ Failed to resolve ENS to address:', input);
      return [];
    }
  }

  if (!address) {
    console.warn('❌ No address resolved for POAP lookup.');
    return [];
  }

  try {
    const response = await axios.get(`https://api.poap.tech/actions/scan/${address}`, {
      headers: {
        'X-API-Key': process.env.NEXT_PUBLIC_POAP_API_KEY || 'demo'
      }
    });

    const poaps = response.data || [];

    return poaps.map(poap => {
      const event = poap.event || {};
      const startDate = new Date(event.start_date || Date.now());
      const fancyDate = startDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const shortDate = startDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      return {
        id: event.id,
        name: event.name || 'Unnamed POAP',
        image_url: event.image_url || '/default-poap.png',
        event_url: `https://poap.gallery/event/${event.id}`,
        location: event.city || 'Unknown',
        date: shortDate,
        description: event.description || 'No description provided',
        fancy_date: fancyDate,
        year: startDate.getFullYear(),
        country: event.country || 'Unknown',
        event_url_fallback: `https://poap.xyz/event/${event.id}`
      };
    });
  } catch (error) {
    console.error('❌ POAP fetch failed:', error?.response?.data || error.message);
    return [];
  }
}
