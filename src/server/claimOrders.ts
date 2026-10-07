import { pgPatch } from './supabasePostgrest';
import { requireSupabaseService } from './supabaseEnv';

/** Attach guest payments to the account that signs in with the same email. */
export async function claimOrdersForEmail(uid: string, email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!uid || !normalized) return;
  const { url, serviceKey } = requireSupabaseService();
  const { error } = await pgPatch(
    url,
    serviceKey,
    'orders',
    `customer_email=ilike.${encodeURIComponent(normalized)}&user_id=is.null`,
    { user_id: uid },
  );
  if (error) console.error('[payments] could not attach payments to account', error);
}
