-- ============================================================================
-- Migration: 002 - Market Study Schema
-- Description: Create tables and indexes for Market Study feature
-- Author: System
-- Date: 2025-01-05
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: market_studies
-- Description: Stores market study/property valuation data
-- ============================================================================

CREATE TABLE IF NOT EXISTS market_studies (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign Keys
  user_id UUID NOT NULL,

  -- Market Study Data (JSONB for flexibility)
  state JSONB NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT fk_market_studies_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users (id)
    ON DELETE CASCADE
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Index for user queries (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_market_studies_user_id
  ON market_studies (user_id);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_market_studies_created_at
  ON market_studies (created_at DESC);

-- Index for combined user + date queries (optimized for pagination)
CREATE INDEX IF NOT EXISTS idx_market_studies_user_created
  ON market_studies (user_id, created_at DESC);

-- GIN index for JSONB queries (searching within state)
CREATE INDEX IF NOT EXISTS idx_market_studies_state_gin
  ON market_studies USING GIN (state);

-- Specific JSONB path indexes for common queries
CREATE INDEX IF NOT EXISTS idx_market_studies_city
  ON market_studies ((state->'propertyAddress'->>'city'));

CREATE INDEX IF NOT EXISTS idx_market_studies_evaluation_type
  ON market_studies ((state->>'evaluationType'));

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on market_studies table
ALTER TABLE market_studies ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own market studies
CREATE POLICY market_studies_select_policy
  ON market_studies
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own market studies
CREATE POLICY market_studies_insert_policy
  ON market_studies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own market studies
CREATE POLICY market_studies_update_policy
  ON market_studies
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own market studies
CREATE POLICY market_studies_delete_policy
  ON market_studies
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Trigger: Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_market_studies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_market_studies_updated_at
  BEFORE UPDATE ON market_studies
  FOR EACH ROW
  EXECUTE FUNCTION update_market_studies_updated_at();

-- ============================================================================
-- Functions
-- ============================================================================

-- Function: Get market studies count by user
CREATE OR REPLACE FUNCTION get_market_studies_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM market_studies
  WHERE user_id = p_user_id;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get recent market studies
CREATE OR REPLACE FUNCTION get_recent_market_studies(p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  state JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ms.id,
    ms.user_id,
    ms.state,
    ms.created_at,
    ms.updated_at
  FROM market_studies ms
  ORDER BY ms.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Search market studies by location
CREATE OR REPLACE FUNCTION search_market_studies_by_location(
  p_user_id UUID,
  p_city TEXT,
  p_neighborhood TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  state JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  IF p_neighborhood IS NOT NULL THEN
    RETURN QUERY
    SELECT
      ms.id,
      ms.user_id,
      ms.state,
      ms.created_at,
      ms.updated_at
    FROM market_studies ms
    WHERE ms.user_id = p_user_id
      AND ms.state->'propertyAddress'->>'city' = p_city
      AND ms.state->'propertyAddress'->>'neighborhood' = p_neighborhood
    ORDER BY ms.created_at DESC;
  ELSE
    RETURN QUERY
    SELECT
      ms.id,
      ms.user_id,
      ms.state,
      ms.created_at,
      ms.updated_at
    FROM market_studies ms
    WHERE ms.user_id = p_user_id
      AND ms.state->'propertyAddress'->>'city' = p_city
    ORDER BY ms.created_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Comments (Documentation)
-- ============================================================================

COMMENT ON TABLE market_studies IS 'Stores market study/property valuation data using Comparative Method (NBR 14653-2)';
COMMENT ON COLUMN market_studies.id IS 'Unique identifier for the market study';
COMMENT ON COLUMN market_studies.user_id IS 'Reference to the user who created the study';
COMMENT ON COLUMN market_studies.state IS 'JSONB containing full MarketStudy entity serialization';
COMMENT ON COLUMN market_studies.created_at IS 'Timestamp when the study was created';
COMMENT ON COLUMN market_studies.updated_at IS 'Timestamp when the study was last updated';

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON market_studies TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_market_studies_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_market_studies(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION search_market_studies_by_location(UUID, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- Rollback Instructions
-- ============================================================================

-- To rollback this migration, run the following commands:
-- DROP FUNCTION IF EXISTS search_market_studies_by_location(UUID, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS get_recent_market_studies(INTEGER);
-- DROP FUNCTION IF EXISTS get_market_studies_count(UUID);
-- DROP TRIGGER IF EXISTS trigger_market_studies_updated_at ON market_studies;
-- DROP FUNCTION IF EXISTS update_market_studies_updated_at();
-- DROP TABLE IF EXISTS market_studies CASCADE;
