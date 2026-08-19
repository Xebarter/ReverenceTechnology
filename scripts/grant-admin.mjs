/**
 * Grant /admin access to an account that has already signed in once.
 *
 * Usage:
 *   npm run grant-admin -- you@example.com
 *
 * Then refresh /admin (or sign out and sign in) so the session cookie picks up admin.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function loadEnv(file) {
  if (!existsSync(file)) return;
  const text = readFileSync(file, 'utf8');
  let i = 0;
  while (i < text.length) {
    const nl = text.indexOf('\n', i);
    const line = (nl === -1 ? text.slice(i) : text.slice(i, nl)).replace(/\r$/, '');
    i = nl === -1 ? text.length : nl + 1;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (val.startsWith('"')) {
      let collected = val.slice(1);
      while (!collected.endsWith('"') && nl !== -1 && i < text.length) {
        const nextNl = text.indexOf('\n', i);
        const nextLine = (nextNl === -1 ? text.slice(i) : text.slice(i, nextNl)).replace(/\r$/, '');
        i = nextNl === -1 ? text.length : nextNl + 1;
        collected += '\n' + nextLine;
      }
      val = collected.endsWith('"') ? collected.slice(0, -1) : collected;
    } else if ((val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val.replace(/\\n/g, '\n');
  }
}

loadEnv(resolve(process.cwd(), '.env.local'));
loadEnv(resolve(process.cwd(), '.env'));

const email = (process.argv[2] || '').trim().toLowerCase();
if (!email || !email.includes('@')) {
  console.error('Usage: npm run grant-admin -- you@example.com');
  console.error('Sign in once at /auth first so a profiles row exists, then run this.');
  process.exit(1);
}

const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

async function pg(path, { method = 'GET', body, prefer } = {}) {
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    Accept: 'application/json',
  };
  if (body) headers['Content-Type'] = 'application/json';
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg = data && typeof data === 'object' && data.message ? data.message : text.slice(0, 400);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return data;
}

const profiles = await pg(`profiles?email=eq.${encodeURIComponent(email)}&select=id,email,full_name`);
const profile = Array.isArray(profiles) ? profiles[0] : null;
if (!profile?.id) {
  console.error(`No profiles row for ${email}. Sign in once at /auth, then re-run this script.`);
  process.exit(1);
}

const uid = String(profile.id);
const fullName = profile.full_name || null;

const existing = await pg(`admin_users?email=eq.${encodeURIComponent(email)}&select=id,is_active`);
const row = Array.isArray(existing) ? existing[0] : null;

if (row) {
  await pg(`admin_users?email=eq.${encodeURIComponent(email)}`, {
    method: 'PATCH',
    prefer: 'return=minimal',
    body: { id: uid, is_active: true, full_name: fullName },
  });
  console.log(`Updated admin_users for ${email} (uid ${uid}).`);
} else {
  await pg('admin_users', {
    method: 'POST',
    prefer: 'return=minimal',
    body: [{ id: uid, email, full_name: fullName, is_active: true }],
  });
  console.log(`Inserted admin_users for ${email} (uid ${uid}).`);
}

const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
if (clientEmail && privateKey) {
  try {
    const app = getApps()[0]
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId:
              process.env.FIREBASE_ADMIN_PROJECT_ID?.trim() ||
              process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
            clientEmail,
            privateKey,
          }),
        });
    await getAuth(app).setCustomUserClaims(uid, { admin: true });
    console.log('Set Firebase custom claim admin=true.');
  } catch (e) {
    console.warn('Could not set Firebase custom claims (session cookie still works after refresh):', e instanceof Error ? e.message : e);
  }
} else {
  console.log('FIREBASE_ADMIN_* not set — skipped custom claims. Refresh /admin after signing in; admin_users is enough.');
}

console.log('\nDone. Open /admin (refresh or sign in again) so the session cookie is reissued with admin access.');
