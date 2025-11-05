import { Money } from '@/domain/calculator/value-objects/Money';
import { PaymentMethod } from './PaymentMethod';
import { Transaction, PaymentGateway } from './Transaction';
import { BusinessRuleError } from '@/lib/errors';

/**
 * Subscription Status Type
 */
export type SubscriptionStatus =
  | 'active'
  | 'cancelled'
  | 'past_due'
  | 'suspended'
  | 'expired';

/**
 * Subscription Plan Type
 */
export type SubscriptionPlan = 'FREE' | 'BASIC' | 'UNLIMITED' | 'COMBO';

/**
 * Subscription Params Interface
 */
export interface SubscriptionParams {
  id?: string;
  userId: string;
  planId: SubscriptionPlan;
  status?: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd?: boolean;
  gateway: PaymentGateway;
  externalSubscriptionId: string;
  paymentMethod: PaymentMethod;
  amount: Money;
  transactions?: Transaction[];
  createdAt?: Date;
}

/**
 * Subscription Aggregate Root
 *
 * Main aggregate root for payment domain.
 * Manages subscription lifecycle, billing periods, and payment tracking.
 * Enforces business rules around renewals, cancellations, and payment status.
 *
 * @example
 * const subscription = new Subscription({
 *   userId: 'user_123',
 *   planId: 'BASIC',
 *   currentPeriodStart: new Date(),
 *   currentPeriodEnd: new Date('2025-02-05'),
 *   gateway: 'stripe',
 *   externalSubscriptionId: 'sub_stripe_123',
 *   paymentMethod: method,
 *   amount: new Money(29.90)
 * });
 */
export class Subscription {
  private readonly id: string;
  private readonly userId: string;
  private planId: SubscriptionPlan;
  private status: SubscriptionStatus;
  private readonly currentPeriodStart: Date;
  private currentPeriodEnd: Date;
  private cancelAtPeriodEnd: boolean;
  private readonly gateway: PaymentGateway;
  private readonly externalSubscriptionId: string;
  private paymentMethod: PaymentMethod;
  private amount: Money;
  private readonly transactions: Transaction[];
  private readonly createdAt: Date;
  private cancelledAt?: Date;

  constructor(params: SubscriptionParams) {
    this.id = params.id || this.generateId();
    this.userId = params.userId;
    this.planId = params.planId;
    this.status = params.status || 'active';
    this.currentPeriodStart = params.currentPeriodStart;
    this.currentPeriodEnd = params.currentPeriodEnd;
    this.cancelAtPeriodEnd = params.cancelAtPeriodEnd || false;
    this.gateway = params.gateway;
    this.externalSubscriptionId = params.externalSubscriptionId;
    this.paymentMethod = params.paymentMethod;
    this.amount = params.amount;
    this.transactions = params.transactions || [];
    this.createdAt = params.createdAt || new Date();

    this.validate();
  }

  /**
   * Validate business rules
   */
  private validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    if (this.currentPeriodEnd <= this.currentPeriodStart) {
      throw new Error('Period end must be after period start');
    }

    if (this.amount.getAmount() < 0) {
      throw new Error('Subscription amount cannot be negative');
    }
  }

  // ============================================================================
  // Business Logic
  // ============================================================================

  /**
   * Renew subscription for next billing period
   */
  renew(periodEnd: Date): void {
    if (this.cancelAtPeriodEnd) {
      throw new BusinessRuleError(
        'Cannot renew subscription set to cancel',
        'RENEWAL_CANCELLED'
      );
    }

    if (this.status !== 'active') {
      throw new BusinessRuleError(
        'Can only renew active subscriptions',
        'RENEWAL_NOT_ACTIVE'
      );
    }

    this.currentPeriodEnd = periodEnd;
  }

  /**
   * Cancel subscription
   */
  cancel(immediately: boolean = false): void {
    if (immediately) {
      this.status = 'cancelled';
      this.cancelledAt = new Date();
    } else {
      this.cancelAtPeriodEnd = true;
    }
  }

  /**
   * Reactivate cancelled subscription
   */
  reactivate(): void {
    if (this.status === 'cancelled' && !this.isPeriodExpired()) {
      this.status = 'active';
      this.cancelAtPeriodEnd = false;
      this.cancelledAt = undefined;
    } else {
      throw new BusinessRuleError(
        'Cannot reactivate expired subscription',
        'REACTIVATION_EXPIRED'
      );
    }
  }

  /**
   * Suspend subscription (e.g., for fraud)
   */
  suspend(reason: string): void {
    this.status = 'suspended';
  }

  /**
   * Mark subscription as past due
   */
  markAsPastDue(): void {
    this.status = 'past_due';
  }

  /**
   * Update to new plan
   */
  updatePlan(newPlan: SubscriptionPlan, newAmount: Money): void {
    if (!this.isActive()) {
      throw new BusinessRuleError(
        'Can only update plan for active subscriptions',
        'UPDATE_NOT_ACTIVE'
      );
    }

    this.planId = newPlan;
    this.amount = newAmount;
  }

  /**
   * Update payment method
   */
  updatePaymentMethod(paymentMethod: PaymentMethod): void {
    this.paymentMethod = paymentMethod;
  }

  /**
   * Add transaction to subscription
   */
  addTransaction(transaction: Transaction): void {
    this.transactions.push(transaction);

    // Update status based on transaction
    if (transaction.isCompleted()) {
      if (this.status === 'past_due') {
        this.status = 'active';
      }
    }
  }

  // ============================================================================
  // Queries
  // ============================================================================

  /**
   * Check if subscription period is expired
   */
  isPeriodExpired(): boolean {
    return new Date() > this.currentPeriodEnd;
  }

  /**
   * Get days until renewal
   */
  getDaysUntilRenewal(): number {
    const now = new Date();
    const diff = this.currentPeriodEnd.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if subscription is active
   */
  isActive(): boolean {
    return this.status === 'active' && !this.isPeriodExpired();
  }

  /**
   * Check if subscription is past due
   */
  isPastDue(): boolean {
    return this.status === 'past_due';
  }

  /**
   * Check if subscription is cancelled
   */
  isCancelled(): boolean {
    return this.status === 'cancelled';
  }

  /**
   * Get all completed transactions
   */
  getCompletedTransactions(): Transaction[] {
    return this.transactions.filter((t) => t.isCompleted());
  }

  /**
   * Get total amount paid
   */
  getTotalPaid(): Money {
    return this.getCompletedTransactions().reduce(
      (total, transaction) => total.add(transaction.getAmount()),
      Money.zero()
    );
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

  getPlanId(): SubscriptionPlan {
    return this.planId;
  }

  getStatus(): SubscriptionStatus {
    return this.status;
  }

  getCurrentPeriodStart(): Date {
    return new Date(this.currentPeriodStart);
  }

  getCurrentPeriodEnd(): Date {
    return new Date(this.currentPeriodEnd);
  }

  getCancelAtPeriodEnd(): boolean {
    return this.cancelAtPeriodEnd;
  }

  getGateway(): PaymentGateway {
    return this.gateway;
  }

  getExternalSubscriptionId(): string {
    return this.externalSubscriptionId;
  }

  getPaymentMethod(): PaymentMethod {
    return this.paymentMethod;
  }

  getAmount(): Money {
    return this.amount;
  }

  getTransactions(): Transaction[] {
    return [...this.transactions];
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getCancelledAt(): Date | undefined {
    return this.cancelledAt ? new Date(this.cancelledAt) : undefined;
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
      planId: this.planId,
      status: this.status,
      currentPeriodStart: this.currentPeriodStart.toISOString(),
      currentPeriodEnd: this.currentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: this.cancelAtPeriodEnd,
      gateway: this.gateway,
      externalSubscriptionId: this.externalSubscriptionId,
      paymentMethod: this.paymentMethod.toJSON(),
      amount: this.amount.getAmount(),
      transactions: this.transactions.map((t) => t.toJSON()),
      createdAt: this.createdAt.toISOString(),
      cancelledAt: this.cancelledAt?.toISOString(),
    };
  }

  /**
   * Create Subscription from JSON
   */
  static fromJSON(json: Record<string, any>): Subscription {
    return new Subscription({
      id: json.id,
      userId: json.userId,
      planId: json.planId,
      status: json.status,
      currentPeriodStart: new Date(json.currentPeriodStart),
      currentPeriodEnd: new Date(json.currentPeriodEnd),
      cancelAtPeriodEnd: json.cancelAtPeriodEnd,
      gateway: json.gateway,
      externalSubscriptionId: json.externalSubscriptionId,
      paymentMethod: PaymentMethod.fromJSON(json.paymentMethod),
      amount: new Money(json.amount),
      transactions: json.transactions?.map((t: any) =>
        Transaction.fromJSON(t)
      ),
      createdAt: new Date(json.createdAt),
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return (
      'sub_' +
      Date.now().toString(36) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
