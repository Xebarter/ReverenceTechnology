'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { onIdTokenChanged, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { consumeRedirectResult, firebaseAuth } from './lib/firebase';

export type AppUser = {
  id: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  user_metadata: { full_name?: string };
};

interface UserContextType {
  user: AppUser | null;
  session: { accessToken: string | null } | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

function toAppUser(fb: FirebaseUser): AppUser {
  const displayName = fb.displayName;
  return {
    id: fb.uid,
    uid: fb.uid,
    email: fb.email,
    displayName,
    photoURL: fb.photoURL,
    user_metadata: { full_name: displayName || undefined },
  };
}

async function syncSession(fb: FirebaseUser | null) {
  if (!fb) {
    await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => undefined);
    return { isAdmin: false };
  }
  try {
    const idToken = await fb.getIdToken();
    const resp = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const json = (await resp.json().catch(() => null)) as { isAdmin?: boolean } | null;
    return { isAdmin: Boolean(json?.isAdmin) };
  } catch (e) {
    console.error('[auth] session sync failed', e);
    return { isAdmin: false };
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<{ accessToken: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let seq = 0;
    let unsub: (() => void) | undefined;

    const apply = async (fb: FirebaseUser | null) => {
      const my = ++seq;
      if (fb) {
        setUser(toAppUser(fb));
        const token = await fb.getIdToken().catch(() => null);
        if (cancelled || my !== seq) return;
        setSession({ accessToken: token });
        const result = await syncSession(fb);
        if (cancelled || my !== seq) return;
        setIsAdmin(result.isAdmin);
      } else {
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        if (cancelled || my !== seq || firebaseAuth.currentUser) return;
        await syncSession(null);
        if (cancelled || my !== seq || firebaseAuth.currentUser) return;
      }
      if (!cancelled && my === seq) setLoading(false);
    };

    (async () => {
      try {
        await consumeRedirectResult();
      } catch (e) {
        console.error('[auth] getRedirectResult', e);
      }
      if (cancelled) return;
      unsub = onIdTokenChanged(firebaseAuth, (fb) => {
        void apply(fb);
      });
    })();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(firebaseAuth);
    await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => undefined);
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  }, []);

  const getIdToken = useCallback(async () => {
    return (await firebaseAuth.currentUser?.getIdToken()) ?? null;
  }, []);

  return (
    <UserContext.Provider value={{ user, session, loading, isAdmin, signOut, getIdToken }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
