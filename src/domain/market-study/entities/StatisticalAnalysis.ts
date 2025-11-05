import { Money } from '@/domain/calculator/value-objects/Money';
import { MarketSample } from './MarketSample';
import { ValidationError } from '@/lib/errors';

/**
 * Statistical Analysis Entity
 *
 * Represents the statistical analysis of market samples.
 * Implements outlier detection and normality filtering based on NBR 14653-2.
 *
 * Statistical criteria:
 * - Abnormal samples: Outside 60%-140% of median
 * - Normal range: 80%-120% of recalculated median
 * - Reliable: CV < 30% with at least 3 retained samples
 *
 * @example
 * const analysis = new StatisticalAnalysis(
 *   allSamples,
 *   new Money(5000), // mean price per m²
 *   new Money(4950), // median
 *   new Money(450),  // standard deviation
 *   9.09,            // coefficient of variation (%)
 *   new Money(4200), // min
 *   new Money(5800), // max
 *   [],              // outliers
 *   [],              // excluded
 *   retainedSamples  // retained samples
 * );
 */
export class StatisticalAnalysis {
  private readonly samples: readonly MarketSample[];
  private readonly mean: Money;
  private readonly median: Money;
  private readonly stdDev: Money;
  private readonly coefficientOfVariation: number;
  private readonly min: Money;
  private readonly max: Money;
  private readonly outliers: readonly MarketSample[];
  private readonly excluded: readonly MarketSample[];
  private readonly retained: readonly MarketSample[];

  constructor(
    samples: MarketSample[],
    mean: Money,
    median: Money,
    stdDev: Money,
    coefficientOfVariation: number,
    min: Money,
    max: Money,
    outliers: MarketSample[],
    excluded: MarketSample[],
    retained: MarketSample[]
  ) {
    this.samples = Object.freeze([...samples]);
    this.mean = mean;
    this.median = median;
    this.stdDev = stdDev;
    this.coefficientOfVariation = coefficientOfVariation;
    this.min = min;
    this.max = max;
    this.outliers = Object.freeze([...outliers]);
    this.excluded = Object.freeze([...excluded]);
    this.retained = Object.freeze([...retained]);

    this.validate();
  }

  /**
   * Validate statistical analysis
   */
  private validate(): void {
    if (this.samples.length === 0) {
      throw new ValidationError('At least one sample is required');
    }

    if (this.retained.length === 0) {
      throw new ValidationError('At least one retained sample is required');
    }

    if (this.coefficientOfVariation < 0) {
      throw new ValidationError('Coefficient of variation cannot be negative');
    }

    if (!Number.isFinite(this.coefficientOfVariation)) {
      throw new ValidationError('Coefficient of variation must be finite');
    }
  }

  /**
   * Get all samples (before filtering)
   */
  getSamples(): ReadonlyArray<MarketSample> {
    return this.samples;
  }

  /**
   * Get mean (average) price per m²
   */
  getMean(): Money {
    return this.mean;
  }

  /**
   * Get median price per m²
   */
  getMedian(): Money {
    return this.median;
  }

  /**
   * Get standard deviation
   */
  getStdDev(): Money {
    return this.stdDev;
  }

  /**
   * Get coefficient of variation (%)
   *
   * CV = (Standard Deviation / Mean) × 100
   * Lower CV indicates more reliable data.
   */
  getCoefficientOfVariation(): number {
    return this.coefficientOfVariation;
  }

  /**
   * Get minimum value
   */
  getMin(): Money {
    return this.min;
  }

  /**
   * Get maximum value
   */
  getMax(): Money {
    return this.max;
  }

  /**
   * Get outlier samples (abnormal values outside 60%-140% of median)
   */
  getOutliers(): ReadonlyArray<MarketSample> {
    return this.outliers;
  }

  /**
   * Get excluded samples (outside normal range 80%-120% of median)
   */
  getExcluded(): ReadonlyArray<MarketSample> {
    return this.excluded;
  }

  /**
   * Get retained samples (final samples used for valuation)
   */
  getRetainedSamples(): ReadonlyArray<MarketSample> {
    return this.retained;
  }

  /**
   * Check if analysis is reliable
   *
   * Reliable if:
   * - CV < 30% (NBR 14653-2 recommendation for high precision)
   * - At least 3 retained samples
   */
  isReliable(): boolean {
    return this.coefficientOfVariation < 30 && this.retained.length >= 3;
  }

  /**
   * Get precision grade based on CV
   *
   * NBR 14653-2 grading:
   * - CV ≤ 10%: Excellent precision
   * - 10% < CV ≤ 20%: Good precision
   * - 20% < CV ≤ 30%: Acceptable precision
   * - CV > 30%: Low precision
   */
  getPrecisionGrade(): 'excellent' | 'good' | 'acceptable' | 'low' {
    if (this.coefficientOfVariation <= 10) return 'excellent';
    if (this.coefficientOfVariation <= 20) return 'good';
    if (this.coefficientOfVariation <= 30) return 'acceptable';
    return 'low';
  }

  /**
   * Get precision grade description in Portuguese
   */
  getPrecisionDescription(): string {
    const grade = this.getPrecisionGrade();
    const descriptions = {
      excellent: 'Excelente precisão (CV ≤ 10%)',
      good: 'Boa precisão (10% < CV ≤ 20%)',
      acceptable: 'Precisão aceitável (20% < CV ≤ 30%)',
      low: 'Baixa precisão (CV > 30%)',
    };
    return descriptions[grade];
  }

  /**
   * Get confidence interval (mean ± 2 * standard deviation)
   *
   * Approximately 95% confidence interval for normal distribution.
   */
  getConfidenceInterval(): { lower: Money; upper: Money } {
    const twoStdDev = this.stdDev.multiply(2);
    const lower = this.mean.subtract(twoStdDev);
    const upper = this.mean.add(twoStdDev);

    return {
      lower: lower.getAmount() > 0 ? lower : Money.zero(),
      upper,
    };
  }

  /**
   * Get sample count summary
   */
  getSampleCounts(): {
    total: number;
    outliers: number;
    excluded: number;
    retained: number;
  } {
    return {
      total: this.samples.length,
      outliers: this.outliers.length,
      excluded: this.excluded.length,
      retained: this.retained.length,
    };
  }

  /**
   * Create StatisticalAnalysis from JSON
   */
  static fromJSON(json: {
    samples: any[];
    mean: number;
    median: number;
    stdDev: number;
    coefficientOfVariation: number;
    min: number;
    max: number;
    outliers: any[];
    excluded: any[];
    retained: any[];
  }): StatisticalAnalysis {
    return new StatisticalAnalysis(
      json.samples.map((s) => MarketSample.fromJSON(s)),
      new Money(json.mean),
      new Money(json.median),
      new Money(json.stdDev),
      json.coefficientOfVariation,
      new Money(json.min),
      new Money(json.max),
      json.outliers.map((s) => MarketSample.fromJSON(s)),
      json.excluded.map((s) => MarketSample.fromJSON(s)),
      json.retained.map((s) => MarketSample.fromJSON(s))
    );
  }

  /**
   * Convert to JSON
   */
  toJSON(): {
    mean: number;
    median: number;
    stdDev: number;
    coefficientOfVariation: number;
    min: number;
    max: number;
    sampleCounts: {
      total: number;
      outliers: number;
      excluded: number;
      retained: number;
    };
    isReliable: boolean;
    precisionGrade: string;
    precisionDescription: string;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
    samples: any[];
    outliers: any[];
    excluded: any[];
    retained: any[];
  } {
    const confidenceInterval = this.getConfidenceInterval();

    return {
      mean: this.mean.getAmount(),
      median: this.median.getAmount(),
      stdDev: this.stdDev.getAmount(),
      coefficientOfVariation: this.coefficientOfVariation,
      min: this.min.getAmount(),
      max: this.max.getAmount(),
      sampleCounts: this.getSampleCounts(),
      isReliable: this.isReliable(),
      precisionGrade: this.getPrecisionGrade(),
      precisionDescription: this.getPrecisionDescription(),
      confidenceInterval: {
        lower: confidenceInterval.lower.getAmount(),
        upper: confidenceInterval.upper.getAmount(),
      },
      samples: this.samples.map((s) => s.toJSON()),
      outliers: this.outliers.map((s) => s.toJSON()),
      excluded: this.excluded.map((s) => s.toJSON()),
      retained: this.retained.map((s) => s.toJSON()),
    };
  }
}
