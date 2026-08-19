'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Users, Mail, Package, Image, MessageCircle, Briefcase, BookOpen, ShoppingCart, CreditCard, PackageCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    messages: 0,
    services: 0,
    heroImages: 0,
    testimonials: 0,
    products: 0,
    deposits: 0,
    orders: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch message count
      const { count: messageCount } = await supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true });

      // Fetch services count
      const { count: servicesCount } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true });

      // Fetch products count
      const { count: productsCount } = await supabase
        .from('shop_products')
        .select('*', { count: 'exact', head: true });

      // Fetch deposits count
      const { count: depositsCount } = await supabase
        .from('customer_deposits')
        .select('*', { count: 'exact', head: true });

      // Fetch orders count
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // For now, we'll set hero images and testimonials to 0 since we don't have those tables yet
      setStats({
        messages: messageCount || 0,
        services: servicesCount || 0,
        heroImages: 0,
        testimonials: 0,
        products: productsCount || 0,
        deposits: depositsCount || 0,
        orders: ordersCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { name: 'Messages', value: stats.messages, icon: Mail },
    { name: 'Services', value: stats.services, icon: Package },
    { name: 'Hero Images', value: stats.heroImages, icon: Image },
    { name: 'Testimonials', value: stats.testimonials, icon: MessageCircle },
    { name: 'Shop Products', value: stats.products, icon: ShoppingCart },
    { name: 'Deposits', value: stats.deposits, icon: CreditCard },
    { name: 'Orders', value: stats.orders, icon: PackageCheck },
  ];

  const quickActions = [
    { name: 'View Messages', href: '/admin/messages', icon: Mail },
    { name: 'Manage Services', href: '/admin/services', icon: Package },
    { name: 'Update Hero Images', href: '/admin/hero-images', icon: Image },
    { name: 'Manage Testimonials', href: '/admin/testimonials', icon: MessageCircle },
    { name: 'View Job Postings', href: '/admin/careers', icon: Briefcase },
    { name: 'Manage Blog Posts', href: '/admin/blog', icon: BookOpen },
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'Shop Products', href: '/admin/shop', icon: ShoppingCart },
    { name: 'Customer Deposits', href: '/admin/deposits', icon: CreditCard },
    { name: 'Orders', href: '/admin/orders', icon: PackageCheck },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-admin text-3xl text-ink-deep">Dashboard</h1>
        <p className="mt-2 text-muted">Welcome to your admin dashboard</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.name} className="border border-rule bg-surface p-5">
              <div className="flex items-center">
                <div className="border border-rule p-3 text-ink">
                  <Icon size={20} />
                </div>
                <div className="ml-4">
                  <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted">
                    {card.name}
                  </div>
                  <div className="font-admin text-2xl text-ink-deep">
                    {loading ? (
                      <div className="h-6 w-12 animate-pulse bg-paper-2" />
                    ) : (
                      card.value
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <a
              key={action.name}
              href={action.href}
              className="flex items-center border border-rule bg-surface p-5 transition-colors hover:border-ink"
            >
              <div className="border border-rule p-3 text-ink">
                <Icon size={20} />
              </div>
              <div className="ml-4 text-sm font-medium text-ink">{action.name}</div>
            </a>
          );
        })}
      </div>

      <div className="border border-rule bg-surface p-6">
        <h2 className="mb-4 font-admin text-xl text-ink-deep">Recent Activity</h2>
        <div className="py-12 text-center">
          <BarChart3 className="mx-auto text-rule" size={40} />
          <h3 className="mt-4 font-admin text-lg text-ink-deep">No recent activity</h3>
          <div className="mt-1 text-muted">Check back later for updates.</div>
        </div>
      </div>
    </div>
  );
}