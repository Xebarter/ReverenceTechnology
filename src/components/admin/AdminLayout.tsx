'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '../../UserContext';
import {
  LayoutDashboard,
  Mail,
  Package,
  Image,
  MessageCircle,
  Briefcase,
  BookOpen,
  Users,
  LogOut,
  Menu,
  X,
  User,
  FolderOpen,
  ClipboardList,
  Phone,
  ShoppingCart,
  CreditCard,
  PackageCheck,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin/auth');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Messages', href: '/admin/messages', icon: Mail },
    { name: 'Scheduled Calls', href: '/admin/scheduled-calls', icon: Phone },
    { name: 'Services', href: '/admin/services', icon: Package },
    { name: 'Hero Images', href: '/admin/hero-images', icon: Image },
    { name: 'Testimonials', href: '/admin/testimonials', icon: MessageCircle },
    { name: 'Portfolio', href: '/admin/projects', icon: FolderOpen },
    { name: 'Client projects', href: '/admin/client-projects', icon: ClipboardList },
    { name: 'Careers', href: '/admin/careers', icon: Briefcase },
    { name: 'Blog', href: '/admin/blog', icon: BookOpen },
    { name: 'Shop', href: '/admin/shop', icon: ShoppingCart },
    { name: 'Deposits', href: '/admin/deposits', icon: CreditCard },
    { name: 'Orders', href: '/admin/orders', icon: PackageCheck },
    { name: 'Users', href: '/admin/users', icon: Users },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-paper font-admin">
      <div className="fixed top-0 left-0 right-0 z-10 border-b border-rule bg-surface md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="font-admin text-lg text-ink-deep">Reverence Admin</h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-ink"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <aside
        className={`fixed inset-y-0 left-0 z-20 w-64 transform border-r border-rule bg-surface transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="flex h-full flex-col pt-14 md:pt-0">
          <div className="flex h-16 items-center border-b border-rule px-6">
            <div>
              <p className="font-admin text-lg text-ink-deep">Reverence</p>
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-gold">
                Admin
              </p>
            </div>
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-3 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center border-l-2 px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? 'border-gold bg-paper text-ink-deep'
                      : 'border-transparent text-muted hover:bg-paper hover:text-ink'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="space-y-1 border-t border-rule p-3">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center px-3 py-2.5 text-sm text-muted hover:text-ink"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </button>
            <Link
              href="/"
              className="flex items-center px-3 py-2.5 text-sm text-muted hover:text-ink"
            >
              <User className="mr-3 h-4 w-4" />
              Back to Site
            </Link>
          </div>
        </div>
      </aside>

      <div className="pt-14 md:ml-64 md:pt-0">
        <div className="p-4 md:p-8">{children}</div>
      </div>
    </div>
  );
}
