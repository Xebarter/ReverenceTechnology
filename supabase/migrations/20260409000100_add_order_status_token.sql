-- Add a per-order status token so the customer can securely fetch status
-- without requiring authentication (avoids RLS issues on the status page).

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS status_token text;

CREATE INDEX IF NOT EXISTS idx_orders_status_token ON orders(status_token);

