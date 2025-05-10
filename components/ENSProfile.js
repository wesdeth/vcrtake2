// components/ENSProfile.js
import { useEffect, useState } from 'react';
import { getEnsData } from '../lib/ensUtils';
import ProfileCard from './ProfileCard'; // optional if you want to show

export default function ENSProfile({ ensNameOrAddress }) {
  const [ensData, setEnsData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ensNameOrAddress) {
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      const data = await getEnsData(ensNameOrAddress);
      setEnsData(data);
      setLoading(false);
    })();
  }, [ensNameOrAddress]);

  if (loading) {
    return <p>Loading ENS data…</p>;
  }

  if (!ensData?.address) {
    return <p>Not found / invalid ENS or address.</p>;
  }

  // Optionally use ProfileCard
  return (
    <ProfileCard
      data={{
        name: ensData.name,
        address: ensData.address,
        avatar: ensData.avatar,
        // etc.
        twitter: ensData.twitter,
        website: ensData.website
      }}
    />
  );
}
