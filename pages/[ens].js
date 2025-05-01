import ENSProfile from '../components/ENSProfile';
import { useRouter } from 'next/router';

export default function ENSPage() {
  const router = useRouter();
  const { ens } = router.query;

  if (!ens) {
    return <p className="text-center mt-10">Loading ENS profile...</p>;
  }

  return <ENSProfile ensName={ens} />;
}
