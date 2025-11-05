# Payment Flow Calculator - Product Requirements Document

## Document Control
- **Feature**: Payment Flow Calculator with Shareable Links
- **Version**: 2.0.0 (Updated to reflect current implementation)
- **Priority**: P0 (Critical)
- **Status**: PARTIALLY IMPLEMENTED - Core calculators exist, shareable links pending
- **Last Updated**: 2025-11-05
- **Owner**: Product Team
- **Implementation Status**:
  - ✅ Core calculator functionality (HTML/JS)
  - ✅ PRICE and SAC amortization methods
  - ✅ Construction payment flow tracking
  - ✅ Financing capacity calculator
  - ❌ Shareable links (not implemented)
  - ❌ Backend integration (not implemented)
  - ❌ Agent branding customization (not implemented)

---

## 1. Feature Overview

### 1.1 Business Context
Real estate agents need to quickly calculate and present payment plans to clients, showing:
- Entry payments (with multiple installments option)
- Monthly payments during construction
- Habite-se (delivery) payment
- Post-construction financing options

**Key Problem**: Agents lose deals because they can't quickly show clients personalized payment scenarios on-site.

### 1.2 Success Metrics
```
Metric                        | Target
----------------------------- | ----------
Calculators created/month     | 5,000+
Shareable links clicked       | 10,000+
Link→Sale conversion          | 15%+
Avg. time to create calc      | < 2 minutes
Share rate                    | 60%+
Mobile usage                  | 70%+
```

### 1.3 User Stories

```gherkin
Feature: Payment Flow Calculator

  As a real estate agent
  I want to create personalized payment calculations
  So that I can present professional proposals to clients

  Scenario: Agent creates calculator
    Given I am logged in as an agent
    When I enter property value and payment details
    Then I should see a complete payment flow
    And I should see monthly breakdown
    And I should see approval/rejection status

  Scenario: Agent shares calculator with client
    Given I have created a calculator
    When I click "Share"
    Then I should get a short URL
    And the URL should pre-fill all my inputs
    And my logo should appear on the calculator
    And client should not need to login

  Scenario: Client views shared calculator
    Given I received a calculator link from my agent
    When I open the link
    Then I should see the calculator with pre-filled data
    And I should see the agent's branding
    And I should be able to adjust values
    And I should see real-time recalculations
```

---

## 2. Current Implementation Overview

### 2.1 Implemented Calculators

The project currently has **two functional calculator implementations** built with vanilla HTML/CSS/JavaScript:

#### **A. CalculadoraFluxoPriceAjustada.html** (Construction Payment Flow Calculator)

**Location**: `/features-html/CalculadoraFluxoPriceAjustada.html` (2,494 lines)

**Purpose**: Comprehensive real estate payment flow calculator designed for construction projects with multi-stage payment schedules.

**Key Features**:

1. **Construction Phase Management**:
   - Construction completion date tracking (month/year)
   - Captação percentage configuration (% of property value to collect until delivery)
   - Automatic calculation of months until completion
   - Real-time progress tracking

2. **Multi-Stage Payment Structure**:
   - **Entrada (Down Payment)**: Support for multiple parceled entry payments with add/remove functionality
   - **Durante a Obra (During Construction)**:
     - Recurring payments: Monthly, semi-annual, and annual options
     - Unique payments: One-time payments during construction
     - Quantity limits based on construction timeline
   - **Habite-se (Occupancy Certificate Payment)**: Single payment at property delivery
   - **Pós-Obra (Post-Construction)**: Monthly, semi-annual, and annual payment options

3. **Real-Time Financial Calculations**:
   - Total entered via all stages
   - Total captação (entry + during construction + habite-se)
   - Total paid (captação + post-construction)
   - Remaining balance calculation
   - Automatic approval/rejection status indicator

4. **Dual Financing Simulation Modes**:

   **Mode 1: Saldo Total (Total Balance)**
   - Finances the complete remaining balance
   - Age input validation (18-80 years)
   - Automatic maximum term calculation (limited to 35 years or age 80.5)
   - Quick-select term buttons (5, 10, 15, 20, 25, 30, 35 years)

   **Mode 2: Pós-Obra (Post-Construction)**
   - Uses values from post-construction section
   - Reajusted payments for monthly/semi-annual/annual installments
   - Applies compound interest to each payment frequency

5. **Amortization Methods**:
   - **PRICE (Fixed Installments)**: Constant payment throughout the loan term
   - **SAC (Decreasing Installments)**: Fixed amortization with decreasing interest

6. **Advanced Calculations**:
   ```javascript
   // PRICE Formula
   parcela = valorFinanciar * (taxaMensal * (1 + taxaMensal)^n) / ((1 + taxaMensal)^n - 1)

   // SAC Formula
   amortizacaoFixa = valorFinanciar / n
   parcela(i) = amortizacaoFixa + (saldoDevedor * taxaMensal)

   // Interest Rate Conversion (Annual to Monthly)
   taxaMensal = Math.pow(1 + taxaAnual/100, 1/12) - 1
   ```

7. **Results & Analytics**:
   - Complete amortization table with payment number, installment, interest, amortization, balance
   - First and last installment display (critical for SAC)
   - Total interest and total paid calculations
   - Color-coded payment types
   - Status approval indicator (green = approved, red = rejected)

8. **User Experience**:
   - Responsive design (mobile-friendly)
   - Tooltips for complex fields
   - Brazilian Real (R$) currency formatting
   - Smooth animations and transitions
   - Glass-morphism card design
   - Modal popups for mode selection

---

#### **B. Simulador de Financiamento.html** (Financing Simulator)

**Location**: `/features-html/Simulador de Financiamento.html` (878 lines)

**Purpose**: Streamlined financing simulator for individual homebuyers with two focused modes.

**Key Features**:

1. **Mode Selection Screen**:
   - Visual choice cards for mode selection
   - Clear iconography and descriptions

2. **Calcular Capacidade (Calculate Borrowing Capacity)**:
   - **Inputs**:
     - Monthly income
     - Financing term (5-35 years slider)
     - Interest rate (5-15% slider)
   - **Outputs**:
     - Maximum monthly payment (30% of income rule)
     - Maximum property value
     - Required down payment (20% standard)
     - Maximum financing amount
   - **Logic**: Backward calculation from income to determine purchasing power

3. **Simular Financiamento (Simulate Financing)**:
   - **Financing Type Selection**:
     - 🏠 **Residential**: Up to 35 years, 9-14% interest
     - 🏢 **Commercial**: Up to 25 years, 10-15% interest
     - 🌾 **Rural**: Up to 30 years, 8-13% interest
   - **Inputs**:
     - Client age (18-80 years)
     - Property value
     - Down payment amount (automatic % display)
     - Financing term (dynamically adjusted by financing type)
     - Interest rate (range adjusted by financing type)
     - Amortization method (PRICE or SAC toggle)
   - **Validations**:
     - Age + term cannot exceed 80.5 years
     - Down payment must be > 0 and < property value
     - Minimum financing amounts

4. **Results Display**:
   - Main result card with gradient background
   - Stats grid showing:
     - First installment (or fixed installment for PRICE)
     - Last installment (for SAC)
     - Recommended minimum income (30% rule)
     - Total to pay
     - Total interest
     - Amount financed
     - Selected amortization type
     - Selected financing type

5. **Design System**:
   - TailwindCSS-inspired styling
   - Purple/blue gradient backgrounds
   - Interactive choice cards
   - Mode toggle buttons (PRICE vs SAC)
   - Slider inputs with real-time value display
   - Responsive breakpoints for mobile/tablet/desktop

---

### 2.2 Technical Stack (Current Implementation)

```
Frontend: Pure HTML5 + Vanilla JavaScript (ES6+)
├── No frameworks (React, Vue, etc.)
├── No TypeScript (pure JavaScript)
├── No build process required
└── No package.json dependencies

Styling: Custom CSS + TailwindCSS (CDN)
├── Glass-morphism effects
├── Gradient backgrounds
├── Custom animations (@keyframes)
└── Responsive grid layouts

Libraries:
├── Chart.js (imported but not fully utilized)
└── Intl.NumberFormat (for Brazilian Real formatting)

Architecture:
├── Client-side only (no backend)
├── No API calls
├── No database integration
├── No authentication
├── No state management
└── All calculations performed in browser
```

---

### 2.3 Key Differences vs. Proposed Architecture

| Aspect | Current Implementation | Proposed (PRD Section 2.1) |
|--------|------------------------|---------------------------|
| **Language** | Vanilla JavaScript | TypeScript |
| **Architecture** | Procedural | OOP (Classes, SOLID principles) |
| **Backend** | None (client-side only) | Vercel Edge Functions + Supabase |
| **State Management** | Direct DOM manipulation | Domain entities (PaymentCalculator, Money, etc.) |
| **Persistence** | None (calculations lost on refresh) | Database with short codes |
| **Shareable Links** | ❌ Not implemented | ✅ Proposed with short codes |
| **Authentication** | ❌ Not required | ✅ JWT-based |
| **Branding** | ❌ Fixed | ✅ Customizable per agent |
| **Testing** | ❌ No tests | ✅ Unit/Integration/E2E |
| **API Integration** | ❌ None | ✅ RESTful API |
| **Code Organization** | Single HTML files | Repository pattern, use cases, domain models |

---

### 2.4 Implementation Gaps & Next Steps

**Implemented** ✅:
- Core calculator logic (PRICE & SAC)
- Multi-stage payment tracking
- Financing capacity calculator
- Age-based term validation
- Currency formatting (Brazilian Real)
- Responsive UI
- Interactive user experience

**Not Implemented** ❌:
1. **Shareable Links**: No URL encoding, no state serialization
2. **Backend Integration**: No API, no database, no persistence
3. **Authentication**: No user accounts, no sessions
4. **Branding**: No custom logos, colors, or agent information
5. **Repository Pattern**: No abstraction, no data layer
6. **TypeScript**: No type safety, no interfaces
7. **Testing**: No unit tests, no integration tests
8. **Monitoring**: No analytics, no error tracking
9. **PDF Export**: No report generation
10. **Email Integration**: No sharing via email

**Priority Enhancements** (Based on Architecture Document):
1. Implement shareable links with short codes (P0)
2. Add Supabase integration for persistence (P0)
3. Implement user authentication (P1)
4. Add agent branding customization (P1)
5. Convert to TypeScript with OOP design (P2)
6. Add comprehensive testing suite (P2)
7. Implement PDF export functionality (P3)

---

## 3. Proposed Technical Architecture (Future Implementation)

> **Note**: The following sections (3.1 - 3.4) describe the proposed TypeScript/OOP architecture from the original PRD. This represents the target state for a future refactoring to enable shareable links, persistence, and multi-user features.

### 3.1 Domain Model (OOP Design)

```typescript
/**
 * Core domain entities following DDD principles
 */

// Value Objects (immutable)
class Money {
  constructor(
    private readonly amount: number,
    private readonly currency: string = 'BRL'
  ) {
    if (amount < 0) throw new ValidationError('Amount cannot be negative');
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  getAmount(): number {
    return this.amount;
  }

  format(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: this.currency
    }).format(this.amount);
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error('Currency mismatch');
    }
  }
}

class Percentage {
  constructor(private readonly value: number) {
    if (value < 0 || value > 100) {
      throw new ValidationError('Percentage must be between 0 and 100');
    }
  }

  getValue(): number {
    return this.value;
  }

  toDecimal(): number {
    return this.value / 100;
  }

  static fromDecimal(decimal: number): Percentage {
    return new Percentage(decimal * 100);
  }
}

class CompletionDate {
  constructor(
    private readonly month: number,
    private readonly year: number
  ) {
    if (month < 1 || month > 12) {
      throw new ValidationError('Invalid month');
    }
    if (year < new Date().getFullYear()) {
      throw new ValidationError('Completion date cannot be in the past');
    }
  }

  getMonthsUntilCompletion(): number {
    const now = new Date();
    const completion = new Date(this.year, this.month - 1);
    const months =
      (completion.getFullYear() - now.getFullYear()) * 12 +
      (completion.getMonth() - now.getMonth());
    return Math.max(0, months);
  }

  getMonth(): number {
    return this.month;
  }

  getYear(): number {
    return this.year;
  }
}

// Entities
class Installment {
  constructor(
    private readonly id: string,
    private readonly amount: Money,
    private readonly dueDate: Date,
    private readonly description: string
  ) {}

  getId(): string {
    return this.id;
  }

  getAmount(): Money {
    return this.amount;
  }

  getDueDate(): Date {
    return this.dueDate;
  }

  getDescription(): string {
    return this.description;
  }

  isOverdue(): boolean {
    return new Date() > this.dueDate;
  }
}

class PaymentPhase {
  constructor(
    private readonly name: string,
    private readonly installments: Installment[]
  ) {}

  getName(): string {
    return this.name;
  }

  getInstallments(): ReadonlyArray<Installment> {
    return [...this.installments];
  }

  getTotalAmount(): Money {
    return this.installments.reduce(
      (sum, inst) => sum.add(inst.getAmount()),
      new Money(0)
    );
  }

  getInstallmentCount(): number {
    return this.installments.length;
  }
}

// Aggregate Root
class PaymentCalculator {
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

  constructor(params: CalculatorParams) {
    this.id = params.id || generateUUID();
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

    this.validate();
  }

  private validate(): void {
    const totalPaid = this.getTotalPaid();
    if (totalPaid.getAmount() > this.propertyValue.getAmount() * 1.5) {
      throw new ValidationError('Total paid exceeds 150% of property value');
    }
  }

  // Business Logic Methods
  isApproved(): boolean {
    const requiredCaptation = this.getRequiredCaptation();
    const actualCaptation = this.getActualCaptation();
    return actualCaptation.getAmount() >= requiredCaptation.getAmount();
  }

  getApprovalStatus(): ApprovalStatus {
    const required = this.getRequiredCaptation();
    const actual = this.getActualCaptation();
    const difference = actual.subtract(required);

    return {
      approved: this.isApproved(),
      requiredCaptation: required,
      actualCaptation: actual,
      difference: difference,
      percentagePaid: (actual.getAmount() / this.propertyValue.getAmount()) * 100
    };
  }

  getRequiredCaptation(): Money {
    return this.propertyValue.multiply(this.captationPercentage.toDecimal());
  }

  getActualCaptation(): Money {
    return this.entryPayments
      .getTotalAmount()
      .add(this.duringConstructionPayments.getTotalAmount())
      .add(this.habiteSe);
  }

  getTotalPaid(): Money {
    return this.getActualCaptation()
      .add(this.postConstructionPayments.getTotalAmount());
  }

  getRemainingBalance(): Money {
    return this.propertyValue.subtract(this.getTotalPaid());
  }

  getMonthsUntilCompletion(): number {
    return this.completionDate.getMonthsUntilCompletion();
  }

  // Shareable Link Methods
  generateShortCode(): string {
    if (this.shortCode) {
      return this.shortCode;
    }
    this.shortCode = generateShortCode(); // e.g., 'abc123'
    return this.shortCode;
  }

  getShareableUrl(baseUrl: string): string {
    if (!this.shortCode) {
      throw new Error('Short code not generated');
    }
    return `${baseUrl}/c/${this.shortCode}`;
  }

  incrementViewCount(): void {
    this.viewCount++;
  }

  getViewCount(): number {
    return this.viewCount;
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getUserId(): string {
    return this.userId;
  }

  getPropertyValue(): Money {
    return this.propertyValue;
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

  // Serialization for database/API
  toJSON(): CalculatorJSON {
    return {
      id: this.id,
      userId: this.userId,
      propertyValue: this.propertyValue.getAmount(),
      captationPercentage: this.captationPercentage.getValue(),
      completionDate: {
        month: this.completionDate.getMonth(),
        year: this.completionDate.getYear()
      },
      entryPayments: this.serializePhase(this.entryPayments),
      duringConstructionPayments: this.serializePhase(this.duringConstructionPayments),
      habiteSe: this.habiteSe.getAmount(),
      postConstructionPayments: this.serializePhase(this.postConstructionPayments),
      shortCode: this.shortCode,
      viewCount: this.viewCount,
      createdAt: this.createdAt.toISOString()
    };
  }

  private serializePhase(phase: PaymentPhase): any {
    return {
      name: phase.getName(),
      installments: phase.getInstallments().map(inst => ({
        id: inst.getId(),
        amount: inst.getAmount().getAmount(),
        dueDate: inst.getDueDate().toISOString(),
        description: inst.getDescription()
      }))
    };
  }

  static fromJSON(json: CalculatorJSON): PaymentCalculator {
    return new PaymentCalculator({
      id: json.id,
      userId: json.userId,
      propertyValue: new Money(json.propertyValue),
      captationPercentage: new Percentage(json.captationPercentage),
      completionDate: new CompletionDate(
        json.completionDate.month,
        json.completionDate.year
      ),
      entryPayments: this.deserializePhase(json.entryPayments),
      duringConstructionPayments: this.deserializePhase(json.duringConstructionPayments),
      habiteSe: new Money(json.habiteSe),
      postConstructionPayments: this.deserializePhase(json.postConstructionPayments),
      shortCode: json.shortCode,
      viewCount: json.viewCount,
      createdAt: new Date(json.createdAt)
    });
  }

  private static deserializePhase(data: any): PaymentPhase {
    const installments = data.installments.map(
      (inst: any) =>
        new Installment(
          inst.id,
          new Money(inst.amount),
          new Date(inst.dueDate),
          inst.description
        )
    );
    return new PaymentPhase(data.name, installments);
  }
}
```

### 3.2 Repository Pattern

```typescript
/**
 * Repository interface (abstraction)
 */
interface ICalculatorRepository {
  save(calculator: PaymentCalculator): Promise<PaymentCalculator>;
  findById(id: string): Promise<PaymentCalculator | null>;
  findByShortCode(shortCode: string): Promise<PaymentCalculator | null>;
  findByUserId(userId: string, limit?: number): Promise<PaymentCalculator[]>;
  update(calculator: PaymentCalculator): Promise<PaymentCalculator>;
  delete(id: string): Promise<void>;
  incrementViewCount(id: string): Promise<void>;
}

/**
 * Concrete implementation using Supabase
 */
class SupabaseCalculatorRepository implements ICalculatorRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(calculator: PaymentCalculator): Promise<PaymentCalculator> {
    const json = calculator.toJSON();

    const { data, error } = await this.supabase
      .from('calculators')
      .insert({
        id: json.id,
        user_id: json.userId,
        short_code: json.shortCode,
        state: json, // Store entire calculator state as JSONB
        views: json.viewCount,
        created_at: json.createdAt
      })
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to save calculator', error);
    }

    return PaymentCalculator.fromJSON(data.state);
  }

  async findById(id: string): Promise<PaymentCalculator | null> {
    const { data, error } = await this.supabase
      .from('calculators')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new DatabaseError('Failed to find calculator', error);
    }

    return PaymentCalculator.fromJSON(data.state);
  }

  async findByShortCode(shortCode: string): Promise<PaymentCalculator | null> {
    const { data, error } = await this.supabase
      .from('calculators')
      .select('*')
      .eq('short_code', shortCode)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new DatabaseError('Failed to find calculator by short code', error);
    }

    return PaymentCalculator.fromJSON(data.state);
  }

  async findByUserId(
    userId: string,
    limit: number = 50
  ): Promise<PaymentCalculator[]> {
    const { data, error } = await this.supabase
      .from('calculators')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new DatabaseError('Failed to find calculators by user', error);
    }

    return data.map(row => PaymentCalculator.fromJSON(row.state));
  }

  async update(calculator: PaymentCalculator): Promise<PaymentCalculator> {
    const json = calculator.toJSON();

    const { data, error } = await this.supabase
      .from('calculators')
      .update({
        state: json,
        views: json.viewCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', json.id)
      .select()
      .single();

    if (error) {
      throw new DatabaseError('Failed to update calculator', error);
    }

    return PaymentCalculator.fromJSON(data.state);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('calculators')
      .delete()
      .eq('id', id);

    if (error) {
      throw new DatabaseError('Failed to delete calculator', error);
    }
  }

  async incrementViewCount(id: string): Promise<void> {
    const { error } = await this.supabase.rpc('increment_calculator_views', {
      calculator_id: id
    });

    if (error) {
      throw new DatabaseError('Failed to increment view count', error);
    }
  }
}
```

### 3.3 Use Cases (Application Layer)

```typescript
/**
 * Use Case: Create Calculator
 *
 * Single Responsibility: Creating and persisting a new calculator
 */
class CreateCalculatorUseCase {
  constructor(
    private readonly repository: ICalculatorRepository,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(input: CreateCalculatorInput): Promise<CreateCalculatorOutput> {
    // 1. Validate input
    const validatedInput = CreateCalculatorSchema.parse(input);

    // 2. Create domain entity
    const calculator = new PaymentCalculator({
      userId: validatedInput.userId,
      propertyValue: new Money(validatedInput.propertyValue),
      captationPercentage: new Percentage(validatedInput.captationPercentage),
      completionDate: new CompletionDate(
        validatedInput.completionMonth,
        validatedInput.completionYear
      ),
      entryPayments: this.buildEntryPayments(validatedInput.entries),
      duringConstructionPayments: this.buildDuringConstructionPayments(
        validatedInput.duringConstruction
      ),
      habiteSe: new Money(validatedInput.habiteSe),
      postConstructionPayments: this.buildPostConstructionPayments(
        validatedInput.postConstruction
      )
    });

    // 3. Validate business rules
    if (!calculator.isApproved() && validatedInput.requireApproval) {
      throw new BusinessRuleError('Calculator does not meet approval criteria');
    }

    // 4. Persist
    const saved = await this.repository.save(calculator);

    // 5. Publish event
    await this.eventPublisher.publish(new CalculatorCreatedEvent(saved));

    // 6. Return result
    return {
      id: saved.getId(),
      approvalStatus: saved.getApprovalStatus(),
      createdAt: saved.toJSON().createdAt
    };
  }

  private buildEntryPayments(entries: EntryInput[]): PaymentPhase {
    const installments = entries.flatMap((entry, entryIndex) => {
      const installmentAmount = new Money(entry.amount / entry.quantity);

      return Array.from({ length: entry.quantity }, (_, i) => {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);

        return new Installment(
          generateUUID(),
          installmentAmount,
          dueDate,
          `Entry ${entryIndex + 1} - Installment ${i + 1}/${entry.quantity}`
        );
      });
    });

    return new PaymentPhase('Entry Payments', installments);
  }

  // ... similar methods for other payment phases
}

/**
 * Use Case: Generate Shareable Link
 */
class GenerateShareableLinkUseCase {
  constructor(
    private readonly repository: ICalculatorRepository,
    private readonly shortCodeGenerator: IShortCodeGenerator,
    private readonly config: AppConfig
  ) {}

  async execute(
    input: GenerateShareableLinkInput
  ): Promise<GenerateShareableLinkOutput> {
    // 1. Find calculator
    const calculator = await this.repository.findById(input.calculatorId);
    if (!calculator) {
      throw new NotFoundError('Calculator not found');
    }

    // 2. Verify ownership
    if (calculator.getUserId() !== input.userId) {
      throw new UnauthorizedError('You do not own this calculator');
    }

    // 3. Generate short code if not exists
    if (!calculator.toJSON().shortCode) {
      const shortCode = await this.shortCodeGenerator.generate();
      calculator.generateShortCode();
      await this.repository.update(calculator);
    }

    // 4. Return shareable URL
    const url = calculator.getShareableUrl(this.config.appUrl);

    return {
      shortUrl: url,
      shortCode: calculator.toJSON().shortCode!,
      expiresAt: null // Optional: add expiration logic
    };
  }
}

/**
 * Use Case: Load Calculator from Short Code
 */
class LoadCalculatorByShortCodeUseCase {
  constructor(private readonly repository: ICalculatorRepository) {}

  async execute(
    input: LoadCalculatorInput
  ): Promise<LoadCalculatorOutput> {
    // 1. Find by short code
    const calculator = await this.repository.findByShortCode(input.shortCode);
    if (!calculator) {
      throw new NotFoundError('Calculator not found or link expired');
    }

    // 2. Increment view count (async, don't await)
    this.repository.incrementViewCount(calculator.getId()).catch(err => {
      console.error('Failed to increment view count:', err);
    });

    // 3. Return calculator data
    return {
      calculator: calculator.toJSON(),
      approvalStatus: calculator.getApprovalStatus(),
      owner: {
        // Fetch from users table
        name: 'Agent Name',
        logo: 'https://...'
      }
    };
  }
}
```

### 3.4 API Endpoints

```typescript
/**
 * POST /api/calculator
 *
 * Create a new calculator
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Authenticate user
    const user = await authenticate(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Check rate limit
    await checkRateLimit(user.id, 'create_calculator');

    // 3. Check plan limits
    const usage = await getUserUsage(user.id);
    if (usage.calculators >= user.plan.maxCalculators) {
      return res.status(403).json({
        error: 'Calculator limit reached',
        upgrade: '/pricing'
      });
    }

    // 4. Execute use case
    const useCase = new CreateCalculatorUseCase(
      new SupabaseCalculatorRepository(supabase),
      new EventPublisher()
    );

    const result = await useCase.execute({
      ...req.body,
      userId: user.id
    });

    // 5. Return response
    return res.status(201).json({
      success: true,
      data: result
    });

  } catch (error) {
    return handleError(error, res);
  }
}

/**
 * POST /api/calculator/:id/share
 *
 * Generate shareable link
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const user = await authenticate(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;

    const useCase = new GenerateShareableLinkUseCase(
      new SupabaseCalculatorRepository(supabase),
      new ShortCodeGenerator(),
      config
    );

    const result = await useCase.execute({
      calculatorId: id as string,
      userId: user.id
    });

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    return handleError(error, res);
  }
}

/**
 * GET /c/:shortCode
 *
 * Load calculator from short code (public endpoint)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shortCode } = req.query;

    const useCase = new LoadCalculatorByShortCodeUseCase(
      new SupabaseCalculatorRepository(supabase)
    );

    const result = await useCase.execute({
      shortCode: shortCode as string
    });

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    return handleError(error, res);
  }
}
```

---

## 4. UI/UX Requirements

### 4.1 Responsive Design

```
Breakpoint | Width | Layout
---------- | ----- | -------------------------
Mobile     | <640px| Single column, stacked
Tablet     | 640-1024px | Two columns
Desktop    | >1024px | Three columns with sidebar
```

### 4.2 Loading States

```typescript
// Progressive enhancement
1. Show skeleton UI immediately
2. Load critical data (property value, dates)
3. Calculate and render results
4. Enable interactions

// Optimistic updates
- Update UI immediately on input change
- Debounce API calls (500ms)
- Show loading spinner only for >1s operations
```

### 4.3 Error Handling

```typescript
// User-friendly error messages
const ERROR_MESSAGES = {
  VALIDATION_ERROR: 'Please check your inputs and try again',
  NETWORK_ERROR: 'Connection lost. Your data is saved locally.',
  RATE_LIMIT: 'Too many requests. Please wait a moment.',
  PLAN_LIMIT: 'Upgrade your plan to create more calculators',
  UNAUTHORIZED: 'Please log in to continue'
};

// Error recovery
- Auto-save to localStorage every 30s
- Retry failed API calls (3x with exponential backoff)
- Show "Continue where you left off" on reload
```

---

## 5. Security Requirements

### 5.1 Input Validation

```typescript
import { z } from 'zod';

const CreateCalculatorSchema = z.object({
  propertyValue: z.number().positive().max(100000000), // R$ 100M max
  captationPercentage: z.number().min(0).max(100),
  completionMonth: z.number().int().min(1).max(12),
  completionYear: z.number().int().min(2025).max(2050),
  entries: z.array(z.object({
    amount: z.number().positive(),
    quantity: z.number().int().positive().max(120)
  })).min(1).max(10),
  duringConstruction: z.object({
    monthly: z.object({
      amount: z.number().nonnegative(),
      quantity: z.number().int().nonnegative()
    }),
    semiannual: z.object({
      amount: z.number().nonnegative(),
      quantity: z.number().int().nonnegative()
    }),
    annual: z.object({
      amount: z.number().nonnegative(),
      quantity: z.number().int().nonnegative()
    })
  }),
  habiteSe: z.number().nonnegative(),
  postConstruction: z.object({
    monthly: z.object({
      amount: z.number().nonnegative(),
      quantity: z.number().int().nonnegative().max(480) // 40 years max
    }),
    semiannual: z.object({
      amount: z.number().nonnegative(),
      quantity: z.number().int().nonnegative()
    }),
    annual: z.object({
      amount: z.number().nonnegative(),
      quantity: z.number().int().nonnegative()
    })
  })
});
```

### 5.2 Rate Limiting

```typescript
// Per-user limits
const RATE_LIMITS = {
  create_calculator: { requests: 10, window: 3600 }, // 10/hour
  share_calculator: { requests: 50, window: 3600 }, // 50/hour
  load_calculator: { requests: 1000, window: 3600 } // 1000/hour (public)
};

// Per-IP limits (for anonymous users)
const IP_RATE_LIMITS = {
  load_calculator: { requests: 100, window: 3600 } // 100/hour per IP
};
```

---

## 6. Performance Requirements

### 6.1 Metrics

```
Operation                | Target   | Measurement
------------------------ | -------- | -----------
Page Load Time           | < 1.5s   | Lighthouse
Calculator Render        | < 300ms  | Custom metric
API Response (create)    | < 200ms  | p95
API Response (load)      | < 100ms  | p95 (cached)
Calculation Speed        | < 50ms   | JavaScript profiler
```

### 6.2 Optimization Strategies

```typescript
// 1. Memoization for expensive calculations
const memoizedCalculate = useMemo(() => {
  return calculator.getApprovalStatus();
}, [calculator.toJSON()]);

// 2. Web Workers for heavy computations
const worker = new Worker('/calculator-worker.js');
worker.postMessage({ type: 'CALCULATE', data: inputData });

// 3. Virtualization for long lists
<VirtualList
  items={installments}
  itemHeight={60}
  renderItem={(item) => <InstallmentRow {...item} />}
/>

// 4. Code splitting
const Calculator = lazy(() => import('./Calculator'));
```

---

## 7. Testing Requirements

### 7.1 Unit Tests

```typescript
describe('PaymentCalculator', () => {
  describe('isApproved', () => {
    it('should return true when actual captation meets required', () => {
      const calculator = new PaymentCalculator({
        propertyValue: new Money(1000000),
        captationPercentage: new Percentage(30),
        // ... actual captation = 300,000
      });

      expect(calculator.isApproved()).toBe(true);
    });

    it('should return false when actual captation is below required', () => {
      const calculator = new PaymentCalculator({
        propertyValue: new Money(1000000),
        captationPercentage: new Percentage(30),
        // ... actual captation = 200,000
      });

      expect(calculator.isApproved()).toBe(false);
    });
  });

  describe('getTotalPaid', () => {
    it('should sum all payment phases correctly', () => {
      // Test implementation
    });
  });

  describe('generateShortCode', () => {
    it('should generate a unique 6-character code', () => {
      // Test implementation
    });

    it('should reuse existing short code', () => {
      // Test implementation
    });
  });
});
```

### 7.2 Integration Tests

```typescript
describe('Calculator API', () => {
  describe('POST /api/calculator', () => {
    it('should create calculator for authenticated user', async () => {
      const response = await request(app)
        .post('/api/calculator')
        .set('Authorization', `Bearer ${token}`)
        .send(validCalculatorData);

      expect(response.status).toBe(201);
      expect(response.body.data.id).toBeDefined();
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/calculator')
        .send(validCalculatorData);

      expect(response.status).toBe(401);
    });

    it('should enforce plan limits', async () => {
      // Create calculators up to limit
      // Attempt to create one more
      // Expect 403 Forbidden
    });
  });
});
```

### 7.3 E2E Tests

```typescript
describe('Calculator User Flow', () => {
  test('agent creates and shares calculator with client', async ({ page }) => {
    // 1. Login as agent
    await page.goto('/login');
    await page.fill('[name=email]', 'agent@example.com');
    await page.fill('[name=password]', 'password');
    await page.click('button[type=submit]');

    // 2. Navigate to calculator
    await page.goto('/calculadora');

    // 3. Fill in property details
    await page.fill('[id=valor-total]', '1000000');
    await page.fill('[id=mes-obra]', '12');
    await page.fill('[id=ano-obra]', '2026');
    await page.fill('[id=percentual-captacao]', '30');

    // 4. Add entry payment
    await page.fill('[id=entrada-valor]', '100000');
    await page.fill('[id=entrada-qtd]', '1');

    // 5. Verify approval status
    await expect(page.locator('#status-texto')).toContainText('APROVADO');

    // 6. Generate shareable link
    await page.click('button:has-text("Compartilhar")');
    const shortUrl = await page.locator('[id=short-url]').innerText();

    // 7. Open link in new context (as client)
    const clientContext = await browser.newContext();
    const clientPage = await clientContext.newPage();
    await clientPage.goto(shortUrl);

    // 8. Verify calculator loads with agent's data
    await expect(clientPage.locator('#valor-total')).toHaveValue('1000000');
    await expect(clientPage.locator('#status-texto')).toContainText('APROVADO');

    // 9. Verify agent branding appears
    await expect(clientPage.locator('[data-agent-logo]')).toBeVisible();
  });
});
```

---

## 8. Acceptance Criteria

### 8.1 Definition of Done

- [ ] Unit tests pass (≥80% coverage)
- [ ] Integration tests pass
- [ ] E2E tests pass for critical flows
- [ ] Performance metrics met
- [ ] Security review completed
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Code review approved
- [ ] Documentation updated
- [ ] QA sign-off received
- [ ] Product owner approval

### 8.2 Release Checklist

- [ ] Feature flag enabled for beta users
- [ ] Monitoring dashboards configured
- [ ] Error tracking set up (Sentry)
- [ ] Analytics events implemented
- [ ] A/B test configured (if applicable)
- [ ] Rollback plan documented
- [ ] Customer support trained
- [ ] Marketing materials ready

---

## 9. Open Questions

1. **Expiration**: Should shareable links expire? If so, after how long?
2. **Editing**: Can agents edit calculators after sharing? How to handle versioning?
3. **Branding**: What customization options for agent branding (colors, logo placement)?
4. **Export**: Should agents be able to export calculators to PDF?
5. **Templates**: Should we provide calculator templates for common scenarios?

---

## 10. Future Enhancements (Out of Scope)

- Calculator templates library
- PDF export with agent branding
- Email integration (send calculator to client)
- WhatsApp sharing integration
- Calculator versioning and history
- Collaborative editing (multiple agents)
- Advanced financing calculations (PRICE vs SAC)
- Integration with banks' financing tables

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-01-04 | Product Team | Initial PRD with proposed TypeScript/OOP architecture |
| 2.0.0 | 2025-11-05 | Development Team | **MAJOR UPDATE**: Added Section 2 documenting current HTML/JavaScript implementation. Updated to reflect actual state of two working calculators (CalculadoraFluxoPriceAjustada.html and Simulador de Financiamento.html). Clarified implementation status (core calculators ✅, shareable links ❌, backend integration ❌). Renamed original Section 2 to Section 3 "Proposed Technical Architecture" to distinguish current vs. future state. Added comparison table showing gaps between current and proposed architecture. |

**Next Review**: 2025-12-05

**Key Changes in v2.0.0**:
- ✅ Documented two existing calculator implementations
- ✅ Added technical stack details (Vanilla JS, no backend)
- ✅ Listed implementation gaps and priorities
- ✅ Clarified that shareable links are not yet implemented
- ✅ Maintained proposed architecture for future reference
- ✅ Updated document control section with implementation status
