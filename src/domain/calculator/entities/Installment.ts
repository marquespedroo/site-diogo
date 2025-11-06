import { Money } from '../value-objects/Money';

/**
 * Installment Entity
 *
 * Represents a single payment installment with due date and description.
 * Entity with identity (id).
 *
 * @example
 * const installment = new Installment(
 *   '123',
 *   new Money(5000),
 *   new Date('2025-06-01'),
 *   'Entry 1 - Installment 1/12'
 * );
 */
export class Installment {
  private readonly id: string;
  private readonly amount: Money;
  private readonly dueDate: Date;
  private readonly description: string;

  constructor(id: string, amount: Money, dueDate: Date, description: string) {
    if (!id || id.trim().length === 0) {
      throw new Error('Installment ID cannot be empty');
    }
    if (!description || description.trim().length === 0) {
      throw new Error('Installment description cannot be empty');
    }
    if (!(dueDate instanceof Date) || isNaN(dueDate.getTime())) {
      throw new Error('Invalid due date');
    }

    this.id = id;
    this.amount = amount;
    this.dueDate = new Date(dueDate); // Clone date to ensure immutability
    this.description = description.trim();
  }

  /**
   * Get installment ID
   */
  getId(): string {
    return this.id;
  }

  /**
   * Get installment amount
   */
  getAmount(): Money {
    return this.amount;
  }

  /**
   * Get due date
   */
  getDueDate(): Date {
    return new Date(this.dueDate); // Return clone to preserve immutability
  }

  /**
   * Get description
   */
  getDescription(): string {
    return this.description;
  }

  /**
   * Check if installment is overdue
   */
  isOverdue(): boolean {
    return new Date() > this.dueDate;
  }

  /**
   * Get days until due (negative if overdue)
   */
  getDaysUntilDue(): number {
    const now = new Date();
    const diffTime = this.dueDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Format due date as Brazilian date string
   */
  formatDueDate(): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(this.dueDate);
  }

  /**
   * Check if equal to another Installment (by ID)
   */
  equals(other: Installment): boolean {
    return this.id === other.id;
  }

  /**
   * Create Installment from JSON
   */
  static fromJSON(json: {
    id: string;
    amount: number;
    dueDate: string;
    description: string;
  }): Installment {
    return new Installment(
      json.id,
      new Money(json.amount),
      new Date(json.dueDate),
      json.description
    );
  }

  /**
   * Convert to JSON
   */
  toJSON(): {
    id: string;
    amount: number;
    dueDate: string;
    description: string;
  } {
    return {
      id: this.id,
      amount: this.amount.getAmount(),
      dueDate: this.dueDate.toISOString(),
      description: this.description,
    };
  }
}
