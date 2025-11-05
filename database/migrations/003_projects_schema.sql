-- ============================================================================
-- Projects Table Schema Migration
-- Version: 003
-- Description: Creates projects and units tables with RLS policies
-- Date: 2025-01-04
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Projects Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Owner
  user_id UUID NOT NULL,

  -- Project Details
  name VARCHAR(200) NOT NULL,
  description TEXT,

  -- Location (stored as JSONB for flexibility)
  location JSONB NOT NULL,

  -- Sharing (array of user IDs who have access)
  shared_with UUID[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes
  CONSTRAINT projects_name_length CHECK (char_length(name) > 0),
  CONSTRAINT projects_location_valid CHECK (
    location ? 'city' AND
    location ? 'neighborhood' AND
    location ? 'state'
  )
);

-- Indexes for projects table
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_location_city_idx ON projects((location->>'city'));
CREATE INDEX IF NOT EXISTS projects_location_state_idx ON projects((location->>'state'));
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS projects_updated_at_idx ON projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS projects_shared_with_idx ON projects USING GIN(shared_with);
CREATE INDEX IF NOT EXISTS projects_name_search_idx ON projects USING GIN(to_tsvector('portuguese', name));

-- ============================================================================
-- Units Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS units (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Foreign Key to Project
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Unit Identifier
  tower VARCHAR(10) NOT NULL,
  unit_number VARCHAR(20) NOT NULL,

  -- Unit Details
  area DECIMAL(10, 2) NOT NULL CHECK (area > 0),
  price DECIMAL(15, 2) NOT NULL CHECK (price > 0),
  parking_spots VARCHAR(10) NOT NULL DEFAULT '0',
  origin VARCHAR(20) NOT NULL CHECK (origin IN ('real', 'permutante')),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (
    status IN ('available', 'reserved', 'sold', 'unavailable')
  ),

  -- Metadata (for sold_date, sold_price, reserved_by, etc.)
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint on project + tower + number
  CONSTRAINT units_unique_identifier UNIQUE (project_id, tower, unit_number)
);

-- Indexes for units table
CREATE INDEX IF NOT EXISTS units_project_id_idx ON units(project_id);
CREATE INDEX IF NOT EXISTS units_status_idx ON units(status);
CREATE INDEX IF NOT EXISTS units_tower_idx ON units(tower);
CREATE INDEX IF NOT EXISTS units_price_idx ON units(price);
CREATE INDEX IF NOT EXISTS units_area_idx ON units(area);
CREATE INDEX IF NOT EXISTS units_origin_idx ON units(origin);
CREATE INDEX IF NOT EXISTS units_created_at_idx ON units(created_at DESC);
CREATE INDEX IF NOT EXISTS units_updated_at_idx ON units(updated_at DESC);

-- ============================================================================
-- Updated_at Triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for projects table
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for units table
DROP TRIGGER IF EXISTS update_units_updated_at ON units;
CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;

-- Projects RLS Policies
-- ----------------------

-- Policy: Users can view projects they own or that are shared with them
DROP POLICY IF EXISTS "Users can view own or shared projects" ON projects;
CREATE POLICY "Users can view own or shared projects"
  ON projects FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() = ANY(shared_with)
  );

-- Policy: Users can insert their own projects
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update projects they own
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete projects they own
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Units RLS Policies
-- -------------------

-- Policy: Users can view units in projects they have access to
DROP POLICY IF EXISTS "Users can view units in accessible projects" ON units;
CREATE POLICY "Users can view units in accessible projects"
  ON units FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = units.project_id
      AND (
        projects.user_id = auth.uid() OR
        auth.uid() = ANY(projects.shared_with)
      )
    )
  );

-- Policy: Users can insert units in projects they own
DROP POLICY IF EXISTS "Users can insert units in own projects" ON units;
CREATE POLICY "Users can insert units in own projects"
  ON units FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = units.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Policy: Users can update units in projects they own
DROP POLICY IF EXISTS "Users can update units in own projects" ON units;
CREATE POLICY "Users can update units in own projects"
  ON units FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = units.project_id
      AND projects.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = units.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Policy: Users can delete units in projects they own
DROP POLICY IF EXISTS "Users can delete units in own projects" ON units;
CREATE POLICY "Users can delete units in own projects"
  ON units FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = units.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to get project statistics
CREATE OR REPLACE FUNCTION get_project_statistics(project_uuid UUID)
RETURNS JSON AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT json_build_object(
    'totalUnits', COUNT(*),
    'availableUnits', COUNT(*) FILTER (WHERE status = 'available'),
    'soldUnits', COUNT(*) FILTER (WHERE status = 'sold'),
    'reservedUnits', COUNT(*) FILTER (WHERE status = 'reserved'),
    'totalValue', COALESCE(SUM(price), 0),
    'averagePrice', COALESCE(AVG(price), 0),
    'minPrice', COALESCE(MIN(price), 0),
    'maxPrice', COALESCE(MAX(price), 0),
    'averagePricePerSqM', COALESCE(AVG(price / area), 0)
  ) INTO stats
  FROM units
  WHERE project_id = project_uuid;

  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE projects IS 'Real estate projects with multi-agent access';
COMMENT ON TABLE units IS 'Individual units within projects';

COMMENT ON COLUMN projects.user_id IS 'Owner of the project (only owner can edit)';
COMMENT ON COLUMN projects.shared_with IS 'Array of user IDs with read-only access';
COMMENT ON COLUMN projects.location IS 'JSONB with city, neighborhood, state';

COMMENT ON COLUMN units.project_id IS 'Foreign key to projects table (cascades on delete)';
COMMENT ON COLUMN units.tower IS 'Building/tower identifier';
COMMENT ON COLUMN units.unit_number IS 'Unit number within tower';
COMMENT ON COLUMN units.metadata IS 'JSONB for sold_date, sold_price, reserved_by, etc.';

-- ============================================================================
-- Grant Permissions (if using service role)
-- ============================================================================

-- Grant usage on tables to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON units TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================
