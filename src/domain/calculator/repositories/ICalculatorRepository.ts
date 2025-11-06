import { PaymentCalculator } from '../entities/PaymentCalculator';

/**
 * ICalculatorRepository Interface
 *
 * Repository interface for PaymentCalculator persistence.
 * Follows Repository pattern - abstracts data access from domain logic.
 * Implementations: SupabaseCalculatorRepository
 *
 * @example
 * const repository: ICalculatorRepository = new SupabaseCalculatorRepository(supabase);
 * await repository.save(calculator);
 * const found = await repository.findById('abc123');
 */
export interface ICalculatorRepository {
  /**
   * Save a new calculator to the database
   * @throws {DatabaseError} if save fails
   */
  save(calculator: PaymentCalculator): Promise<PaymentCalculator>;

  /**
   * Find calculator by ID
   * @returns Calculator or null if not found
   */
  findById(id: string): Promise<PaymentCalculator | null>;

  /**
   * Find calculator by short code (for shareable links)
   * @returns Calculator or null if not found
   */
  findByShortCode(shortCode: string): Promise<PaymentCalculator | null>;

  /**
   * Find all calculators for a user
   * @param userId - User ID to search for
   * @param limit - Maximum number of results (default: 50)
   * @returns Array of calculators
   */
  findByUserId(userId: string, limit?: number): Promise<PaymentCalculator[]>;

  /**
   * Update existing calculator
   * @throws {NotFoundError} if calculator doesn't exist
   * @throws {DatabaseError} if update fails
   */
  update(calculator: PaymentCalculator): Promise<PaymentCalculator>;

  /**
   * Delete calculator by ID
   * @throws {NotFoundError} if calculator doesn't exist
   */
  delete(id: string): Promise<void>;

  /**
   * Increment view count for a calculator (for analytics)
   * @param id - Calculator ID
   */
  incrementViewCount(id: string): Promise<void>;

  /**
   * Check if a short code already exists
   * @param shortCode - Short code to check
   * @returns true if exists, false otherwise
   */
  shortCodeExists(shortCode: string): Promise<boolean>;
}
