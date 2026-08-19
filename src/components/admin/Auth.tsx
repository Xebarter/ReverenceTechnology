'use client';

import { useEffect, useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth, signInWithGoogle } from '../../lib/firebase';
import { useUser } from '../../UserContext';
import { Button, Card, FieldLabel, Input } from '../ui';

export default function AdminAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading, isAdmin } = useUser();

  useEffect(() => {
    if (authLoading) return;
    if (user && isAdmin) {
      window.location.replace('/admin');
      return;
    }
    if (user && !isAdmin) {
      window.location.replace('/unauthorized');
    }
  }, [authLoading, user, isAdmin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      sessionStorage.setItem('auth_redirect', '/admin');
      await signInWithGoogle();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-12 font-admin">
      <Card className="w-full max-w-md p-8 md:p-10">
        <p className="mb-2 text-center text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-gold">
          Reverence Technology
        </p>
        <h1 className="text-center font-admin text-3xl text-ink-deep">Admin sign in</h1>
        <p className="mt-2 mb-8 text-center text-sm text-muted">
          Sign in with your authorized account to access the admin dashboard
        </p>

        <form className="space-y-5" onSubmit={handleLogin}>
          {error && (
            <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <Button type="button" variant="secondary" disabled={loading} className="w-full" onClick={onGoogle}>
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            <span className="h-px flex-1 bg-rule" />
            or email
            <span className="h-px flex-1 bg-rule" />
          </div>

          <div>
            <FieldLabel htmlFor="email">Email address</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={loading || authLoading} className="w-full">
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
