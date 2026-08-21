import Shop from '../../../components/Shop';
import { pageMetadata } from '../../../lib/seo';

export const metadata = pageMetadata({
  title: 'Shop',
  description: 'Hardware and accessories from Reverence Technology in Kampala.',
  path: '/shop',
});

export default function ShopPage() {
  return <Shop />;
}
