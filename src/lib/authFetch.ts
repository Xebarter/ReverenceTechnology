'use client';

import { firebaseAuth } from './firebase';

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = await firebaseAuth.currentUser?.getIdToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(input, { ...init, headers });
}

export async function authJson<T = unknown>(input: RequestInfo | URL, init: RequestInit = {}): Promise<T> {
  const resp = await authFetch(input, init);
  const json = (await resp.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!resp.ok) {
    throw new Error((json as { error?: string } | null)?.error || `Request failed (HTTP ${resp.status})`);
  }
  return json as T;
}
