import { Money } from '@/domain/calculator/value-objects/Money';
import { PaymentMethod } from './PaymentMethod';
import { BusinessRuleError } from '@/lib/errors';

/**
 * Transaction Status Type
 */
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

/**
 * Payment Gateway Type
 */
export type PaymentGateway = 'stripe' | 'mercadopago' | 'asaas';

/**
 * Transaction Entity
 *
 * Represents a payment transaction.
 * Tracks payment lifecycle from pending to completed/failed/refunded.
 *
 * @example
 * const transaction = new Transaction(
 *   'txn_123',
 *   'user_456',
 *   new Money(99.90),
 *   'Monthly subscription',
 *   paymentMethod,
 *   'pending',
 *   'stripe',
 *   'pi_stripe_123'
 * );
 */
export class Transaction {
  private readonly id: string;
  private readonly userId: string;
  private readonly amount: Money;
  private readonly description: string;
  private readonly paymentMethod: PaymentMethod;
  private status: TransactionStatus;
  private readonly gateway: PaymentGateway;
  private readonly externalId: string;
  private readonly createdAt: Date;
  private paidAt?: Date;
  private failureReason?: string;
  private refundedAt?: Date;
  private metadata: Record<string, any>;

  constructor(
    id: string,
    userId: string,
    amount: Money,
    description: string,
    paymentMethod: PaymentMethod,
    status: TransactionStatus,
    gateway: PaymentGateway,
    externalId: string,
    createdAt?: Date,
    paidAt?: Date,
    failureReason?: string,
    metadata?: Record<string, any>
  ) {
    this.id = id;
    this.userId = userId;
    this.amount = amount;
    this.description = description;
    this.paymentMethod = paymentMethod;
    this.status = status;
    this.gateway = gateway;
    this.externalId = externalId;
    this.createdAt = createdAt || new Date();
    this.paidAt = paidAt;
    this.failureReason = failureReason;
    this.metadata = metadata || {};
  }

  // ============================================================================
  // State Transitions
  // ============================================================================

  /**
   * Mark transaction as pending
   */
  markAsPending(): void {
    this.status = 'pending';
  }

  /**
   * Mark transaction as completed
   */
  markAsCompleted(paidAt?: Date): void {
    this.status = 'completed';
    this.paidAt = paidAt || new Date();
    this.failureReason = undefined;
  }

  /**
   * Mark transaction as failed
   */
  markAsFailed(reason: string): void {
    this.status = 'failed';
    this.failureReason = reason;
  }

  /**
   * Mark transaction as refunded
   */
  markAsRefunded(): void {
    if (this.status !== 'completed') {
      throw new BusinessRuleError(
        'Can only refund completed transactions',
        'REFUND_NOT_COMPLETED'
      );
    }
    this.status = 'refunded';
    this.refundedAt = new Date();
  }

  // ============================================================================
  // Queries
  // ============================================================================

  /**
   * Check if transaction is completed
   */
  isCompleted(): boolean {
    return this.status === 'completed';
  }

  /**
   * Check if transaction is pending
   */
  isPending(): boolean {
    return this.status === 'pending';
  }

  /**
   * Check if transaction failed
   */
  isFailed(): boolean {
    return this.status === 'failed';
  }

  /**
   * Check if transaction was refunded
   */
  isRefunded(): boolean {
    return this.status === 'refunded';
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

  getAmount(): Money {
    return this.amount;
  }

  getDescription(): string {
    return this.description;
  }

  getPaymentMethod(): PaymentMethod {
    return this.paymentMethod;
  }

  getStatus(): TransactionStatus {
    return this.status;
  }

  getGateway(): PaymentGateway {
    return this.gateway;
  }

  getExternalId(): string {
    return this.externalId;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getPaidAt(): Date | undefined {
    return this.paidAt ? new Date(this.paidAt) : undefined;
  }

  getFailureReason(): string | undefined {
    return this.failureReason;
  }

  getRefundedAt(): Date | undefined {
    return this.refundedAt ? new Date(this.refundedAt) : undefined;
  }

  getMetadata(): Record<string, any> {
    return { ...this.metadata };
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
      amount: this.amount.getAmount(),
      description: this.description,
      paymentMethod: this.paymentMethod.toJSON(),
      status: this.status,
      gateway: this.gateway,
      externalId: this.externalId,
      createdAt: this.createdAt.toISOString(),
      paidAt: this.paidAt?.toISOString(),
      failureReason: this.failureReason,
      refundedAt: this.refundedAt?.toISOString(),
      metadata: this.metadata,
    };
  }

  /**
   * Create Transaction from JSON
   */
  static fromJSON(json: Record<string, any>): Transaction {
    return new Transaction(
      json.id,
      json.userId,
      new Money(json.amount),
      json.description,
      PaymentMethod.fromJSON(json.paymentMethod),
      json.status,
      json.gateway,
      json.externalId,
      new Date(json.createdAt),
      json.paidAt ? new Date(json.paidAt) : undefined,
      json.failureReason,
      json.metadata
    );
  }
}
