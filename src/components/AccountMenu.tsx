'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Briefcase,
  FolderOpen,
  LayoutDashboard,
  LogIn,
  LogOut,
  Package,
  Plus,
  Shield,
  UserRound,
} from 'lucide-react';
import { useUser } from '../UserContext';

function initialsFor(user: { displayName: string | null; email: string | null }) {
  const name = user.displayName?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  const local = user.email?.split('@')[0] || 'A';
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

function displayNameFor(user: { displayName: string | null; email: string | null }) {
  if (user.displayName?.trim()) return user.displayName.trim();
  const local = user.email?.split('@')[0] || 'there';
  const first = local.split(/[._-]+/).filter(Boolean)[0] || local;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export default function AccountMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { user, loading, signOut, isAdmin } = useUser();
  const authHref = `/auth?redirect=${encodeURIComponent(pathname || '/')}`;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onPointer = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border text-sm font-semibold tracking-wide transition-all duration-200 ${
          open
            ? 'border-gold bg-ink-deep text-paper shadow-[0_0_0_3px_rgba(176,141,87,0.22)]'
            : 'border-rule bg-surface text-ink hover:border-gold hover:text-ink-deep'
        } disabled:opacity-50`}
      >
        {user ? (
          user.photoURL ? (
            <img src={user.photoURL} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            initialsFor(user)
          )
        ) : (
          <UserRound size={16} strokeWidth={1.75} />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="absolute right-0 z-[120] mt-3 w-[18.5rem] origin-top-right overflow-hidden rounded-md border border-rule bg-surface shadow-[0_18px_50px_-24px_rgba(14,36,54,0.45)]"
          >
            <div className="h-px bg-gradient-to-r from-transparent via-gold to-transparent" />

            {user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/40 bg-ink-deep text-xs font-semibold tracking-wide text-paper">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initialsFor(user)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-serif text-base text-ink-deep">{displayNameFor(user)}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                </div>
                <p className="px-4 pb-2 text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-gold">
                  Client portal
                </p>
                <div className="border-t border-rule py-1.5">
                  <MenuLink href="/dashboard" icon={<LayoutDashboard size={16} />} onSelect={() => setOpen(false)}>
                    Overview
                  </MenuLink>
                  <MenuLink href="/dashboard/projects" icon={<FolderOpen size={16} />} onSelect={() => setOpen(false)}>
                    Projects
                  </MenuLink>
                  <MenuLink
                    href="/dashboard/applications"
                    icon={<Briefcase size={16} />}
                    onSelect={() => setOpen(false)}
                  >
                    Applications
                  </MenuLink>
                  <MenuLink href="/orders" icon={<Package size={16} />} onSelect={() => setOpen(false)}>
                    Order tracking
                  </MenuLink>
                </div>
                <div className="border-t border-rule py-1.5">
                  <MenuLink href="/dashboard/projects/new" icon={<Plus size={16} />} onSelect={() => setOpen(false)}>
                    Start a project
                  </MenuLink>
                  {isAdmin && (
                    <MenuLink href="/admin" icon={<Shield size={16} />} onSelect={() => setOpen(false)}>
                      Admin
                    </MenuLink>
                  )}
                </div>
                <div className="border-t border-rule bg-paper px-1.5 py-1.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={async () => {
                      setOpen(false);
                      await signOut();
                      window.location.href = '/';
                    }}
                    className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sm text-muted transition-colors hover:bg-surface hover:text-ink"
                  >
                    <LogOut size={16} className="text-gold" />
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="px-4 py-4">
                  <p className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-gold">Account</p>
                  <p className="mt-1 font-serif text-lg text-ink-deep">Client portal</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    Sign in to manage projects, applications, and payments.
                  </p>
                </div>
                <div className="border-t border-rule py-1.5">
                  <MenuLink href={authHref} icon={<LogIn size={16} />} onSelect={() => setOpen(false)}>
                    Sign in
                  </MenuLink>
                  <MenuLink
                    href={`${authHref}${authHref.includes('?') ? '&' : '?'}mode=signup`}
                    icon={<UserRound size={16} />}
                    onSelect={() => setOpen(false)}
                  >
                    Create account
                  </MenuLink>
                  <MenuLink href="/orders" icon={<Package size={16} />} onSelect={() => setOpen(false)}>
                    Track an order
                  </MenuLink>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({
  href,
  icon,
  onSelect,
  children,
}: {
  href: string;
  icon: ReactNode;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onSelect}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink transition-colors hover:bg-paper hover:text-ink-deep"
    >
      <span className="text-gold">{icon}</span>
      {children}
    </Link>
  );
}
