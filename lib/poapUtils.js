import axios from 'axios';

export async function getPOAPs(address) {
  if (!address) return [];

  try {
    const response = await axios.get(`https://api.poap.tech/actions/scan/${address}`, {
      headers: {
        'X-API-Key': process.env.NEXT_PUBLIC_POAP_API_KEY || 'demo'
      }
    });

    const poaps = response.data || [];

    return poaps.map(poap => {
      const startDate = new Date(poap.event.start_date);
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
        id: poap.event.id,
        name: poap.event.name,
        image_url: poap.event.image_url,
        event_url: `https://poap.gallery/event/${poap.event.id}`,
        location: poap.event.city || 'Unknown',
        date: shortDate || 'Unknown',
        description: poap.event.description || 'No description provided',
        fancy_date: fancyDate || 'Unknown',
        year: startDate.getFullYear() || 'Unknown',
        country: poap.event.country || 'Unknown',
        event_url_fallback: `https://poap.xyz/event/${poap.event.id}`
      };
    });
  } catch (error) {
    console.error('❌ POAP fetch failed:', error);
    return [];
  }
}
