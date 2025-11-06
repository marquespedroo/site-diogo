import { MarketStudy } from '../entities/MarketStudy';

/**
 * IMarketStudyRepository Interface
 *
 * Repository interface for MarketStudy persistence.
 * Follows Repository pattern - abstracts data access from domain logic.
 * Implementations: SupabaseMarketStudyRepository
 *
 * @example
 * const repository: IMarketStudyRepository = new SupabaseMarketStudyRepository(supabase);
 * await repository.save(marketStudy);
 * const found = await repository.findById('study-123');
 */
export interface IMarketStudyRepository {
  /**
   * Save a new market study to the database
   *
   * @param marketStudy - MarketStudy to save
   * @returns Saved market study with database-generated ID
   * @throws {DatabaseError} if save fails
   */
  save(marketStudy: MarketStudy): Promise<MarketStudy>;

  /**
   * Find market study by ID
   *
   * @param id - Market study ID
   * @returns MarketStudy or null if not found
   * @throws {DatabaseError} if query fails
   */
  findById(id: string): Promise<MarketStudy | null>;

  /**
   * Find all market studies for a user
   *
   * @param userId - User ID to search for
   * @param limit - Maximum number of results (default: 50)
   * @param offset - Number of results to skip for pagination (default: 0)
   * @returns Array of market studies, ordered by creation date (newest first)
   * @throws {DatabaseError} if query fails
   */
  findByUserId(userId: string, limit?: number, offset?: number): Promise<MarketStudy[]>;

  /**
   * Update existing market study
   *
   * Used for updating URLs (PDF, slides) or selected standard.
   *
   * @param marketStudy - MarketStudy to update
   * @returns Updated market study
   * @throws {NotFoundError} if market study doesn't exist
   * @throws {DatabaseError} if update fails
   */
  update(marketStudy: MarketStudy): Promise<MarketStudy>;

  /**
   * Delete market study by ID
   *
   * @param id - Market study ID to delete
   * @throws {NotFoundError} if market study doesn't exist
   * @throws {DatabaseError} if delete fails
   */
  delete(id: string): Promise<void>;

  /**
   * Count total market studies for a user
   *
   * Useful for pagination and analytics.
   *
   * @param userId - User ID to count for
   * @returns Total count of market studies
   * @throws {DatabaseError} if query fails
   */
  countByUserId(userId: string): Promise<number>;

  /**
   * Find recent market studies across all users
   *
   * Admin/analytics function.
   *
   * @param limit - Maximum number of results (default: 20)
   * @returns Array of recent market studies
   * @throws {DatabaseError} if query fails
   */
  findRecent(limit?: number): Promise<MarketStudy[]>;

  /**
   * Search market studies by property address
   *
   * Useful for finding similar studies in the same area.
   *
   * @param userId - User ID (to scope search to user's studies)
   * @param city - City name to search
   * @param neighborhood - Optional neighborhood to filter
   * @returns Array of market studies in the specified location
   * @throws {DatabaseError} if query fails
   */
  searchByLocation(userId: string, city: string, neighborhood?: string): Promise<MarketStudy[]>;
}
