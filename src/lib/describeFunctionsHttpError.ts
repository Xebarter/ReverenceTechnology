/**
 * When an Edge Function returns 4xx/5xx, supabase-js throws FunctionsHttpError with
 * `context` = the fetch Response. The JSON body is not in `error.message`.
 */
export async function describeFunctionsHttpError(err: unknown): Promise<string | null> {
  if (!err || typeof err !== 'object') return null;
  const e = err as { name?: string; message?: string; context?: unknown };
  if (e.name !== 'FunctionsHttpError' || !(e.context instanceof Response)) return null;

  try {
    const ct = e.context.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) return e.message ?? null;

    const j = (await e.context.clone().json()) as {
      hint?: string;
      error?: string;
      result?: string | null;
      resultExplanation?: string | null;
      httpStatus?: number;
    };

    if (typeof j.hint === 'string' && j.hint.trim()) {
      return j.hint.trim();
    }
    if (typeof j.resultExplanation === 'string' && j.resultExplanation.trim()) {
      return j.resultExplanation.trim();
    }
    if (typeof j.error === 'string') {
      return j.result != null && j.result !== ''
        ? `${j.error} (code: ${j.result})`
        : j.error;
    }
  } catch {
    /* ignore */
  }

  return e.message ?? null;
}
