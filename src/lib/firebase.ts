'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createAuth() {
  if (typeof window === 'undefined') {
    return getAuth(firebaseApp);
  }
  try {
    return initializeAuth(firebaseApp, {
      persistence: browserLocalPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    return getAuth(firebaseApp);
  }
}

export const firebaseAuth = createAuth();
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

let redirectResultPromise: ReturnType<typeof getRedirectResult> | null = null;

/** Consume the Google redirect result once (Strict Mode remounts share this promise). */
export function consumeRedirectResult() {
  if (!redirectResultPromise) {
    redirectResultPromise = getRedirectResult(firebaseAuth);
  }
  return redirectResultPromise;
}

export async function signInWithGoogle() {
  try {
    await signInWithPopup(firebaseAuth, googleProvider, browserPopupRedirectResolver);
  } catch (err: unknown) {
    const code =
      typeof err === 'object' && err !== null && 'code' in err ? String((err as { code: string }).code) : '';
    if (code !== 'auth/popup-blocked' && code !== 'auth/operation-not-supported-in-this-environment') {
      throw err;
    }
    await signInWithRedirect(firebaseAuth, googleProvider);
  }
}
