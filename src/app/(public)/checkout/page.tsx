import Checkout from '../../../components/Checkout';
import { noIndexMetadata } from '../../../lib/seo';

export const metadata = noIndexMetadata('Checkout', '/checkout');

export default function CheckoutPage() {
  return <Checkout />;
}
