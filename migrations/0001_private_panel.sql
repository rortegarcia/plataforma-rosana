CREATE TABLE IF NOT EXISTS registrations (
  id TEXT PRIMARY KEY, resend_id TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK(kind IN ('inquiry','workshop')),
  topic TEXT NOT NULL, title TEXT NOT NULL,
  customer_name TEXT NOT NULL, customer_email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY, product TEXT NOT NULL, title TEXT NOT NULL,
  amount_cents INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'EUR',
  registration_id TEXT REFERENCES registrations(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS paypal_orders (
  id TEXT PRIMARY KEY, purchase_id TEXT NOT NULL UNIQUE REFERENCES purchases(id)
);
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES paypal_orders(id),
  amount_cents INTEGER NOT NULL, currency TEXT NOT NULL, status TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY, capture_id TEXT NOT NULL REFERENCES payments(id),
  amount_cents INTEGER NOT NULL, currency TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS registrations_created ON registrations(created_at);
CREATE INDEX IF NOT EXISTS purchases_registration ON purchases(registration_id);
