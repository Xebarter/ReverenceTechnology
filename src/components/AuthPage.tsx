'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { AnimatePresence, motion } from 'framer-motion';
import { firebaseAuth, signInWithGoogle } from '../lib/firebase';
import { postAuthDestination, safePostAuthPath } from '../lib/authRedirect';
import { useUser } from '../UserContext';
import { AlertCircle, Briefcase, FolderOpen, Loader2, Lock, Mail, ShieldCheck, User2 } from 'lucide-react';
import { Button, FieldLabel, Input } from './ui';

type Mode = 'signin' | 'signup';

function authMessage(err: unknown, fallback: string) {
  const code =
    typeof err === 'object' && err !== null && 'code' in err ? String((err as { code: string }).code) : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'The email or password is incorrect.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Sign in instead.';
    case 'auth/weak-password':
      return 'Use a password of at least 6 characters.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
    case 'auth/popup-blocked':
    case 'auth/redirect-cancelled-by-user':
      return 'Sign-in was cancelled.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return err instanceof Error ? err.message : fallback;
  }
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.6 39.6 16.3 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.7 7.1l.1.1 6.3 5.3C36.8 41.3 44 36 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}

const capabilities = [
  { icon: FolderOpen, label: 'Brief a project and track progress' },
  { icon: Briefcase, label: 'Apply for roles and follow applications' },
  { icon: ShieldCheck, label: 'Pay installments as work is delivered' },
];

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, isAdmin } = useUser();

  const redirectTo = useMemo(
    () => safePostAuthPath(searchParams?.get('redirect')),
    [searchParams],
  );

  const [mode, setMode] = useState<Mode>(searchParams?.get('mode') === 'signup' ? 'signup' : 'signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    const stored = sessionStorage.getItem('auth_redirect');
    if (stored) sessionStorage.removeItem('auth_redirect');
    router.replace(postAuthDestination(isAdmin, stored || redirectTo));
  }, [loading, user, isAdmin, redirectTo, router]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setMessage(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
        if (fullName.trim()) {
          await updateProfile(cred.user, { displayName: fullName.trim() });
        }
        setMessage('Account created. You are signed in.');
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      }
    } catch (err: unknown) {
      setError(authMessage(err, 'Authentication failed.'));
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      sessionStorage.setItem('auth_redirect', redirectTo);
      await signInWithGoogle();
    } catch (err: unknown) {
      setError(authMessage(err, 'Google sign-in failed.'));
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4.25rem)] bg-paper">
      <div className="grid min-h-[calc(100vh-4.25rem)] lg:grid-cols-2">
        <aside className="relative hidden overflow-hidden bg-ink-deep px-10 py-16 text-paper lg:flex lg:flex-col lg:justify-between xl:px-16 xl:py-20">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              color: '#fff',
            }}
          />
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-gold/20" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full border border-gold/10" />

          <div className="relative">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-gold">
              Reverence Technology
            </p>
            <div className="mt-8 h-px w-12 bg-gold" />
            <h1 className="mt-8 max-w-md font-serif text-4xl font-medium leading-[1.15] tracking-tight xl:text-5xl">
              A considered space for your work with us.
            </h1>
            <p className="mt-6 max-w-sm text-[1.05rem] leading-relaxed text-paper/70">
              Sign in to manage projects, applications, and payments — the same standard we bring to
              every engagement.
            </p>
          </div>

          <ul className="relative space-y-5">
            {capabilities.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-sm text-paper/80">
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-paper/10 bg-paper/5">
                  <Icon size={16} className="text-gold" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </aside>

        <section className="flex items-center justify-center px-4 py-12 sm:px-8 md:py-16">
          <div className="w-full max-w-[28rem]">
            <div className="mb-10 lg:hidden">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-gold">
                Reverence Technology
              </p>
              <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-ink-deep">
                {mode === 'signup' ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Projects, applications, and payments — in one place.
              </p>
            </div>

            <div className="hidden lg:block">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">
                {mode === 'signup' ? 'New client' : 'Existing client'}
              </p>
              <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight text-ink-deep xl:text-4xl">
                {mode === 'signup' ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {mode === 'signup'
                  ? 'A few details, then you can brief a project or apply for a role.'
                  : 'Continue to your dashboard, projects, and applications.'}
              </p>
            </div>

            <div className="mt-8 flex border-b border-rule">
              {(['signin', 'signup'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => switchMode(key)}
                  className={`relative -mb-px px-1 pb-3 mr-8 text-sm font-medium transition-colors ${
                    mode === key ? 'text-ink-deep' : 'text-muted hover:text-ink'
                  }`}
                >
                  {key === 'signin' ? 'Sign in' : 'Create account'}
                  {mode === key && (
                    <span className="absolute inset-x-0 bottom-0 h-px bg-gold" />
                  )}
                </button>
              ))}
            </div>

            <div className="pt-8">
              {(error || message) && (
                <div
                  className={`mb-6 flex items-start gap-3 border px-4 py-3 text-sm ${
                    error
                      ? 'border-red-200 bg-red-50/80 text-red-800'
                      : 'border-rule bg-paper-2 text-ink'
                  }`}
                >
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <div>{error || message}</div>
                </div>
              )}

              <button
                type="button"
                disabled={busy}
                onClick={onGoogle}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-rule bg-surface px-5 py-3 text-sm font-medium text-ink-deep transition-colors hover:border-ink disabled:pointer-events-none disabled:opacity-50"
              >
                <GoogleMark />
                Continue with Google
              </button>

              <div className="my-7 flex items-center gap-4">
                <span className="h-px flex-1 bg-rule" />
                <span className="text-[0.625rem] font-semibold uppercase tracking-[0.18em] text-muted">
                  or with email
                </span>
                <span className="h-px flex-1 bg-rule" />
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <AnimatePresence initial={false}>
                  {mode === 'signup' && (
                    <motion.div
                      key="name"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <FieldLabel htmlFor="auth-name">Full name</FieldLabel>
                      <div className="relative">
                        <User2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                        <Input
                          id="auth-name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Jane Doe"
                          className="pl-11"
                          autoComplete="name"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <FieldLabel htmlFor="auth-email">Email</FieldLabel>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <Input
                      required
                      type="email"
                      id="auth-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="pl-11"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <FieldLabel htmlFor="auth-password">Password</FieldLabel>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <Input
                      required
                      type="password"
                      id="auth-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-11"
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      minLength={6}
                    />
                  </div>
                  {mode === 'signup' && (
                    <p className="ml-0.5 mt-1.5 text-xs text-muted">At least 6 characters.</p>
                  )}
                </div>

                <Button type="submit" disabled={busy} size="lg" className="mt-2 w-full">
                  {busy ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Please wait
                    </>
                  ) : mode === 'signup' ? (
                    'Create account'
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>

              {redirectTo !== '/' && (
                <p className="mt-6 text-center text-xs text-muted">
                  After signing in you will continue to your requested page.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
