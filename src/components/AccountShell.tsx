'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Briefcase, FolderOpen, LayoutDashboard, Loader2, LogOut, Menu, Plus, X } from 'lucide-react';
import { useUser } from '../UserContext';
import { authPageHref } from '../lib/authRedirect';
import { Button } from './ui';

const nav = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, match: (p: string) => p === '/dashboard' },
  {
    name: 'Projects',
    href: '/dashboard/projects',
    icon: FolderOpen,
    match: (p: string) => p.startsWith('/dashboard/projects') && !p.startsWith('/dashboard/projects/new'),
  },
  {
    name: 'Applications',
    href: '/dashboard/applications',
    icon: Briefcase,
    match: (p: string) => p.startsWith('/dashboard/applications'),
  },
];

function initialsFromEmail(email: string) {
  const local = email.split('@')[0] || 'A';
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

function greetingName(email: string) {
  const local = email.split('@')[0] || 'there';
  const first = local.split(/[._-]+/).filter(Boolean)[0] || local;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export default function AccountShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useUser();

  useEffect(() => {
    if (loading || user) return;
    const search = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(authPageHref(`${pathname || '/dashboard'}${search}`));
  }, [loading, user, router, pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const current = pathname?.startsWith('/dashboard/projects/new')
    ? 'New project'
    : pathname?.match(/^\/dashboard\/projects\/[^/]+$/)
      ? 'Project'
      : nav.find((item) => item.match(pathname || ''))?.name || 'Account';

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-paper text-muted">
        <Loader2 className="animate-spin" size={18} />
        Loading your account...
      </div>
    );
  }

  const email = user.email || '';
  const name = greetingName(email);

  return (
    <div className="relative min-h-screen bg-paper">
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-rule bg-ink-deep px-4 py-3 text-paper md:hidden">
        <div className="min-w-0">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-gold">Account</p>
          <p className="truncate font-serif text-lg">{current}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-2"
          aria-expanded={open}
          aria-label={open ? 'Close account menu' : 'Open account menu'}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink-deep/50 md:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ink-deep text-paper shadow-[12px_0_40px_-28px_rgb(14_36_54/0.65)] transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="flex h-[4.25rem] items-center border-b border-paper/10 px-6">
          <Link href="/dashboard" className="min-w-0">
            <p className="font-serif text-lg tracking-tight">Reverence</p>
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-gold">Client portal</p>
          </Link>
        </div>

        <div className="flex items-center gap-3 border-b border-paper/10 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper/10 text-xs font-semibold tracking-wide">
            {initialsFromEmail(email)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-paper/55">{email}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.match(pathname || '');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-xl px-3 py-2.5 text-sm transition-colors duration-200 ${
                  active
                    ? 'bg-paper/10 text-paper'
                    : 'text-paper/65 hover:bg-paper/5 hover:text-paper'
                }`}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-paper/10 p-3">
          <Link
            href="/dashboard/projects/new"
            className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm text-paper transition-colors duration-200 hover:bg-paper/5"
          >
            <Plus className="mr-3 h-4 w-4 text-gold" />
            Start a project
          </Link>
          <Link href="/" className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm text-paper/65 transition-colors duration-200 hover:bg-paper/5 hover:text-paper">
            Back to site
          </Link>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              window.location.href = '/';
            }}
            className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm text-paper/65 transition-colors duration-200 hover:bg-paper/5 hover:text-paper"
          >
            <LogOut className="mr-3 h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="md:ml-64">
        <div className="hidden items-center justify-between border-b border-rule bg-surface px-8 py-4 md:flex lg:px-10">
          <div>
            <p className="font-serif text-lg text-ink-deep">{current}</p>
            <p className="text-sm text-muted">
              Welcome back, <span className="font-medium text-ink">{name}</span>
            </p>
          </div>
          {!pathname?.startsWith('/dashboard/projects/new') && (
            <Button size="sm" onClick={() => router.push('/dashboard/projects/new')}>
              <Plus size={14} />
              New project
            </Button>
          )}
        </div>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 md:px-10 md:py-10">{children}</div>
      </div>
    </div>
  );
}
