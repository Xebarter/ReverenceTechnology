import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

function adminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim() &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim(),
  );
}

function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  if (!adminConfigured()) {
    throw new Error(
      'Firebase Admin is not configured. Set FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY.',
    );
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID?.trim() ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!.trim(),
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  });
}

export function getFirebaseAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function isFirebaseAdminConfigured(): boolean {
  return adminConfigured();
}
