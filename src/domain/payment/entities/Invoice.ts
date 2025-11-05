import { Money } from '@/domain/calculator/value-objects/Money';
import { Transaction } from './Transaction';

/**
 * Invoice Status Type
 */
export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

/**
 * Invoice Entity
 *
 * Represents a billing invoice for subscription or one-time charges.
 * Links to a transaction when paid.
 *
 * @example
 * const invoice = new Invoice(
 *   'inv_123',
 *   'user_456',
 *   'sub_789',
 *   new Money(99.90),
 *   'Monthly subscription - January 2025',
 *   'open',
 *   new Date('2025-01-15')
 * );
 */
export class Invoice {
  private readonly id: string;
  private readonly userId: string;
  private readonly subscriptionId: string;
  private readonly amount: Money;
  private readonly description: string;
  private status: InvoiceStatus;
  private readonly dueDate: Date;
  private readonly createdAt: Date;
  private paidAt?: Date;
  private transaction?: Transaction;
  private readonly invoiceUrl?: string;
  private readonly pdfUrl?: string;

  constructor(
    id: string,
    userId: string,
    subscriptionId: string,
    amount: Money,
    description: string,
    status: InvoiceStatus,
    dueDate: Date,
    createdAt?: Date,
    paidAt?: Date,
    transaction?: Transaction,
    invoiceUrl?: string,
    pdfUrl?: string
  ) {
    this.id = id;
    this.userId = userId;
    this.subscriptionId = subscriptionId;
    this.amount = amount;
    this.description = description;
    this.status = status;
    this.dueDate = dueDate;
    this.createdAt = createdAt || new Date();
    this.paidAt = paidAt;
    this.transaction = transaction;
    this.invoiceUrl = invoiceUrl;
    this.pdfUrl = pdfUrl;
  }

  // ============================================================================
  // State Transitions
  // ============================================================================

  /**
   * Mark invoice as paid
   */
  markAsPaid(transaction: Transaction, paidAt?: Date): void {
    this.status = 'paid';
    this.paidAt = paidAt || new Date();
    this.transaction = transaction;
  }

  /**
   * Mark invoice as void
   */
  markAsVoid(): void {
    this.status = 'void';
  }

  /**
   * Mark invoice as uncollectible
   */
  markAsUncollectible(): void {
    this.status = 'uncollectible';
  }

  // ============================================================================
  // Queries
  // ============================================================================

  /**
   * Check if invoice is paid
   */
  isPaid(): boolean {
    return this.status === 'paid';
  }

  /**
   * Check if invoice is open (awaiting payment)
   */
  isOpen(): boolean {
    return this.status === 'open';
  }

  /**
   * Check if invoice is overdue
   */
  isOverdue(): boolean {
    return this.isOpen() && new Date() > this.dueDate;
  }

  /**
   * Get days until due (negative if overdue)
   */
  getDaysUntilDue(): number {
    const now = new Date();
    const diff = this.dueDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // ============================================================================
  // Getters
  // ============================================================================

  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getSubscriptionId(): string {
    return this.subscriptionId;
  }

  getAmount(): Money {
    return this.amount;
  }

  getDescription(): string {
    return this.description;
  }

  getStatus(): InvoiceStatus {
    return this.status;
  }

  getDueDate(): Date {
    return new Date(this.dueDate);
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getPaidAt(): Date | undefined {
    return this.paidAt ? new Date(this.paidAt) : undefined;
  }

  getTransaction(): Transaction | undefined {
    return this.transaction;
  }

  getInvoiceUrl(): string | undefined {
    return this.invoiceUrl;
  }

  getPdfUrl(): string | undefined {
    return this.pdfUrl;
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  /**
   * Convert to JSON
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      userId: this.userId,
      subscriptionId: this.subscriptionId,
      amount: this.amount.getAmount(),
      description: this.description,
      status: this.status,
      dueDate: this.dueDate.toISOString(),
      createdAt: this.createdAt.toISOString(),
      paidAt: this.paidAt?.toISOString(),
      transaction: this.transaction?.toJSON(),
      invoiceUrl: this.invoiceUrl,
      pdfUrl: this.pdfUrl,
    };
  }

  /**
   * Create Invoice from JSON
   */
  static fromJSON(json: Record<string, any>): Invoice {
    return new Invoice(
      json.id,
      json.userId,
      json.subscriptionId,
      new Money(json.amount),
      json.description,
      json.status,
      new Date(json.dueDate),
      new Date(json.createdAt),
      json.paidAt ? new Date(json.paidAt) : undefined,
      json.transaction ? Transaction.fromJSON(json.transaction) : undefined,
      json.invoiceUrl,
      json.pdfUrl
    );
  }
}
