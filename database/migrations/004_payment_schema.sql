-- ImobiTools Payment Schema
-- Version: 1.0.0
-- Date: 2025-11-05
-- Description: Payment integration tables for subscriptions, transactions, and invoices

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('FREE', 'BASIC', 'UNLIMITED', 'COMBO')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due', 'suspended', 'expired')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  gateway TEXT NOT NULL CHECK (gateway IN ('stripe', 'mercadopago', 'asaas')),
  external_subscription_id TEXT NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  payment_method JSONB NOT NULL,
  state JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT external_subscription_unique UNIQUE (gateway, external_subscription_id),
  CONSTRAINT period_dates_valid CHECK (current_period_end > current_period_start)
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_external_id ON subscriptions(external_subscription_id);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  gateway TEXT NOT NULL CHECK (gateway IN ('stripe', 'mercadopago', 'asaas')),
  external_id TEXT NOT NULL,
  payment_method JSONB NOT NULL,
  state JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  failure_reason TEXT,
  refunded_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT external_transaction_unique UNIQUE (gateway, external_id)
);

-- Indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_external_id ON transactions(external_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  due_date TIMESTAMPTZ NOT NULL,
  state JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  invoice_url TEXT,
  pdf_url TEXT
);

-- Indexes
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_user_status ON invoices(user_id, status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all payment tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Subscriptions Policies
CREATE POLICY subscriptions_select_own ON subscriptions
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', TRUE));

CREATE POLICY subscriptions_insert_own ON subscriptions
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', TRUE));

CREATE POLICY subscriptions_update_own ON subscriptions
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', TRUE));

CREATE POLICY subscriptions_delete_own ON subscriptions
  FOR DELETE
  USING (user_id = current_setting('app.current_user_id', TRUE));

-- Transactions Policies
CREATE POLICY transactions_select_own ON transactions
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', TRUE));

CREATE POLICY transactions_insert_own ON transactions
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', TRUE));

-- Invoices Policies
CREATE POLICY invoices_select_own ON invoices
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', TRUE));

CREATE POLICY invoices_insert_own ON invoices
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', TRUE));

CREATE POLICY invoices_update_own ON invoices
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', TRUE));

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for subscriptions
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

-- Function to check for duplicate active subscriptions
CREATE OR REPLACE FUNCTION check_duplicate_active_subscription()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    IF EXISTS (
      SELECT 1 FROM subscriptions
      WHERE user_id = NEW.user_id
        AND status = 'active'
        AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'User already has an active subscription';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent duplicate active subscriptions
CREATE TRIGGER prevent_duplicate_active_subscription
  BEFORE INSERT OR UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION check_duplicate_active_subscription();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE subscriptions IS 'Stores user subscriptions with payment gateway details';
COMMENT ON COLUMN subscriptions.id IS 'Primary key (subscription ID)';
COMMENT ON COLUMN subscriptions.user_id IS 'User who owns the subscription';
COMMENT ON COLUMN subscriptions.plan_id IS 'Subscription plan (FREE, BASIC, UNLIMITED, COMBO)';
COMMENT ON COLUMN subscriptions.status IS 'Subscription status';
COMMENT ON COLUMN subscriptions.amount IS 'Monthly subscription amount in BRL';
COMMENT ON COLUMN subscriptions.gateway IS 'Payment gateway (stripe, asaas, mercadopago)';
COMMENT ON COLUMN subscriptions.external_subscription_id IS 'Gateway subscription ID';
COMMENT ON COLUMN subscriptions.current_period_start IS 'Current billing period start';
COMMENT ON COLUMN subscriptions.current_period_end IS 'Current billing period end';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'Whether to cancel at period end';
COMMENT ON COLUMN subscriptions.payment_method IS 'Payment method details (JSONB)';
COMMENT ON COLUMN subscriptions.state IS 'Complete subscription state as JSONB';

COMMENT ON TABLE transactions IS 'Stores payment transactions';
COMMENT ON COLUMN transactions.id IS 'Primary key (transaction ID)';
COMMENT ON COLUMN transactions.user_id IS 'User who made the transaction';
COMMENT ON COLUMN transactions.amount IS 'Transaction amount in BRL';
COMMENT ON COLUMN transactions.description IS 'Transaction description';
COMMENT ON COLUMN transactions.status IS 'Transaction status';
COMMENT ON COLUMN transactions.gateway IS 'Payment gateway';
COMMENT ON COLUMN transactions.external_id IS 'Gateway transaction ID';
COMMENT ON COLUMN transactions.payment_method IS 'Payment method used (JSONB)';
COMMENT ON COLUMN transactions.state IS 'Complete transaction state as JSONB';

COMMENT ON TABLE invoices IS 'Stores billing invoices';
COMMENT ON COLUMN invoices.id IS 'Primary key (invoice ID)';
COMMENT ON COLUMN invoices.user_id IS 'User who owns the invoice';
COMMENT ON COLUMN invoices.subscription_id IS 'Related subscription';
COMMENT ON COLUMN invoices.amount IS 'Invoice amount in BRL';
COMMENT ON COLUMN invoices.description IS 'Invoice description';
COMMENT ON COLUMN invoices.status IS 'Invoice status';
COMMENT ON COLUMN invoices.due_date IS 'Payment due date';
COMMENT ON COLUMN invoices.state IS 'Complete invoice state as JSONB';
