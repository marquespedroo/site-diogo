-- ImobiTools Database Schema
-- Version: 1.0.0
-- Date: 2025-11-05
-- Description: Initial schema for calculator storage with shareable links

-- ============================================================================
-- CALCULATORS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS calculators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  short_code TEXT UNIQUE,
  state JSONB NOT NULL,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Indexes for performance
  CONSTRAINT short_code_length CHECK (char_length(short_code) = 6),
  CONSTRAINT short_code_format CHECK (short_code ~ '^[a-z0-9]+$')
);

-- Indexes
CREATE INDEX idx_calculators_user_id ON calculators(user_id);
CREATE INDEX idx_calculators_short_code ON calculators(short_code) WHERE short_code IS NOT NULL;
CREATE INDEX idx_calculators_created_at ON calculators(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on calculators table
ALTER TABLE calculators ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own calculators
CREATE POLICY calculators_select_own ON calculators
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id', TRUE));

-- Policy: Anyone can read calculators with short codes (public shareable links)
CREATE POLICY calculators_select_public ON calculators
  FOR SELECT
  USING (short_code IS NOT NULL);

-- Policy: Users can insert their own calculators
CREATE POLICY calculators_insert_own ON calculators
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', TRUE));

-- Policy: Users can update their own calculators
CREATE POLICY calculators_update_own ON calculators
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', TRUE));

-- Policy: Users can delete their own calculators
CREATE POLICY calculators_delete_own ON calculators
  FOR DELETE
  USING (user_id = current_setting('app.current_user_id', TRUE));

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call update_updated_at_column
CREATE TRIGGER update_calculators_updated_at
  BEFORE UPDATE ON calculators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_calculator_views(calculator_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE calculators
  SET views = views + 1
  WHERE id = calculator_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE calculators IS 'Stores payment flow calculators with shareable links';
COMMENT ON COLUMN calculators.id IS 'Primary key (UUID)';
COMMENT ON COLUMN calculators.user_id IS 'User who created the calculator (no FK for now)';
COMMENT ON COLUMN calculators.short_code IS 'Short code for shareable links (e.g., abc123)';
COMMENT ON COLUMN calculators.state IS 'Complete calculator state as JSONB';
COMMENT ON COLUMN calculators.views IS 'Number of times calculator was viewed';
COMMENT ON COLUMN calculators.created_at IS 'Timestamp when calculator was created';
COMMENT ON COLUMN calculators.updated_at IS 'Timestamp when calculator was last updated';
COMMENT ON COLUMN calculators.expires_at IS 'Optional expiration date for shareable links';
