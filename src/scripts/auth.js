/**
 * Authentication Module for ImobiTools
 * Provides authentication functionality for multi-page application
 */

import { createClient } from '../infrastructure/database/supabase-client';

// Initialize Supabase client
const supabase = createClient();

// ===== STATE MANAGEMENT =====
let currentUser = null;
let currentProfile = null;
let authListeners = [];

/**
 * Initialize authentication system
 * Call this on page load
 */
export async function initAuth() {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      currentUser = session.user;
      await loadUserProfile(session.user.id);
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] State changed:', event);

      if (session?.user) {
        currentUser = session.user;
        await loadUserProfile(session.user.id);
      } else {
        currentUser = null;
        currentProfile = null;
      }

      // Notify listeners
      notifyAuthChange(event, session);

      // Update UI
      updateAuthUI();
    });

    // Initial UI update
    updateAuthUI();

    return { user: currentUser, profile: currentProfile };
  } catch (error) {
    console.error('[Auth] Initialization error:', error);
    return { user: null, profile: null, error };
  }
}

/**
 * Load user profile from database
 */
async function loadUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    currentProfile = data;
    return data;
  } catch (error) {
    console.error('[Auth] Profile load error:', error);
    return null;
  }
}

// ===== AUTHENTICATION METHODS =====

/**
 * Sign up new user
 */
export async function signUp(email, password, fullName) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('[Auth] Sign up error:', error);
    return { data: null, error };
  }
}

/**
 * Sign in existing user
 */
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('[Auth] Sign in error:', error);
    return { data: null, error };
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    currentUser = null;
    currentProfile = null;

    return { error: null };
  } catch (error) {
    console.error('[Auth] Sign out error:', error);
    return { error };
  }
}

/**
 * Reset password
 */
export async function resetPassword(email) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password.html`
    });

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('[Auth] Reset password error:', error);
    return { error };
  }
}

// ===== GETTERS =====

/**
 * Get current user
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Get current user profile
 */
export function getCurrentProfile() {
  return currentProfile;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return currentUser !== null;
}

/**
 * Check if user is staff (support, admin, or owner)
 */
export function isStaff() {
  return currentProfile && ['support', 'admin', 'owner'].includes(currentProfile.role);
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(permissionName) {
  if (!currentUser) return false;

  try {
    const { data, error } = await supabase.rpc('has_permission', {
      user_uuid: currentUser.id,
      permission_name: permissionName
    });

    if (error) throw error;

    return data === true;
  } catch (error) {
    console.error('[Auth] Permission check error:', error);
    return false;
  }
}

// ===== FEATURE ACCESS =====

/**
 * Get anonymous session ID for tracking
 */
function getAnonymousSessionId() {
  let sessionId = sessionStorage.getItem('imobitools_anonymous_session');
  if (!sessionId) {
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('imobitools_anonymous_session', sessionId);
  }
  return sessionId;
}

/**
 * Check if user can access a feature
 */
export async function canAccessFeature(featureSlug) {
  try {
    const sessionId = currentUser ? null : getAnonymousSessionId();

    const { data, error } = await supabase.rpc('can_access_feature', {
      feature_slug_param: featureSlug,
      user_uuid: currentUser?.id || null,
      session_id_param: sessionId
    });

    if (error) throw error;

    return {
      canAccess: data.can_access,
      reason: data.reason,
      remainingUses: data.remaining_uses,
      requiresLogin: data.requires_login,
      requiresSubscription: data.requires_subscription
    };
  } catch (error) {
    console.error('[Auth] Feature access check error:', error);
    return {
      canAccess: false,
      reason: 'error',
      error: error.message
    };
  }
}

/**
 * Record feature usage
 */
export async function recordFeatureUsage(featureSlug, action = 'use', metadata = {}) {
  try {
    const sessionId = currentUser ? null : getAnonymousSessionId();

    const { data, error } = await supabase.rpc('record_feature_usage', {
      feature_slug_param: featureSlug,
      action_param: action,
      user_uuid: currentUser?.id || null,
      session_id_param: sessionId,
      metadata_param: metadata,
      user_agent_param: navigator.userAgent
    });

    if (error) throw error;

    return {
      success: data.success,
      message: data.message,
      usageId: data.usage_id
    };
  } catch (error) {
    console.error('[Auth] Feature usage record error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ===== EVENT LISTENERS =====

/**
 * Add auth state change listener
 */
export function onAuthStateChange(callback) {
  authListeners.push(callback);

  // Return unsubscribe function
  return () => {
    const index = authListeners.indexOf(callback);
    if (index > -1) {
      authListeners.splice(index, 1);
    }
  };
}

/**
 * Notify all auth change listeners
 */
function notifyAuthChange(event, session) {
  authListeners.forEach(callback => {
    try {
      callback(event, session);
    } catch (error) {
      console.error('[Auth] Listener error:', error);
    }
  });
}

// ===== UI UPDATES =====

/**
 * Update authentication UI elements
 */
function updateAuthUI() {
  const authButton = document.getElementById('authButton');
  const userMenuButton = document.getElementById('userMenuButton');
  const userMenu = document.getElementById('userMenu');

  if (!authButton) return;

  if (isAuthenticated()) {
    // Show user menu
    authButton.style.display = 'none';
    if (userMenuButton) {
      userMenuButton.style.display = 'flex';

      // Update user info
      const userNameElement = userMenuButton.querySelector('.user-name');
      const userEmailElement = userMenuButton.querySelector('.user-email');

      if (userNameElement && currentProfile) {
        userNameElement.textContent = currentProfile.full_name || 'Usuário';
      }
      if (userEmailElement && currentUser) {
        userEmailElement.textContent = currentUser.email;
      }
    }
  } else {
    // Show login button
    authButton.style.display = 'flex';
    if (userMenuButton) {
      userMenuButton.style.display = 'none';
    }
  }
}

/**
 * Show authentication modal
 */
export function showAuthModal(mode = 'login') {
  const modal = document.getElementById('authModal');
  if (!modal) return;

  // Set mode
  const loginForm = modal.querySelector('.login-form');
  const signupForm = modal.querySelector('.signup-form');

  if (mode === 'login') {
    if (loginForm) loginForm.style.display = 'block';
    if (signupForm) signupForm.style.display = 'none';
  } else {
    if (loginForm) loginForm.style.display = 'none';
    if (signupForm) signupForm.style.display = 'block';
  }

  modal.style.display = 'flex';
}

/**
 * Hide authentication modal
 */
export function hideAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// ===== EXPORTS =====
export const auth = {
  initAuth,
  signUp,
  signIn,
  signOut,
  resetPassword,
  getCurrentUser,
  getCurrentProfile,
  isAuthenticated,
  isStaff,
  hasPermission,
  canAccessFeature,
  recordFeatureUsage,
  onAuthStateChange,
  showAuthModal,
  hideAuthModal
};

// Make available globally for inline script handlers
if (typeof window !== 'undefined') {
  window.imobiAuth = auth;
}
