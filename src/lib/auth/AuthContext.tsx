/**
 * Authentication Context - ImobiTools
 * Provides authentication state and methods throughout the application
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../../infrastructure/database/supabase-client';

// =====================================================
// TYPES
// =====================================================

export interface UserProfile {
  id: string;
  role: 'client' | 'support' | 'admin' | 'owner';
  account_status: 'pending_verification' | 'active' | 'suspended' | 'deactivated' | 'banned';
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  creci: string | null;
  cnpj: string | null;
  email: string;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  email_verified_at: string | null;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

export interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  isStaff: () => boolean;
  hasPermission: (permission: string) => Promise<boolean>;
}

// =====================================================
// CONTEXT
// =====================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =====================================================
// PROVIDER
// =====================================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    initialized: false,
  });

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, email:auth.users(email)')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      // Extract email from nested auth.users object
      const email = (data as any).email?.[0]?.email || '';

      return {
        ...data,
        email,
      } as UserProfile;
    } catch (error) {
      console.error('Exception fetching profile:', error);
      return null;
    }
  }, []);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (state.user) {
      const profile = await fetchProfile(state.user.id);
      setState(prev => ({ ...prev, profile }));
    }
  }, [state.user, fetchProfile]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setState(prev => ({ ...prev, loading: false, initialized: true }));
          }
          return;
        }

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);

          if (mounted) {
            setState({
              user: session.user,
              profile,
              session,
              loading: false,
              initialized: true,
            });
          }

          // Update last_login_at
          await supabase
            .from('profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', session.user.id);
        } else {
          if (mounted) {
            setState(prev => ({ ...prev, loading: false, initialized: true }));
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setState(prev => ({ ...prev, loading: false, initialized: true }));
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (mounted) {
          setState({
            user: session.user,
            profile,
            session,
            loading: false,
            initialized: true,
          });
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            initialized: true,
          });
        }
      } else if (event === 'USER_UPDATED' && session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (mounted) {
          setState(prev => ({
            ...prev,
            user: session.user,
            profile,
            session,
          }));
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign up
  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  // Sign in
  const signIn = useCallback(async (
    email: string,
    password: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // Reset password
  const resetPassword = useCallback(async (
    email: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  // Update password
  const updatePassword = useCallback(async (
    newPassword: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (
    updates: Partial<UserProfile>
  ): Promise<{ error: Error | null }> => {
    if (!state.user) {
      return { error: new Error('No user logged in') };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', state.user.id);

      if (error) {
        return { error };
      }

      // Refresh profile data
      await refreshProfile();

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }, [state.user, refreshProfile]);

  // Check if user is staff
  const isStaff = useCallback((): boolean => {
    return state.profile?.role !== 'client';
  }, [state.profile]);

  // Check if user has specific permission
  const hasPermission = useCallback(async (permission: string): Promise<boolean> => {
    if (!state.user || !state.profile) return false;

    // Owner has all permissions
    if (state.profile.role === 'owner') return true;

    // Check in database
    try {
      const { data, error } = await supabase.rpc('has_permission', {
        user_uuid: state.user.id,
        permission_name: permission,
      });

      if (error) {
        console.error('Error checking permission:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Exception checking permission:', error);
      return false;
    }
  }, [state.user, state.profile]);

  const value: AuthContextType = {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshProfile,
    isStaff,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// =====================================================
// HOOK
// =====================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// =====================================================
// UTILITY HOOKS
// =====================================================

/**
 * Hook to require authentication
 * Redirects to login if not authenticated
 */
export const useRequireAuth = (redirectUrl: string = '/login') => {
  const { user, loading, initialized } = useAuth();

  useEffect(() => {
    if (initialized && !loading && !user) {
      window.location.href = redirectUrl;
    }
  }, [user, loading, initialized, redirectUrl]);

  return { user, loading };
};

/**
 * Hook to require staff role
 * Redirects if not staff
 */
export const useRequireStaff = (redirectUrl: string = '/') => {
  const { user, profile, loading, initialized, isStaff } = useAuth();

  useEffect(() => {
    if (initialized && !loading && (!user || !isStaff())) {
      window.location.href = redirectUrl;
    }
  }, [user, profile, loading, initialized, isStaff, redirectUrl]);

  return { user, profile, loading };
};
