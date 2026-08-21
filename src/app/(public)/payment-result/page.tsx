import { Suspense } from 'react';
import PaymentResult from '../../../components/PaymentResult';
import { noIndexMetadata } from '../../../lib/seo';

export const metadata = noIndexMetadata('Payment result', '/payment-result');

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div className="px-6 py-16 text-muted">Loading payment result…</div>}>
      <PaymentResult />
    </Suspense>
  );
}
