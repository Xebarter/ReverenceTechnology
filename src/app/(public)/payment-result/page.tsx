"use client";

import { Suspense } from 'react';
import PaymentResult from '../../../components/PaymentResult';
import SEO from '../../../components/SEO';

export default function PaymentResultPage() {
  return (
    <>
      <SEO title="Payment Result" />
      <Suspense fallback={<div className="px-6 py-16 text-muted">Loading payment result…</div>}>
        <PaymentResult />
      </Suspense>
    </>
  );
}
