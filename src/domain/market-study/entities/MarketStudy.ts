import { PropertyAddress } from '../value-objects/PropertyAddress';
import { PropertyArea } from '../value-objects/PropertyArea';
import { PropertyCharacteristics } from '../value-objects/PropertyCharacteristics';
import { MarketSample } from './MarketSample';
import { StatisticalAnalysis } from './StatisticalAnalysis';
import { PropertyValuation, PropertyStandard } from './PropertyValuation';
import { ValidationError, BusinessRuleError } from '@/lib/errors';

/**
 * Evaluation Type
 */
export type EvaluationType = 'sale' | 'rent';

/**
 * Market Study Params Interface
 */
export interface MarketStudyParams {
  id?: string;
  userId: string;
  propertyAddress: PropertyAddress;
  propertyArea: PropertyArea;
  propertyCharacteristics: PropertyCharacteristics;
  evaluationType: EvaluationType;
  factorNames: string[];
  samples: MarketSample[];
  analysis: StatisticalAnalysis;
  valuations: Map<PropertyStandard, PropertyValuation>;
  selectedStandard?: PropertyStandard;
  agentLogo?: string;
  pdfUrl?: string;
  slidesUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * MarketStudy Aggregate Root
 *
 * Main domain entity representing a complete market study/property valuation.
 * Implements the Comparative Method (Método Comparativo Direto) following
 * Brazilian standards (NBR 14653-2).
 *
 * Responsibilities:
 * - Manage property information and characteristics
 * - Store comparable samples and statistical analysis
 * - Provide valuations for different property standards
 * - Generate and store PDF/presentation URLs
 * - Enforce business rules and validation
 *
 * @example
 * const marketStudy = new MarketStudy({
 *   userId: 'user-123',
 *   propertyAddress: new PropertyAddress(...),
 *   propertyArea: new PropertyArea(90),
 *   propertyCharacteristics: new PropertyCharacteristics(...),
 *   evaluationType: 'sale',
 *   factorNames: ['bedrooms', 'bathrooms', 'parkingSpots'],
 *   samples: [...],
 *   analysis: statisticalAnalysis,
 *   valuations: valuationsMap
 * });
 */
export class MarketStudy {
  private readonly id: string;
  private readonly userId: string;
  private readonly propertyAddress: PropertyAddress;
  private readonly propertyArea: PropertyArea;
  private readonly propertyCharacteristics: PropertyCharacteristics;
  private readonly evaluationType: EvaluationType;
  private readonly factorNames: readonly string[];
  private readonly samples: readonly MarketSample[];
  private readonly analysis: StatisticalAnalysis;
  private readonly valuations: ReadonlyMap<PropertyStandard, PropertyValuation>;
  private selectedStandard?: PropertyStandard;
  private agentLogo?: string;
  private pdfUrl?: string;
  private slidesUrl?: string;
  private readonly createdAt: Date;
  private updatedAt: Date;

  constructor(params: MarketStudyParams) {
    this.id = params.id || this.generateId();
    this.userId = params.userId;
    this.propertyAddress = params.propertyAddress;
    this.propertyArea = params.propertyArea;
    this.propertyCharacteristics = params.propertyCharacteristics;
    this.evaluationType = params.evaluationType;
    this.factorNames = Object.freeze([...params.factorNames]);
    this.samples = Object.freeze([...params.samples]);
    this.analysis = params.analysis;
    this.valuations = new Map(params.valuations);
    this.selectedStandard = params.selectedStandard;
    this.agentLogo = params.agentLogo;
    this.pdfUrl = params.pdfUrl;
    this.slidesUrl = params.slidesUrl;
    this.createdAt = params.createdAt || new Date();
    this.updatedAt = params.updatedAt || new Date();

    this.validate();
  }

  /**
   * Validate business rules
   */
  private validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new ValidationError('User ID is required');
    }

    if (this.samples.length < 3) {
      throw new ValidationError('Minimum 3 samples required for reliable valuation');
    }

    if (this.factorNames.length === 0) {
      throw new ValidationError('At least one comparison factor is required');
    }

    if (this.valuations.size === 0) {
      throw new ValidationError('At least one valuation is required');
    }

    // Warn if analysis is not reliable (but don't fail)
    if (!this.analysis.isReliable()) {
      console.warn(
        `Market study ${this.id}: Statistical analysis is not reliable (CV > 30% or < 3 samples)`
      );
    }
  }

  // ============================================================================
  // Business Logic Methods
  // ============================================================================

  /**
   * Get recommended valuation based on selected standard
   *
   * Returns null if no standard is selected.
   */
  getRecommendedValuation(): PropertyValuation | null {
    if (!this.selectedStandard) {
      return null;
    }

    return this.valuations.get(this.selectedStandard) || null;
  }

  /**
   * Select a property standard for valuation
   *
   * @throws {BusinessRuleError} if standard doesn't have a valuation
   */
  selectStandard(standard: PropertyStandard): void {
    if (!this.valuations.has(standard)) {
      throw new BusinessRuleError(
        `No valuation available for standard: ${standard}`,
        'VALUATION_NOT_FOUND'
      );
    }

    this.selectedStandard = standard;
    this.updatedAt = new Date();
  }

  /**
   * Upload agent logo URL
   */
  uploadAgentLogo(logoUrl: string): void {
    if (!logoUrl || logoUrl.trim().length === 0) {
      throw new ValidationError('Logo URL cannot be empty');
    }

    this.agentLogo = logoUrl;
    this.updatedAt = new Date();
  }

  /**
   * Set PDF report URL
   */
  setPdfUrl(url: string): void {
    if (!url || url.trim().length === 0) {
      throw new ValidationError('PDF URL cannot be empty');
    }

    this.pdfUrl = url;
    this.updatedAt = new Date();
  }

  /**
   * Set slides presentation URL
   */
  setSlidesUrl(url: string): void {
    if (!url || url.trim().length === 0) {
      throw new ValidationError('Slides URL cannot be empty');
    }

    this.slidesUrl = url;
    this.updatedAt = new Date();
  }

  /**
   * Check if market study has PDF generated
   */
  hasPdfGenerated(): boolean {
    return !!this.pdfUrl;
  }

  /**
   * Check if market study has slides generated
   */
  hasSlidesGenerated(): boolean {
    return !!this.slidesUrl;
  }

  /**
   * Get valuation range (min to max across all standards)
   */
  getValuationRange(): { min: PropertyValuation; max: PropertyValuation } | null {
    if (this.valuations.size === 0) {
      return null;
    }

    const valuationsArray = Array.from(this.valuations.values());

    let minValuation = valuationsArray[0];
    let maxValuation = valuationsArray[0];

    for (const valuation of valuationsArray) {
      if (valuation.getTotalValue().lessThan(minValuation.getTotalValue())) {
        minValuation = valuation;
      }
      if (valuation.getTotalValue().greaterThan(maxValuation.getTotalValue())) {
        maxValuation = valuation;
      }
    }

    return { min: minValuation, max: maxValuation };
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

  getPropertyAddress(): PropertyAddress {
    return this.propertyAddress;
  }

  getPropertyArea(): PropertyArea {
    return this.propertyArea;
  }

  getPropertyCharacteristics(): PropertyCharacteristics {
    return this.propertyCharacteristics;
  }

  getEvaluationType(): EvaluationType {
    return this.evaluationType;
  }

  getFactorNames(): ReadonlyArray<string> {
    return this.factorNames;
  }

  getSamples(): ReadonlyArray<MarketSample> {
    return this.samples;
  }

  getAnalysis(): StatisticalAnalysis {
    return this.analysis;
  }

  getValuations(): ReadonlyMap<PropertyStandard, PropertyValuation> {
    return new Map(this.valuations);
  }

  getSelectedStandard(): PropertyStandard | undefined {
    return this.selectedStandard;
  }

  getAgentLogo(): string | undefined {
    return this.agentLogo;
  }

  getPdfUrl(): string | undefined {
    return this.pdfUrl;
  }

  getSlidesUrl(): string | undefined {
    return this.slidesUrl;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  /**
   * Convert to JSON for persistence/API
   */
  toJSON(): Record<string, any> {
    const range = this.getValuationRange();

    return {
      id: this.id,
      userId: this.userId,
      propertyAddress: this.propertyAddress.toJSON(),
      propertyArea: this.propertyArea.getSquareMeters(),
      propertyCharacteristics: this.propertyCharacteristics.toJSON(),
      evaluationType: this.evaluationType,
      factorNames: [...this.factorNames],
      samples: this.samples.map((s) => s.toJSON()),
      analysis: this.analysis.toJSON(),
      valuations: Array.from(this.valuations.entries()).map(([standard, valuation]) => ({
        standard,
        ...valuation.toJSON(),
      })),
      selectedStandard: this.selectedStandard,
      recommendedValuation: this.getRecommendedValuation()?.toJSON(),
      valuationRange: range
        ? {
            min: range.min.toJSON(),
            max: range.max.toJSON(),
          }
        : null,
      agentLogo: this.agentLogo,
      pdfUrl: this.pdfUrl,
      slidesUrl: this.slidesUrl,
      hasPdfGenerated: this.hasPdfGenerated(),
      hasSlidesGenerated: this.hasSlidesGenerated(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  /**
   * Create MarketStudy from JSON
   */
  static fromJSON(json: Record<string, any>): MarketStudy {
    // Parse valuations map
    const valuationsMap = new Map<PropertyStandard, PropertyValuation>();
    if (json.valuations && Array.isArray(json.valuations)) {
      json.valuations.forEach((v: any) => {
        valuationsMap.set(
          v.standard || v.standardType,
          PropertyValuation.fromJSON({
            standardType: v.standard || v.standardType,
            pricePerSqM: v.pricePerSqM,
            totalValue: v.totalValue,
          })
        );
      });
    }

    return new MarketStudy({
      id: json.id,
      userId: json.userId,
      propertyAddress: PropertyAddress.fromJSON(json.propertyAddress),
      propertyArea: new PropertyArea(json.propertyArea),
      propertyCharacteristics: PropertyCharacteristics.fromJSON(
        json.propertyCharacteristics
      ),
      evaluationType: json.evaluationType,
      factorNames: json.factorNames || [],
      samples: (json.samples || []).map((s: any) => MarketSample.fromJSON(s)),
      analysis: StatisticalAnalysis.fromJSON(json.analysis),
      valuations: valuationsMap,
      selectedStandard: json.selectedStandard,
      agentLogo: json.agentLogo,
      pdfUrl: json.pdfUrl,
      slidesUrl: json.slidesUrl,
      createdAt: json.createdAt ? new Date(json.createdAt) : new Date(),
      updatedAt: json.updatedAt ? new Date(json.updatedAt) : new Date(),
    });
  }

  /**
   * Generate unique ID (UUID-like)
   */
  private generateId(): string {
    return (
      Date.now().toString(36) + Math.random().toString(36).substring(2, 15)
    );
  }
}
