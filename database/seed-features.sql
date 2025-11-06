-- =====================================================
-- Seed Feature Catalog for ImobiTools
-- =====================================================
-- Run this in Supabase SQL Editor
-- Creates feature entries for the calculator and other tools
-- =====================================================

-- Clear existing features (optional - only if you want to start fresh)
-- DELETE FROM feature_usage;
-- DELETE FROM features;

-- Insert Calculator Feature
INSERT INTO features (
  slug,
  name,
  description,
  category,
  quota_type,
  free_quota,
  premium_quota,
  is_active
) VALUES (
  'calculadora-imoveis',
  'Calculadora de Imóveis',
  'Simule o status de aprovação do financiamento imobiliário com cálculos detalhados de entrada, captação e pagamentos',
  'tools',
  'usage_count',
  3,
  10,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  free_quota = EXCLUDED.free_quota,
  premium_quota = EXCLUDED.premium_quota,
  updated_at = NOW();

-- Insert Market Study Feature (for future use)
INSERT INTO features (
  slug,
  name,
  description,
  category,
  quota_type,
  free_quota,
  premium_quota,
  is_active
) VALUES (
  'estudo-mercado',
  'Estudo de Mercado',
  'Análise completa de mercado imobiliário com comparativos e tendências',
  'analytics',
  'usage_count',
  2,
  20,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  free_quota = EXCLUDED.free_quota,
  premium_quota = EXCLUDED.premium_quota,
  updated_at = NOW();

-- Insert Projects Table Feature (for future use)
INSERT INTO features (
  slug,
  name,
  description,
  category,
  quota_type,
  free_quota,
  premium_quota,
  is_active
) VALUES (
  'tabela-empreendimentos',
  'Tabela de Empreendimentos',
  'Gerencie e compare múltiplos empreendimentos imobiliários',
  'management',
  'usage_count',
  5,
  50,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  free_quota = EXCLUDED.free_quota,
  premium_quota = EXCLUDED.premium_quota,
  updated_at = NOW();

-- Verify features were created
SELECT
  slug,
  name,
  category,
  free_quota as "Quota Gratuita",
  premium_quota as "Quota Premium",
  is_active as "Ativo"
FROM features
ORDER BY category, name;

-- Show usage quotas summary
SELECT
  '✅ Features created successfully!' as status,
  COUNT(*) as total_features,
  SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_features
FROM features;
