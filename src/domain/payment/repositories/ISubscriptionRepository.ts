import { Subscription } from '../entities/Subscription';

/**
 * ISubscriptionRepository Interface
 *
 * Repository interface for Subscription persistence.
 * Follows Repository pattern - abstracts data access from domain logic.
 * Implementations: SupabaseSubscriptionRepository
 *
 * @example
 * const repository: ISubscriptionRepository = new SupabaseSubscriptionRepository(supabase);
 * await repository.save(subscription);
 * const found = await repository.findById('sub_123');
 */
export interface ISubscriptionRepository {
  /**
   * Save a new subscription to the database
   * @throws {DatabaseError} if save fails
   */
  save(subscription: Subscription): Promise<Subscription>;

  /**
   * Find subscription by ID
   * @returns Subscription or null if not found
   */
  findById(id: string): Promise<Subscription | null>;

  /**
   * Find subscription by external gateway ID
   * @returns Subscription or null if not found
   */
  findByExternalId(externalId: string): Promise<Subscription | null>;

  /**
   * Find active subscription for a user
   * @returns Subscription or null if no active subscription
   */
  findActiveByUserId(userId: string): Promise<Subscription | null>;

  /**
   * Find all subscriptions for a user
   * @param userId - User ID to search for
   * @param limit - Maximum number of results (default: 50)
   * @returns Array of subscriptions
   */
  findByUserId(userId: string, limit?: number): Promise<Subscription[]>;

  /**
   * Update existing subscription
   * @throws {NotFoundError} if subscription doesn't exist
   * @throws {DatabaseError} if update fails
   */
  update(subscription: Subscription): Promise<Subscription>;

  /**
   * Delete subscription by ID
   * @throws {NotFoundError} if subscription doesn't exist
   */
  delete(id: string): Promise<void>;

  /**
   * Find subscriptions ending soon (for renewal notifications)
   * @param daysUntilEnd - Number of days until period end
   * @returns Array of subscriptions ending soon
   */
  findEndingSoon(daysUntilEnd: number): Promise<Subscription[]>;

  /**
   * Find past due subscriptions
   * @returns Array of past due subscriptions
   */
  findPastDue(): Promise<Subscription[]>;
}
