'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react';
import { fetchOrderStatus } from '../lib/fetchOrderStatus';
import { Button, buttonClassName, Card, Container, PageHeader } from './ui';

type PaymentStatus = 'paid' | 'failed' | 'pending' | 'refunded' | null;

export default function PaymentResult() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderNumber = searchParams?.get('order') || '';
  const statusToken = searchParams?.get('t') || '';
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);

  const intervalRef = useRef<number | undefined>(undefined);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const isServiceOrder = useMemo(() => {
    const raw = (searchParams?.get('kind') || '').toLowerCase();
    return raw === 'service';
  }, [searchParams]);

  const now = () =>
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const stopPolling = () => {
    if (intervalRef.current !== undefined) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    setPolling(false);
  };

  const handleRefresh = () => {
    stopPolling();
    setRefreshNonce((n) => n + 1);
  };

  useEffect(() => {
    if (!orderNumber || !statusToken) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchStatus = async (): Promise<PaymentStatus | null> => {
      if (!isMounted) return null;
      try {
        const snapshot = await fetchOrderStatus(orderNumber, statusToken);
        if (!isMounted) return null;
        const next = (snapshot?.payment_status as PaymentStatus) || null;
        setPaymentStatus(next);
        setPaymentReference(snapshot?.payment_reference ?? null);
        setOrderStatus(snapshot?.order_status ?? null);
        setLastCheckedAt(now());
        return next;
      } catch {
        if (isMounted) setError('Failed to check order status. Please try again.');
        setLastCheckedAt(now());
        return null;
      }
    };

    (async () => {
      setLoading(true);
      setError('');
      stopPolling();

      const initial = await fetchStatus();
      if (!isMounted) return;
      setLoading(false);

      if (initial && initial !== 'pending') return;

      let attempts = 0;
      const maxAttempts = 24;
      const intervalMs = 5000;

      setPolling(true);
      intervalRef.current = window.setInterval(async () => {
        if (!isMounted) return;
        attempts += 1;
        if (attempts >= maxAttempts) {
          stopPolling();
          return;
        }
        const next = await fetchStatus();
        if (next && next !== 'pending') {
          stopPolling();
        }
      }, intervalMs);
    })();

    return () => {
      isMounted = false;
      stopPolling();
    };
  }, [orderNumber, statusToken, refreshNonce]);

  useEffect(() => {
    if (paymentStatus !== 'paid' || !orderNumber) return;
    // For service purchases, we want to prompt account creation so users can view services.
    if (isServiceOrder) return;
    const id = window.setTimeout(() => {
      router.push(`/orders?order=${encodeURIComponent(orderNumber)}`);
    }, 3000);
    return () => window.clearTimeout(id);
  }, [router, orderNumber, paymentStatus, isServiceOrder]);

  const statusConfig =
    paymentStatus === 'paid'
      ? { icon: CheckCircle2, label: 'Payment successful', tone: 'ink' }
      : paymentStatus === 'failed'
        ? { icon: XCircle, label: 'Payment failed', tone: 'red' }
        : paymentStatus === 'refunded'
          ? { icon: XCircle, label: 'Payment refunded', tone: 'muted' }
          : paymentStatus === 'pending'
            ? { icon: Clock, label: 'Order pending', tone: 'gold' }
            : { icon: Clock, label: 'Checking order status…', tone: 'muted' };

  const Icon = statusConfig.icon;

  const iconClass =
    statusConfig.tone === 'ink'
      ? 'text-ink'
      : statusConfig.tone === 'red'
        ? 'text-red-600'
        : statusConfig.tone === 'gold'
          ? 'text-gold'
          : 'text-muted';

  const showRefresh = !loading && (paymentStatus === 'pending' || paymentStatus === null);

  if (!orderNumber || !statusToken) {
    return (
      <section className="min-h-screen bg-paper">
        <PageHeader
          eyebrow="Payment"
          title="Status link incomplete"
          description="Open order tracking and find your order using the email or phone you used, or return to the page you arrived from with the full link."
        />
        <Container className="py-16 text-center">
          <XCircle size={48} className="mx-auto mb-4 text-gold" />
          <Link href="/orders" className={buttonClassName()}>
            Track orders
          </Link>
        </Container>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-paper pb-16">
      <PageHeader
        eyebrow="Payment"
        title={statusConfig.label}
        description={orderNumber ? `Order ${orderNumber}` : undefined}
      />

      <Container className="py-12">
        <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="mb-6 flex items-center justify-center">
            <Icon size={48} className={iconClass} />
          </div>

          {orderNumber && (
            <div className="mb-6 text-sm text-muted">
              Order: <span className="font-mono font-medium text-ink">{orderNumber}</span>
            </div>
          )}

          {showRefresh && (
            <div className="mb-4 flex justify-center">
              <Button
                type="button"
                variant="secondary"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw size={18} className={polling ? 'animate-spin' : ''} />
                {polling ? 'Checking…' : 'Refresh status'}
              </Button>
            </div>
          )}

          {loading && <div className="mb-4 text-muted">Loading order status…</div>}

          {error && (
            <div
              className="mb-4 inline-block rounded-md bg-red-50 p-4 text-sm text-red-700"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          <Card className="p-6 text-left">
            {paymentStatus === 'paid' ? (
              <p className="text-ink">
                Thanks for your payment. Our team will follow up with next steps.
              </p>
            ) : paymentStatus === 'failed' ? (
              <p className="text-ink">
                The payment did not complete. Please try again, or contact us with your order reference.
              </p>
            ) : paymentStatus === 'refunded' ? (
              <p className="text-ink">
                Your payment was refunded. If you were charged, your bank may take a few days to show the refund.
              </p>
            ) : paymentStatus === 'pending' ? (
              <p className="text-ink">
                Your order is pending. We will update the status when payment is confirmed. This page checks
                automatically.
              </p>
            ) : (
              <p className="text-ink">We are loading your order status. Please wait a moment…</p>
            )}

            {(paymentReference || orderStatus) && (
              <div className="mt-5 rounded-md border border-rule bg-paper p-4">
                <div className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted">Details</div>
                {paymentReference && (
                  <div className="mb-1 text-sm text-ink">
                    Reference: <span className="font-mono font-medium">{paymentReference}</span>
                  </div>
                )}
                {orderStatus && (
                  <div className="text-sm text-ink">
                    Order status: <span className="font-medium capitalize">{orderStatus}</span>
                  </div>
                )}
              </div>
            )}

            {lastCheckedAt && (
              <div className="mt-4 text-center text-xs text-muted">Last checked: {lastCheckedAt}</div>
            )}

            <div className="mt-6 flex justify-center gap-3">
              {isServiceOrder ? (
                <Link href="/dashboard/projects" className={buttonClassName()}>
                  View projects
                </Link>
              ) : (
                <Link href="/orders" className={buttonClassName()}>
                  Track Orders
                </Link>
              )}
              <Link
                href="/"
                className={buttonClassName('secondary')}
              >
                Return Home
              </Link>
            </div>
          </Card>
        </motion.div>
        </div>
      </Container>
    </section>
  );
}
