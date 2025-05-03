import axios from 'axios';

export async function getPOAPs(address) {
  if (!address || typeof address !== 'string') {
    console.error('❌ Invalid address provided to getPOAPs');
    return [];
  }

  try {
    const url = `https://api.poap.tech/actions/scan/${address}`;
    const response = await axios.get(url, {
      headers: {
        'X-API-Key': process.env.NEXT_PUBLIC_POAP_API_KEY || 'demo', // Swap with your real key when ready
        'Accept': 'application/json'
      }
    });

    const rawPoaps = response.data || [];

    return rawPoaps.map((poap) => ({
      name: poap.event.name || 'POAP',
      description: poap.event.description || '',
      image_url: poap.event.image_url || 'https://via.placeholder.com/100',
      created: poap.created || poap.event.start_date || null
    }));
  } catch (error) {
    console.error('❌ POAP Fetch Failed:', error.message);
    return [];
  }
}
