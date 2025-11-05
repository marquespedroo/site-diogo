# Market Study Tool - Product Requirements Document

## Document Control
- **Feature**: Property Valuation & Market Study Generator
- **Version**: 1.0.0
- **Priority**: P0 (Critical)
- **Target Release**: Sprint 2
- **Owner**: Product Team

---

## 1. Feature Overview

### 1.1 Business Context
Real estate agents need professional market studies to:
- Justify property valuations to clients
- Present comparative market analysis (CMA)
- Generate branded PDF reports and slide presentations
- Support pricing negotiations with data-driven evidence

**Key Problem**: Creating professional market studies manually takes 2-4 hours. Agents need this in <15 minutes.

### 1.2 Success Metrics
```
Metric                        | Target
----------------------------- | ----------
Market studies created/month  | 3,000+
PDF reports generated         | 2,500+
Avg. time to complete study   | < 12 minutes
Agent satisfaction            | 4.5+ stars
Valuation accuracy            | ±10% of actual
Reports shared with clients   | 75%+
```

---

## 2. Domain Model Architecture

### 2.1 Core Entities

```typescript
/**
 * Value Objects
 */
class PropertyAddress {
  constructor(
    private readonly street: string,
    private readonly number: string,
    private readonly neighborhood: string,
    private readonly city: string,
    private readonly state: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.street || !this.neighborhood || !this.city) {
      throw new ValidationError('Invalid address');
    }
  }

  toString(): string {
    return `${this.street}, ${this.number}, ${this.neighborhood}, ${this.city}-${this.state}`;
  }
}

class PropertyArea {
  constructor(private readonly squareMeters: number) {
    if (squareMeters <= 0) {
      throw new ValidationError('Area must be positive');
    }
  }

  getSquareMeters(): number {
    return this.squareMeters;
  }

  format(): string {
    return `${this.squareMeters.toFixed(2)} m²`;
  }
}

class PropertyCharacteristics {
  constructor(
    private readonly bedrooms: number,
    private readonly bathrooms: number,
    private readonly parkingSpots: number,
    private readonly additionalFeatures: string[]
  ) {}

  getBedrooms(): number {
    return this.bedrooms;
  }

  getBathrooms(): number {
    return this.bathrooms;
  }

  getParkingSpots(): number {
    return this.parkingSpots;
  }

  getFeatures(): ReadonlyArray<string> {
    return [...this.additionalFeatures];
  }
}

/**
 * Entities
 */
class MarketSample {
  constructor(
    private readonly id: string,
    private readonly location: string,
    private readonly area: PropertyArea,
    private readonly price: Money,
    private readonly status: 'for_sale' | 'sold',
    private readonly characteristics: Map<string, number>, // Factor name → value
    private readonly homogenizedValue: Money // Calculated after adjustments
  ) {}

  getId(): string {
    return this.id;
  }

  getPricePerSqM(): Money {
    return new Money(this.price.getAmount() / this.area.getSquareMeters());
  }

  getHomogenizedPricePerSqM(): Money {
    return new Money(
      this.homogenizedValue.getAmount() / this.area.getSquareMeters()
    );
  }

  // Getters...
}

class StatisticalAnalysis {
  constructor(
    private readonly samples: MarketSample[],
    private readonly mean: Money,
    private readonly median: Money,
    private readonly stdDev: Money,
    private readonly coefficientOfVariation: number,
    private readonly min: Money,
    private readonly max: Money,
    private readonly outliers: MarketSample[], // Abnormal samples
    private readonly excluded: MarketSample[], // Out of normality range
    private readonly retained: MarketSample[] // Final samples used
  ) {}

  getMean(): Money {
    return this.mean;
  }

  getMedian(): Money {
    return this.median;
  }

  getStdDev(): Money {
    return this.stdDev;
  }

  getCoefficientOfVariation(): number {
    return this.coefficientOfVariation;
  }

  getRetainedSamples(): ReadonlyArray<MarketSample> {
    return [...this.retained];
  }

  isReliable(): boolean {
    // NBR 14653 recommends CV < 30% for high precision
    return this.coefficientOfVariation < 30 && this.retained.length >= 3;
  }
}

class PropertyValuation {
  constructor(
    private readonly standardType: PropertyStandard,
    private readonly pricePerSqM: Money,
    private readonly totalValue: Money
  ) {}

  getStandardType(): PropertyStandard {
    return this.standardType;
  }

  getPricePerSqM(): Money {
    return this.pricePerSqM;
  }

  getTotalValue(): Money {
    return this.totalValue;
  }
}

type PropertyStandard = 'original' | 'basic' | 'renovated' | 'modernized' | 'high_end';

/**
 * Aggregate Root
 */
class MarketStudy {
  private readonly id: string;
  private readonly userId: string;
  private readonly propertyAddress: PropertyAddress;
  private readonly propertyArea: PropertyArea;
  private readonly propertyCharacteristics: PropertyCharacteristics;
  private readonly evaluationType: 'sale' | 'rent';
  private readonly factorNames: string[]; // Dynamic factors for comparison
  private readonly samples: MarketSample[];
  private readonly analysis: StatisticalAnalysis;
  private readonly valuations: Map<PropertyStandard, PropertyValuation>;
  private readonly selectedStandard?: PropertyStandard;
  private readonly agentLogo?: string;
  private pdfUrl?: string;
  private slidesUrl?: string;
  private readonly createdAt: Date;

  constructor(params: MarketStudyParams) {
    this.id = params.id || generateUUID();
    this.userId = params.userId;
    this.propertyAddress = params.propertyAddress;
    this.propertyArea = params.propertyArea;
    this.propertyCharacteristics = params.propertyCharacteristics;
    this.evaluationType = params.evaluationType;
    this.factorNames = params.factorNames;
    this.samples = params.samples;
    this.analysis = params.analysis;
    this.valuations = params.valuations;
    this.selectedStandard = params.selectedStandard;
    this.agentLogo = params.agentLogo;
    this.pdfUrl = params.pdfUrl;
    this.slidesUrl = params.slidesUrl;
    this.createdAt = params.createdAt || new Date();

    this.validate();
  }

  private validate(): void {
    if (this.samples.length < 3) {
      throw new ValidationError('Minimum 3 samples required');
    }

    if (!this.analysis.isReliable()) {
      console.warn('Statistical analysis is not reliable (CV > 30%)');
    }
  }

  // Business Logic
  getRecommendedValuation(): PropertyValuation | null {
    if (!this.selectedStandard) return null;
    return this.valuations.get(this.selectedStandard) || null;
  }

  selectStandard(standard: PropertyStandard): void {
    if (!this.valuations.has(standard)) {
      throw new BusinessRuleError(`No valuation for standard: ${standard}`);
    }
    (this as any).selectedStandard = standard;
  }

  uploadAgentLogo(logoUrl: string): void {
    (this as any).agentLogo = logoUrl;
  }

  setPdfUrl(url: string): void {
    this.pdfUrl = url;
  }

  setSlidesUrl(url: string): void {
    this.slidesUrl = url;
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getAnalysis(): StatisticalAnalysis {
    return this.analysis;
  }

  getValuations(): ReadonlyMap<PropertyStandard, PropertyValuation> {
    return new Map(this.valuations);
  }

  // Serialization
  toJSON(): MarketStudyJSON {
    return {
      id: this.id,
      userId: this.userId,
      propertyAddress: {
        street: this.propertyAddress.toString()
      },
      propertyArea: this.propertyArea.getSquareMeters(),
      evaluationType: this.evaluationType,
      factorNames: this.factorNames,
      samples: this.samples.map(s => ({
        id: s.getId(),
        // ... serialize
      })),
      analysis: {
        mean: this.analysis.getMean().getAmount(),
        median: this.analysis.getMedian().getAmount(),
        // ... serialize
      },
      valuations: Array.from(this.valuations.entries()).map(([key, val]) => ({
        standard: key,
        pricePerSqM: val.getPricePerSqM().getAmount(),
        totalValue: val.getTotalValue().getAmount()
      })),
      selectedStandard: this.selectedStandard,
      agentLogo: this.agentLogo,
      pdfUrl: this.pdfUrl,
      slidesUrl: this.slidesUrl,
      createdAt: this.createdAt.toISOString()
    };
  }

  static fromJSON(json: MarketStudyJSON): MarketStudy {
    // Deserialization logic
  }
}
```

### 2.2 Services

```typescript
/**
 * Valuation Service
 *
 * Implements the Comparative Method (Método Comparativo Direto)
 * following Brazilian standards (NBR 14653-2)
 */
class ValuationService {
  /**
   * Calculate homogenized values for all samples
   */
  homogenizeSamples(
    samples: MarketSample[],
    targetProperty: {
      characteristics: Map<string, number>
    }
  ): MarketSample[] {
    return samples.map(sample => {
      let adjustmentFactor = 1.0;

      // Apply adjustment factors for each characteristic
      sample.characteristics.forEach((value, factor) => {
        const targetValue = targetProperty.characteristics.get(factor) || 0;

        if (value === targetValue) {
          adjustmentFactor *= 1.0; // No adjustment
        } else if (value > targetValue) {
          adjustmentFactor *= 0.9; // Sample is superior, decrease value
        } else {
          adjustmentFactor *= 1.1; // Sample is inferior, increase value
        }
      });

      const homogenizedValue = new Money(
        sample.getPrice().getAmount() * adjustmentFactor
      );

      return new MarketSample(
        sample.getId(),
        sample.getLocation(),
        sample.getArea(),
        sample.getPrice(),
        sample.getStatus(),
        sample.getCharacteristics(),
        homogenizedValue
      );
    });
  }

  /**
   * Perform statistical analysis on homogenized samples
   */
  analyzeStatistics(samples: MarketSample[]): StatisticalAnalysis {
    const homogenizedValues = samples.map(s =>
      s.getHomogenizedPricePerSqM().getAmount()
    );

    // 1. Calculate initial statistics
    const mean = this.calculateMean(homogenizedValues);
    const median = this.calculateMedian(homogenizedValues);
    const stdDev = this.calculateStdDev(homogenizedValues, mean);
    const cv = (stdDev / mean) * 100;

    // 2. Identify outliers (values outside 60%-140% of median)
    const lowerBoundAbnormal = median * 0.6;
    const upperBoundAbnormal = median * 1.4;

    const abnormalSamples: MarketSample[] = [];
    const normalSamples: MarketSample[] = [];

    samples.forEach(sample => {
      const value = sample.getHomogenizedPricePerSqM().getAmount();
      if (value < lowerBoundAbnormal || value > upperBoundAbnormal) {
        abnormalSamples.push(sample);
      } else {
        normalSamples.push(sample);
      }
    });

    // 3. Recalculate median without abnormal samples
    if (normalSamples.length >= 3) {
      const normalValues = normalSamples.map(s =>
        s.getHomogenizedPricePerSqM().getAmount()
      );
      const medianNormal = this.calculateMedian(normalValues);

      // 4. Identify samples outside normality range (80%-120% of new median)
      const lowerBoundNormal = medianNormal * 0.8;
      const upperBoundNormal = medianNormal * 1.2;

      const excludedSamples: MarketSample[] = [];
      const retainedSamples: MarketSample[] = [];

      normalSamples.forEach(sample => {
        const value = sample.getHomogenizedPricePerSqM().getAmount();
        if (value < lowerBoundNormal || value > upperBoundNormal) {
          excludedSamples.push(sample);
        } else {
          retainedSamples.push(sample);
        }
      });

      // 5. Final statistics on retained samples
      if (retainedSamples.length >= 3) {
        const retainedValues = retainedSamples.map(s =>
          s.getHomogenizedPricePerSqM().getAmount()
        );

        return new StatisticalAnalysis(
          samples,
          new Money(this.calculateMean(retainedValues)),
          new Money(this.calculateMedian(retainedValues)),
          new Money(this.calculateStdDev(retainedValues, this.calculateMean(retainedValues))),
          (this.calculateStdDev(retainedValues, this.calculateMean(retainedValues)) /
            this.calculateMean(retainedValues)) *
            100,
          new Money(Math.min(...retainedValues)),
          new Money(Math.max(...retainedValues)),
          abnormalSamples,
          excludedSamples,
          retainedSamples
        );
      }
    }

    // Fallback: use all samples if filtering reduces below 3
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
      samples
    );
  }

  /**
   * Calculate valuations for different property standards
   */
  calculateValuations(
    analysis: StatisticalAnalysis,
    propertyArea: PropertyArea,
    perceptionFactor: number = 0 // Agent's market perception adjustment (%)
  ): Map<PropertyStandard, PropertyValuation> {
    const basePricePerSqM = analysis.getMean().getAmount();
    const adjustmentMultiplier = 1 + perceptionFactor / 100;

    const standards: PropertyStandard[] = [
      'original',
      'basic',
      'renovated',
      'modernized',
      'high_end'
    ];

    const multipliers = {
      original: 0.9,
      basic: 0.95,
      renovated: 1.0,
      modernized: 1.05,
      high_end: 1.1
    };

    const valuations = new Map<PropertyStandard, PropertyValuation>();

    standards.forEach(standard => {
      const pricePerSqM =
        basePricePerSqM * multipliers[standard] * adjustmentMultiplier;
      const totalValue = pricePerSqM * propertyArea.getSquareMeters();

      valuations.set(
        standard,
        new PropertyValuation(
          standard,
          new Money(pricePerSqM),
          new Money(totalValue)
        )
      );
    });

    return valuations;
  }

  private calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private calculateStdDev(values: number[], mean: number): number {
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    return Math.sqrt(variance);
  }
}

/**
 * PDF Generation Service
 */
class PDFGeneratorService {
  constructor(
    private readonly puppeteer: PuppeteerService,
    private readonly storage: IStorageService
  ) {}

  async generate(
    marketStudy: MarketStudy,
    agentInfo: AgentInfo
  ): Promise<string> {
    // 1. Render HTML template
    const html = await this.renderTemplate(marketStudy, agentInfo);

    // 2. Generate PDF using Puppeteer
    const pdfBuffer = await this.puppeteer.htmlToPdf(html, {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    // 3. Upload to storage
    const filename = `market-study-${marketStudy.getId()}.pdf`;
    const url = await this.storage.upload(pdfBuffer, filename, 'application/pdf');

    return url;
  }

  private async renderTemplate(
    study: MarketStudy,
    agent: AgentInfo
  ): Promise<string> {
    const template = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          ${this.getStyles()}
        </style>
      </head>
      <body>
        <div class="header">
          ${agent.logo ? `<img src="${agent.logo}" class="logo" />` : ''}
          <h1>ESTUDO DE MERCADO</h1>
          <p>Método Comparativo Direto de Dados</p>
        </div>

        <div class="property-info">
          <h2>Imóvel Avaliado</h2>
          <p><strong>Endereço:</strong> ${study.toJSON().propertyAddress.street}</p>
          <p><strong>Área:</strong> ${study.toJSON().propertyArea} m²</p>
        </div>

        <div class="statistics">
          <h2>Estatísticas Descritivas</h2>
          ${this.renderStatistics(study.getAnalysis())}
        </div>

        <div class="valuations">
          <h2>Resultados da Avaliação</h2>
          ${this.renderValuations(study.getValuations())}
        </div>

        <div class="footer">
          <p>Relatório gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
          <p>${agent.name} | ${agent.email}</p>
        </div>
      </body>
      </html>
    `;

    return template;
  }

  private getStyles(): string {
    return `
      /* PDF-optimized styles */
      body { font-family: Arial, sans-serif; }
      .header { text-align: center; margin-bottom: 30px; }
      .logo { max-width: 150px; }
      h1 { color: #667eea; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ddd; padding: 8px; }
      @media print { body { margin: 0; } }
    `;
  }

  // ... render helper methods
}
```

### 2.3 Use Cases

```typescript
/**
 * Use Case: Create Market Study
 */
class CreateMarketStudyUseCase {
  constructor(
    private readonly repository: IMarketStudyRepository,
    private readonly valuationService: ValuationService,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(
    input: CreateMarketStudyInput
  ): Promise<CreateMarketStudyOutput> {
    // 1. Validate input
    const validated = CreateMarketStudySchema.parse(input);

    // 2. Build domain entities
    const propertyAddress = new PropertyAddress(
      validated.address.street,
      validated.address.number,
      validated.address.neighborhood,
      validated.address.city,
      validated.address.state
    );

    const propertyArea = new PropertyArea(validated.propertyArea);

    const samples = validated.samples.map(
      s =>
        new MarketSample(
          generateUUID(),
          s.location,
          new PropertyArea(s.area),
          new Money(s.price),
          s.status,
          new Map(Object.entries(s.characteristics)),
          new Money(0) // Will be calculated
        )
    );

    // 3. Homogenize samples
    const homogenizedSamples = this.valuationService.homogenizeSamples(
      samples,
      {
        characteristics: new Map(Object.entries(validated.propertyCharacteristics))
      }
    );

    // 4. Analyze statistics
    const analysis = this.valuationService.analyzeStatistics(homogenizedSamples);

    // 5. Calculate valuations
    const valuations = this.valuationService.calculateValuations(
      analysis,
      propertyArea,
      validated.perceptionFactor
    );

    // 6. Create aggregate
    const marketStudy = new MarketStudy({
      userId: validated.userId,
      propertyAddress,
      propertyArea,
      propertyCharacteristics: new PropertyCharacteristics(
        validated.propertyCharacteristics.bedrooms,
        validated.propertyCharacteristics.bathrooms,
        validated.propertyCharacteristics.parkingSpots,
        []
      ),
      evaluationType: validated.evaluationType,
      factorNames: validated.factorNames,
      samples: homogenizedSamples,
      analysis,
      valuations
    });

    // 7. Persist
    const saved = await this.repository.save(marketStudy);

    // 8. Publish event
    await this.eventPublisher.publish(new MarketStudyCreatedEvent(saved));

    // 9. Return result
    return {
      id: saved.getId(),
      analysis: saved.getAnalysis(),
      valuations: Array.from(saved.getValuations().entries())
    };
  }
}

/**
 * Use Case: Generate PDF Report
 */
class GeneratePDFReportUseCase {
  constructor(
    private readonly repository: IMarketStudyRepository,
    private readonly pdfGenerator: PDFGeneratorService,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(input: GeneratePDFInput): Promise<GeneratePDFOutput> {
    // 1. Find market study
    const study = await this.repository.findById(input.marketStudyId);
    if (!study) {
      throw new NotFoundError('Market study not found');
    }

    // 2. Verify ownership
    if (study.getUserId() !== input.userId) {
      throw new UnauthorizedError('Not your market study');
    }

    // 3. Get agent info
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // 4. Generate PDF
    const pdfUrl = await this.pdfGenerator.generate(study, {
      name: user.name,
      email: user.email,
      logo: user.logoUrl
    });

    // 5. Update study with PDF URL
    study.setPdfUrl(pdfUrl);
    await this.repository.update(study);

    return {
      pdfUrl
    };
  }
}
```

---

## 3. API Endpoints

```typescript
/**
 * POST /api/market-study
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await authenticate(req);
    await checkRateLimit(user.id, 'create_market_study');

    const useCase = new CreateMarketStudyUseCase(
      new SupabaseMarketStudyRepository(supabase),
      new ValuationService(),
      new EventPublisher()
    );

    const result = await useCase.execute({
      ...req.body,
      userId: user.id
    });

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    return handleError(error, res);
  }
}

/**
 * POST /api/market-study/:id/pdf
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await authenticate(req);
    const { id } = req.query;

    const useCase = new GeneratePDFReportUseCase(
      new SupabaseMarketStudyRepository(supabase),
      new PDFGeneratorService(puppeteer, storage),
      new SupabaseUserRepository(supabase)
    );

    const result = await useCase.execute({
      marketStudyId: id as string,
      userId: user.id
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return handleError(error, res);
  }
}
```

---

## 4. Testing Requirements

```typescript
describe('ValuationService', () => {
  describe('homogenizeSamples', () => {
    it('should apply correct adjustment factors', () => {
      const samples = [
        new MarketSample(/* superior property */)
      ];

      const homogenized = service.homogenizeSamples(samples, targetProperty);

      // Superior property should have value decreased
      expect(homogenized[0].getHomogenizedValue()).toBeLessThan(
        samples[0].getPrice()
      );
    });
  });

  describe('analyzeStatistics', () => {
    it('should identify outliers correctly', () => {
      // Test with known outliers
    });

    it('should calculate CV correctly', () => {
      // Test coefficient of variation
    });
  });
});

describe('PDF Generation', () => {
  it('should generate valid PDF with agent branding', async () => {
    const pdfUrl = await useCase.execute(/* ... */);

    // Download and verify PDF
    const response = await fetch(pdfUrl);
    const buffer = await response.arrayBuffer();

    expect(buffer.byteLength).toBeGreaterThan(0);
    // Additional PDF validation
  });
});
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-01-04 | Product Team | Initial PRD |
