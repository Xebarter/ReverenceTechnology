'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  ClipboardList,
  Banknote,
  CreditCard,
  Image,
  Mail,
  MessageCircle,
  Package,
  PackageCheck,
  Phone,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatUgx } from '../../lib/projectMoney';

type Inquiry = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  message?: string | null;
  service_interest?: string | null;
  interested_package?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type OrderRow = {
  id: string;
  order_number?: string | null;
  customer_name?: string | null;
  total_amount?: number | null;
  payment_status?: string | null;
  created_at?: string | null;
};

const quickActions = [
  { name: 'Messages', detail: 'Quotes and inbound mail', href: '/admin/messages', icon: Mail },
  { name: 'Calls', detail: 'Booked conversations', href: '/admin/scheduled-calls', icon: Phone },
  { name: 'Client projects', detail: 'Active work and balances', href: '/admin/client-projects', icon: ClipboardList },
  { name: 'Orders', detail: 'Shop and payment records', href: '/admin/orders', icon: PackageCheck },
  { name: 'Deposits', detail: 'Customer deposits', href: '/admin/deposits', icon: CreditCard },
  { name: 'Disbursements', detail: 'Paytota balance and payouts', href: '/admin/disbursement', icon: Banknote },
  { name: 'Services', detail: 'Packages on the site', href: '/admin/services', icon: Package },
  { name: 'Shop', detail: 'Products in the catalogue', href: '/admin/shop', icon: ShoppingCart },
  { name: 'Careers', detail: 'Open roles', href: '/admin/careers', icon: Briefcase },
  { name: 'Blog', detail: 'Published writing', href: '/admin/blog', icon: BookOpen },
  { name: 'Testimonials', detail: 'Client quotes', href: '/admin/testimonials', icon: MessageCircle },
  { name: 'Hero images', detail: 'Homepage photography', href: '/admin/hero-images', icon: Image },
  { name: 'Users', detail: 'Admin access', href: '/admin/users', icon: Users },
];

function when(iso?: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-UG', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusTone(status?: string | null) {
  const value = (status || 'new').toLowerCase();
  if (value === 'paid' || value === 'replied' || value === 'closed') return 'bg-ink text-paper';
  if (value === 'failed' || value === 'cancelled') return 'bg-red-50 text-red-700';
  return 'bg-paper-2 text-ink';
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    messages: 0,
    orders: 0,
    deposits: 0,
    projects: 0,
    services: 0,
    products: 0,
    calls: 0,
  });
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [messages, ordersCount, deposits, projects, services, products, calls, recentMail, recentOrders] =
          await Promise.all([
            supabase.from('inquiries').select('*', { count: 'exact', head: true }),
            supabase.from('orders').select('*', { count: 'exact', head: true }),
            supabase.from('customer_deposits').select('*', { count: 'exact', head: true }),
            supabase.from('client_projects').select('*', { count: 'exact', head: true }),
            supabase.from('services').select('*', { count: 'exact', head: true }),
            supabase.from('shop_products').select('*', { count: 'exact', head: true }),
            supabase.from('scheduled_calls').select('*', { count: 'exact', head: true }),
            supabase.from('inquiries').select('*').order('created_at', { ascending: false }).limit(5),
            supabase
              .from('orders')
              .select('id,order_number,customer_name,total_amount,payment_status,created_at')
              .order('created_at', { ascending: false })
              .limit(5),
          ]);

        setStats({
          messages: messages.count || 0,
          orders: ordersCount.count || 0,
          deposits: deposits.count || 0,
          projects: projects.count || 0,
          services: services.count || 0,
          products: products.count || 0,
          calls: calls.count || 0,
        });
        setInquiries((recentMail.data as Inquiry[]) || []);
        setOrders((recentOrders.data as OrderRow[]) || []);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const metrics = [
    { name: 'Messages', value: stats.messages, href: '/admin/messages', hint: 'Inbound' },
    { name: 'Orders', value: stats.orders, href: '/admin/orders', hint: 'All time' },
    { name: 'Deposits', value: stats.deposits, href: '/admin/deposits', hint: 'Recorded' },
    { name: 'Projects', value: stats.projects, href: '/admin/client-projects', hint: 'Client work' },
    { name: 'Calls', value: stats.calls, href: '/admin/scheduled-calls', hint: 'Scheduled' },
    { name: 'Services', value: stats.services, href: '/admin/services', hint: 'Packages' },
    { name: 'Products', value: stats.products, href: '/admin/shop', hint: 'In the shop' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">Today</p>
          <h1 className="mt-2 text-3xl tracking-tight text-ink-deep">Dashboard</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            A quick read of what came in, what was paid, and where to go next.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.slice(0, 4).map((metric) => (
          <Link
            key={metric.name}
            href={metric.href}
            className="group min-w-0 rounded-2xl border border-rule bg-surface p-4 shadow-[0_1px_2px_rgb(14_36_54/0.04)] transition duration-200 hover:border-ink/30 sm:p-5 sm:hover:-translate-y-0.5 sm:hover:shadow-[0_16px_40px_-24px_rgb(14_36_54/0.55)]"
          >
            <div className="flex items-center justify-between text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
              {metric.name}
              <ArrowUpRight size={14} className="text-gold opacity-0 transition group-hover:opacity-100" />
            </div>
            <div className="mt-3 text-2xl tabular-nums tracking-tight text-ink-deep sm:text-3xl">
              {loading ? <span className="inline-block h-8 w-12 animate-pulse rounded-lg bg-paper-2" /> : metric.value}
            </div>
            <p className="mt-1 text-xs text-muted">{metric.hint}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {metrics.slice(4).map((metric) => (
          <Link
            key={metric.name}
            href={metric.href}
            className="rounded-2xl border border-rule bg-surface px-4 py-4 transition duration-200 hover:border-ink/30"
          >
            <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">{metric.name}</div>
            <div className="mt-1 text-xl tabular-nums text-ink-deep">
              {loading ? <span className="inline-block h-6 w-8 animate-pulse rounded bg-paper-2" /> : metric.value}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <section className="rounded-2xl border border-rule bg-surface xl:col-span-3">
          <div className="flex items-center justify-between border-b border-rule px-5 py-4">
            <h2 className="text-base font-medium text-ink-deep">Latest messages</h2>
            <Link href="/admin/messages" className="text-sm text-muted hover:text-ink">
              Open inbox
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((row) => (
                <div key={row} className="h-14 animate-pulse rounded-xl bg-paper-2" />
              ))}
            </div>
          ) : inquiries.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted">No messages yet.</p>
          ) : (
            <ul className="divide-y divide-rule">
              {inquiries.map((item) => (
                <li key={item.id}>
                  <Link href="/admin/messages" className="block px-5 py-4 transition-colors hover:bg-paper">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink-deep">{item.full_name || 'Unknown'}</p>
                        <p className="mt-0.5 truncate text-sm text-muted">
                          {item.service_interest || item.interested_package || item.email || 'Inquiry'}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-muted">{when(item.created_at)}</p>
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide ${statusTone(item.status)}`}>
                          {item.status || 'new'}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-rule bg-surface xl:col-span-2">
          <div className="flex items-center justify-between border-b border-rule px-5 py-4">
            <h2 className="text-base font-medium text-ink-deep">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-muted hover:text-ink">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((row) => (
                <div key={row} className="h-14 animate-pulse rounded-xl bg-paper-2" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-rule">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link href="/admin/orders" className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-paper">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-deep">{order.customer_name || 'Customer'}</p>
                      <p className="mt-0.5 text-xs text-muted">{order.order_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm tabular-nums text-ink-deep">{formatUgx(Number(order.total_amount || 0))}</p>
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide ${statusTone(order.payment_status)}`}>
                        {order.payment_status || 'pending'}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-base font-medium text-ink-deep">Jump to</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center gap-4 rounded-2xl border border-rule bg-surface px-4 py-4 transition duration-200 hover:border-ink/30 hover:bg-white"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-paper text-ink">
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink-deep">{action.name}</span>
                  <span className="block truncate text-xs text-muted">{action.detail}</span>
                </span>
                <ArrowUpRight size={16} className="ml-auto shrink-0 text-gold opacity-0 transition group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
