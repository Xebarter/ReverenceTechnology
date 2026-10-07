import { useState, useEffect } from 'react';
import { X, CreditCard, Smartphone, Building2, Wallet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Button, FieldLabel, Input, Textarea } from './ui';

interface DepositFormProps {
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    category: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}



export default function DepositForm({ product, isOpen, onClose, onSuccess }: DepositFormProps) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    deposit_amount: '',
    payment_method: 'mobile_money' as 'mobile_money' | 'bank_transfer' | 'cash' | 'other',
    payment_reference: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  // Note: Keeping for future enhancements; currently unused in UI
  const [, setExistingDeposits] = useState<any[]>([]);
  const [totalDeposited, setTotalDeposited] = useState(0);

  useEffect(() => {
    if (isOpen && product) {
      fetchExistingDeposits();
    }
  }, [isOpen, product]);

  const fetchExistingDeposits = async () => {
    if (!product) return;

    try {
      // For now, we'll check by product_id only
      // In a real app, you'd also filter by customer email/phone after they enter it
      const { data, error } = await supabase
        .from('customer_deposits')
        .select('*')
        .eq('product_id', product.id)
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false});

      if (error) throw error;

      const deposits = data || [];
      setExistingDeposits(deposits);

      // Calculate total deposited (this would normally be per customer)
      const total = deposits.reduce((sum, d) => sum + parseFloat(d.total_deposited || 0), 0);
      setTotalDeposited(total);
    } catch (err) {
      console.error('Error fetching deposits:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const calculateRemaining = () => {
    if (!product || !formData.deposit_amount) return product?.price || 0;
    const deposit = parseFloat(formData.deposit_amount) || 0;
    return Math.max(0, product.price - deposit - totalDeposited);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (!product) {
      setError('No product selected');
      setSubmitting(false);
      return;
    }

    const depositAmount = parseFloat(formData.deposit_amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      setError('Please enter a valid deposit amount');
      setSubmitting(false);
      return;
    }

    if (depositAmount > product.price) {
      setError('Deposit amount cannot exceed product price');
      setSubmitting(false);
      return;
    }

    try {
      const newTotalDeposited = totalDeposited + depositAmount;
      const remainingBalance = product.price - newTotalDeposited;
      const isCompleted = remainingBalance <= 0;

      const depositData = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        deposit_amount: depositAmount,
        total_deposited: newTotalDeposited,
        remaining_balance: Math.max(0, remainingBalance),
        status: isCompleted ? 'completed' : 'pending',
        payment_method: formData.payment_method,
        payment_reference: formData.payment_reference || null,
        notes: formData.notes || null,
        completed_at: isCompleted ? new Date().toISOString() : null,
      };

      const { error: insertError } = await supabase
        .from('customer_deposits')
        .insert([depositData]);

      if (insertError) throw insertError;

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
        if (onSuccess) onSuccess();
        // Reset form
        setFormData({
          customer_name: '',
          customer_email: '',
          customer_phone: '',
          deposit_amount: '',
          payment_method: 'mobile_money',
          payment_reference: '',
          notes: '',
        });
      }, 3000);
    } catch (err: any) {
      console.error('Error submitting deposit:', err);
      setError(err.message || 'Failed to submit deposit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !product) return null;

  const remaining = calculateRemaining();
  const progress = product.price > 0 ? ((totalDeposited / product.price) * 100) : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-deep/50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-rule bg-surface shadow-[0_30px_60px_-36px_rgb(14_36_54/0.55)]"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-rule bg-surface p-6">
            <div>
              <h2 className="font-serif text-2xl font-medium text-ink-deep">Make a Deposit</h2>
              <p className="mt-1 text-muted">Secure your purchase with a deposit</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-muted hover:bg-paper"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 text-center"
              >
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-md border border-rule bg-paper text-ink">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="mb-2 font-serif text-2xl font-medium text-ink-deep">Deposit Submitted!</h3>
                <p className="text-muted">We&apos;ve received your deposit. Our team will confirm it shortly.</p>
              </motion.div>
            ) : (
              <>
                <div className="mb-6 rounded-md border border-rule bg-paper p-6">
                  <div className="flex gap-4">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-24 w-24 rounded-md object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-gold">
                        {product.category}
                      </div>
                      <h3 className="mb-2 font-serif text-xl font-medium text-ink-deep">{product.name}</h3>
                      <div className="font-serif text-2xl text-ink-deep">
                        {new Intl.NumberFormat('en-UG', {
                          style: 'currency',
                          currency: 'UGX',
                          minimumFractionDigits: 0,
                        }).format(product.price)}
                      </div>
                    </div>
                  </div>

                  {totalDeposited > 0 && (
                    <div className="mt-4 border-t border-rule pt-4">
                      <div className="mb-2 flex justify-between text-sm font-medium">
                        <span className="text-muted">Total Deposited</span>
                        <span className="text-ink">
                          {new Intl.NumberFormat('en-UG', {
                            style: 'currency',
                            currency: 'UGX',
                            minimumFractionDigits: 0,
                          }).format(totalDeposited)} / {new Intl.NumberFormat('en-UG', {
                            style: 'currency',
                            currency: 'UGX',
                            minimumFractionDigits: 0,
                          }).format(product.price)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-md bg-paper-2">
                        <div
                          className="h-full bg-ink transition-all duration-500"
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-muted">
                        {remaining > 0 ? (
                          <span>Remaining: {new Intl.NumberFormat('en-UG', {
                            style: 'currency',
                            currency: 'UGX',
                            minimumFractionDigits: 0,
                          }).format(remaining)}</span>
                        ) : (
                          <span className="font-medium text-ink">Fully Paid!</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <FieldLabel htmlFor="deposit-name">Full Name *</FieldLabel>
                      <Input
                        type="text"
                        id="deposit-name"
                        name="customer_name"
                        value={formData.customer_name}
                        onChange={handleChange}
                        required
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="deposit-email">Email Address *</FieldLabel>
                      <Input
                        type="email"
                        id="deposit-email"
                        name="customer_email"
                        value={formData.customer_email}
                        onChange={handleChange}
                        required
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <FieldLabel htmlFor="deposit-phone">Phone Number *</FieldLabel>
                    <Input
                      type="tel"
                      id="deposit-phone"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleChange}
                      required
                      placeholder="+256 700 000 000"
                    />
                  </div>

                  <div>
                    <FieldLabel htmlFor="deposit-amount">Deposit Amount (UGX) *</FieldLabel>
                    <Input
                      type="number"
                      id="deposit-amount"
                      name="deposit_amount"
                      value={formData.deposit_amount}
                      onChange={handleChange}
                      required
                      min="1"
                      max={product.price}
                      step="1000"
                      className="text-lg font-medium"
                      placeholder="Enter amount"
                    />
                    <div className="mt-2 text-sm text-muted">
                      {formData.deposit_amount && (
                        <div>
                          <span className="font-medium">Remaining after deposit: </span>
                          <span className="font-medium text-ink">
                            {new Intl.NumberFormat('en-UG', {
                              style: 'currency',
                              currency: 'UGX',
                              minimumFractionDigits: 0,
                            }).format(remaining)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Payment Method *</FieldLabel>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {[
                        { value: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
                        { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2 },
                        { value: 'cash', label: 'Cash', icon: Wallet },
                        { value: 'other', label: 'Other', icon: CreditCard },
                      ].map((method) => {
                        const Icon = method.icon;
                        return (
                          <button
                            key={method.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, payment_method: method.value as any }))}
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
                  </div>

                  <div>
                    <FieldLabel htmlFor="deposit-ref">Payment Reference / Transaction ID</FieldLabel>
                    <Input
                      type="text"
                      id="deposit-ref"
                      name="payment_reference"
                      value={formData.payment_reference}
                      onChange={handleChange}
                      placeholder="Enter transaction ID or reference"
                    />
                    <p className="mt-1 text-xs text-muted">
                      Please provide your payment reference for verification
                    </p>
                  </div>

                  <div>
                    <FieldLabel htmlFor="deposit-notes">Additional Notes (Optional)</FieldLabel>
                    <Textarea
                      id="deposit-notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={3}
                      className="resize-none"
                      placeholder="Any additional information..."
                    />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-red-700"
                    >
                      <AlertCircle size={20} />
                      <span className="text-sm font-medium">{error}</span>
                    </motion.div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onClose}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="flex-1"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard size={20} />
                          Submit Deposit
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
