'use client';

import { useState, useEffect } from 'react';
import { Search, Package, CheckCircle2, Clock, XCircle, Truck, Edit, DollarSign, Mail, Phone, Boxes } from 'lucide-react';
import { motion } from 'framer-motion';
import { adminSupabase } from '../../lib/supabase';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  country: string;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_reference: string | null;
  order_status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  shipping_fee: number;
  items: any[];
  notes: string | null;
  admin_notes: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    order_status: 'pending' as Order['order_status'],
    payment_status: 'pending' as Order['payment_status'],
    tracking_number: '',
    admin_notes: '',
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await adminSupabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setEditFormData({
      order_status: order.order_status,
      payment_status: order.payment_status,
      tracking_number: order.tracking_number || '',
      admin_notes: order.admin_notes || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedOrder) return;

    try {
      const updateData: any = {
        order_status: editFormData.order_status,
        payment_status: editFormData.payment_status,
        tracking_number: editFormData.tracking_number || null,
        admin_notes: editFormData.admin_notes || null,
        updated_at: new Date().toISOString(),
      };

      if (editFormData.order_status === 'shipped' && selectedOrder.order_status !== 'shipped') {
        updateData.shipped_at = new Date().toISOString();
      }

      if (editFormData.order_status === 'delivered' && selectedOrder.order_status !== 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await adminSupabase
        .from('orders')
        .update(updateData)
        .eq('id', selectedOrder.id);

      if (error) throw error;
      setShowEditModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order');
    }
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string, type: 'order' | 'payment') => {
    const statusConfig = {
      order: {
        pending: { color: 'bg-paper-2 text-ink border-rule', icon: Clock, label: 'Pending' },
        confirmed: { color: 'bg-paper text-ink border-rule', icon: CheckCircle2, label: 'Confirmed' },
        processing: { color: 'bg-paper text-ink border-rule', icon: Package, label: 'Processing' },
        shipped: { color: 'bg-paper text-ink border-rule', icon: Truck, label: 'Shipped' },
        delivered: { color: 'bg-paper text-ink border-rule', icon: CheckCircle2, label: 'Delivered' },
        cancelled: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Cancelled' },
      },
      payment: {
        pending: { color: 'bg-paper-2 text-ink border-rule', icon: Clock, label: 'Pending' },
        paid: { color: 'bg-paper text-ink border-rule', icon: CheckCircle2, label: 'Paid' },
        failed: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Failed' },
        refunded: { color: 'bg-paper text-ink border-rule', icon: XCircle, label: 'Refunded' },
      },
    };

    const config = statusConfig[type][status as keyof typeof statusConfig[typeof type]] || statusConfig[type].pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter;
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone.includes(searchQuery) ||
      (order.tracking_number && order.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesPayment && matchesSearch;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.order_status === 'pending').length,
    processing: orders.filter(o => o.order_status === 'processing').length,
    shipped: orders.filter(o => o.order_status === 'shipped').length,
    delivered: orders.filter(o => o.order_status === 'delivered').length,
    totalRevenue: orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + parseFloat(o.total_amount.toString() || '0'), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rule border-t-ink rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-admin text-3xl text-ink-deep">Orders Management</h1>
        <p className="text-muted mt-2">Manage and track customer orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <div className="bg-surface p-6 border border-rule">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted">Total Orders</div>
            <Package className="text-ink" size={20} />
          </div>
          <div className="text-2xl font-bold text-ink-deep">{stats.total}</div>
        </div>
        <div className="bg-surface p-6 border border-rule">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted">Pending</div>
            <Clock className="text-gold" size={20} />
          </div>
          <div className="text-2xl font-bold text-gold">{stats.pending}</div>
        </div>
        <div className="bg-surface p-6 border border-rule">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted">Processing</div>
            <Package className="text-ink" size={20} />
          </div>
          <div className="text-2xl font-bold text-ink">{stats.processing}</div>
        </div>
        <div className="bg-surface p-6 border border-rule">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted">Shipped</div>
            <Truck className="text-ink" size={20} />
          </div>
          <div className="text-2xl font-bold text-ink">{stats.shipped}</div>
        </div>
        <div className="bg-surface p-6 border border-rule">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted">Delivered</div>
            <CheckCircle2 className="text-ink" size={20} />
          </div>
          <div className="text-2xl font-bold text-ink">{stats.delivered}</div>
        </div>
        <div className="bg-surface p-6 border border-rule">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted">Revenue</div>
            <DollarSign className="text-gold" size={20} />
          </div>
          <div className="text-xl font-bold text-ink">{formatPrice(stats.totalRevenue)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface p-6 border border-rule mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={20} />
            <input
              type="text"
              placeholder="Search by order number, customer name, email, phone, or tracking..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-rule rounded-lg focus:outline-none focus:ring-1 focus:border-ink focus:ring-1 focus:ring-ink"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-rule rounded-lg focus:outline-none focus:ring-1 focus:ring-ink"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-4 py-2 border border-rule rounded-lg focus:outline-none focus:ring-1 focus:ring-ink"
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-surface border border-rule p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-bold text-ink-deep truncate">{order.order_number}</div>
                <div className="text-xs text-muted mt-1">{formatDate(order.created_at)}</div>
              </div>
              <button
                onClick={() => handleEdit(order)}
                className="shrink-0 p-2 text-ink bg-paper rounded-lg"
                title="Edit Order"
              >
                <Edit size={18} />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {getStatusBadge(order.order_status, 'order')}
              {getStatusBadge(order.payment_status, 'payment')}
            </div>

            <div className="mt-3 text-sm text-ink">
              <div className="font-semibold text-ink-deep">{order.customer_name}</div>
              <div className="text-xs text-muted truncate">{order.customer_email}</div>
              <div className="text-xs text-muted truncate">{order.customer_phone}</div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-paper border border-rule p-3">
                <div className="text-[11px] font-bold uppercase tracking-wide text-muted">Amount</div>
                <div className="mt-1 font-bold text-ink">{formatPrice(order.total_amount)}</div>
              </div>
              <div className="rounded-lg bg-paper border border-rule p-3">
                <div className="text-[11px] font-bold uppercase tracking-wide text-muted flex items-center gap-1">
                  <Boxes size={14} />
                  Items
                </div>
                <div className="mt-1 text-sm text-ink-deep">
                  {Array.isArray(order.items) ? order.items.length : 0} item(s)
                </div>
                {Array.isArray(order.items) && order.items.length > 0 && (
                  <div className="text-xs text-muted mt-1 truncate">{order.items[0].product_name}</div>
                )}
              </div>
            </div>

            {order.tracking_number && (
              <div className="mt-3 text-xs text-muted">
                <Truck size={12} className="inline mr-1" />
                {order.tracking_number}
              </div>
            )}
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 bg-surface border border-rule">
            <Package className="mx-auto text-muted mb-4" size={48} />
            <p className="text-muted text-lg">No orders found</p>
            <p className="text-muted text-sm mt-2">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-surface border border-rule overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-paper border-b border-rule">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Order</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Items</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-paper transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-ink-deep">{order.order_number}</div>
                    {order.tracking_number && (
                      <div className="text-xs text-muted mt-1">
                        <Truck size={12} className="inline mr-1" />
                        {order.tracking_number}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-ink-deep">{order.customer_name}</div>
                    <div className="text-sm text-muted flex items-center gap-1 mt-1">
                      <Mail size={12} />
                      {order.customer_email}
                    </div>
                    <div className="text-sm text-muted flex items-center gap-1">
                      <Phone size={12} />
                      {order.customer_phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-ink-deep">
                      {Array.isArray(order.items) ? order.items.length : 0} item(s)
                    </div>
                    {Array.isArray(order.items) && order.items.length > 0 && (
                      <div className="text-xs text-muted mt-1">
                        {order.items[0].product_name}
                        {order.items.length > 1 && ` +${order.items.length - 1} more`}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-ink">{formatPrice(order.total_amount)}</div>
                    {order.shipping_fee > 0 && (
                      <div className="text-xs text-muted">Shipping: {formatPrice(order.shipping_fee)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(order.order_status, 'order')}</td>
                  <td className="px-6 py-4">{getStatusBadge(order.payment_status, 'payment')}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-ink-deep">{formatDate(order.created_at)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEdit(order)}
                      className="p-2 text-ink hover:bg-paper rounded-lg transition-colors"
                      title="Edit Order"
                    >
                      <Edit size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto text-muted mb-4" size={48} />
            <p className="text-muted text-lg">No orders found</p>
            <p className="text-muted text-sm mt-2">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border border-rule bg-surface max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-rule">
              <h2 className="text-2xl font-bold text-ink-deep">Edit Order: {selectedOrder.order_number}</h2>
              <p className="text-muted mt-1">Update order status and add admin notes</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-ink mb-2">Order Status</label>
                  <select
                    value={editFormData.order_status}
                    onChange={(e) => setEditFormData({ ...editFormData, order_status: e.target.value as Order['order_status'] })}
                    className="w-full px-4 py-3 border border-rule focus:border-ink focus:ring-1 focus:ring-ink outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-ink mb-2">Payment Status</label>
                  <select
                    value={editFormData.payment_status}
                    onChange={(e) => setEditFormData({ ...editFormData, payment_status: e.target.value as Order['payment_status'] })}
                    className="w-full px-4 py-3 border border-rule focus:border-ink focus:ring-1 focus:ring-ink outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-ink mb-2">Tracking Number</label>
                  <input
                    type="text"
                    value={editFormData.tracking_number}
                    onChange={(e) => setEditFormData({ ...editFormData, tracking_number: e.target.value })}
                    className="w-full px-4 py-3 border border-rule focus:border-ink focus:ring-1 focus:ring-ink outline-none"
                    placeholder="Enter tracking number"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-ink mb-2">Admin Notes</label>
                  <textarea
                    value={editFormData.admin_notes}
                    onChange={(e) => setEditFormData({ ...editFormData, admin_notes: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-rule focus:border-ink focus:ring-1 focus:ring-ink outline-none resize-none"
                    placeholder="Internal notes (not visible to customer)..."
                  />
                </div>
              </div>
              
              {/* Order Details */}
              <div className="bg-paper p-4">
                <div className="text-sm font-semibold text-ink mb-3">Order Details</div>
                <div className="grid grid-cols-2 gap-4 text-sm text-muted">
                  <div><span className="font-semibold">Customer:</span> {selectedOrder.customer_name}</div>
                  <div><span className="font-semibold">Email:</span> {selectedOrder.customer_email}</div>
                  <div><span className="font-semibold">Phone:</span> {selectedOrder.customer_phone}</div>
                  <div><span className="font-semibold">Total:</span> {formatPrice(selectedOrder.total_amount)}</div>
                  <div className="col-span-2">
                    <span className="font-semibold">Shipping:</span> {selectedOrder.shipping_address}, {selectedOrder.city}, {selectedOrder.country}
                  </div>
                  {selectedOrder.payment_reference && (
                    <div className="col-span-2">
                      <span className="font-semibold">Payment Ref:</span> {selectedOrder.payment_reference}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedOrder(null);
                  }}
                  className="flex-1 px-6 py-3 border border-rule text-ink font-bold hover:bg-paper transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-6 py-3 bg-ink text-paper font-bold hover:bg-ink-deep transition-all"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

