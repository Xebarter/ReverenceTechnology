import CollectPayment from '../../../components/CollectPayment';
import { noIndexMetadata } from '../../../lib/seo';

export const metadata = noIndexMetadata('Pay', '/pay');

export default function PayPage() {
  return <CollectPayment />;
}
