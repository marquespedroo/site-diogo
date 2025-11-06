/**
 * Feature Access Control - ImobiTools
 * Handles feature quota checking and usage tracking
 */

import { supabase } from '../../infrastructure/database/supabase-client';

// =====================================================
// TYPES
// =====================================================

export interface FeatureAccessResult {
  allowed: boolean;
  reason: 'staff_access' | 'subscription_access' | 'free_tier_logged_in' | 'free_tier_anonymous' | 'quota_exceeded' | 'feature_not_found';
  message: string;
  usage_count?: number;
  limit?: number | null;
  remaining?: number;
  upgrade_required?: boolean;
  login_required?: boolean;
  logged_in_limit?: number;
  feature_price?: number;
  subscription_type?: 'feature' | 'bundle';
  subscription_id?: string;
}

export interface UsageRecordResult {
  success: boolean;
  error?: string;
  usage_id?: string;
  access_info?: FeatureAccessResult;
  details?: FeatureAccessResult;
}

export interface Feature {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  status: string;
  anonymous_limit: number;
  logged_in_free_limit: number;
  monthly_price: number | null;
  icon: string | null;
  color: string | null;
}

// =====================================================
// SESSION MANAGEMENT
// =====================================================

/**
 * Get or create anonymous session ID
 * Stored in sessionStorage for anonymous user tracking
 */
export const getAnonymousSessionId = (): string => {
  const STORAGE_KEY = 'imobitools_session_id';

  let sessionId = sessionStorage.getItem(STORAGE_KEY);

  if (!sessionId) {
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    sessionStorage.setItem(STORAGE_KEY, sessionId);
  }

  return sessionId;
};

// =====================================================
// FEATURE ACCESS CONTROL
// =====================================================

/**
 * Check if user/session can access a feature
 */
export const canAccessFeature = async (
  featureSlug: string,
  userId?: string | null
): Promise<FeatureAccessResult> => {
  try {
    const sessionId = userId ? null : getAnonymousSessionId();

    const { data, error } = await supabase.rpc('can_access_feature', {
      feature_slug_param: featureSlug,
      user_uuid: userId || null,
      session_id_param: sessionId,
    });

    if (error) {
      console.error('Error checking feature access:', error);
      return {
        allowed: false,
        reason: 'feature_not_found',
        message: 'Error checking feature access',
      };
    }

    return data as FeatureAccessResult;
  } catch (error) {
    console.error('Exception checking feature access:', error);
    return {
      allowed: false,
      reason: 'feature_not_found',
      message: 'Exception checking feature access',
    };
  }
};

/**
 * Record feature usage
 * Also performs access control check
 */
export const recordFeatureUsage = async (
  featureSlug: string,
  action: string = 'use',
  userId?: string | null,
  metadata?: Record<string, any>
): Promise<UsageRecordResult> => {
  try {
    const sessionId = userId ? null : getAnonymousSessionId();

    const { data, error } = await supabase.rpc('record_feature_usage', {
      feature_slug_param: featureSlug,
      action_param: action,
      user_uuid: userId || null,
      session_id_param: sessionId,
      metadata_param: metadata || {},
      ip_param: null, // IP will be captured by backend if needed
      user_agent_param: navigator.userAgent,
    });

    if (error) {
      console.error('Error recording feature usage:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return data as UsageRecordResult;
  } catch (error) {
    console.error('Exception recording feature usage:', error);
    return {
      success: false,
      error: 'Exception recording feature usage',
    };
  }
};

/**
 * Get all active features
 */
export const getActiveFeatures = async (): Promise<Feature[]> => {
  try {
    const { data, error } = await supabase
      .from('features')
      .select('*')
      .eq('status', 'active')
      .order('display_order');

    if (error) {
      console.error('Error fetching features:', error);
      return [];
    }

    return data as Feature[];
  } catch (error) {
    console.error('Exception fetching features:', error);
    return [];
  }
};

/**
 * Get features by category
 */
export const getFeaturesByCategory = async (category: string): Promise<Feature[]> => {
  try {
    const { data, error } = await supabase
      .from('features')
      .select('*')
      .eq('status', 'active')
      .eq('category', category)
      .order('display_order');

    if (error) {
      console.error('Error fetching features by category:', error);
      return [];
    }

    return data as Feature[];
  } catch (error) {
    console.error('Exception fetching features by category:', error);
    return [];
  }
};

// =====================================================
// USER SUBSCRIPTIONS
// =====================================================

export interface UserSubscription {
  id: string;
  subscription_type: 'feature' | 'bundle';
  status: string;
  feature_slug?: string;
  bundle_slug?: string;
  amount: number;
  period_end: string;
}

/**
 * Get user's active subscriptions
 */
export const getUserSubscriptions = async (userId: string): Promise<UserSubscription[]> => {
  try {
    const { data, error } = await supabase.rpc('get_user_subscriptions', {
      user_uuid: userId,
    });

    if (error) {
      console.error('Error fetching user subscriptions:', error);
      return [];
    }

    return data as UserSubscription[];
  } catch (error) {
    console.error('Exception fetching user subscriptions:', error);
    return [];
  }
};

/**
 * Get user's usage statistics
 */
export interface UsageStats {
  feature_slug: string;
  feature_name: string;
  usage_count: number;
  limit_amount: number;
  has_subscription: boolean;
}

export const getUserUsageStats = async (
  userId: string,
  periodDays: number = 30
): Promise<UsageStats[]> => {
  try {
    const { data, error } = await supabase.rpc('get_user_usage_stats', {
      user_uuid: userId,
      period_days: periodDays,
    });

    if (error) {
      console.error('Error fetching usage stats:', error);
      return [];
    }

    return data as UsageStats[];
  } catch (error) {
    console.error('Exception fetching usage stats:', error);
    return [];
  }
};

// =====================================================
// FEATURE GATING HOC
// =====================================================

/**
 * Feature gate component wrapper
 * Shows upgrade prompt if access denied
 */
export interface FeatureGateProps {
  featureSlug: string;
  userId?: string | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onAccessDenied?: (result: FeatureAccessResult) => void;
}

/**
 * Check if feature requires upgrade
 */
export const requiresUpgrade = (accessResult: FeatureAccessResult): boolean => {
  return !accessResult.allowed && (accessResult.upgrade_required === true || accessResult.login_required === true);
};

/**
 * Get upgrade message for access result
 */
export const getUpgradeMessage = (accessResult: FeatureAccessResult): string => {
  if (accessResult.login_required) {
    return `Você usou ${accessResult.usage_count}/${accessResult.limit} tentativas gratuitas. Faça login para obter ${accessResult.logged_in_limit} tentativas adicionais!`;
  }

  if (accessResult.upgrade_required) {
    const price = accessResult.feature_price ? `R$ ${accessResult.feature_price.toFixed(2)}/mês` : 'Ver planos';
    return `Você atingiu o limite de ${accessResult.limit} usos gratuitos. Assine por ${price} para uso ilimitado!`;
  }

  return accessResult.message;
};
