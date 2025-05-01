
import ENSProfile from '../components/ENSProfile';
import { useRouter } from 'next/router';

export default function ENSPage() {
  const router = useRouter();
  const { ens } = router.query;
  return <ENSProfile ensName={ens} />;
}
