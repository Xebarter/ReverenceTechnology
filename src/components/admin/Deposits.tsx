'use client';

import { useState, useEffect } from 'react';
import { Search, CheckCircle2, Clock, XCircle, Edit, DollarSign, Package, Mail, Phone, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';

interface Deposit {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  product_id: string;
  product_name: string;
  product_price: number;
  deposit_amount: number;
  total_deposited: number;
  remaining_balance: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_method: string;
  payment_reference: string | null;
  notes: string | null;
  admin_notes: string | null;
  deposit_date: string;
  expected_completion_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function Deposits() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    status: 'pending' as Deposit['status'],
    payment_reference: '',
    admin_notes: '',
  });

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_deposits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeposits(data || []);
    } catch (error) {
      console.error('Error fetching deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (depositId: string, newStatus: Deposit['status']) => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('customer_deposits')
        .update(updateData)
        .eq('id', depositId);

      if (error) throw error;
      fetchDeposits();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleEdit = (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setEditFormData({
      status: deposit.status,
      payment_reference: deposit.payment_reference || '',
      admin_notes: deposit.admin_notes || '',
    });
    setShowEditModal(true);
  };

  const openDetails = (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setShowDetails(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedDeposit) return;

    try {
      const updateData: any = {
        status: editFormData.status,
        payment_reference: editFormData.payment_reference.trim() || null,
        admin_notes: editFormData.admin_notes || null,
        updated_at: new Date().toISOString(),
      };

      if (editFormData.status === 'completed' && selectedDeposit.status !== 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('customer_deposits')
        .update(updateData)
        .eq('id', selectedDeposit.id);

      if (error) throw error;
      setShowEditModal(false);
      setSelectedDeposit(null);
      fetchDeposits();
    } catch (error) {
      console.error('Error updating deposit:', error);
      alert('Failed to update deposit');
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

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-paper-2 text-ink border-rule', icon: Clock, label: 'Pending' },
      confirmed: { color: 'bg-paper text-ink border-rule', icon: CheckCircle2, label: 'Confirmed' },
      completed: { color: 'bg-paper text-ink border-rule', icon: CheckCircle2, label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Cancelled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.color}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const calculateProgress = (deposit: Deposit) => {
    if (!deposit.product_price || deposit.product_price === 0) return 0;
    return Math.min(100, (deposit.total_deposited / deposit.product_price) * 100);
  };

  const filteredDeposits = deposits.filter(deposit => {
    const matchesStatus = statusFilter === 'all' || deposit.status === statusFilter;
    const matchesSearch = 
      deposit.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deposit.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deposit.customer_phone.includes(searchQuery) ||
      deposit.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (deposit.payment_reference && deposit.payment_reference.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: deposits.length,
    pending: deposits.filter(d => d.status === 'pending').length,
    confirmed: deposits.filter(d => d.status === 'confirmed').length,
    completed: deposits.filter(d => d.status === 'completed').length,
    totalAmount: deposits.reduce((sum, d) => sum + parseFloat(d.total_deposited.toString() || '0'), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rule border-t-ink rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted font-medium">Loading deposits...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-admin text-3xl text-ink-deep">Customer Deposits</h1>
        <p className="text-muted mt-2">Manage and track customer deposits for products</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <div className="bg-surface p-6 border border-rule">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted">Total Deposits</div>
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
            <div className="text-sm font-medium text-muted">Confirmed</div>
            <CheckCircle2 className="text-ink" size={20} />
          </div>
          <div className="text-2xl font-bold text-ink">{stats.confirmed}</div>
        </div>
        <div className="bg-surface p-6 border border-rule">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted">Completed</div>
            <CheckCircle2 className="text-ink" size={20} />
          </div>
          <div className="text-2xl font-bold text-ink">{stats.completed}</div>
        </div>
        <div className="bg-surface p-6 border border-rule">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-muted">Total Amount</div>
            <DollarSign className="text-ink" size={20} />
          </div>
          <div className="text-xl font-bold text-ink">{formatPrice(stats.totalAmount)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface p-6 border border-rule mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, phone, product, or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-rule rounded-lg focus:outline-none focus:ring-1 focus:border-ink focus:ring-1 focus:ring-ink"
            />
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`shrink-0 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${ statusFilter === status ? 'bg-ink text-paper ' : 'bg-paper text-ink hover:bg-paper-2' }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-4">
        {filteredDeposits.map((deposit) => {
          const progress = calculateProgress(deposit);
          return (
            <div key={deposit.id} className="bg-surface border border-rule p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-ink-deep truncate">{deposit.customer_name}</div>
                  <div className="text-xs text-muted mt-1">{formatDate(deposit.deposit_date || deposit.created_at)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openDetails(deposit)}
                    className="p-2 text-ink bg-paper rounded-lg"
                    title="View details"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(deposit)}
                    className="p-2 text-ink bg-paper rounded-lg"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 items-center">
                {getStatusBadge(deposit.status)}
                <select
                  value={deposit.status}
                  onChange={(e) => handleStatusUpdate(deposit.id, e.target.value as Deposit['status'])}
                  className="px-3 py-2 text-sm font-semibold border border-rule rounded-lg focus:outline-none focus:ring-1 focus:ring-ink bg-surface"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="mt-3">
                <div className="font-semibold text-ink-deep truncate">{deposit.product_name}</div>
                <div className="text-xs text-muted">{formatPrice(deposit.product_price)}</div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-paper border border-rule p-3">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-muted">Last deposit</div>
                  <div className="mt-1 font-bold text-ink">{formatPrice(deposit.deposit_amount)}</div>
                </div>
                <div className="rounded-lg bg-paper border border-rule p-3">
                  <div className="text-[11px] font-bold uppercase tracking-wide text-muted">Remaining</div>
                  <div className="mt-1 font-bold text-ink-deep">{formatPrice(deposit.remaining_balance)}</div>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-muted">{progress.toFixed(0)}%</span>
                  <span className="text-ink">{formatPrice(deposit.total_deposited)}</span>
                </div>
                <div className="w-full bg-paper-2 rounded-full h-2">
                  <div
                    className="bg-ink h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {deposit.payment_reference && (
                <div className="mt-3 text-xs text-muted">
                  Ref: <span className="font-mono">{deposit.payment_reference}</span>
                </div>
              )}
            </div>
          );
        })}

        {filteredDeposits.length === 0 && (
          <div className="text-center py-12 bg-surface border border-rule">
            <Package className="mx-auto text-muted mb-4" size={48} />
            <p className="text-muted text-lg">No deposits found</p>
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
                <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Progress</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {filteredDeposits.map((deposit) => {
                const progress = calculateProgress(deposit);
                return (
                  <tr key={deposit.id} className="hover:bg-paper transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-ink-deep">{deposit.customer_name}</div>
                        <div className="text-sm text-muted flex items-center gap-1 mt-1">
                          <Mail size={12} />
                          {deposit.customer_email}
                        </div>
                        <div className="text-sm text-muted flex items-center gap-1">
                          <Phone size={12} />
                          {deposit.customer_phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-ink-deep">{deposit.product_name}</div>
                      <div className="text-sm text-muted">{formatPrice(deposit.product_price)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32">
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-muted">{progress.toFixed(0)}%</span>
                          <span className="text-ink">{formatPrice(deposit.total_deposited)}</span>
                        </div>
                        <div className="w-full bg-paper-2 rounded-full h-2">
                          <div
                            className="bg-ink h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        {deposit.remaining_balance > 0 && (
                          <div className="text-xs text-muted mt-1">
                            Remaining: {formatPrice(deposit.remaining_balance)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-ink">{formatPrice(deposit.deposit_amount)}</div>
                      <div className="text-xs text-muted">Last deposit</div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(deposit.status)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-ink-deep">{formatDate(deposit.deposit_date || deposit.created_at)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openDetails(deposit)}
                          className="p-2 text-ink hover:bg-paper rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(deposit)}
                          className="p-2 text-ink hover:bg-paper rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <select
                          value={deposit.status}
                          onChange={(e) => handleStatusUpdate(deposit.id, e.target.value as Deposit['status'])}
                          className="px-3 py-1 text-xs font-semibold border border-rule rounded-lg focus:outline-none focus:ring-1 focus:ring-ink"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredDeposits.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto text-muted mb-4" size={48} />
            <p className="text-muted text-lg">No deposits found</p>
            <p className="text-muted text-sm mt-2">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Details Drawer */}
      {showDetails && selectedDeposit && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDetails(false)} />
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="relative h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-rule bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:h-full sm:max-w-xl sm:rounded-none sm:border-l sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-muted">Customer deposit</div>
                <div className="text-2xl font-bold text-ink-deep mt-1">{selectedDeposit.customer_name}</div>
                <div className="mt-3">{getStatusBadge(selectedDeposit.status)}</div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="px-3 py-2 rounded-lg border border-rule text-ink hover:bg-paper"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div className="bg-paper p-4">
                <div className="text-sm font-semibold text-ink mb-3">Customer</div>
                <div className="text-sm text-ink space-y-1">
                  <div><span className="font-semibold">Email:</span> {selectedDeposit.customer_email}</div>
                  <div><span className="font-semibold">Phone:</span> {selectedDeposit.customer_phone}</div>
                </div>
              </div>

              <div className="bg-paper p-4">
                <div className="text-sm font-semibold text-ink mb-3">Deposit</div>
                <div className="space-y-2 text-sm text-ink">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{selectedDeposit.product_name}</div>
                    <div className="text-muted">{formatPrice(selectedDeposit.product_price)}</div>
                  </div>
                  <div className="pt-3 border-t border-rule grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-semibold">Last deposit:</span> {formatPrice(selectedDeposit.deposit_amount)}</div>
                    <div><span className="font-semibold">Total deposited:</span> {formatPrice(selectedDeposit.total_deposited)}</div>
                    <div><span className="font-semibold">Remaining:</span> {formatPrice(selectedDeposit.remaining_balance)}</div>
                    <div><span className="font-semibold">Method:</span> {selectedDeposit.payment_method}</div>
                  </div>
                  {selectedDeposit.payment_reference && (
                    <div className="pt-2 text-xs text-muted">
                      <span className="font-semibold">Reference:</span>{' '}
                      <span className="font-mono">{selectedDeposit.payment_reference}</span>
                    </div>
                  )}
                  <div className="text-xs text-muted pt-2">
                    Date: {formatDate(selectedDeposit.deposit_date || selectedDeposit.created_at)}
                  </div>
                </div>
              </div>

              <div className="bg-paper p-4">
                <div className="text-sm font-semibold text-ink mb-2">Customer notes</div>
                <div className="text-sm text-ink whitespace-pre-wrap">
                  {selectedDeposit.notes ? selectedDeposit.notes : <span className="text-muted italic">None</span>}
                </div>
              </div>

              <div className="bg-paper p-4">
                <div className="text-sm font-semibold text-ink mb-2">Internal notes</div>
                <div className="text-sm text-ink whitespace-pre-wrap">
                  {selectedDeposit.admin_notes ? selectedDeposit.admin_notes : <span className="text-muted italic">None</span>}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDetails(false);
                    handleEdit(selectedDeposit);
                  }}
                  className="flex-1 px-4 py-3 bg-ink text-paper font-bold hover:bg-ink-deep transition-colors"
                >
                  Edit deposit
                </button>
                <button
                  onClick={async () => {
                    setShowDetails(false);
                    await fetchDeposits();
                  }}
                  className="px-4 py-3 border border-rule font-bold hover:bg-paper transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedDeposit && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-rule bg-surface sm:rounded-none"
          >
            <div className="p-6 border-b border-rule">
              <h2 className="text-2xl font-bold text-ink-deep">Edit Deposit</h2>
              <p className="text-muted mt-1">Update deposit status and add admin notes</p>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-ink mb-2">Status</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as Deposit['status'] })}
                  className="w-full px-4 py-3 border border-rule focus:border-ink focus:ring-1 focus:ring-ink outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-ink mb-2">Payment Reference (optional)</label>
                <input
                  type="text"
                  value={editFormData.payment_reference}
                  onChange={(e) => setEditFormData({ ...editFormData, payment_reference: e.target.value })}
                  className="w-full px-4 py-3 border border-rule focus:border-ink focus:ring-1 focus:ring-ink outline-none"
                  placeholder="Transaction ID / Reference"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-ink mb-2">Admin Notes</label>
                <textarea
                  value={editFormData.admin_notes}
                  onChange={(e) => setEditFormData({ ...editFormData, admin_notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-rule focus:border-ink focus:ring-1 focus:ring-ink outline-none resize-none"
                  placeholder="Internal notes (not visible to customer)..."
                />
              </div>
              <div className="bg-paper p-4">
                <div className="text-sm font-semibold text-ink mb-2">Deposit Details</div>
                <div className="space-y-2 text-sm text-muted">
                  <div><span className="font-semibold">Customer:</span> {selectedDeposit.customer_name}</div>
                  <div><span className="font-semibold">Product:</span> {selectedDeposit.product_name}</div>
                  <div><span className="font-semibold">Total Deposited:</span> {formatPrice(selectedDeposit.total_deposited)}</div>
                  <div><span className="font-semibold">Remaining:</span> {formatPrice(selectedDeposit.remaining_balance)}</div>
                  {selectedDeposit.payment_reference && (
                    <div><span className="font-semibold">Reference:</span> {selectedDeposit.payment_reference}</div>
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedDeposit(null);
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

