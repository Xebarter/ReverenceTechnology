import OrderTracking from '../../../components/OrderTracking';
import { noIndexMetadata } from '../../../lib/seo';

export const metadata = noIndexMetadata('Order tracking', '/orders');

export default function OrdersPage() {
  return <OrderTracking />;
}
