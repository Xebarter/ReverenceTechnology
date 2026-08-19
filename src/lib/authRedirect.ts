const FALLBACK = '/dashboard';

export function safePostAuthPath(raw: string | null | undefined): string {
  const path = (raw || '').trim();
  if (!path) return FALLBACK;
  if (/^https?:\/\//i.test(path)) return FALLBACK;
  if (!path.startsWith('/') || path.startsWith('//')) return FALLBACK;
  if (path === '/' || path === '/auth' || path.startsWith('/auth/') || path.startsWith('/auth?')) {
    return FALLBACK;
  }
  if (path === '/admin/auth' || path.startsWith('/admin/auth?')) return '/admin';
  return path;
}

export function postAuthDestination(isAdmin: boolean, requested?: string | null): string {
  if (isAdmin) return '/admin';
  const next = safePostAuthPath(requested);
  if (next === '/admin' || next.startsWith('/admin/')) return FALLBACK;
  return next;
}

export function authPageHref(nextPath?: string | null): string {
  return `/auth?redirect=${encodeURIComponent(safePostAuthPath(nextPath))}`;
}

