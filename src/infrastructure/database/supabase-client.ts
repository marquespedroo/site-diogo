import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize and return Supabase client singleton
 *
 * Creates a singleton instance of the Supabase client using environment variables.
 * Subsequent calls return the same instance.
 *
 * @throws {Error} If required environment variables are missing
 * @returns {SupabaseClient} Initialized Supabase client
 *
 * @example
 * ```typescript
 * const supabase = createClient();
 * const { data, error } = await supabase.from('calculators').select('*');
 * ```
 */
export function createClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required'
    );
  }

  supabaseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

/**
 * Reset the Supabase client singleton (useful for testing)
 *
 * @internal
 */
export function resetClient(): void {
  supabaseClient = null;
}
