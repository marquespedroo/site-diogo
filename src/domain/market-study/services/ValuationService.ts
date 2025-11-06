import { Money } from '@/domain/calculator/value-objects/Money';
import { PropertyArea } from '../value-objects/PropertyArea';
import { MarketSample } from '../entities/MarketSample';
import { StatisticalAnalysis } from '../entities/StatisticalAnalysis';
import { PropertyValuation, PropertyStandard } from '../entities/PropertyValuation';
import { ValidationError } from '@/lib/errors';

/**
 * Valuation Service
 *
 * Implements the Comparative Method (Método Comparativo Direto de Dados)
 * following Brazilian standards (NBR 14653-2).
 *
 * Main responsibilities:
 * - Homogenize market samples by applying adjustment factors
 * - Perform statistical analysis with outlier detection
 * - Calculate valuations for different property standards
 *
 * Statistical criteria (NBR 14653-2):
 * - Abnormal samples: Outside 60%-140% of median
 * - Normal range: 80%-120% of recalculated median
 * - High precision: CV < 30% with at least 3 retained samples
 *
 * @example
 * const service = new ValuationService();
 * const homogenized = service.homogenizeSamples(samples, targetProperty);
 * const analysis = service.analyzeStatistics(homogenized);
 * const valuations = service.calculateValuations(analysis, propertyArea);
 */
export class ValuationService {
  /**
   * Default adjustment factor for characteristic differences
   */
  private readonly DEFAULT_ADJUSTMENT_FACTOR = 0.1; // 10%

  /**
   * Homogenize market samples by applying adjustment factors
   *
   * Adjusts comparable sample prices to match the target property's characteristics.
   * Uses multiplicative adjustment factors:
   * - Sample superior to target: multiply by 0.9 (decrease value)
   * - Sample inferior to target: multiply by 1.1 (increase value)
   * - Sample equal to target: multiply by 1.0 (no change)
   *
   * @param samples - Array of market samples to homogenize
   * @param targetProperty - Target property characteristics for comparison
   * @returns Array of market samples with calculated homogenized values
   */
  homogenizeSamples(
    samples: MarketSample[],
    targetProperty: {
      characteristics: Map<string, number>;
    }
  ): MarketSample[] {
    return samples.map((sample) => {
      let adjustmentFactor = 1.0;

      // Apply adjustment factors for each characteristic
      sample.getCharacteristics().forEach((sampleValue, factorName) => {
        const targetValue = targetProperty.characteristics.get(factorName);

        // Skip if target doesn't have this characteristic
        if (targetValue === undefined) {
          return;
        }

        // Compare values and apply adjustment
        if (sampleValue > targetValue) {
          // Sample is superior, decrease its value
          adjustmentFactor *= 1 - this.DEFAULT_ADJUSTMENT_FACTOR;
        } else if (sampleValue < targetValue) {
          // Sample is inferior, increase its value
          adjustmentFactor *= 1 + this.DEFAULT_ADJUSTMENT_FACTOR;
        }
        // If equal, no adjustment (multiply by 1.0)
      });

      // Calculate homogenized value
      const homogenizedValue = sample.getPrice().multiply(adjustmentFactor);

      // Create new MarketSample with homogenized value
      return new MarketSample(
        sample.getId(),
        sample.getLocation(),
        sample.getArea(),
        sample.getPrice(),
        sample.getStatus(),
        new Map(sample.getCharacteristics()),
        homogenizedValue,
        sample.getListingDate(),
        sample.getSaleDate()
      );
    });
  }

  /**
   * Perform statistical analysis on homogenized samples
   *
   * Implements NBR 14653-2 methodology:
   * 1. Calculate initial statistics (mean, median, std dev, CV)
   * 2. Identify abnormal samples (outside 60%-140% of median)
   * 3. Recalculate median without abnormal samples
   * 4. Filter normal range (80%-120% of new median)
   * 5. Calculate final statistics on retained samples
   *
   * @param samples - Array of homogenized market samples
   * @returns StatisticalAnalysis entity with all metrics
   * @throws {ValidationError} if samples array is empty
   */
  analyzeStatistics(samples: MarketSample[]): StatisticalAnalysis {
    if (samples.length === 0) {
      throw new ValidationError('Cannot analyze statistics: no samples provided');
    }

    // Extract homogenized price per m² values
    const homogenizedValues = samples.map((s) => s.getHomogenizedPricePerSqM().getAmount());

    // 1. Calculate initial statistics
    const mean = this.calculateMean(homogenizedValues);
    const median = this.calculateMedian(homogenizedValues);
    const stdDev = this.calculateStdDev(homogenizedValues, mean);
    const cv = (stdDev / mean) * 100;

    // 2. Identify abnormal samples (outside 60%-140% of median)
    const lowerBoundAbnormal = median * 0.6;
    const upperBoundAbnormal = median * 1.4;

    const abnormalSamples: MarketSample[] = [];
    const normalSamples: MarketSample[] = [];

    samples.forEach((sample) => {
      const value = sample.getHomogenizedPricePerSqM().getAmount();
      if (value < lowerBoundAbnormal || value > upperBoundAbnormal) {
        abnormalSamples.push(sample);
      } else {
        normalSamples.push(sample);
      }
    });

    // 3. If we have enough normal samples, apply stricter filtering
    if (normalSamples.length >= 3) {
      const normalValues = normalSamples.map((s) => s.getHomogenizedPricePerSqM().getAmount());
      const medianNormal = this.calculateMedian(normalValues);

      // 4. Identify samples outside normality range (80%-120% of new median)
      const lowerBoundNormal = medianNormal * 0.8;
      const upperBoundNormal = medianNormal * 1.2;

      const excludedSamples: MarketSample[] = [];
      const retainedSamples: MarketSample[] = [];

      normalSamples.forEach((sample) => {
        const value = sample.getHomogenizedPricePerSqM().getAmount();
        if (value < lowerBoundNormal || value > upperBoundNormal) {
          excludedSamples.push(sample);
        } else {
          retainedSamples.push(sample);
        }
      });

      // 5. Final statistics on retained samples (if we have enough)
      if (retainedSamples.length >= 3) {
        const retainedValues = retainedSamples.map((s) =>
          s.getHomogenizedPricePerSqM().getAmount()
        );

        const finalMean = this.calculateMean(retainedValues);
        const finalMedian = this.calculateMedian(retainedValues);
        const finalStdDev = this.calculateStdDev(retainedValues, finalMean);
        const finalCV = (finalStdDev / finalMean) * 100;

        return new StatisticalAnalysis(
          samples,
          new Money(finalMean),
          new Money(finalMedian),
          new Money(finalStdDev),
          finalCV,
          new Money(Math.min(...retainedValues)),
          new Money(Math.max(...retainedValues)),
          abnormalSamples,
          excludedSamples,
          retainedSamples
        );
      }
    }

    // Fallback: use all samples if filtering reduces below 3
    // This ensures we always have a result, even if reliability is low
    return new StatisticalAnalysis(
      samples,
      new Money(mean),
      new Money(median),
      new Money(stdDev),
      cv,
      new Money(Math.min(...homogenizedValues)),
      new Money(Math.max(...homogenizedValues)),
      [],
      [],
      samples // All samples retained in fallback
    );
  }

  /**
   * Calculate valuations for different property standards
   *
   * Generates valuations for each standard type by applying multipliers
   * to the base price per m² from statistical analysis.
   *
   * Standard multipliers (relative to renovated = 1.0):
   * - Original: 0.9x (no renovations)
   * - Basic: 0.95x (basic renovations)
   * - Renovated: 1.0x (fully renovated - baseline)
   * - Modernized: 1.05x (modern finishes)
   * - High-end: 1.1x (luxury finishes)
   *
   * @param analysis - Statistical analysis result
   * @param propertyArea - Target property area
   * @param perceptionFactor - Agent's market perception adjustment (%, -50 to +50)
   * @returns Map of PropertyStandard to PropertyValuation
   */
  calculateValuations(
    analysis: StatisticalAnalysis,
    propertyArea: PropertyArea,
    perceptionFactor: number = 0
  ): Map<PropertyStandard, PropertyValuation> {
    // Validate perception factor
    if (perceptionFactor < -50 || perceptionFactor > 50) {
      throw new ValidationError('Perception factor must be between -50% and 50%');
    }

    // Use mean price per m² as base
    const basePricePerSqM = analysis.getMean().getAmount();

    // Apply perception factor adjustment
    const adjustmentMultiplier = 1 + perceptionFactor / 100;

    // Define standard types and their multipliers
    const standards: PropertyStandard[] = [
      'original',
      'basic',
      'renovated',
      'modernized',
      'high_end',
    ];

    const multipliers: Record<PropertyStandard, number> = {
      original: 0.9,
      basic: 0.95,
      renovated: 1.0,
      modernized: 1.05,
      high_end: 1.1,
    };

    // Calculate valuation for each standard
    const valuations = new Map<PropertyStandard, PropertyValuation>();

    standards.forEach((standard) => {
      // Apply standard multiplier and perception adjustment
      const pricePerSqM = basePricePerSqM * multipliers[standard] * adjustmentMultiplier;

      // Calculate total value
      const totalValue = pricePerSqM * propertyArea.getSquareMeters();

      // Create valuation entity
      valuations.set(
        standard,
        new PropertyValuation(standard, new Money(pricePerSqM), new Money(totalValue))
      );
    });

    return valuations;
  }

  // ============================================================================
  // Private Statistical Helper Methods
  // ============================================================================

  /**
   * Calculate mean (average) of values
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) {
      throw new ValidationError('Cannot calculate mean of empty array');
    }

    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  /**
   * Calculate median of values
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) {
      throw new ValidationError('Cannot calculate median of empty array');
    }

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      // Even number of values: average of two middle values
      return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      // Odd number of values: middle value
      return sorted[mid];
    }
  }

  /**
   * Calculate standard deviation of values
   */
  private calculateStdDev(values: number[], mean: number): number {
    if (values.length === 0) {
      throw new ValidationError('Cannot calculate standard deviation of empty array');
    }

    // Calculate variance: average of squared differences from mean
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

    // Standard deviation is square root of variance
    return Math.sqrt(variance);
  }
}
