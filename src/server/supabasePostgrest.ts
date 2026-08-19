/**
 * Supabase PostgREST via fetch only (no @supabase/supabase-js).
 */

function trimSlash(s: string): string {
  return s.replace(/\/+$/, '');
}

function svcHeaders(serviceKey: string, more: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    ...more,
  };
}

async function readResponse(res: { ok: boolean; text(): Promise<string> }): Promise<{ ok: boolean; data: unknown; text: string }> {
  const text = await res.text();
  if (!text) return { ok: res.ok, data: null, text: '' };
  try {
    return { ok: res.ok, data: JSON.parse(text), text };
  } catch {
    return { ok: res.ok, data: null, text };
  }
}

function errorMessage(data: unknown, text: string): string {
  if (data && typeof data === 'object' && 'message' in data) {
    return String((data as { message: unknown }).message);
  }
  return text.slice(0, 400) || 'Request failed';
}

export async function pgInsertRow(
  baseUrl: string,
  serviceKey: string,
  table: string,
  row: Record<string, unknown>,
): Promise<{ row: Record<string, unknown> | null; error: string | null }> {
  const url = `${trimSlash(baseUrl)}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...svcHeaders(serviceKey),
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      Accept: 'application/json',
    },
    body: JSON.stringify([row]),
  });
  const { data, text, ok } = await readResponse(res);
  if (!ok) return { row: null, error: errorMessage(data, text) };
  if (Array.isArray(data)) return { row: (data[0] as Record<string, unknown>) ?? null, error: null };
  return { row: null, error: null };
}

export async function pgPatch(
  baseUrl: string,
  serviceKey: string,
  table: string,
  query: string,
  patch: Record<string, unknown>,
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  const q = query.startsWith('?') ? query.slice(1) : query;
  const url = `${trimSlash(baseUrl)}/rest/v1/${table}?${q}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      ...svcHeaders(serviceKey),
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      Accept: 'application/json',
    },
    body: JSON.stringify(patch),
  });
  const { data, text, ok } = await readResponse(res);
  if (!ok) return { rows: [], error: errorMessage(data, text) };
  if (Array.isArray(data)) return { rows: data as Record<string, unknown>[], error: null };
  if (data && typeof data === 'object') return { rows: [data as Record<string, unknown>], error: null };
  return { rows: [], error: null };
}

export async function pgSelect(
  baseUrl: string,
  serviceKey: string,
  table: string,
  query: string,
  columns: string,
): Promise<{ rows: Record<string, unknown>[]; error: string | null }> {
  const q = query.startsWith('?') ? query.slice(1) : query;
  const url = `${trimSlash(baseUrl)}/rest/v1/${table}?${q}&select=${columns}`;
  const res = await fetch(url, {
    headers: {
      ...svcHeaders(serviceKey),
      Accept: 'application/json',
    },
  });
  const { data, text, ok } = await readResponse(res);
  if (!ok) return { rows: [], error: errorMessage(data, text) };
  if (Array.isArray(data)) return { rows: data as Record<string, unknown>[], error: null };
  return { rows: [], error: null };
}

export function eq(col: string, val: string): string {
  return `${col}=eq.${encodeURIComponent(val)}`;
}

export async function pgUpsertRow(
  baseUrl: string,
  serviceKey: string,
  table: string,
  row: Record<string, unknown>,
  onConflict: string,
): Promise<{ row: Record<string, unknown> | null; error: string | null }> {
  const url = `${trimSlash(baseUrl)}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...svcHeaders(serviceKey),
      'Content-Type': 'application/json',
      Prefer: 'return=representation,resolution=merge-duplicates',
      Accept: 'application/json',
    },
    body: JSON.stringify([row]),
  });
  const { data, text, ok } = await readResponse(res);
  if (!ok) return { row: null, error: errorMessage(data, text) };
  if (Array.isArray(data)) return { row: (data[0] as Record<string, unknown>) ?? null, error: null };
  return { row: null, error: null };
}

