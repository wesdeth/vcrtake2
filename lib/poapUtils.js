import axios from 'axios';

export async function getPOAPs(address) {
  if (!address || typeof address !== 'string') {
    console.warn('Invalid address provided to getPOAPs:', address);
    return [];
  }

  try {
    const url = `https://api.poap.tech/actions/scan/${address}`;
    const response = await axios.get(url, {
      headers: {
        'X-API-Key': process.env.NEXT_PUBLIC_POAP_API_KEY || 'demo',
        'Accept': 'application/json'
      }
    });

    const data = response.data;

    if (!Array.isArray(data)) {
      console.warn('Unexpected POAP response format:', data);
      return [];
    }

    return data.map(poap => ({
      id: poap.tokenId,
      name: poap.event?.name || 'Unnamed POAP',
      image_url: poap.event?.image_url || 'https://via.placeholder.com/100',
      description: poap.event?.description || '',
      event_url: poap.event?.event_url || '',
      created: poap.created || '',
      event: poap.event
    }));
  } catch (error) {
    console.error('❌ POAP Fetch Failed:', error.message);
    return [];
  }
}
