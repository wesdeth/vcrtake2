// /lib/poapUtils.js
export async function getPOAPs(input) {
  if (!input) return [];

  try {
    const res = await fetch(`/api/poap?address=${input}`);
    if (!res.ok) {
      console.warn('⚠️ Failed to fetch POAPs:', res.status);
      return [];
    }

    const data = await res.json();
    return data || [];
  } catch (err) {
    console.error('❌ Error in getPOAPs:', err);
    return [];
  }
}
