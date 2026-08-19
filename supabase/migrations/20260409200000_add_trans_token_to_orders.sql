-- Store DPO's TransToken so the status endpoint can call verifyToken
-- directly when BackURL callback hasn't fired yet.
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS trans_token text;

CREATE INDEX IF NOT EXISTS idx_orders_trans_token ON orders(trans_token);
