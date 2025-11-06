/**
 * CompletionDate Value Object
 *
 * Immutable value object representing a construction completion date.
 * Stores month and year, calculates months until completion.
 *
 * @example
 * const completion = new CompletionDate(12, 2026);
 * const months = completion.getMonthsUntilCompletion(); // e.g., 24
 */
export class CompletionDate {
  private readonly month: number;
  private readonly year: number;

  constructor(month: number, year: number) {
    if (month < 1 || month > 12) {
      throw new Error('Month must be between 1 and 12');
    }

    const currentYear = new Date().getFullYear();
    if (year < currentYear) {
      throw new Error('Completion date cannot be in the past');
    }

    // Validate that the date is not too far in the future (e.g., max 50 years)
    if (year > currentYear + 50) {
      throw new Error('Completion date cannot be more than 50 years in the future');
    }

    this.month = month;
    this.year = year;
  }

  /**
   * Get month (1-12)
   */
  getMonth(): number {
    return this.month;
  }

  /**
   * Get year
   */
  getYear(): number {
    return this.year;
  }

  /**
   * Calculate months until completion from now
   */
  getMonthsUntilCompletion(): number {
    const now = new Date();
    const completion = new Date(this.year, this.month - 1, 1);

    const months =
      (completion.getFullYear() - now.getFullYear()) * 12 +
      (completion.getMonth() - now.getMonth());

    return Math.max(0, months);
  }

  /**
   * Check if completion date is in the past
   */
  isPast(): boolean {
    const now = new Date();
    const completion = new Date(this.year, this.month - 1, 1);
    return completion < now;
  }

  /**
   * Check if completion date is in the future
   */
  isFuture(): boolean {
    return !this.isPast();
  }

  /**
   * Format as readable string
   */
  format(): string {
    const monthNames = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    return `${monthNames[this.month - 1]} de ${this.year}`;
  }

  /**
   * Format as short string (MM/YYYY)
   */
  formatShort(): string {
    return `${String(this.month).padStart(2, '0')}/${this.year}`;
  }

  /**
   * Check if equal to another CompletionDate
   */
  equals(other: CompletionDate): boolean {
    return this.month === other.month && this.year === other.year;
  }

  /**
   * Check if before another CompletionDate
   */
  isBefore(other: CompletionDate): boolean {
    if (this.year < other.year) return true;
    if (this.year > other.year) return false;
    return this.month < other.month;
  }

  /**
   * Check if after another CompletionDate
   */
  isAfter(other: CompletionDate): boolean {
    if (this.year > other.year) return true;
    if (this.year < other.year) return false;
    return this.month > other.month;
  }

  /**
   * Create CompletionDate from JSON
   */
  static fromJSON(json: { month: number; year: number }): CompletionDate {
    return new CompletionDate(json.month, json.year);
  }

  /**
   * Convert to JSON
   */
  toJSON(): { month: number; year: number } {
    return {
      month: this.month,
      year: this.year,
    };
  }

  /**
   * Create CompletionDate from Date object
   */
  static fromDate(date: Date): CompletionDate {
    return new CompletionDate(date.getMonth() + 1, date.getFullYear());
  }

  /**
   * Convert to Date object (first day of the month)
   */
  toDate(): Date {
    return new Date(this.year, this.month - 1, 1);
  }
}
