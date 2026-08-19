import { useState } from 'react';
import { Search, Package, Calendar, Truck, CheckCircle2, Clock, XCircle, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Badge, Button, Card, Container, FieldLabel, Input, PageHeader } from './ui';

export default function OrderTracking() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !phone && !orderNumber) {
      setError('Please enter your email, phone number, or order number');
      return;
    }

    setSearching(true);
    setLoading(true);
    setError('');

    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (orderNumber) {
        query = query.eq('order_number', orderNumber);
      } else if (email) {
        query = query.eq('customer_email', email);
      } else if (phone) {
        query = query.eq('customer_phone', phone);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setOrders(data || []);
      if (data && data.length === 0) {
        setError('No orders found. Please check your information and try again.');
      }
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to fetch orders. Please try again.');
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    return order.order_status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { icon: Clock, label: 'Pending' },
      confirmed: { icon: CheckCircle2, label: 'Confirmed' },
      processing: { icon: Package, label: 'Processing' },
      shipped: { icon: Truck, label: 'Shipped' },
      delivered: { icon: CheckCircle2, label: 'Delivered' },
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

  const getPaymentBadge = (status: string) => {
    const statusConfig = {
      pending: { icon: Clock, label: 'Pending' },
      paid: { icon: CheckCircle2, label: 'Paid' },
      failed: { icon: XCircle, label: 'Failed' },
      refunded: { icon: XCircle, label: 'Refunded' },
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

  return (
    <section className="min-h-screen bg-paper pb-16">
      <PageHeader
        eyebrow="Shop"
        title="Track your orders"
        description="Enter your order number, email, or phone number to view your order status."
      />

      <Container className="py-12">
        <Card className="mb-8 p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <FieldLabel htmlFor="order-number">Order Number</FieldLabel>
              <Input
                type="text"
                id="order-number"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="font-mono"
                placeholder="ORD-2025-XXXX-XXXX"
              />
            </div>
            <div className="text-center text-sm font-medium text-muted">OR</div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="order-email">Email Address</FieldLabel>
                <Input
                  type="email"
                  id="order-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <FieldLabel htmlFor="order-phone">Phone Number</FieldLabel>
                <Input
                  type="tel"
                  id="order-phone"
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
              {loading ? 'Searching...' : 'Track Order'}
            </Button>
          </form>
        </Card>

        {orders.length > 0 && (
          <>
            <div className="mb-6 flex items-center gap-4">
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
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
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="border border-rule bg-surface p-6"
                >
                  <div className="flex flex-col gap-6 md:flex-row">
                    <div className="flex-1">
                      <div className="mb-4 flex items-start justify-between">
                        <div>
                          <div className="mb-1 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-gold">Order Number</div>
                          <h3 className="mb-2 font-serif text-2xl font-medium text-ink-deep">{order.order_number}</h3>
                          <div className="flex gap-2">
                            {getStatusBadge(order.order_status)}
                            {getPaymentBadge(order.payment_status)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="mb-1 text-xs font-medium text-muted">Total Amount</div>
                          <div className="font-serif text-2xl text-ink-deep">
                            {formatPrice(order.total_amount)}
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="mb-2 text-sm font-medium text-ink">Order Items ({Array.isArray(order.items) ? order.items.length : 0})</div>
                        <div className="space-y-2">
                          {Array.isArray(order.items) && order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 rounded-md border border-rule bg-paper p-3">
                              {item.product_image && (
                                <img src={item.product_image} alt={item.product_name} className="h-12 w-12 rounded-md object-cover" />
                              )}
                              <div className="flex-1">
                                <div className="text-sm font-medium text-ink">{item.product_name}</div>
                                <div className="text-xs text-muted">Qty: {item.quantity} × {formatPrice(item.product_price)}</div>
                              </div>
                              <div className="font-medium text-ink">{formatPrice(item.subtotal || item.product_price * item.quantity)}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                        <div>
                          <div className="mb-1 flex items-center gap-1 font-medium text-muted">
                            <MapPin size={14} />
                            Shipping Address
                          </div>
                          <div className="font-medium text-ink">
                            {order.shipping_address}, {order.city}, {order.country}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 flex items-center gap-1 font-medium text-muted">
                            <Calendar size={14} />
                            Order Date
                          </div>
                          <div className="font-medium text-ink">{formatDate(order.created_at)}</div>
                        </div>
                        {order.tracking_number && (
                          <div>
                            <div className="mb-1 flex items-center gap-1 font-medium text-muted">
                              <Truck size={14} />
                              Tracking Number
                            </div>
                            <div className="font-mono font-medium text-ink">{order.tracking_number}</div>
                          </div>
                        )}
                        {order.shipped_at && (
                          <div>
                            <div className="mb-1 font-medium text-muted">Shipped On</div>
                            <div className="font-medium text-ink">{formatDate(order.shipped_at)}</div>
                          </div>
                        )}
                        {order.delivered_at && (
                          <div>
                            <div className="mb-1 font-medium text-muted">Delivered On</div>
                            <div className="font-medium text-ink">{formatDate(order.delivered_at)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {orders.length === 0 && !loading && searching && (
          <div className="rounded-md border border-rule bg-surface py-16 text-center">
            <Package className="mx-auto mb-4 text-rule" size={48} />
            <p className="text-lg font-medium text-ink">No orders found</p>
            <p className="mt-2 text-sm text-muted">Please check your order number, email, or phone number and try again.</p>
          </div>
        )}
      </Container>
    </section>
  );
}
