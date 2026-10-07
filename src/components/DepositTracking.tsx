'use client';

import { useState } from 'react';
import { Search, Package, Calendar, CheckCircle2, Clock, XCircle, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Badge, Button, Card, Container, FieldLabel, Input, PageHeader } from './ui';

export default function DepositTracking() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !phone) {
      setError('Please enter your email or phone number');
      return;
    }

    setSearching(true);
    setLoading(true);
    setError('');

    try {
      let query = supabase
        .from('customer_deposits')
        .select('*')
        .order('created_at', { ascending: false });

      if (email) {
        query = query.eq('customer_email', email);
      }
      if (phone) {
        query = query.eq('customer_phone', phone);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setDeposits(data || []);
      if (data && data.length === 0) {
        setError('No deposits found. Please check your email or phone number.');
      }
    } catch (err: any) {
      console.error('Error fetching deposits:', err);
      setError(err.message || 'Failed to fetch deposits. Please try again.');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const filteredDeposits = deposits.filter(deposit => {
    if (statusFilter === 'all') return true;
    return deposit.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { icon: Clock, label: 'Pending' },
      confirmed: { icon: CheckCircle2, label: 'Confirmed' },
      completed: { icon: CheckCircle2, label: 'Completed' },
      cancelled: { icon: XCircle, label: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge>
        <Icon size={12} className="text-gold" />
        {config.label}
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateProgress = (deposit: any) => {
    if (!deposit.product_price || deposit.product_price === 0) return 0;
    return Math.min(100, (deposit.total_deposited / deposit.product_price) * 100);
  };

  return (
    <section className="min-h-screen bg-paper pb-16">
      <PageHeader
        eyebrow="Shop"
        title="Track your deposits"
        description="Enter your email or phone number to view your deposit history and progress."
      />

      <Container className="py-12">
        <Card className="mb-8 p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="deposit-track-email">Email Address</FieldLabel>
                <Input
                  type="email"
                  id="deposit-track-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <FieldLabel htmlFor="deposit-track-phone">Phone Number</FieldLabel>
                <Input
                  type="tel"
                  id="deposit-track-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+256 700 000 000"
                />
              </div>
            </div>
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading || searching}
            >
              <Search size={20} />
              {loading ? 'Searching...' : 'Search Deposits'}
            </Button>
          </form>
        </Card>

        {deposits.length > 0 && (
          <>
            <div className="mb-6 flex items-center gap-4">
              <Filter size={20} className="text-muted" />
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                      statusFilter === status
                        ? 'border-ink bg-ink text-paper'
                        : 'border-rule bg-surface text-ink hover:border-ink'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {filteredDeposits.map((deposit, index) => {
                const progress = calculateProgress(deposit);
                return (
                  <motion.div
                    key={deposit.id}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="border border-rule bg-surface p-6"
                  >
                    <div className="flex flex-col gap-6 md:flex-row">
                      <div className="flex-1">
                        <div className="mb-4 flex items-start gap-4">
                          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-md border border-rule bg-paper">
                            <Package size={32} className="text-gold" />
                          </div>
                          <div className="flex-1">
                            <div className="mb-2 flex items-center justify-between">
                              <h3 className="font-serif text-xl font-medium text-ink-deep">{deposit.product_name}</h3>
                              {getStatusBadge(deposit.status)}
                            </div>
                            <div className="mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-gold">
                              {deposit.product_id ? 'Product ID: ' + deposit.product_id.substring(0, 8) + '...' : 'Product'}
                            </div>
                            <div className="font-serif text-2xl text-ink-deep">
                              {formatPrice(deposit.product_price)}
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="mb-2 flex justify-between text-sm font-medium">
                            <span className="text-muted">Payment Progress</span>
                            <span className="font-medium text-ink">
                              {formatPrice(deposit.total_deposited)} / {formatPrice(deposit.product_price)}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-md bg-paper-2">
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${progress}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, delay: index * 0.1 }}
                              className="h-full bg-ink"
                            />
                          </div>
                          <div className="mt-2 flex justify-between text-xs text-muted">
                            <span>{progress.toFixed(1)}% Complete</span>
                            {deposit.remaining_balance > 0 ? (
                              <span className="font-medium text-gold">
                                Remaining: {formatPrice(deposit.remaining_balance)}
                              </span>
                            ) : (
                              <span className="font-medium text-ink">Fully Paid!</span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="mb-1 font-medium text-muted">Last Deposit</div>
                            <div className="font-medium text-ink">{formatPrice(deposit.deposit_amount)}</div>
                          </div>
                          <div>
                            <div className="mb-1 font-medium text-muted">Payment Method</div>
                            <div className="font-medium capitalize text-ink">
                              {deposit.payment_method?.replace('_', ' ')}
                            </div>
                          </div>
                          <div>
                            <div className="mb-1 font-medium text-muted">Deposit Date</div>
                            <div className="flex items-center gap-1 font-medium text-ink">
                              <Calendar size={14} />
                              {formatDate(deposit.deposit_date || deposit.created_at)}
                            </div>
                          </div>
                          {deposit.payment_reference && (
                            <div>
                              <div className="mb-1 font-medium text-muted">Reference</div>
                              <div className="font-mono text-xs font-medium text-ink">
                                {deposit.payment_reference}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-between md:w-48">
                        <div className="mb-4 text-right">
                          <div className="mb-1 text-xs text-muted">Total Deposited</div>
                          <div className="font-serif text-2xl text-ink-deep">
                            {formatPrice(deposit.total_deposited)}
                          </div>
                        </div>
                        {deposit.remaining_balance > 0 && (
                          <Button
                            onClick={() => {
                              const shopSection = document.getElementById('shop');
                              if (shopSection) {
                                shopSection.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className="w-full text-sm"
                          >
                            Make Another Deposit
                          </Button>
                        )}
                      </div>
                    </div>

                    {deposit.notes && (
                      <div className="mt-4 border-t border-rule pt-4">
                        <div className="mb-1 text-xs font-medium text-muted">Notes</div>
                        <div className="text-sm text-ink">{deposit.notes}</div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {filteredDeposits.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="panel-dark mt-8 p-6 text-paper"
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div>
                    <div className="mb-1 text-sm text-paper/70">Total Deposits</div>
                    <div className="font-serif text-2xl">
                      {filteredDeposits.length}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-sm text-paper/70">Total Amount</div>
                    <div className="font-serif text-2xl">
                      {formatPrice(filteredDeposits.reduce((sum, d) => sum + parseFloat(d.total_deposited || 0), 0))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-sm text-paper/70">Completed</div>
                    <div className="font-serif text-2xl">
                      {filteredDeposits.filter(d => d.status === 'completed').length}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}

        {deposits.length === 0 && !loading && searching && (
          <div className="rounded-2xl border border-rule bg-surface py-16 text-center shadow-[0_1px_2px_rgb(14_36_54/0.04)]">
            <Package className="mx-auto mb-4 text-rule" size={48} />
            <p className="text-lg font-medium text-ink">No deposits found</p>
            <p className="mt-2 text-sm text-muted">Please check your email or phone number and try again.</p>
          </div>
        )}
      </Container>
    </section>
  );
}
