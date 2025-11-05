import { SupabaseClient } from '@supabase/supabase-js';
import { ICalculatorRepository } from '../../domain/calculator/repositories/ICalculatorRepository';
import { PaymentCalculator } from '../../domain/calculator/entities/PaymentCalculator';
import { NotFoundError, DatabaseError } from '../../lib/errors';

/**
 * Database row type for calculators table
 */
interface CalculatorRow {
  id: string;
  user_id: string;
  short_code: string | null;
  state: Record<string, any>;
  views: number;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

/**
 * Supabase Calculator Repository
 *
 * Implements ICalculatorRepository using Supabase as the persistence layer.
 * Handles mapping between PaymentCalculator domain entities and database rows.
 *
 * @example
 * ```typescript
 * const supabase = createClient();
 * const repository = new SupabaseCalculatorRepository(supabase);
 *
 * const calculator = new PaymentCalculator({ ... });
 * await repository.save(calculator);
 * ```
 */
export class SupabaseCalculatorRepository implements ICalculatorRepository {
  private readonly supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Save a new calculator to the database
   *
   * @param calculator - PaymentCalculator to save
   * @returns Saved calculator with database-generated ID
   * @throws {DatabaseError} if save operation fails
   */
  async save(calculator: PaymentCalculator): Promise<PaymentCalculator> {
    try {
      // Serialize calculator state
      const state = calculator.toJSON();
      const userId = calculator.getUserId();
      const shortCode = calculator.getShortCode() || null;
      const viewCount = calculator.getViewCount();

      // Ensure ID is a valid UUID, generate one if not
      let id = calculator.getId();
      if (!this.isValidUUID(id)) {
        id = crypto.randomUUID();
      }

      // Update state with correct ID
      state.id = id;

      // Insert into database
      const { data, error } = await this.supabase
        .from('calculators')
        .insert({
          id,
          user_id: userId,
          short_code: shortCode,
          state,
          views: viewCount,
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError(
          `Failed to save calculator: ${error.message}`,
          'save',
          error as Error
        );
      }

      if (!data) {
        throw new DatabaseError(
          'Failed to save calculator: No data returned',
          'save'
        );
      }

      // Return calculator with database ID
      return this.mapRowToCalculator(data as CalculatorRow);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error saving calculator: ${(error as Error).message}`,
        'save',
        error as Error
      );
    }
  }

  /**
   * Find calculator by ID
   *
   * @param id - Calculator ID
   * @returns Calculator or null if not found
   */
  async findById(id: string): Promise<PaymentCalculator | null> {
    try {
      const { data, error } = await this.supabase
        .from('calculators')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        // Not found is not an error, just return null
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError(
          `Failed to find calculator: ${error.message}`,
          'findById',
          error as Error
        );
      }

      if (!data) {
        return null;
      }

      return this.mapRowToCalculator(data as CalculatorRow);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error finding calculator: ${(error as Error).message}`,
        'findById',
        error as Error
      );
    }
  }

  /**
   * Find calculator by short code
   *
   * Automatically increments view count when found.
   *
   * @param shortCode - Short code to search for
   * @returns Calculator or null if not found
   */
  async findByShortCode(shortCode: string): Promise<PaymentCalculator | null> {
    try {
      const { data, error } = await this.supabase
        .from('calculators')
        .select('*')
        .eq('short_code', shortCode)
        .single();

      if (error) {
        // Not found is not an error, just return null
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError(
          `Failed to find calculator by short code: ${error.message}`,
          'findByShortCode',
          error as Error
        );
      }

      if (!data) {
        return null;
      }

      // Increment view count asynchronously (don't wait)
      const row = data as CalculatorRow;
      this.incrementViewCount(row.id).catch((err) => {
        console.error('Failed to increment view count:', err);
      });

      return this.mapRowToCalculator(row);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error finding calculator by short code: ${(error as Error).message}`,
        'findByShortCode',
        error as Error
      );
    }
  }

  /**
   * Find all calculators for a user
   *
   * @param userId - User ID to search for
   * @param limit - Maximum number of results (default: 50)
   * @returns Array of calculators
   */
  async findByUserId(userId: string, limit = 50): Promise<PaymentCalculator[]> {
    try {
      const { data, error } = await this.supabase
        .from('calculators')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new DatabaseError(
          `Failed to find calculators by user ID: ${error.message}`,
          'findByUserId',
          error as Error
        );
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((row) => this.mapRowToCalculator(row as CalculatorRow));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error finding calculators by user ID: ${(error as Error).message}`,
        'findByUserId',
        error as Error
      );
    }
  }

  /**
   * Update existing calculator
   *
   * @param calculator - Calculator to update
   * @returns Updated calculator
   * @throws {NotFoundError} if calculator doesn't exist
   * @throws {DatabaseError} if update fails
   */
  async update(calculator: PaymentCalculator): Promise<PaymentCalculator> {
    try {
      const id = calculator.getId();
      const state = calculator.toJSON();
      const shortCode = calculator.getShortCode() || null;
      const viewCount = calculator.getViewCount();

      const { data, error } = await this.supabase
        .from('calculators')
        .update({
          short_code: shortCode,
          state,
          views: viewCount,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Check if calculator doesn't exist
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Calculator', id);
        }
        throw new DatabaseError(
          `Failed to update calculator: ${error.message}`,
          'update',
          error as Error
        );
      }

      if (!data) {
        throw new NotFoundError('Calculator', id);
      }

      return this.mapRowToCalculator(data as CalculatorRow);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error updating calculator: ${(error as Error).message}`,
        'update',
        error as Error
      );
    }
  }

  /**
   * Delete calculator by ID
   *
   * @param id - Calculator ID to delete
   * @throws {NotFoundError} if calculator doesn't exist
   */
  async delete(id: string): Promise<void> {
    try {
      const { error, count } = await this.supabase
        .from('calculators')
        .delete({ count: 'exact' })
        .eq('id', id);

      if (error) {
        throw new DatabaseError(
          `Failed to delete calculator: ${error.message}`,
          'delete',
          error as Error
        );
      }

      if (count === 0) {
        throw new NotFoundError('Calculator', id);
      }
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error deleting calculator: ${(error as Error).message}`,
        'delete',
        error as Error
      );
    }
  }

  /**
   * Increment view count for a calculator
   *
   * Uses database function for atomic increment.
   *
   * @param id - Calculator ID
   */
  async incrementViewCount(id: string): Promise<void> {
    try {
      const { error } = await this.supabase.rpc('increment_calculator_views', {
        calculator_id: id,
      });

      if (error) {
        throw new DatabaseError(
          `Failed to increment view count: ${error.message}`,
          'incrementViewCount',
          error as Error
        );
      }
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error incrementing view count: ${(error as Error).message}`,
        'incrementViewCount',
        error as Error
      );
    }
  }

  /**
   * Check if a short code already exists
   *
   * @param shortCode - Short code to check
   * @returns true if exists, false otherwise
   */
  async shortCodeExists(shortCode: string): Promise<boolean> {
    try {
      const { count, error } = await this.supabase
        .from('calculators')
        .select('id', { count: 'exact', head: true })
        .eq('short_code', shortCode);

      if (error) {
        throw new DatabaseError(
          `Failed to check short code existence: ${error.message}`,
          'shortCodeExists',
          error as Error
        );
      }

      return (count ?? 0) > 0;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error checking short code existence: ${(error as Error).message}`,
        'shortCodeExists',
        error as Error
      );
    }
  }

  /**
   * Map database row to PaymentCalculator entity
   *
   * @private
   * @param row - Database row
   * @returns PaymentCalculator instance
   */
  private mapRowToCalculator(row: CalculatorRow): PaymentCalculator {
    // Sync database views with state
    const state = { ...row.state };
    state.viewCount = row.views;
    state.id = row.id;

    return PaymentCalculator.fromJSON(state);
  }

  /**
   * Check if a string is a valid UUID
   *
   * @private
   * @param str - String to check
   * @returns true if valid UUID, false otherwise
   */
  private isValidUUID(str: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
}
