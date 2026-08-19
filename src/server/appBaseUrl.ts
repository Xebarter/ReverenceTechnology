/**
 * Canonical public origin for building return/callback URLs (no trailing slash).
 */
export function getPublicAppBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_BASE_URL?.trim() ||
    process.env.SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, '');
    return `https://${host}`;
  }

  throw new Error(
    'Set NEXT_PUBLIC_APP_URL (or APP_BASE_URL) to your public site URL for hosted payment redirects.',
  );
}
