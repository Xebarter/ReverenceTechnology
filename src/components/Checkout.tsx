'use client';

import { useState } from 'react';
import { ArrowLeft, CreditCard, Smartphone, Building2, Wallet, MapPin, Package, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { adminSupabase } from '../lib/supabase';
import { useCart } from '../CartContext';
import { describeFunctionsHttpError } from '../lib/describeFunctionsHttpError';
import { Button, Card, Container, FieldLabel, Input, PageHeader, Textarea } from './ui';

interface CheckoutProps {
  onClose?: () => void;
}

type ShopPaymentMethod = 'hosted_checkout' | 'mobile_money' | 'bank_transfer' | 'cash' | 'other';

export default function Checkout({ onClose }: CheckoutProps) {
  const router = useRouter();
  const { cartItems, updateQuantity, removeFromCart, clearCart, getTotal } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    city: '',
    country: 'Uganda',
    payment_method: 'mobile_money' as ShopPaymentMethod,
    payment_reference: '',
    notes: '',
  });

  const isPaymentReferenceRequired = formData.payment_method === 'bank_transfer';
  const usesHostedCheckout = formData.payment_method === 'hosted_checkout';
  const usesMobileMoney = formData.payment_method === 'mobile_money';

  const paymentVerification = (() => {
    if (formData.payment_method === 'hosted_checkout') {
      return {
        title: 'Card payment',
        description: 'You will complete payment on a secure card page. Mobile money is collected separately.',
      };
    }
    if (formData.payment_method === 'mobile_money') {
      return {
        title: 'Mobile money',
        description:
          'We will send a PIN prompt to the phone number you enter. Approve it to complete payment (MTN or Airtel).',
      };
    }
    if (formData.payment_method === 'bank_transfer') {
      return {
        title: 'Payment verification',
        description:
          'After you place your order, we will verify your transaction using the reference/transaction ID you provide. Please keep it for your records.',
      };
    }

    if (formData.payment_method === 'cash') {
      return {
        title: 'Cash handling',
        description:
          'Your order will be marked pending until we confirm delivery/pickup details with you. We may contact you if we need more information.',
      };
    }

    return {
      title: 'Secure processing',
      description:
        'Your order will be marked pending while we review your payment details. We will follow up using the email and phone you provide.',
    };
  })();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleUpdateQuantity = (productId: string, change: number) => {
    const item = cartItems.find(item => item.product_id === productId);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + change);
      updateQuantity(productId, newQuantity);
    }
  };

  const calculateSubtotal = () => {
    return getTotal();
  };

  const calculateShipping = () => {
    // Simple shipping calculation - can be made more complex
    return 50000; // 50,000 UGX default shipping
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (cartItems.length === 0) {
      setError('Your cart is empty');
      setSubmitting(false);
      return;
    }

    if (isPaymentReferenceRequired && !formData.payment_reference.trim()) {
      setError('Please enter your payment reference/transaction ID.');
      setSubmitting(false);
      return;
    }

    if (usesMobileMoney && !formData.customer_phone.trim()) {
      setError('Enter the mobile money number that will receive the payment prompt.');
      setSubmitting(false);
      return;
    }

    try {
      const statusToken =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

      const orderData = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        shipping_address: formData.shipping_address,
        city: formData.city,
        country: formData.country,
        payment_method: formData.payment_method,
        payment_reference: usesHostedCheckout ? null : formData.payment_reference || null,
        payment_status: 'pending',
        order_status: 'pending',
        status_token: statusToken,
        total_amount: calculateTotal(),
        shipping_fee: calculateShipping(),
        items: cartItems.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          product_price: item.product_price,
          product_image: item.product_image,
          category: item.category,
          quantity: item.quantity,
          subtotal: item.product_price * item.quantity,
        })),
        notes: formData.notes || null,
      };

      if (usesHostedCheckout || usesMobileMoney) {
        const resp = await fetch('/api/orders/create-shop-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order: orderData,
            startHostedCheckout: usesHostedCheckout,
            startMobileMoney: usesMobileMoney,
          }),
        });
        const json = (await resp.json().catch(() => null)) as {
          orderNumber?: string;
          statusToken?: string;
          hostedCheckoutUrl?: string;
          awaitingPhonePrompt?: boolean;
          error?: string;
        } | null;
        if (!resp.ok) {
          throw new Error(json?.error || `Request failed (HTTP ${resp.status})`);
        }
        if (usesHostedCheckout) {
          const url = json?.hostedCheckoutUrl;
          if (!url) {
            throw new Error('Card checkout could not be started. Please try again or pick mobile money.');
          }
          clearCart();
          window.location.href = url;
          return;
        }
        clearCart();
        if (json?.awaitingPhonePrompt && json.orderNumber && json.statusToken) {
          window.location.href = `/payment-result?order=${encodeURIComponent(json.orderNumber)}&t=${encodeURIComponent(json.statusToken)}&mm=1`;
          return;
        }
        throw new Error('Could not send the payment prompt. Check the number and try again.');
      }

      const { data, error: insertError } = await adminSupabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (insertError) throw insertError;

      setOrderNumber(data.order_number);
      setSubmitted(true);

      // Clear cart only after the order record is created.
      clearCart();
    } catch (err: unknown) {
      console.error('Error submitting order:', err);
      const fromHttp = await describeFunctionsHttpError(err);
      setError(
        fromHttp ??
          (err instanceof Error ? err.message : null) ??
          'Sorry, we couldn’t place your order. Please check your details and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0 && !submitted) {
    return (
      <section className="min-h-screen bg-paper py-16">
        <Container className="max-w-4xl text-center">
          <Package className="mx-auto mb-4 text-rule" size={64} />
          <h1 className="mb-4 font-serif text-3xl font-medium text-ink-deep">Your Cart is Empty</h1>
          <p className="mb-8 text-muted">Add some products to your cart to continue.</p>
          <Button
            onClick={() => {
              if (onClose) onClose();
                else router.push('/#shop');
            }}
          >
            Continue Shopping
          </Button>
        </Container>
      </section>
    );
  }

  if (submitted) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-paper px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl border border-rule bg-surface p-8 text-center md:p-12"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-md border border-rule bg-paper text-ink">
            <CheckCircle2 size={40} />
          </div>
          <h1 className="mb-4 font-serif text-3xl font-medium text-ink-deep">Order Placed Successfully!</h1>
          <p className="mb-6 text-xl text-muted">
            Your order number is: <span className="font-medium text-ink">{orderNumber}</span>
          </p>
          <p className="mb-4 text-muted">
            We’ve received your order. It’s currently pending review, and we’ll update the status soon.
            You can track it anytime using your order number.
          </p>
          {isPaymentReferenceRequired && formData.payment_reference.trim() && (
            <p className="mb-8 text-xs text-muted">
              Payment reference:{' '}
              <span className="font-mono font-medium text-ink">{formData.payment_reference.trim()}</span>
            </p>
          )}
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => {
                if (onClose) onClose();
                else router.push('/');
              }}
            >
              Return Home
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push('/orders')}
            >
              Track Order
            </Button>
          </div>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-paper pb-16">
      <PageHeader
        eyebrow="Shop"
        title="Checkout"
        description="Complete your purchase."
      />

      <Container className="py-10">
        <button
          onClick={() => {
            if (onClose) onClose();
            else router.push('/#shop');
          }}
          className="mb-8 flex items-center gap-2 font-medium text-muted hover:text-ink"
        >
          <ArrowLeft size={20} />
          <span>Back to Shop</span>
        </button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="p-6">
                <h2 className="mb-6 font-serif text-xl font-medium text-ink-deep">Customer Information</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel htmlFor="customer_name">Full Name *</FieldLabel>
                    <Input
                      type="text"
                      id="customer_name"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="customer_email">Email Address *</FieldLabel>
                    <Input
                      type="email"
                      id="customer_email"
                      name="customer_email"
                      value={formData.customer_email}
                      onChange={handleChange}
                      required
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <FieldLabel htmlFor="customer_phone">Phone Number *</FieldLabel>
                    <Input
                      type="tel"
                      id="customer_phone"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleChange}
                      required
                      placeholder="+256 700 000 000"
                    />
                    {usesMobileMoney && (
                      <p className="mt-1 text-xs text-muted">
                        Use the MTN or Airtel number that should receive the payment prompt.
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="mb-6 flex items-center gap-2 font-serif text-xl font-medium text-ink-deep">
                  <MapPin size={22} className="text-gold" />
                  Shipping Address
                </h2>
                <div className="space-y-4">
                  <div>
                    <FieldLabel htmlFor="shipping_address">Street Address *</FieldLabel>
                    <Input
                      type="text"
                      id="shipping_address"
                      name="shipping_address"
                      value={formData.shipping_address}
                      onChange={handleChange}
                      required
                      placeholder="Street address, building, apartment"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="city">City *</FieldLabel>
                      <Input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        placeholder="Kampala"
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="country">Country *</FieldLabel>
                      <Input
                        type="text"
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        required
                        placeholder="Uganda"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="mb-6 flex items-center gap-2 font-serif text-xl font-medium text-ink-deep">
                  <CreditCard size={22} className="text-gold" />
                  Payment Method
                </h2>
                <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">
                  {[
                    { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
                    { value: 'hosted_checkout', label: 'Card', icon: CreditCard },
                    { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
                    { value: 'cash', label: 'Cash', icon: Wallet },
                    { value: 'other', label: 'Other', icon: ShieldCheck },
                  ].map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, payment_method: method.value as ShopPaymentMethod }))}
                        className={`rounded-md border p-4 transition-colors ${
                          formData.payment_method === method.value
                            ? 'border-ink bg-paper text-ink'
                            : 'border-rule text-muted hover:border-ink'
                        }`}
                      >
                        <Icon size={24} className="mx-auto mb-2" />
                        <div className="text-xs font-medium">{method.label}</div>
                      </button>
                    );
                  })}
                </div>
                {!usesHostedCheckout && !usesMobileMoney && (
                  <div>
                    <FieldLabel htmlFor="payment_reference">
                      Payment Reference / Transaction ID{' '}
                      {isPaymentReferenceRequired ? (
                        <span className="text-red-600">*</span>
                      ) : (
                        <span className="font-medium text-muted">(optional)</span>
                      )}
                    </FieldLabel>
                    <Input
                      type="text"
                      id="payment_reference"
                      name="payment_reference"
                      value={formData.payment_reference}
                      onChange={handleChange}
                      required={isPaymentReferenceRequired}
                      className={isPaymentReferenceRequired && !formData.payment_reference.trim() ? 'border-red-300 focus:border-red-600 focus:ring-red-600' : ''}
                      placeholder={isPaymentReferenceRequired ? 'Enter transaction ID or reference *' : 'Enter transaction ID or reference (optional)'}
                    />
                    <p className="mt-1 text-xs text-muted">
                      {isPaymentReferenceRequired
                        ? 'Required for Bank Transfer.'
                        : 'You can leave this blank if paying with cash or other methods.'}
                    </p>
                  </div>
                )}
              </Card>

              <div className="rounded-md border border-rule bg-paper-2 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck size={22} className="mt-0.5 text-gold" />
                  <div>
                    <div className="font-medium text-ink-deep">{paymentVerification.title}</div>
                    <p className="mt-1 text-sm text-muted">{paymentVerification.description}</p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted">
                  By placing your order, you agree to our{' '}
                  <Link href="/terms" className="font-medium text-ink underline decoration-gold underline-offset-4">
                    Terms &amp; Conditions
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/refund-policy"
                    className="font-medium text-ink underline decoration-gold underline-offset-4"
                  >
                    Refund Policy
                  </Link>
                  .
                </div>
              </div>

              <Card className="p-6">
                <FieldLabel htmlFor="notes">Additional Notes (Optional)</FieldLabel>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="resize-none"
                  placeholder="Any special instructions or notes..."
                />
              </Card>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  role="alert"
                  aria-live="polite"
                  className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-red-700"
                >
                  <AlertCircle size={20} />
                  <span className="text-sm font-medium">{error}</span>
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                size="lg"
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    Processing Order...
                  </>
                ) : (
                  <>
                    <CreditCard size={24} />
                    {usesHostedCheckout
                      ? 'Continue to card payment'
                      : usesMobileMoney
                        ? 'Pay with mobile money'
                        : 'Place Order'}
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <Card className="max-h-[calc(100vh-14rem)] overflow-y-auto p-6 lg:sticky lg:top-24">
              <h2 className="mb-6 font-serif text-xl font-medium text-ink-deep">Order Summary</h2>

              <div className="mb-6 space-y-4">
                {cartItems.map((item) => (
                  <div key={item.product_id} className="flex gap-4 border-b border-rule pb-4 last:border-0">
                    {item.product_image && (
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="h-16 w-16 rounded-md object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="mb-1 text-sm font-medium text-ink">{item.product_name}</h3>
                      <p className="mb-2 text-xs text-muted">{item.category}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.product_id, -1)}
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-rule hover:bg-paper"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium text-ink">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.product_id, 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-rule hover:bg-paper"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-ink">{formatPrice(item.product_price * item.quantity)}</div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product_id)}
                            className="mt-1 text-xs text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-rule pt-4">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatPrice(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Shipping</span>
                  <span className="font-medium">{formatPrice(calculateShipping())}</span>
                </div>
                <div className="flex justify-between border-t border-rule pt-4 font-serif text-xl text-ink-deep">
                  <span>Total</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  );
}
