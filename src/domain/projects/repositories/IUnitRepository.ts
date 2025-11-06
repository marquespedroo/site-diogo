import { Unit, UnitStatus } from '../entities/Unit';

/**
 * Unit Filter Options
 */
export interface UnitFilterOptions {
  projectId?: string;
  status?: UnitStatus;
  tower?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  origin?: 'real' | 'permutante';
  limit?: number;
  offset?: number;
  sortBy?: 'price' | 'area' | 'createdAt' | 'identifier';
  sortOrder?: 'asc' | 'desc';
}

/**
 * IUnitRepository Interface
 *
 * Repository interface for Unit entity persistence.
 * Follows Repository pattern from DDD.
 *
 * Note: Units are typically managed through their parent Project aggregate,
 * but this repository provides direct access for queries and bulk operations.
 *
 * @example
 * const repository = new SupabaseUnitRepository(supabase);
 * const units = await repository.findByProjectId('proj-123');
 */
export interface IUnitRepository {
  /**
   * Save a new unit
   *
   * @param unit - Unit to save
   * @returns Saved unit with generated ID
   * @throws {DatabaseError} if save fails
   */
  save(unit: Unit): Promise<Unit>;

  /**
   * Save multiple units at once (bulk insert)
   *
   * @param units - Array of units to save
   * @returns Array of saved units
   * @throws {DatabaseError} if save fails
   */
  saveMany(units: Unit[]): Promise<Unit[]>;

  /**
   * Find unit by ID
   *
   * @param id - Unit ID
   * @returns Unit or null if not found
   * @throws {DatabaseError} if query fails
   */
  findById(id: string): Promise<Unit | null>;

  /**
   * Find all units in a project
   *
   * @param projectId - Project ID
   * @returns Array of units
   * @throws {DatabaseError} if query fails
   */
  findByProjectId(projectId: string): Promise<Unit[]>;

  /**
   * Find units with filters
   *
   * @param filters - Filter options
   * @returns Array of units
   * @throws {DatabaseError} if query fails
   */
  findAll(filters: UnitFilterOptions): Promise<Unit[]>;

  /**
   * Update existing unit
   *
   * @param unit - Unit to update
   * @returns Updated unit
   * @throws {NotFoundError} if unit doesn't exist
   * @throws {DatabaseError} if update fails
   */
  update(unit: Unit): Promise<Unit>;

  /**
   * Update multiple units at once (bulk update)
   *
   * Useful for batch status changes.
   *
   * @param units - Array of units to update
   * @returns Array of updated units
   * @throws {DatabaseError} if update fails
   */
  updateMany(units: Unit[]): Promise<Unit[]>;

  /**
   * Delete unit by ID
   *
   * @param id - Unit ID
   * @throws {NotFoundError} if unit doesn't exist
   * @throws {DatabaseError} if delete fails
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all units in a project
   *
   * @param projectId - Project ID
   * @returns Number of units deleted
   * @throws {DatabaseError} if delete fails
   */
  deleteByProjectId(projectId: string): Promise<number>;

  /**
   * Count units
   *
   * @param filters - Optional filters
   * @returns Count of units
   * @throws {DatabaseError} if query fails
   */
  count(filters?: UnitFilterOptions): Promise<number>;

  /**
   * Check if unit exists
   *
   * @param id - Unit ID
   * @returns true if exists
   * @throws {DatabaseError} if query fails
   */
  exists(id: string): Promise<boolean>;
}
