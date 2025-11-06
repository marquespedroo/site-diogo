import { Money } from '../value-objects/Money';
import { Percentage } from '../value-objects/Percentage';
import { CompletionDate } from '../value-objects/CompletionDate';
import { PaymentPhase } from './PaymentPhase';

/**
 * Approval Status Interface
 */
export interface ApprovalStatus {
  approved: boolean;
  requiredCaptation: Money;
  actualCaptation: Money;
  difference: Money;
  percentagePaid: number;
}

/**
 * PaymentCalculator Params Interface
 */
export interface PaymentCalculatorParams {
  id?: string;
  userId: string;
  propertyValue: Money;
  captationPercentage: Percentage;
  completionDate: CompletionDate;
  entryPayments: PaymentPhase;
  duringConstructionPayments: PaymentPhase;
  habiteSe: Money;
  postConstructionPayments: PaymentPhase;
  shortCode?: string;
  viewCount?: number;
  createdAt?: Date;
}

/**
 * PaymentCalculator Aggregate Root
 *
 * Main domain entity representing a complete payment flow calculator.
 * Implements business logic for approval calculation, totals, and validation.
 * Follows Aggregate Root pattern from DDD.
 *
 * @example
 * const calculator = new PaymentCalculator({
 *   userId: 'user-123',
 *   propertyValue: new Money(1000000),
 *   captationPercentage: new Percentage(30),
 *   // ... other params
 * });
 *
 * const approved = calculator.isApproved();
 * const status = calculator.getApprovalStatus();
 */
export class PaymentCalculator {
  private readonly id: string;
  private readonly userId: string;
  private readonly propertyValue: Money;
  private readonly captationPercentage: Percentage;
  private readonly completionDate: CompletionDate;
  private readonly entryPayments: PaymentPhase;
  private readonly duringConstructionPayments: PaymentPhase;
  private readonly habiteSe: Money;
  private readonly postConstructionPayments: PaymentPhase;
  private readonly createdAt: Date;
  private shortCode?: string;
  private viewCount: number;

  constructor(params: PaymentCalculatorParams) {
    // Generate ID if not provided
    this.id = params.id || this.generateId();
    this.userId = params.userId;
    this.propertyValue = params.propertyValue;
    this.captationPercentage = params.captationPercentage;
    this.completionDate = params.completionDate;
    this.entryPayments = params.entryPayments;
    this.duringConstructionPayments = params.duringConstructionPayments;
    this.habiteSe = params.habiteSe;
    this.postConstructionPayments = params.postConstructionPayments;
    this.createdAt = params.createdAt || new Date();
    this.shortCode = params.shortCode;
    this.viewCount = params.viewCount || 0;

    // Validate business rules
    this.validate();
  }

  /**
   * Validate business rules
   */
  private validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    // Validate that total paid doesn't exceed 150% of property value
    const totalPaid = this.getTotalPaid();
    const maxAllowed = this.propertyValue.multiply(1.5);

    if (totalPaid.greaterThan(maxAllowed)) {
      throw new Error(
        `Total paid (${totalPaid.format()}) exceeds 150% of property value (${maxAllowed.format()})`
      );
    }

    // Validate captation percentage is reasonable
    if (this.captationPercentage.getValue() > 100) {
      throw new Error('Captation percentage cannot exceed 100%');
    }
  }

  // ============================================================================
  // Business Logic Methods
  // ============================================================================

  /**
   * Check if calculator is approved based on captation requirement
   */
  isApproved(): boolean {
    const required = this.getRequiredCaptation();
    const actual = this.getActualCaptation();
    return actual.greaterThanOrEqual(required);
  }

  /**
   * Get detailed approval status
   */
  getApprovalStatus(): ApprovalStatus {
    const required = this.getRequiredCaptation();
    const actual = this.getActualCaptation();
    const approved = actual.greaterThanOrEqual(required);

    let difference: Money;
    if (approved) {
      difference = actual.subtract(required);
    } else {
      difference = required.subtract(actual);
    }

    const percentagePaid = (actual.getAmount() / this.propertyValue.getAmount()) * 100;

    return {
      approved,
      requiredCaptation: required,
      actualCaptation: actual,
      difference,
      percentagePaid,
    };
  }

  /**
   * Get required captation amount (% of property value)
   */
  getRequiredCaptation(): Money {
    return this.propertyValue.multiply(this.captationPercentage.toDecimal());
  }

  /**
   * Get actual captation amount (entry + during construction + habite-se)
   */
  getActualCaptation(): Money {
    const entryTotal = this.entryPayments.getTotalAmount();
    const duringTotal = this.duringConstructionPayments.getTotalAmount();

    return entryTotal.add(duringTotal).add(this.habiteSe);
  }

  /**
   * Get total paid (captation + post-construction)
   */
  getTotalPaid(): Money {
    const captation = this.getActualCaptation();
    const postTotal = this.postConstructionPayments.getTotalAmount();

    return captation.add(postTotal);
  }

  /**
   * Get remaining balance (property value - total paid)
   */
  getRemainingBalance(): Money {
    const totalPaid = this.getTotalPaid();

    // If total paid exceeds property value, return zero
    if (totalPaid.greaterThanOrEqual(this.propertyValue)) {
      return Money.zero();
    }

    return this.propertyValue.subtract(totalPaid);
  }

  /**
   * Get months until construction completion
   */
  getMonthsUntilCompletion(): number {
    return this.completionDate.getMonthsUntilCompletion();
  }

  // ============================================================================
  // Shareable Link Methods
  // ============================================================================

  /**
   * Generate short code for shareable link
   */
  generateShortCode(): string {
    if (this.shortCode) {
      return this.shortCode;
    }

    // Generate random alphanumeric code (6 characters)
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint8Array(6);
    crypto.getRandomValues(array);

    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(array[i] % chars.length);
    }

    this.shortCode = code;
    return code;
  }

  /**
   * Get shareable URL
   */
  getShareableUrl(baseUrl: string): string {
    if (!this.shortCode) {
      throw new Error('Short code not generated. Call generateShortCode() first.');
    }
    return `${baseUrl}/c/${this.shortCode}`;
  }

  /**
   * Increment view count
   */
  incrementViewCount(): void {
    this.viewCount++;
  }

  /**
   * Get view count
   */
  getViewCount(): number {
    return this.viewCount;
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

  getPropertyValue(): Money {
    return this.propertyValue;
  }

  getCaptationPercentage(): Percentage {
    return this.captationPercentage;
  }

  getCompletionDate(): CompletionDate {
    return this.completionDate;
  }

  getEntryPayments(): PaymentPhase {
    return this.entryPayments;
  }

  getDuringConstructionPayments(): PaymentPhase {
    return this.duringConstructionPayments;
  }

  getHabiteSe(): Money {
    return this.habiteSe;
  }

  getPostConstructionPayments(): PaymentPhase {
    return this.postConstructionPayments;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getShortCode(): string | undefined {
    return this.shortCode;
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  /**
   * Convert to JSON for persistence/API
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      userId: this.userId,
      propertyValue: this.propertyValue.getAmount(),
      captationPercentage: this.captationPercentage.getValue(),
      completionDate: this.completionDate.toJSON(),
      entryPayments: this.entryPayments.toJSON(),
      duringConstructionPayments: this.duringConstructionPayments.toJSON(),
      habiteSe: this.habiteSe.getAmount(),
      postConstructionPayments: this.postConstructionPayments.toJSON(),
      shortCode: this.shortCode,
      viewCount: this.viewCount,
      createdAt: this.createdAt.toISOString(),
    };
  }

  /**
   * Create PaymentCalculator from JSON
   */
  static fromJSON(json: Record<string, any>): PaymentCalculator {
    return new PaymentCalculator({
      id: json.id,
      userId: json.userId,
      propertyValue: new Money(json.propertyValue),
      captationPercentage: new Percentage(json.captationPercentage),
      completionDate: CompletionDate.fromJSON(json.completionDate),
      entryPayments: PaymentPhase.fromJSON(json.entryPayments),
      duringConstructionPayments: PaymentPhase.fromJSON(json.duringConstructionPayments),
      habiteSe: new Money(json.habiteSe),
      postConstructionPayments: PaymentPhase.fromJSON(json.postConstructionPayments),
      shortCode: json.shortCode,
      viewCount: json.viewCount,
      createdAt: new Date(json.createdAt),
    });
  }

  /**
   * Generate unique ID (UUID-like)
   */
  private generateId(): string {
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    const randomPart = Array.from(array, (byte) => byte.toString(36))
      .join('')
      .substring(0, 13);
    return Date.now().toString(36) + randomPart;
  }
}
