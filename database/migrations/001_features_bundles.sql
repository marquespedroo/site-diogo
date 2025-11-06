-- =====================================================
-- Migration 001: Features & Bundles Catalog
-- =====================================================
-- Purpose: Dynamic feature catalog and bundle management
--          with flexible pricing and quota configuration
-- Dependencies: Migration 000 (User Management)
-- Author: ImobiTools Architecture Team
-- Date: 2025-11-06
-- =====================================================

-- =====================================================
-- ENUMS: Feature and Bundle Status
-- =====================================================

CREATE TYPE feature_status AS ENUM (
  'draft',         -- Under development
  'active',        -- Available for use
  'deprecated',    -- Still works but discouraged
  'disabled'       -- Not available
);

CREATE TYPE feature_category AS ENUM (
  'calculator',    -- Financial calculators
  'analysis',      -- Market analysis tools
  'management',    -- Project management
  'reporting',     -- Reports and exports
  'integration'    -- External integrations
);

-- =====================================================
-- FEATURES TABLE: Dynamic Feature Catalog
-- =====================================================

CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identification
  slug TEXT UNIQUE NOT NULL,                    -- URL-friendly identifier (e.g., 'cash-flow-calculator')
  name TEXT NOT NULL,                           -- Display name
  description TEXT,                             -- Feature description
  category feature_category NOT NULL,
  status feature_status NOT NULL DEFAULT 'active',

  -- Usage Quotas
  anonymous_limit INTEGER NOT NULL DEFAULT 3,   -- Free uses for non-logged users
  logged_in_free_limit INTEGER NOT NULL DEFAULT 10,  -- Free uses for logged-in users

  -- Pricing
  monthly_price DECIMAL(10, 2),                 -- Monthly subscription price (NULL = not available for individual purchase)
  annual_price DECIMAL(10, 2),                  -- Annual subscription price (NULL = not available)

  -- UI Configuration
  icon TEXT,                                    -- Icon identifier (e.g., 'calculator', 'chart')
  color TEXT,                                   -- Theme color (hex code)
  display_order INTEGER NOT NULL DEFAULT 0,     -- Sort order in UI

  -- Feature Flags
  requires_authentication BOOLEAN NOT NULL DEFAULT FALSE,  -- Force login to use
  is_beta BOOLEAN NOT NULL DEFAULT FALSE,       -- Beta badge in UI
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,    -- Premium badge in UI

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,           -- Additional configuration

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deprecated_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT positive_limits CHECK (
    anonymous_limit >= 0 AND logged_in_free_limit >= 0
  ),
  CONSTRAINT positive_prices CHECK (
    (monthly_price IS NULL OR monthly_price > 0) AND
    (annual_price IS NULL OR annual_price > 0)
  ),
  CONSTRAINT annual_discount CHECK (
    annual_price IS NULL OR monthly_price IS NULL OR
    annual_price < (monthly_price * 12)  -- Annual must be discounted
  )
);

-- Indexes
CREATE INDEX idx_features_slug ON features(slug);
CREATE INDEX idx_features_status ON features(status);
CREATE INDEX idx_features_category ON features(category);
CREATE INDEX idx_features_display_order ON features(display_order);

-- Updated timestamp trigger
CREATE TRIGGER set_features_updated_at
  BEFORE UPDATE ON features
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- BUNDLES TABLE: Feature Package Offerings
-- =====================================================

CREATE TABLE IF NOT EXISTS bundles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identification
  slug TEXT UNIQUE NOT NULL,                    -- URL-friendly identifier (e.g., 'professional-plan')
  name TEXT NOT NULL,                           -- Display name (e.g., 'Professional Plan')
  description TEXT,                             -- Bundle description
  status feature_status NOT NULL DEFAULT 'active',

  -- Pricing
  monthly_price DECIMAL(10, 2) NOT NULL,        -- Monthly subscription price
  annual_price DECIMAL(10, 2),                  -- Annual subscription price (optional)
  discount_percentage INTEGER DEFAULT 0,        -- Display discount % (for marketing)

  -- UI Configuration
  icon TEXT,
  color TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,    -- "Most Popular" badge
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,   -- Featured on pricing page

  -- Marketing
  features_list TEXT[],                         -- List of feature descriptions for pricing page
  cta_text TEXT DEFAULT 'Subscribe Now',        -- Call-to-action button text

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deprecated_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_bundle_slug CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT positive_bundle_prices CHECK (
    monthly_price > 0 AND (annual_price IS NULL OR annual_price > 0)
  ),
  CONSTRAINT valid_discount CHECK (discount_percentage BETWEEN 0 AND 100),
  CONSTRAINT annual_bundle_discount CHECK (
    annual_price IS NULL OR annual_price < (monthly_price * 12)
  )
);

-- Indexes
CREATE INDEX idx_bundles_slug ON bundles(slug);
CREATE INDEX idx_bundles_status ON bundles(status);
CREATE INDEX idx_bundles_display_order ON bundles(display_order);

-- Updated timestamp trigger
CREATE TRIGGER set_bundles_updated_at
  BEFORE UPDATE ON bundles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- BUNDLE_FEATURES: Many-to-Many Relationship
-- =====================================================

CREATE TABLE IF NOT EXISTS bundle_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bundle_id UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,

  -- Optional: Override usage limits for this bundle
  custom_limit INTEGER,  -- NULL = unlimited within bundle

  -- Metadata
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_bundle_feature UNIQUE(bundle_id, feature_id)
);

-- Indexes
CREATE INDEX idx_bundle_features_bundle ON bundle_features(bundle_id);
CREATE INDEX idx_bundle_features_feature ON bundle_features(feature_id);

-- =====================================================
-- HELPER FUNCTIONS: Business Logic
-- =====================================================

-- Get all features included in a bundle
CREATE OR REPLACE FUNCTION get_bundle_features(bundle_slug_param TEXT)
RETURNS TABLE (
  feature_id UUID,
  feature_slug TEXT,
  feature_name TEXT,
  custom_limit INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.slug,
    f.name,
    bf.custom_limit
  FROM features f
  INNER JOIN bundle_features bf ON f.id = bf.feature_id
  INNER JOIN bundles b ON bf.bundle_id = b.id
  WHERE b.slug = bundle_slug_param
    AND f.status = 'active'
    AND b.status = 'active';
END;
$$ LANGUAGE plpgsql STABLE;

-- Calculate bundle savings vs individual features
CREATE OR REPLACE FUNCTION calculate_bundle_savings(bundle_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  bundle_price DECIMAL(10, 2);
  individual_total DECIMAL(10, 2);
  savings_amount DECIMAL(10, 2);
  savings_percentage INTEGER;
BEGIN
  -- Get bundle price
  SELECT monthly_price INTO bundle_price
  FROM bundles WHERE id = bundle_id_param;

  -- Calculate sum of individual feature prices
  SELECT COALESCE(SUM(f.monthly_price), 0) INTO individual_total
  FROM features f
  INNER JOIN bundle_features bf ON f.id = bf.feature_id
  WHERE bf.bundle_id = bundle_id_param
    AND f.monthly_price IS NOT NULL;

  -- Calculate savings
  IF individual_total > 0 THEN
    savings_amount := individual_total - bundle_price;
    savings_percentage := ROUND((savings_amount / individual_total * 100)::NUMERIC);
  ELSE
    savings_amount := 0;
    savings_percentage := 0;
  END IF;

  RETURN jsonb_build_object(
    'bundle_price', bundle_price,
    'individual_total', individual_total,
    'savings_amount', savings_amount,
    'savings_percentage', savings_percentage
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Get active features by category
CREATE OR REPLACE FUNCTION get_features_by_category()
RETURNS TABLE (
  category feature_category,
  features JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.category,
    jsonb_agg(
      jsonb_build_object(
        'id', f.id,
        'slug', f.slug,
        'name', f.name,
        'description', f.description,
        'icon', f.icon,
        'color', f.color,
        'monthly_price', f.monthly_price,
        'is_beta', f.is_beta,
        'is_premium', f.is_premium
      ) ORDER BY f.display_order
    )
  FROM features f
  WHERE f.status = 'active'
  GROUP BY f.category
  ORDER BY f.category;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_features ENABLE ROW LEVEL SECURITY;

-- Everyone can view active features and bundles
CREATE POLICY "Anyone can view active features"
  ON features FOR SELECT
  USING (status = 'active' OR is_staff(auth.uid()));

CREATE POLICY "Anyone can view active bundles"
  ON bundles FOR SELECT
  USING (status = 'active' OR is_staff(auth.uid()));

CREATE POLICY "Anyone can view bundle_features"
  ON bundle_features FOR SELECT
  USING (TRUE);

-- Only staff with permission can manage features
CREATE POLICY "Staff can manage features"
  ON features FOR ALL
  USING (
    is_staff(auth.uid())
    AND has_permission(auth.uid(), 'manage_features')
  );

CREATE POLICY "Staff can manage bundles"
  ON bundles FOR ALL
  USING (
    is_staff(auth.uid())
    AND has_permission(auth.uid(), 'manage_features')
  );

CREATE POLICY "Staff can manage bundle_features"
  ON bundle_features FOR ALL
  USING (
    is_staff(auth.uid())
    AND has_permission(auth.uid(), 'manage_features')
  );

-- =====================================================
-- SEED DATA: Initial Features
-- =====================================================

-- Insert core features
INSERT INTO features (slug, name, description, category, status, anonymous_limit, logged_in_free_limit, monthly_price, icon, color, display_order, requires_authentication)
VALUES
  -- Existing Features
  ('profitability-calculator', 'Calculadora de Rentabilidade', 'Calculadora completa de análise de viabilidade econômica de empreendimentos imobiliários', 'calculator', 'active', 3, 10, 49.90, 'calculator', '#1976d2', 1, FALSE),

  ('market-study', 'Estudo de Mercado', 'Análise comparativa de mercado com dados de concorrência e benchmarking', 'analysis', 'active', 2, 5, 79.90, 'chart-bar', '#4caf50', 2, FALSE),

  ('project-management', 'Gestão de Projetos', 'Gerenciamento completo de projetos com unidades, permutantes e fluxo de caixa', 'management', 'active', 0, 3, 99.90, 'building', '#ff9800', 3, TRUE),

  -- New Features (to be implemented)
  ('cash-flow-calculator', 'Calculadora de Fluxo de Pagamento', 'Planejamento detalhado de fluxo de pagamentos em múltiplas fases do empreendimento', 'calculator', 'draft', 3, 10, 59.90, 'cash-register', '#9c27b0', 4, FALSE),

  ('financing-simulator', 'Simulador de Financiamento', 'Simulação de capacidade de financiamento e cálculo de parcelas (PRICE e SAC)', 'calculator', 'draft', 5, 15, 39.90, 'percentage', '#f44336', 5, FALSE),

  ('export-reports', 'Exportação de Relatórios', 'Exportação de estudos e análises em PDF, Excel e CSV', 'reporting', 'active', 1, 5, 29.90, 'download', '#607d8b', 6, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Insert bundles
INSERT INTO bundles (slug, name, description, status, monthly_price, annual_price, discount_percentage, icon, color, display_order, is_popular, is_featured, features_list, cta_text)
VALUES
  ('starter', 'Plano Starter', 'Ideal para corretores e pequenos investidores', 'active', 99.90, 999.00, 17, 'rocket', '#1976d2', 1, FALSE, FALSE,
   ARRAY[
     'Calculadora de Rentabilidade (ilimitado)',
     'Simulador de Financiamento (ilimitado)',
     'Exportação de Relatórios (5/mês)',
     'Suporte por email'
   ],
   'Começar Agora'),

  ('professional', 'Plano Professional', 'Para incorporadoras e profissionais do setor', 'active', 249.90, 2499.00, 17, 'briefcase', '#4caf50', 2, TRUE, TRUE,
   ARRAY[
     'Todos os recursos do Starter',
     'Estudo de Mercado (ilimitado)',
     'Gestão de Projetos (ilimitado)',
     'Calculadora de Fluxo (ilimitado)',
     'Exportação de Relatórios (ilimitado)',
     'Suporte prioritário'
   ],
   'Assinar Professional'),

  ('enterprise', 'Plano Enterprise', 'Solução completa para grandes incorporadoras', 'active', 499.90, 4999.00, 17, 'office-building', '#ff9800', 3, FALSE, TRUE,
   ARRAY[
     'Todos os recursos do Professional',
     'API de integração',
     'Dashboards customizados',
     'Suporte dedicado',
     'Treinamento da equipe',
     'SLA garantido'
   ],
   'Falar com Vendas')
ON CONFLICT (slug) DO NOTHING;

-- Link features to bundles
INSERT INTO bundle_features (bundle_id, feature_id, custom_limit)
SELECT
  b.id,
  f.id,
  NULL  -- Unlimited
FROM bundles b
CROSS JOIN features f
WHERE b.slug = 'starter'
  AND f.slug IN ('profitability-calculator', 'financing-simulator')
ON CONFLICT (bundle_id, feature_id) DO NOTHING;

INSERT INTO bundle_features (bundle_id, feature_id, custom_limit)
SELECT
  b.id,
  f.id,
  CASE WHEN f.slug = 'export-reports' THEN 5 ELSE NULL END
FROM bundles b
CROSS JOIN features f
WHERE b.slug = 'starter'
  AND f.slug = 'export-reports'
ON CONFLICT (bundle_id, feature_id) DO NOTHING;

INSERT INTO bundle_features (bundle_id, feature_id, custom_limit)
SELECT
  b.id,
  f.id,
  NULL  -- Unlimited
FROM bundles b
CROSS JOIN features f
WHERE b.slug = 'professional'
  AND f.slug IN (
    'profitability-calculator',
    'financing-simulator',
    'market-study',
    'project-management',
    'cash-flow-calculator',
    'export-reports'
  )
ON CONFLICT (bundle_id, feature_id) DO NOTHING;

INSERT INTO bundle_features (bundle_id, feature_id, custom_limit)
SELECT
  b.id,
  f.id,
  NULL  -- Unlimited
FROM bundles b
CROSS JOIN features f
WHERE b.slug = 'enterprise'
  AND f.status IN ('active', 'draft')  -- All features
ON CONFLICT (bundle_id, feature_id) DO NOTHING;

-- =====================================================
-- COMMENTS: Documentation
-- =====================================================

COMMENT ON TABLE features IS 'Dynamic feature catalog with usage quotas and pricing';
COMMENT ON TABLE bundles IS 'Feature bundles (subscription plans) with package pricing';
COMMENT ON TABLE bundle_features IS 'Many-to-many relationship between bundles and features';

COMMENT ON COLUMN features.slug IS 'URL-friendly identifier for feature (e.g., cash-flow-calculator)';
COMMENT ON COLUMN features.anonymous_limit IS 'Free uses for non-authenticated users (session-based)';
COMMENT ON COLUMN features.logged_in_free_limit IS 'Free uses for authenticated users without subscription';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify features:
-- SELECT * FROM features WHERE status = 'active';
-- SELECT * FROM get_features_by_category();

-- Verify bundles and savings:
-- SELECT b.name, calculate_bundle_savings(b.id)
-- FROM bundles b WHERE status = 'active';

-- =====================================================
-- END OF MIGRATION 001
-- =====================================================
