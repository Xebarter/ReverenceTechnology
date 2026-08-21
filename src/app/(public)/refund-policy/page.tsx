import RefundPolicy from '../../../components/RefundPolicy';
import { pageMetadata } from '../../../lib/seo';

export const metadata = pageMetadata({
  title: 'Refund Policy',
  description: 'Refund and cancellation terms for Reverence Technology projects, products, and payments.',
  path: '/refund-policy',
});

export default function RefundPolicyPage() {
  return <RefundPolicy />;
}
