'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, Loader2, Smartphone } from 'lucide-react';
import { useUser } from '../UserContext';
import { Button, Card, Container, FieldLabel, Input, PageHeader, Textarea } from './ui';

type Method = 'mobile_money' | 'card';

export default function CollectPayment() {
  const { user } = useUser();
  const [method, setMethod] = useState<Method>('mobile_money');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setName((current) => current || user.displayName || user.user_metadata.full_name || '');
    setEmail((current) => current || user.email || '');
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const resp = await fetch('/api/payments/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          amount: Number(amount),
          purpose,
          method,
        }),
      });
      const json = (await resp.json().catch(() => null)) as {
        error?: string;
        orderNumber?: string;
        statusToken?: string;
        hostedCheckoutUrl?: string;
        awaitingPhonePrompt?: boolean;
      } | null;
      if (!resp.ok) throw new Error(json?.error || 'Could not start the payment.');

      if (method === 'card') {
        if (!json?.hostedCheckoutUrl) throw new Error('Card payment could not be started. Try mobile money.');
        window.location.href = json.hostedCheckoutUrl;
        return;
      }
      if (json?.awaitingPhonePrompt && json.orderNumber && json.statusToken) {
        window.location.href = `/payment-result?order=${encodeURIComponent(json.orderNumber)}&t=${encodeURIComponent(json.statusToken)}&mm=1`;
        return;
      }
      throw new Error('Could not send the payment prompt. Check the number and try again.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not start the payment.');
      setSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen bg-paper pb-16">
      <PageHeader
        eyebrow="Pay"
        title="Send a payment"
        description="Pay by mobile money or card. No account is required. If you later sign in with this email, the payment shows on your account."
      />
      <Container className="py-12">
        <form onSubmit={submit} className="mx-auto max-w-xl space-y-6">
          <Card className="p-6">
            <div className="mb-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod('mobile_money')}
                className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-3 text-sm font-medium ${
                  method === 'mobile_money' ? 'border-ink bg-ink text-paper' : 'border-rule text-muted hover:text-ink'
                }`}
              >
                <Smartphone size={16} />
                Mobile money
              </button>
              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-3 text-sm font-medium ${
                  method === 'card' ? 'border-ink bg-ink text-paper' : 'border-rule text-muted hover:text-ink'
                }`}
              >
                <CreditCard size={16} />
                Card
              </button>
            </div>
            <p className="text-sm text-muted">
              {method === 'mobile_money'
                ? 'We send a PIN prompt to your MTN or Airtel number. Approve it on your phone.'
                : 'You’ll complete the card payment on a secure page, then return here.'}
            </p>
          </Card>

          <Card className="space-y-4 p-6">
            <div>
              <FieldLabel htmlFor="pay-name">Full name</FieldLabel>
              <Input id="pay-name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
            </div>
            <div>
              <FieldLabel htmlFor="pay-email">Email</FieldLabel>
              <Input
                id="pay-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <p className="mt-1 text-xs text-muted">
                This is how we match the payment if you open an account later.
              </p>
            </div>
            <div>
              <FieldLabel htmlFor="pay-phone">{method === 'mobile_money' ? 'Mobile money number' : 'Phone number'}</FieldLabel>
              <Input
                id="pay-phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
                placeholder={method === 'mobile_money' ? '07XXXXXXXX' : '+256 700 000 000'}
              />
            </div>
            <div>
              <FieldLabel htmlFor="pay-amount">Amount (UGX)</FieldLabel>
              <Input
                id="pay-amount"
                type="number"
                inputMode="numeric"
                min={1000}
                step={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="50000"
              />
            </div>
            <div>
              <FieldLabel htmlFor="pay-purpose">What is this payment for?</FieldLabel>
              <Textarea
                id="pay-purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                className="min-h-[96px]"
                placeholder="Invoice, project, or a short note"
              />
            </div>
          </Card>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {method === 'mobile_money' ? 'Sending prompt…' : 'Opening card payment…'}
              </>
            ) : method === 'mobile_money' ? (
              'Pay with mobile money'
            ) : (
              'Continue to card payment'
            )}
          </Button>
          <p className="text-center text-xs text-muted">
            By paying you agree to our{' '}
            <Link href="/terms" className="font-medium text-ink underline decoration-gold underline-offset-4">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/refund-policy" className="font-medium text-ink underline decoration-gold underline-offset-4">
              Refund Policy
            </Link>
            .
          </p>
        </form>
      </Container>
    </section>
  );
}
