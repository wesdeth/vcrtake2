
import axios from 'axios';

export async function getPOAPs(address) {
  try {
    const url = `https://api.poap.tech/actions/scan/${address}`;
    const response = await axios.get(url, {
      headers: { 'X-API-Key': 'demo' }
    });
    return response.data || [];
  } catch (error) {
    console.error('POAP Fetch Failed:', error);
    return [];
  }
}
