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

    return poaps.map(poap => ({
      name: poap.event.name,
      image_url: poap.event.image_url,
      event_url: `https://poap.gallery/event/${poap.event.id}`,
      location: poap.event.city || 'Unknown'
    }));
  } catch (error) {
    console.error('❌ POAP fetch failed:', error);
    return [];
  }
}
