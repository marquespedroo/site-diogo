import { Money } from '../value-objects/Money';
import { Installment } from './Installment';

/**
 * PaymentPhase Entity
 *
 * Represents a phase of payments (e.g., "Entry", "During Construction", "Post-Construction").
 * Contains multiple installments and calculates total amount.
 *
 * @example
 * const entryPhase = new PaymentPhase('Entry Payments', [installment1, installment2]);
 * const total = entryPhase.getTotalAmount(); // Sum of all installments
 */
export class PaymentPhase {
  private readonly name: string;
  private readonly installments: ReadonlyArray<Installment>;

  constructor(name: string, installments: Installment[]) {
    if (!name || name.trim().length === 0) {
      throw new Error('Payment phase name cannot be empty');
    }
    if (!Array.isArray(installments)) {
      throw new Error('Installments must be an array');
    }

    this.name = name.trim();
    this.installments = Object.freeze([...installments]); // Freeze to ensure immutability
  }

  /**
   * Get phase name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get all installments (readonly)
   */
  getInstallments(): ReadonlyArray<Installment> {
    return this.installments;
  }

  /**
   * Get total amount of all installments in this phase
   */
  getTotalAmount(): Money {
    if (this.installments.length === 0) {
      return Money.zero();
    }

    return this.installments.reduce(
      (sum, installment) => sum.add(installment.getAmount()),
      Money.zero()
    );
  }

  /**
   * Get number of installments in this phase
   */
  getInstallmentCount(): number {
    return this.installments.length;
  }

  /**
   * Get installment by index
   */
  getInstallmentAt(index: number): Installment | undefined {
    if (index < 0 || index >= this.installments.length) {
      return undefined;
    }
    return this.installments[index];
  }

  /**
   * Check if phase has any installments
   */
  hasInstallments(): boolean {
    return this.installments.length > 0;
  }

  /**
   * Check if phase is empty
   */
  isEmpty(): boolean {
    return this.installments.length === 0;
  }

  /**
   * Get earliest due date in this phase
   */
  getEarliestDueDate(): Date | null {
    if (this.installments.length === 0) {
      return null;
    }

    return this.installments.reduce((earliest, installment) => {
      const dueDate = installment.getDueDate();
      return dueDate < earliest ? dueDate : earliest;
    }, this.installments[0]!.getDueDate());
  }

  /**
   * Get latest due date in this phase
   */
  getLatestDueDate(): Date | null {
    if (this.installments.length === 0) {
      return null;
    }

    return this.installments.reduce((latest, installment) => {
      const dueDate = installment.getDueDate();
      return dueDate > latest ? dueDate : latest;
    }, this.installments[0]!.getDueDate());
  }

  /**
   * Get average installment amount
   */
  getAverageInstallmentAmount(): Money {
    if (this.installments.length === 0) {
      return Money.zero();
    }

    const total = this.getTotalAmount();
    return total.divide(this.installments.length);
  }

  /**
   * Create PaymentPhase from JSON
   */
  static fromJSON(json: {
    name: string;
    installments: Array<{
      id: string;
      amount: number;
      dueDate: string;
      description: string;
    }>;
  }): PaymentPhase {
    const installments = json.installments.map(inst =>
      Installment.fromJSON(inst)
    );
    return new PaymentPhase(json.name, installments);
  }

  /**
   * Convert to JSON
   */
  toJSON(): {
    name: string;
    installments: Array<{
      id: string;
      amount: number;
      dueDate: string;
      description: string;
    }>;
  } {
    return {
      name: this.name,
      installments: this.installments.map(inst => inst.toJSON()),
    };
  }

  /**
   * Create empty payment phase
   */
  static empty(name: string): PaymentPhase {
    return new PaymentPhase(name, []);
  }
}
