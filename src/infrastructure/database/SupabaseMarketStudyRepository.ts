import { SupabaseClient } from '@supabase/supabase-js';
import { IMarketStudyRepository } from '@/domain/market-study/repositories/IMarketStudyRepository';
import { MarketStudy } from '@/domain/market-study/entities/MarketStudy';
import { NotFoundError, DatabaseError } from '@/lib/errors';
import { isValidUUID } from '@/lib/utils/uuid';
import { PAGINATION } from '@/lib/constants';

/**
 * Database row type for market_studies table
 */
interface MarketStudyRow {
  id: string;
  user_id: string;
  state: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase Market Study Repository
 *
 * Implements IMarketStudyRepository using Supabase as the persistence layer.
 * Handles mapping between MarketStudy domain entities and database rows.
 *
 * Table structure:
 * - id: UUID primary key
 * - user_id: UUID foreign key to users table
 * - state: JSONB containing full MarketStudy serialization
 * - created_at: timestamp
 * - updated_at: timestamp
 *
 * @example
 * ```typescript
 * const supabase = createClient();
 * const repository = new SupabaseMarketStudyRepository(supabase);
 *
 * const marketStudy = new MarketStudy({ ... });
 * await repository.save(marketStudy);
 * ```
 */
export class SupabaseMarketStudyRepository implements IMarketStudyRepository {
  private readonly supabase: SupabaseClient;
  private readonly tableName = 'market_studies';

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Save a new market study to the database
   *
   * @param marketStudy - MarketStudy to save
   * @returns Saved market study with database-generated ID
   * @throws {DatabaseError} if save operation fails
   */
  async save(marketStudy: MarketStudy): Promise<MarketStudy> {
    try {
      // Serialize market study state
      const state = marketStudy.toJSON();
      const userId = marketStudy.getUserId();

      // Ensure ID is a valid UUID, generate one if not
      let id = marketStudy.getId();
      if (!isValidUUID(id)) {
        id = crypto.randomUUID();
      }

      // Update state with correct ID
      state.id = id;

      // Insert into database
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert({
          id,
          user_id: userId,
          state,
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError(
          `Failed to save market study: ${error.message}`,
          'save',
          error as Error
        );
      }

      if (!data) {
        throw new DatabaseError('Failed to save market study: No data returned', 'save');
      }

      // Return market study with database ID
      return this.mapRowToMarketStudy(data as MarketStudyRow);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error saving market study: ${(error as Error).message}`,
        'save',
        error as Error
      );
    }
  }

  /**
   * Find market study by ID
   *
   * @param id - Market study ID
   * @returns MarketStudy or null if not found
   */
  async findById(id: string): Promise<MarketStudy | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        // Not found is not an error, just return null
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError(
          `Failed to find market study: ${error.message}`,
          'findById',
          error as Error
        );
      }

      if (!data) {
        return null;
      }

      return this.mapRowToMarketStudy(data as MarketStudyRow);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error finding market study: ${(error as Error).message}`,
        'findById',
        error as Error
      );
    }
  }

  /**
   * Find all market studies for a user
   *
   * @param userId - User ID to search for
   * @param limit - Maximum number of results (default: 50)
   * @param offset - Number of results to skip (default: 0)
   * @returns Array of market studies
   */
  async findByUserId(
    userId: string,
    limit: number = PAGINATION.DEFAULT_LIMIT,
    offset: number = PAGINATION.DEFAULT_OFFSET
  ): Promise<MarketStudy[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new DatabaseError(
          `Failed to find market studies by user ID: ${error.message}`,
          'findByUserId',
          error as Error
        );
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((row) => this.mapRowToMarketStudy(row as MarketStudyRow));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error finding market studies by user ID: ${(error as Error).message}`,
        'findByUserId',
        error as Error
      );
    }
  }

  /**
   * Update existing market study
   *
   * @param marketStudy - MarketStudy to update
   * @returns Updated market study
   * @throws {NotFoundError} if market study doesn't exist
   * @throws {DatabaseError} if update fails
   */
  async update(marketStudy: MarketStudy): Promise<MarketStudy> {
    try {
      const id = marketStudy.getId();
      const state = marketStudy.toJSON();

      const { data, error } = await this.supabase
        .from(this.tableName)
        .update({
          state,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Check if market study doesn't exist
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Market study', id);
        }
        throw new DatabaseError(
          `Failed to update market study: ${error.message}`,
          'update',
          error as Error
        );
      }

      if (!data) {
        throw new NotFoundError('Market study', id);
      }

      return this.mapRowToMarketStudy(data as MarketStudyRow);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error updating market study: ${(error as Error).message}`,
        'update',
        error as Error
      );
    }
  }

  /**
   * Delete market study by ID
   *
   * @param id - Market study ID to delete
   * @throws {NotFoundError} if market study doesn't exist
   */
  async delete(id: string): Promise<void> {
    try {
      const { error, count } = await this.supabase
        .from(this.tableName)
        .delete({ count: 'exact' })
        .eq('id', id);

      if (error) {
        throw new DatabaseError(
          `Failed to delete market study: ${error.message}`,
          'delete',
          error as Error
        );
      }

      if (count === 0) {
        throw new NotFoundError('Market study', id);
      }
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error deleting market study: ${(error as Error).message}`,
        'delete',
        error as Error
      );
    }
  }

  /**
   * Count total market studies for a user
   *
   * @param userId - User ID to count for
   * @returns Total count
   */
  async countByUserId(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        throw new DatabaseError(
          `Failed to count market studies: ${error.message}`,
          'countByUserId',
          error as Error
        );
      }

      return count ?? 0;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error counting market studies: ${(error as Error).message}`,
        'countByUserId',
        error as Error
      );
    }
  }

  /**
   * Find recent market studies across all users
   *
   * @param limit - Maximum number of results (default: 20)
   * @returns Array of recent market studies
   */
  async findRecent(limit: number = 20): Promise<MarketStudy[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new DatabaseError(
          `Failed to find recent market studies: ${error.message}`,
          'findRecent',
          error as Error
        );
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((row) => this.mapRowToMarketStudy(row as MarketStudyRow));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error finding recent market studies: ${(error as Error).message}`,
        'findRecent',
        error as Error
      );
    }
  }

  /**
   * Search market studies by property location
   *
   * @param userId - User ID to scope search
   * @param city - City name to search
   * @param neighborhood - Optional neighborhood to filter
   * @returns Array of market studies in the specified location
   */
  async searchByLocation(
    userId: string,
    city: string,
    neighborhood?: string
  ): Promise<MarketStudy[]> {
    try {
      let query = this.supabase.from(this.tableName).select('*').eq('user_id', userId);

      // Use JSONB query operators to search within the state column
      query = query.eq('state->>propertyAddress->>city', city);

      if (neighborhood) {
        query = query.eq('state->>propertyAddress->>neighborhood', neighborhood);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError(
          `Failed to search market studies by location: ${error.message}`,
          'searchByLocation',
          error as Error
        );
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((row) => this.mapRowToMarketStudy(row as MarketStudyRow));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error searching market studies by location: ${(error as Error).message}`,
        'searchByLocation',
        error as Error
      );
    }
  }

  /**
   * Map database row to MarketStudy entity
   *
   * @private
   * @param row - Database row
   * @returns MarketStudy instance
   */
  private mapRowToMarketStudy(row: MarketStudyRow): MarketStudy {
    // Sync database metadata with state
    const state = { ...row.state };
    state.id = row.id;
    state.createdAt = row.created_at;
    state.updatedAt = row.updated_at;

    return MarketStudy.fromJSON(state);
  }
}
