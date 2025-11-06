import { Transaction } from '../entities/Transaction';
import { Invoice } from '../entities/Invoice';

/**
 * IPaymentRepository Interface
 *
 * Repository interface for payment-related persistence.
 * Handles both transactions and invoices.
 *
 * @example
 * const repository: IPaymentRepository = new SupabasePaymentRepository(supabase);
 * await repository.saveTransaction(transaction);
 * const invoices = await repository.findInvoicesByUserId('user_123');
 */
export interface IPaymentRepository {
  // ============================================================================
  // Transaction Methods
  // ============================================================================

  /**
   * Save a new transaction
   * @throws {DatabaseError} if save fails
   */
  saveTransaction(transaction: Transaction): Promise<Transaction>;

  /**
   * Find transaction by ID
   * @returns Transaction or null if not found
   */
  findTransactionById(id: string): Promise<Transaction | null>;

  /**
   * Find transaction by external gateway ID
   * @returns Transaction or null if not found
   */
  findTransactionByExternalId(externalId: string): Promise<Transaction | null>;

  /**
   * Find all transactions for a user
   * @param userId - User ID to search for
   * @param limit - Maximum number of results (default: 50)
   * @returns Array of transactions
   */
  findTransactionsByUserId(userId: string, limit?: number): Promise<Transaction[]>;

  /**
   * Update existing transaction
   * @throws {NotFoundError} if transaction doesn't exist
   * @throws {DatabaseError} if update fails
   */
  updateTransaction(transaction: Transaction): Promise<Transaction>;

  // ============================================================================
  // Invoice Methods
  // ============================================================================

  /**
   * Save a new invoice
   * @throws {DatabaseError} if save fails
   */
  saveInvoice(invoice: Invoice): Promise<Invoice>;

  /**
   * Find invoice by ID
   * @returns Invoice or null if not found
   */
  findInvoiceById(id: string): Promise<Invoice | null>;

  /**
   * Find all invoices for a user
   * @param userId - User ID to search for
   * @param limit - Maximum number of results (default: 50)
   * @returns Array of invoices
   */
  findInvoicesByUserId(userId: string, limit?: number): Promise<Invoice[]>;

  /**
   * Find invoices for a subscription
   * @param subscriptionId - Subscription ID
   * @returns Array of invoices
   */
  findInvoicesBySubscriptionId(subscriptionId: string): Promise<Invoice[]>;

  /**
   * Find open (unpaid) invoices for a user
   * @param userId - User ID
   * @returns Array of open invoices
   */
  findOpenInvoicesByUserId(userId: string): Promise<Invoice[]>;

  /**
   * Update existing invoice
   * @throws {NotFoundError} if invoice doesn't exist
   * @throws {DatabaseError} if update fails
   */
  updateInvoice(invoice: Invoice): Promise<Invoice>;
}
