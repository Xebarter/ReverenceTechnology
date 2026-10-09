'use client';

import { useEffect, useState, type ReactNode } from 'react';
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
  ExternalLink,
  FolderOpen,
  ClipboardList,
  Phone,
  ShoppingCart,
  CreditCard,
  PackageCheck,
  Banknote,
} from 'lucide-react';

const groups = [
  {
    label: 'Overview',
    items: [{ name: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
  },
  {
    label: 'Inbox',
    items: [
      { name: 'Messages', href: '/admin/messages', icon: Mail },
      { name: 'Calls', href: '/admin/scheduled-calls', icon: Phone },
    ],
  },
  {
    label: 'Work',
    items: [
      { name: 'Client projects', href: '/admin/client-projects', icon: ClipboardList },
      { name: 'Services', href: '/admin/services', icon: Package },
      { name: 'Portfolio', href: '/admin/projects', icon: FolderOpen },
      { name: 'Careers', href: '/admin/careers', icon: Briefcase },
      { name: 'Blog', href: '/admin/blog', icon: BookOpen },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { name: 'Orders', href: '/admin/orders', icon: PackageCheck },
      { name: 'Deposits', href: '/admin/deposits', icon: CreditCard },
      { name: 'Disbursements', href: '/admin/disbursement', icon: Banknote },
      { name: 'Shop', href: '/admin/shop', icon: ShoppingCart },
    ],
  },
  {
    label: 'Site',
    items: [
      { name: 'Hero', href: '/admin/hero-images', icon: Image },
      { name: 'Testimonials', href: '/admin/testimonials', icon: MessageCircle },
      { name: 'Users', href: '/admin/users', icon: Users },
    ],
  },
];

function currentTitle(pathname: string) {
  for (const group of groups) {
    const match = group.items.find((item) => item.href === pathname);
    if (match) return match.name;
  }
  return 'Admin';
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/admin/auth');
  };

  const isActive = (path: string) => pathname === path;
  const initial = (user?.displayName || user?.email || 'A').trim().charAt(0).toUpperCase();

  useEffect(() => {
    if (!sidebarOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sidebarOpen]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="admin-shell min-h-dvh overflow-x-clip bg-paper font-admin text-ink">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink-deep/50 backdrop-blur-[2px] md:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(88vw,20rem)] flex-col bg-ink-deep text-paper transition-transform duration-300 ease-out md:w-[260px] ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/admin" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold text-gold">
              R
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight text-white">Reverence</span>
              <span className="block text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-gold">
                Operations
              </span>
            </span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-3 py-2">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-2 text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-white/35">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200 ${
                        active
                          ? 'bg-white/10 text-white'
                          : 'text-white/65 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-gold' : ''}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-1 border-t border-white/10 p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/65 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            View site
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-white/65 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="md:pl-[260px]">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-rule/80 bg-paper/90 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md md:h-16 md:px-8 md:py-0">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="shrink-0 rounded-xl border border-rule bg-surface p-2.5 text-ink md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-muted">Admin</p>
              <p className="truncate text-sm font-medium text-ink-deep">{currentTitle(pathname || '')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden text-sm text-muted sm:block">
              {new Date().toLocaleDateString('en-UG', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-semibold text-paper"
              title={user?.email || 'Signed in'}
            >
              {initial}
            </div>
          </div>
        </header>
        <main className="min-w-0 overflow-x-clip px-4 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
