import { importX509, jwtVerify, type JWTVerifyGetKey } from 'jose';

const FIREBASE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

type CertCache = {
  certs: Record<string, string>;
  expiresAt: number;
};

let cache: CertCache | null = null;

async function getCerts(): Promise<Record<string, string>> {
  if (cache && Date.now() < cache.expiresAt) return cache.certs;

  const res = await fetch(FIREBASE_CERTS_URL);
  if (!res.ok) {
    throw new Error('Could not fetch Firebase public keys');
  }

  const certs = (await res.json()) as Record<string, string>;
  const cacheControl = res.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSec = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
  cache = {
    certs,
    expiresAt: Date.now() + Math.max(60, maxAgeSec - 60) * 1000,
  };
  return certs;
}

const getKey: JWTVerifyGetKey = async (header) => {
  const certs = await getCerts();
  const pem = header.kid ? certs[header.kid] : undefined;
  if (!pem) {
    throw new Error('Invalid Firebase token');
  }
  return importX509(pem, 'RS256');
};

export type VerifiedFirebaseUser = {
  uid: string;
  email: string | null;
  name: string | null;
  admin: boolean;
};

export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseUser> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!projectId) {
    throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set');
  }

  const { payload } = await jwtVerify(idToken, getKey, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    algorithms: ['RS256'],
  });

  const uid = typeof payload.sub === 'string' ? payload.sub : '';
  if (!uid) {
    throw new Error('Invalid Firebase token');
  }

  return {
    uid,
    email: typeof payload.email === 'string' ? payload.email : null,
    name: typeof payload.name === 'string' ? payload.name : null,
    admin: payload.admin === true,
  };
}
