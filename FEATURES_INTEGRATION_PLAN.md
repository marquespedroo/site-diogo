# 🏗️ **Features Integration Plan - Ultrathink Analysis**

## **Executive Summary**

This document outlines the enterprise-level integration of two distinct financial calculators into the ImobiTools platform:

1. **Calculadora de Fluxo de Pagamento** (Cash Flow Calculator) - Complex multi-stage payment planning
2. **Simulador de Financiamento** (Financing Simulator) - Focused loan capacity and payment calculator

**Status**: Ready for implementation
**Complexity**: High (8.5/10)
**Architecture Compliance**: Full DDD, Clean Architecture, SOLID
**Estimated Effort**: 16-20 hours

---

## **📊 Features Analysis**

### **Feature 1: Calculadora de Fluxo de Pagamento**

**Purpose**: Comprehensive cash flow planning for property purchases with complex payment structures

**Core Functionality**:
- **Dados Iniciais** (Initial Data):
  - Property total value
  - Capture percentage requirement
  - Construction completion date (month/year)

- **Entrada** (Entry Payments):
  - Multiple entry installments support
  - Variable quantities per installment
  - Real-time percentage calculation

- **Durante a Obra** (During Construction):
  - **Recurring**: Monthly, Semi-annual, Annual payments
  - **One-time**: Custom payments during construction period
  - Auto-calculation of maximum installments based on construction duration

- **Habite-se** (Delivery Payment):
  - Single payment at property delivery

- **Pós-Obra** (Post-Construction):
  - Monthly, Semi-annual, Annual recurring payments
  - No time limit restrictions

- **Análise de Fluxo** (Flow Analysis):
  - Approval status (Capture requirement met/not met)
  - Detailed financial summary
  - Remaining balance calculation
  - Percentage breakdowns for all payment stages

- **Simulação de Financiamento** (Embedded Financing):
  - Two modes:
    1. Finance total remaining balance (PRICE/SAC)
    2. Finance post-construction payments with interest adjustment
  - Age and term restrictions
  - Complete amortization tables

**Technical Characteristics**:
- 2494 lines of logic-heavy JavaScript
- Complex state management (12+ state properties)
- Real-time calculations with dependencies
- Modal interactions
- Dynamic form generation

**Use Cases**:
- Real estate developers planning payment structures
- Buyers analyzing cash flow for under-construction properties
- Brokers demonstrating payment flexibility to clients

---

### **Feature 2: Simulador de Financiamento**

**Purpose**: Quick, focused financing calculator for capacity analysis and loan simulation

**Core Functionality**:

**Mode 1: Calcular Capacidade** (Calculate Capacity):
- **Input**: Monthly income, term, interest rate
- **Output**: Maximum financing amount, recommended monthly payment (30% of income), required down payment (20%), property value
- **Logic**: Reverse PRICE calculation from affordable payment

**Mode 2: Simular Financiamento** (Simulate Financing):
- **Financing Types**:
  - Residential 🏠: Max 35 years, default 10% rate
  - Commercial 🏢: Max 25 years, default 11% rate
  - Rural 🌾: Max 30 years, default 9% rate

- **Inputs**:
  - Client age (restrictions apply)
  - Property value
  - Down payment (with % display)
  - Term (slider)
  - Interest rate (slider, range varies by type)
  - Amortization: PRICE (fixed) vs SAC (decreasing)

- **Validations**:
  - Age 18-79
  - Final age ≤ 80.5 years (age + term)
  - Term ≤ financing type maximum

- **Output**:
  - Monthly payment
  - Total paid
  - Total interest
  - Recommended minimum income (payment = 30% of income)
  - Amortization method indicator
  - Financing type badge

**Technical Characteristics**:
- 878 lines of clean JavaScript
- Step-by-step wizard flow (mode selection → form → results)
- Financial formulas (PRICE & SAC)
- Age-based dynamic restrictions
- Type-specific configurations

**Use Cases**:
- Clients checking financing eligibility before property search
- Quick loan payment estimates
- Comparing PRICE vs SAC amortization methods
- Brokers qualifying leads

---

## **🎯 Why These Are Distinct Features**

| Aspect | Calculadora de Fluxo | Simulador de Financiamento |
|--------|----------------------|---------------------------|
| **Complexity** | High (multi-stage, 12+ inputs) | Low (3-5 inputs) |
| **Use Case** | Payment planning for specific property | General financing capacity/estimate |
| **Target User** | Developers, buyers of under-construction | Anyone exploring financing options |
| **Time Horizon** | Pre-construction → Post-construction (years) | Immediate (loan analysis) |
| **State Persistence** | Essential (save/load/share) | Nice-to-have (quick calculator) |
| **Payment Stages** | 5 stages with sub-divisions | 1 stage (loan payments) |
| **Integration** | Complex (embedded financing sim) | Simple (standalone calculator) |

**Conclusion**: These features serve different purposes at different stages of the real estate journey and must remain separate for optimal UX.

---

## **🏗️ System Architecture Integration**

### **Database Schema Design**

Following existing patterns from `001_initial_schema.sql` and `003_projects_schema.sql`:

```sql
-- ============================================================================
-- CASH FLOW CALCULATORS TABLE (Feature 1)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cash_flow_calculators (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Owner
  user_id UUID NOT NULL,

  -- Calculator Data
  name VARCHAR(200) NOT NULL,
  state JSONB NOT NULL,

  -- Sharing
  short_code VARCHAR(6) UNIQUE,
  views INTEGER DEFAULT 0,
  shared_with UUID[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT cash_flow_name_length CHECK (char_length(name) > 0),
  CONSTRAINT cash_flow_short_code_format CHECK (short_code ~ '^[a-z0-9]+$'),
  CONSTRAINT cash_flow_state_required CHECK (
    state ? 'valorTotal' AND
    state ? 'percentualCaptacao' AND
    state ? 'entradas'
  )
);

-- Indexes
CREATE INDEX idx_cash_flow_user_id ON cash_flow_calculators(user_id);
CREATE INDEX idx_cash_flow_short_code ON cash_flow_calculators(short_code) WHERE short_code IS NOT NULL;
CREATE INDEX idx_cash_flow_created_at ON cash_flow_calculators(created_at DESC);
CREATE INDEX idx_cash_flow_updated_at ON cash_flow_calculators(updated_at DESC);
CREATE INDEX idx_cash_flow_shared_with ON cash_flow_calculators USING GIN(shared_with);
CREATE INDEX idx_cash_flow_name_search ON cash_flow_calculators USING GIN(to_tsvector('portuguese', name));

-- ============================================================================
-- FINANCING SIMULATIONS TABLE (Feature 2)
-- ============================================================================

CREATE TABLE IF NOT EXISTS financing_simulations (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Owner
  user_id UUID NOT NULL,

  -- Simulation Data
  name VARCHAR(200) NOT NULL,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('capacidade', 'simulacao')),
  financing_type VARCHAR(20) CHECK (financing_type IN ('residencial', 'comercial', 'rural')),
  input_data JSONB NOT NULL,
  result_data JSONB NOT NULL,

  -- Sharing
  short_code VARCHAR(6) UNIQUE,
  views INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT financing_name_length CHECK (char_length(name) > 0),
  CONSTRAINT financing_short_code_format CHECK (short_code ~ '^[a-z0-9]+$')
);

-- Indexes
CREATE INDEX idx_financing_user_id ON financing_simulations(user_id);
CREATE INDEX idx_financing_mode ON financing_simulations(mode);
CREATE INDEX idx_financing_type ON financing_simulations(financing_type);
CREATE INDEX idx_financing_short_code ON financing_simulations(short_code) WHERE short_code IS NOT NULL;
CREATE INDEX idx_financing_created_at ON financing_simulations(created_at DESC);
CREATE INDEX idx_financing_name_search ON financing_simulations USING GIN(to_tsvector('portuguese', name));

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE cash_flow_calculators ENABLE ROW LEVEL SECURITY;
ALTER TABLE financing_simulations ENABLE ROW LEVEL SECURITY;

-- Cash Flow Calculators Policies
CREATE POLICY "Users can view own or shared cash flow calculators"
  ON cash_flow_calculators FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() = ANY(shared_with) OR
    short_code IS NOT NULL
  );

CREATE POLICY "Users can insert own cash flow calculators"
  ON cash_flow_calculators FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cash flow calculators"
  ON cash_flow_calculators FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cash flow calculators"
  ON cash_flow_calculators FOR DELETE
  USING (auth.uid() = user_id);

-- Financing Simulations Policies
CREATE POLICY "Users can view own financing simulations"
  ON financing_simulations FOR SELECT
  USING (auth.uid() = user_id OR short_code IS NOT NULL);

CREATE POLICY "Users can insert own financing simulations"
  ON financing_simulations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own financing simulations"
  ON financing_simulations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own financing simulations"
  ON financing_simulations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update timestamps
CREATE TRIGGER update_cash_flow_updated_at
  BEFORE UPDATE ON cash_flow_calculators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financing_updated_at
  BEFORE UPDATE ON financing_simulations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Increment view count for cash flow calculators
CREATE OR REPLACE FUNCTION increment_cash_flow_views(calculator_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE cash_flow_calculators
  SET views = views + 1
  WHERE id = calculator_id;
END;
$$ LANGUAGE plpgsql;

-- Increment view count for financing simulations
CREATE OR REPLACE FUNCTION increment_financing_views(simulation_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE financing_simulations
  SET views = views + 1
  WHERE id = simulation_id;
END;
$$ LANGUAGE plpgsql;

-- Generate unique short code
CREATE OR REPLACE FUNCTION generate_short_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result VARCHAR(6) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

**Schema Design Rationale**:
1. ✅ **UUID Primary Keys**: Following existing pattern
2. ✅ **JSONB for Flexible Data**: `state`, `input_data`, `result_data` allow schema evolution
3. ✅ **Shareable Links**: `short_code` with same 6-char constraint as existing calculators
4. ✅ **RLS Policies**: Multi-tenant security with owner + shared access
5. ✅ **Auto-updating Timestamps**: Reusing existing `update_updated_at_column()` function
6. ✅ **Full-text Search**: Portuguese stemming for name searches
7. ✅ **Performance Indexes**: Strategic indexes for common queries

---

### **Domain Layer Design (DDD)**

Following the existing `src/domain/` patterns:

```typescript
// ============================================================================
// CASH FLOW CALCULATOR DOMAIN
// ============================================================================

// src/domain/cash-flow/entities/CashFlowCalculator.ts
import { Entity } from '@/domain/shared/Entity';
import { UUID } from '@/domain/shared/UUID';
import { Money } from '@/domain/calculator/entities/Money';

interface EntryPayment {
  id: number;
  valor: number;
  qtd: number;
}

interface RecurringPayment {
  valor: number;
  qtd: number;
}

interface PaymentPeriod {
  mensais: RecurringPayment;
  semestrais: RecurringPayment;
  anuais: RecurringPayment;
}

interface CashFlowState {
  valorTotal: number;
  entradas: EntryPayment[];
  parcelasUnicasObra: EntryPayment[];
  parcelasDuranteObra: PaymentPeriod;
  parcelaHabiteSe: number;
  parcelasPosObra: PaymentPeriod;
  percentualCaptacao: number;
  mesObra: number | null;
  anoObra: number | null;
}

export class CashFlowCalculator extends Entity {
  private constructor(
    id: UUID,
    private userId: UUID,
    private name: string,
    private state: CashFlowState,
    private shortCode?: string,
    private views: number = 0,
    private sharedWith: UUID[] = [],
    private createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
    private expiresAt?: Date
  ) {
    super(id);
    this.validate();
  }

  // Factory Methods
  static create(userId: UUID, name: string, state: CashFlowState): CashFlowCalculator {
    return new CashFlowCalculator(UUID.generate(), userId, name, state);
  }

  static restore(
    id: UUID,
    userId: UUID,
    name: string,
    state: CashFlowState,
    shortCode?: string,
    views?: number,
    sharedWith?: UUID[],
    createdAt?: Date,
    updatedAt?: Date,
    expiresAt?: Date
  ): CashFlowCalculator {
    return new CashFlowCalculator(
      id, userId, name, state, shortCode, views, sharedWith, createdAt, updatedAt, expiresAt
    );
  }

  // Business Logic Methods
  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new ValidationError('Calculator name cannot be empty');
    }
    if (this.state.valorTotal <= 0) {
      throw new ValidationError('Total value must be greater than zero');
    }
    if (this.state.percentualCaptacao < 0 || this.state.percentualCaptacao > 100) {
      throw new ValidationError('Capture percentage must be between 0 and 100');
    }
  }

  calculateTotalEntries(): Money {
    return new Money(
      this.state.entradas.reduce((acc, e) => acc + (e.valor * e.qtd), 0)
    );
  }

  calculateTotalDuringConstruction(): Money {
    const { mensais, semestrais, anuais } = this.state.parcelasDuranteObra;
    const recurring = mensais.valor * mensais.qtd +
                     semestrais.valor * semestrais.qtd +
                     anuais.valor * anuais.qtd;
    const oneTime = this.state.parcelasUnicasObra.reduce((acc, p) => acc + (p.valor * p.qtd), 0);
    return new Money(recurring + oneTime);
  }

  calculateTotalPostConstruction(): Money {
    const { mensais, semestrais, anuais } = this.state.parcelasPosObra;
    return new Money(
      mensais.valor * mensais.qtd +
      semestrais.valor * semestrais.qtd +
      anuais.valor * anuais.qtd
    );
  }

  calculateCaptureValue(): Money {
    return new Money((this.state.valorTotal * this.state.percentualCaptacao) / 100);
  }

  calculateTotalPaid(): Money {
    return Money.add(
      this.calculateTotalEntries(),
      this.calculateTotalDuringConstruction(),
      new Money(this.state.parcelaHabiteSe),
      this.calculateTotalPostConstruction()
    );
  }

  calculateRemainingBalance(): Money {
    return Money.subtract(
      new Money(this.state.valorTotal),
      this.calculateTotalPaid()
    );
  }

  isApproved(): boolean {
    const captureValue = this.calculateCaptureValue().getValue();
    const paidUntilDelivery = Money.add(
      this.calculateTotalEntries(),
      this.calculateTotalDuringConstruction(),
      new Money(this.state.parcelaHabiteSe)
    ).getValue();
    return paidUntilDelivery >= captureValue;
  }

  updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new ValidationError('Calculator name cannot be empty');
    }
    this.name = newName;
    this.updatedAt = new Date();
  }

  updateState(newState: CashFlowState): void {
    this.state = newState;
    this.updatedAt = new Date();
    this.validate();
  }

  generateShareLink(): void {
    if (!this.shortCode) {
      this.shortCode = this.generateShortCode();
    }
  }

  private generateShortCode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  share(userIds: UUID[]): void {
    this.sharedWith = [...new Set([...this.sharedWith, ...userIds])];
    this.updatedAt = new Date();
  }

  unshare(userId: UUID): void {
    this.sharedWith = this.sharedWith.filter(id => !id.equals(userId));
    this.updatedAt = new Date();
  }

  incrementViews(): void {
    this.views++;
  }

  // Getters
  getUserId(): UUID { return this.userId; }
  getName(): string { return this.name; }
  getState(): CashFlowState { return { ...this.state }; }
  getShortCode(): string | undefined { return this.shortCode; }
  getViews(): number { return this.views; }
  getSharedWith(): UUID[] { return [...this.sharedWith]; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
  getExpiresAt(): Date | undefined { return this.expiresAt; }
}

// ============================================================================
// FINANCING SIMULATION DOMAIN
// ============================================================================

// src/domain/financing/entities/FinancingSimulation.ts
import { Entity } from '@/domain/shared/Entity';
import { UUID } from '@/domain/shared/UUID';
import { Money } from '@/domain/calculator/entities/Money';

type SimulationMode = 'capacidade' | 'simulacao';
type FinancingType = 'residencial' | 'comercial' | 'rural';
type AmortizationType = 'price' | 'sac';

interface CapacidadeInputData {
  renda: number;
  prazo: number;
  taxa: number;
}

interface SimulacaoInputData {
  idade: number;
  valorImovel: number;
  valorEntrada: number;
  prazo: number;
  taxa: number;
  tipoFinanciamento: FinancingType;
  modalidade: AmortizationType;
}

interface ResultData {
  parcela: number;
  totalPago: number;
  totalJuros: number;
  valorFinanciado: number;
  rendaMinima?: number;
  valorMaximoImovel?: number;
  entradaNecessaria?: number;
  primeiraParcela?: number;
  ultimaParcela?: number;
}

export class FinancingSimulation extends Entity {
  private constructor(
    id: UUID,
    private userId: UUID,
    private name: string,
    private mode: SimulationMode,
    private financingType: FinancingType | null,
    private inputData: CapacidadeInputData | SimulacaoInputData,
    private resultData: ResultData,
    private shortCode?: string,
    private views: number = 0,
    private createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {
    super(id);
    this.validate();
  }

  // Factory Methods
  static createCapacidade(
    userId: UUID,
    name: string,
    input: CapacidadeInputData
  ): FinancingSimulation {
    const result = FinancingSimulation.calculateCapacidade(input);
    return new FinancingSimulation(
      UUID.generate(), userId, name, 'capacidade', null, input, result
    );
  }

  static createSimulacao(
    userId: UUID,
    name: string,
    input: SimulacaoInputData
  ): FinancingSimulation {
    const result = FinancingSimulation.calculateSimulacao(input);
    return new FinancingSimulation(
      UUID.generate(), userId, name, 'simulacao', input.tipoFinanciamento, input, result
    );
  }

  static restore(
    id: UUID,
    userId: UUID,
    name: string,
    mode: SimulationMode,
    financingType: FinancingType | null,
    inputData: CapacidadeInputData | SimulacaoInputData,
    resultData: ResultData,
    shortCode?: string,
    views?: number,
    createdAt?: Date,
    updatedAt?: Date
  ): FinancingSimulation {
    return new FinancingSimulation(
      id, userId, name, mode, financingType, inputData, resultData,
      shortCode, views, createdAt, updatedAt
    );
  }

  // Business Logic - Capacidade Calculation
  private static calculateCapacidade(input: CapacidadeInputData): ResultData {
    const parcelaMax = input.renda * 0.30;
    const meses = input.prazo * 12;
    const taxaMensal = input.taxa / 12 / 100;

    const valorFinanciado = parcelaMax * (
      (Math.pow(1 + taxaMensal, meses) - 1) /
      (taxaMensal * Math.pow(1 + taxaMensal, meses))
    );

    const valorMaximoImovel = valorFinanciado / 0.8;
    const entradaNecessaria = valorMaximoImovel * 0.2;
    const totalPago = parcelaMax * meses + entradaNecessaria;
    const totalJuros = totalPago - valorMaximoImovel;

    return {
      parcela: parcelaMax,
      totalPago,
      totalJuros,
      valorFinanciado,
      valorMaximoImovel,
      entradaNecessaria
    };
  }

  // Business Logic - Simulacao Calculation
  private static calculateSimulacao(input: SimulacaoInputData): ResultData {
    const valorFinanciado = input.valorImovel - input.valorEntrada;
    const meses = input.prazo * 12;
    const taxaMensal = input.taxa / 12 / 100;

    if (input.modalidade === 'price') {
      // PRICE - Fixed payments
      const parcela = valorFinanciado * (
        (taxaMensal * Math.pow(1 + taxaMensal, meses)) /
        (Math.pow(1 + taxaMensal, meses) - 1)
      );

      const totalPago = parcela * meses + input.valorEntrada;
      const totalJuros = totalPago - input.valorImovel;
      const rendaMinima = parcela / 0.30;

      return {
        parcela,
        totalPago,
        totalJuros,
        valorFinanciado,
        rendaMinima,
        primeiraParcela: parcela,
        ultimaParcela: parcela
      };
    } else {
      // SAC - Decreasing payments
      const amortizacaoFixa = valorFinanciado / meses;
      let saldoDevedor = valorFinanciado;
      let totalJuros = 0;
      let primeiraParcela = 0;
      let ultimaParcela = 0;

      for (let i = 1; i <= meses; i++) {
        const juros = saldoDevedor * taxaMensal;
        const parcela = amortizacaoFixa + juros;
        saldoDevedor -= amortizacaoFixa;
        totalJuros += juros;

        if (i === 1) primeiraParcela = parcela;
        if (i === meses) ultimaParcela = parcela;
      }

      const totalPago = valorFinanciado + totalJuros + input.valorEntrada;
      const rendaMinima = primeiraParcela / 0.30;

      return {
        parcela: primeiraParcela,
        totalPago,
        totalJuros,
        valorFinanciado,
        rendaMinima,
        primeiraParcela,
        ultimaParcela
      };
    }
  }

  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new ValidationError('Simulation name cannot be empty');
    }

    if (this.mode === 'capacidade') {
      const input = this.inputData as CapacidadeInputData;
      if (input.renda <= 0) {
        throw new ValidationError('Income must be greater than zero');
      }
      if (input.prazo <= 0 || input.prazo > 35) {
        throw new ValidationError('Term must be between 1 and 35 years');
      }
      if (input.taxa <= 0 || input.taxa > 50) {
        throw new ValidationError('Interest rate must be between 0 and 50%');
      }
    } else {
      const input = this.inputData as SimulacaoInputData;
      if (input.idade < 18 || input.idade >= 80) {
        throw new ValidationError('Age must be between 18 and 79');
      }
      if (input.valorImovel <= 0) {
        throw new ValidationError('Property value must be greater than zero');
      }
      if (input.valorEntrada >= input.valorImovel) {
        throw new ValidationError('Down payment must be less than property value');
      }

      // Age + term validation
      const idadeFinal = input.idade + input.prazo;
      if (idadeFinal > 80.5) {
        throw new ValidationError(
          `Final age (${idadeFinal}) exceeds maximum of 80.5 years`
        );
      }

      // Term limits by financing type
      const maxTerms = { residencial: 35, comercial: 25, rural: 30 };
      const maxTerm = maxTerms[input.tipoFinanciamento];
      if (input.prazo > maxTerm) {
        throw new ValidationError(
          `Maximum term for ${input.tipoFinanciamento} is ${maxTerm} years`
        );
      }
    }
  }

  // Methods
  generateShareLink(): void {
    if (!this.shortCode) {
      this.shortCode = this.generateShortCode();
    }
  }

  private generateShortCode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  incrementViews(): void {
    this.views++;
  }

  // Getters
  getUserId(): UUID { return this.userId; }
  getName(): string { return this.name; }
  getMode(): SimulationMode { return this.mode; }
  getFinancingType(): FinancingType | null { return this.financingType; }
  getInputData(): CapacidadeInputData | SimulacaoInputData { return { ...this.inputData }; }
  getResultData(): ResultData { return { ...this.resultData }; }
  getShortCode(): string | undefined { return this.shortCode; }
  getViews(): number { return this.views; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
}
```

**Domain Design Rationale**:
1. ✅ **Entities extend base Entity class**: Following existing pattern
2. ✅ **Immutable by default**: Private fields with getters only
3. ✅ **Factory methods**: `create()` for new, `restore()` for persistence layer
4. ✅ **Business logic in domain**: All calculations and validations in entities
5. ✅ **Value Objects**: Reusing `Money` and `UUID` from existing domain
6. ✅ **Validation in domain**: Business rules enforced at entity level
7. ✅ **Type-safe**: Full TypeScript types for all data structures

---

### **API Layer Design**

Following the pattern from `calculator-api.ts`, `projects-api.ts`:

```typescript
// ============================================================================
// CASH FLOW CALCULATOR API CLIENT
// ============================================================================

// src/scripts/cash-flow-api.ts
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

// Zod Schemas
const EntryPaymentSchema = z.object({
  id: z.number(),
  valor: z.number().nonnegative(),
  qtd: z.number().int().positive()
});

const RecurringPaymentSchema = z.object({
  valor: z.number().nonnegative(),
  qtd: z.number().int().nonnegative()
});

const PaymentPeriodSchema = z.object({
  mensais: RecurringPaymentSchema,
  semestrais: RecurringPaymentSchema,
  anuais: RecurringPaymentSchema
});

const CashFlowStateSchema = z.object({
  valorTotal: z.number().positive(),
  entradas: z.array(EntryPaymentSchema),
  parcelasUnicasObra: z.array(EntryPaymentSchema),
  parcelasDuranteObra: PaymentPeriodSchema,
  parcelaHabiteSe: z.number().nonnegative(),
  parcelasPosObra: PaymentPeriodSchema,
  percentualCaptacao: z.number().min(0).max(100),
  mesObra: z.number().nullable(),
  anoObra: z.number().nullable()
});

const CreateCashFlowRequestSchema = z.object({
  name: z.string().min(1).max(200),
  state: CashFlowStateSchema
});

const UpdateCashFlowRequestSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  state: CashFlowStateSchema.optional()
});

const ShareCashFlowRequestSchema = z.object({
  id: z.string().uuid(),
  userIds: z.array(z.string().uuid())
});

// API Error Class
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// API Client
export const cashFlowAPI = {
  // Create new cash flow calculator
  async create(data: z.infer<typeof CreateCashFlowRequestSchema>) {
    const validated = CreateCashFlowRequestSchema.parse(data);

    const { data: result, error } = await supabase
      .from('cash_flow_calculators')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        name: validated.name,
        state: validated.state
      })
      .select()
      .single();

    if (error) {
      throw new APIError(error.message, 500, error.code);
    }

    return result;
  },

  // Get calculator by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('cash_flow_calculators')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new APIError('Calculator not found', 404);
      }
      throw new APIError(error.message, 500, error.code);
    }

    return data;
  },

  // Get calculator by short code
  async getByShortCode(shortCode: string) {
    const { data, error } = await supabase
      .from('cash_flow_calculators')
      .select('*')
      .eq('short_code', shortCode)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new APIError('Calculator not found', 404);
      }
      throw new APIError(error.message, 500, error.code);
    }

    // Increment views
    await supabase.rpc('increment_cash_flow_views', { calculator_id: data.id });

    return data;
  },

  // List user's calculators
  async list(options?: { limit?: number; offset?: number }) {
    const query = supabase
      .from('cash_flow_calculators')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new APIError(error.message, 500, error.code);
    }

    return { data: data || [], count: count || 0 };
  },

  // Update calculator
  async update(data: z.infer<typeof UpdateCashFlowRequestSchema>) {
    const validated = UpdateCashFlowRequestSchema.parse(data);

    const updateData: any = {};
    if (validated.name) updateData.name = validated.name;
    if (validated.state) updateData.state = validated.state;

    const { data: result, error } = await supabase
      .from('cash_flow_calculators')
      .update(updateData)
      .eq('id', validated.id)
      .select()
      .single();

    if (error) {
      throw new APIError(error.message, 500, error.code);
    }

    return result;
  },

  // Delete calculator
  async delete(id: string) {
    const { error } = await supabase
      .from('cash_flow_calculators')
      .delete()
      .eq('id', id);

    if (error) {
      throw new APIError(error.message, 500, error.code);
    }

    return { success: true };
  },

  // Generate share link
  async generateShareLink(id: string) {
    // Generate short code using database function
    const { data: codeData, error: codeError } = await supabase
      .rpc('generate_short_code');

    if (codeError) {
      throw new APIError('Failed to generate share code', 500);
    }

    const { data, error } = await supabase
      .from('cash_flow_calculators')
      .update({ short_code: codeData })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new APIError(error.message, 500, error.code);
    }

    return {
      shortCode: data.short_code,
      shareUrl: `${window.location.origin}/cash-flow/${data.short_code}`
    };
  },

  // Share with users
  async share(data: z.infer<typeof ShareCashFlowRequestSchema>) {
    const validated = ShareCashFlowRequestSchema.parse(data);

    const { data: current } = await this.getById(validated.id);
    const updatedSharedWith = [...new Set([
      ...(current.shared_with || []),
      ...validated.userIds
    ])];

    const { data: result, error } = await supabase
      .from('cash_flow_calculators')
      .update({ shared_with: updatedSharedWith })
      .eq('id', validated.id)
      .select()
      .single();

    if (error) {
      throw new APIError(error.message, 500, error.code);
    }

    return result;
  },

  // Unshare with user
  async unshare(id: string, userId: string) {
    const { data: current } = await this.getById(id);
    const updatedSharedWith = (current.shared_with || []).filter(
      (uid: string) => uid !== userId
    );

    const { data: result, error } = await supabase
      .from('cash_flow_calculators')
      .update({ shared_with: updatedSharedWith })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new APIError(error.message, 500, error.code);
    }

    return result;
  }
};

// ============================================================================
// FINANCING SIMULATION API CLIENT
// ============================================================================

// src/scripts/financing-api.ts
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

// Zod Schemas
const CapacidadeInputSchema = z.object({
  renda: z.number().positive(),
  prazo: z.number().int().min(1).max(35),
  taxa: z.number().positive().max(50)
});

const SimulacaoInputSchema = z.object({
  idade: z.number().int().min(18).max(79),
  valorImovel: z.number().positive(),
  valorEntrada: z.number().nonnegative(),
  prazo: z.number().int().positive(),
  taxa: z.number().positive(),
  tipoFinanciamento: z.enum(['residencial', 'comercial', 'rural']),
  modalidade: z.enum(['price', 'sac'])
});

const CreateFinancingRequestSchema = z.object({
  name: z.string().min(1).max(200),
  mode: z.enum(['capacidade', 'simulacao']),
  inputData: z.union([CapacidadeInputSchema, SimulacaoInputSchema])
});

// API Client
export const financingAPI = {
  // Create new simulation
  async create(data: z.infer<typeof CreateFinancingRequestSchema>) {
    const validated = CreateFinancingRequestSchema.parse(data);

    // Calculate result based on mode
    const resultData = validated.mode === 'capacidade'
      ? this.calculateCapacidade(validated.inputData as any)
      : this.calculateSimulacao(validated.inputData as any);

    const { data: result, error } = await supabase
      .from('financing_simulations')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        name: validated.name,
        mode: validated.mode,
        financing_type: validated.mode === 'simulacao'
          ? (validated.inputData as any).tipoFinanciamento
          : null,
        input_data: validated.inputData,
        result_data: resultData
      })
      .select()
      .single();

    if (error) {
      throw new APIError(error.message, 500, error.code);
    }

    return result;
  },

  // Get simulation by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('financing_simulations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new APIError('Simulation not found', 404);
      }
      throw new APIError(error.message, 500, error.code);
    }

    return data;
  },

  // Get simulation by short code
  async getByShortCode(shortCode: string) {
    const { data, error } = await supabase
      .from('financing_simulations')
      .select('*')
      .eq('short_code', shortCode)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new APIError('Simulation not found', 404);
      }
      throw new APIError(error.message, 500, error.code);
    }

    // Increment views
    await supabase.rpc('increment_financing_views', { simulation_id: data.id });

    return data;
  },

  // List user's simulations
  async list(options?: { limit?: number; offset?: number; mode?: string }) {
    let query = supabase
      .from('financing_simulations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (options?.mode) {
      query = query.eq('mode', options.mode);
    }

    if (options?.limit) {
      query.limit(options.limit);
    }

    if (options?.offset) {
      query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new APIError(error.message, 500, error.code);
    }

    return { data: data || [], count: count || 0 };
  },

  // Delete simulation
  async delete(id: string) {
    const { error } = await supabase
      .from('financing_simulations')
      .delete()
      .eq('id', id);

    if (error) {
      throw new APIError(error.message, 500, error.code);
    }

    return { success: true };
  },

  // Generate share link
  async generateShareLink(id: string) {
    const { data: codeData, error: codeError } = await supabase
      .rpc('generate_short_code');

    if (codeError) {
      throw new APIError('Failed to generate share code', 500);
    }

    const { data, error } = await supabase
      .from('financing_simulations')
      .update({ short_code: codeData })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new APIError(error.message, 500, error.code);
    }

    return {
      shortCode: data.short_code,
      shareUrl: `${window.location.origin}/financing/${data.short_code}`
    };
  },

  // Helper: Calculate capacidade
  calculateCapacidade(input: z.infer<typeof CapacidadeInputSchema>) {
    const parcelaMax = input.renda * 0.30;
    const meses = input.prazo * 12;
    const taxaMensal = input.taxa / 12 / 100;

    const valorFinanciado = parcelaMax * (
      (Math.pow(1 + taxaMensal, meses) - 1) /
      (taxaMensal * Math.pow(1 + taxaMensal, meses))
    );

    const valorMaximoImovel = valorFinanciado / 0.8;
    const entradaNecessaria = valorMaximoImovel * 0.2;
    const totalPago = parcelaMax * meses + entradaNecessaria;
    const totalJuros = totalPago - valorMaximoImovel;

    return {
      parcela: parcelaMax,
      totalPago,
      totalJuros,
      valorFinanciado,
      valorMaximoImovel,
      entradaNecessaria
    };
  },

  // Helper: Calculate simulacao
  calculateSimulacao(input: z.infer<typeof SimulacaoInputSchema>) {
    const valorFinanciado = input.valorImovel - input.valorEntrada;
    const meses = input.prazo * 12;
    const taxaMensal = input.taxa / 12 / 100;

    if (input.modalidade === 'price') {
      const parcela = valorFinanciado * (
        (taxaMensal * Math.pow(1 + taxaMensal, meses)) /
        (Math.pow(1 + taxaMensal, meses) - 1)
      );

      const totalPago = parcela * meses + input.valorEntrada;
      const totalJuros = totalPago - input.valorImovel;
      const rendaMinima = parcela / 0.30;

      return {
        parcela,
        totalPago,
        totalJuros,
        valorFinanciado,
        rendaMinima,
        primeiraParcela: parcela,
        ultimaParcela: parcela
      };
    } else {
      // SAC
      const amortizacaoFixa = valorFinanciado / meses;
      let saldoDevedor = valorFinanciado;
      let totalJuros = 0;
      let primeiraParcela = 0;
      let ultimaParcela = 0;

      for (let i = 1; i <= meses; i++) {
        const juros = saldoDevedor * taxaMensal;
        const parcela = amortizacaoFixa + juros;
        saldoDevedor -= amortizacaoFixa;
        totalJuros += juros;

        if (i === 1) primeiraParcela = parcela;
        if (i === meses) ultimaParcela = parcela;
      }

      const totalPago = valorFinanciado + totalJuros + input.valorEntrada;
      const rendaMinima = primeiraParcela / 0.30;

      return {
        parcela: primeiraParcela,
        totalPago,
        totalJuros,
        valorFinanciado,
        rendaMinima,
        primeiraParcela,
        ultimaParcela
      };
    }
  }
};
```

**API Design Rationale**:
1. ✅ **Zod validation**: Runtime type safety at API boundary
2. ✅ **Error handling**: Custom `APIError` class with status codes
3. ✅ **Supabase integration**: Using existing supabase client
4. ✅ **RLS compliance**: Policies enforced automatically by Supabase
5. ✅ **CRUD operations**: Complete create, read, update, delete
6. ✅ **Pagination support**: List operations support limit/offset
7. ✅ **Shareable links**: Short code generation and management

---

## **Frontend Integration - Design System Adaptation**

### **Design Tokens Mapping**

From existing `src/styles/tokens.css`:

```css
/* Original features use inline gradient styles */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Will be replaced with design system tokens */
background: var(--gradient-primary);

/* Color mapping */
#667eea → var(--primary-500)
#764ba2 → var(--secondary-600)
#10b981 → var(--success-500)
#f59e0b → var(--warning-500)
#ef4444 → var(--danger-500)
```

### **Component Structure**

Following Argon Dashboard patterns:

```html
<!-- Cash Flow Calculator Page -->
<div class="container-fluid py-4">
  <!-- Header Card -->
  <div class="card mb-4">
    <div class="card-header pb-0">
      <div class="d-flex align-items-center">
        <div class="icon icon-shape bg-gradient-primary text-white rounded-circle me-3">
          <i class="fas fa-chart-line"></i>
        </div>
        <div>
          <h6 class="mb-0">Calculadora de Fluxo de Pagamento</h6>
          <p class="text-sm mb-0">Planeje o fluxo de pagamento do seu imóvel</p>
        </div>
      </div>
    </div>
    <div class="card-body">
      <!-- Calculator form here -->
    </div>
  </div>
</div>

<!-- Financing Simulator Page -->
<div class="container-fluid py-4">
  <!-- Mode Selection Card -->
  <div class="card mb-4">
    <div class="card-header pb-0">
      <h6>Simulador de Financiamento</h6>
      <p class="text-sm mb-0">O que você deseja fazer?</p>
    </div>
    <div class="card-body">
      <div class="row">
        <div class="col-md-6">
          <div class="card card-body card-hover" onclick="selectMode('capacidade')">
            <div class="icon icon-lg bg-gradient-info text-white rounded-circle mb-3">
              <i class="fas fa-calculator"></i>
            </div>
            <h6 class="mb-2">Calcular Capacidade</h6>
            <p class="text-sm text-secondary mb-0">Descubra quanto você pode financiar</p>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card card-body card-hover" onclick="selectMode('simulacao')">
            <div class="icon icon-lg bg-gradient-success text-white rounded-circle mb-3">
              <i class="fas fa-home"></i>
            </div>
            <h6 class="mb-2">Simular Financiamento</h6>
            <p class="text-sm text-secondary mb-0">Calcule as parcelas de um imóvel</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### **Navigation Integration**

Add to `pages/pages/dashboard.html`:

```html
<!-- In sidebar navigation -->
<li class="nav-item">
  <a class="nav-link collapsed" href="#" data-toggle="collapse" data-target="#collapseCalculadoras">
    <div class="icon icon-shape icon-sm shadow border-radius-md bg-white text-center me-2 d-flex align-items-center justify-content-center">
      <i class="fas fa-calculator text-primary text-sm opacity-10"></i>
    </div>
    <span class="nav-link-text ms-1">Calculadoras</span>
  </a>
  <div id="collapseCalculadoras" class="collapse" data-parent="#sidenav-main">
    <ul class="nav ms-4 ps-3">
      <li class="nav-item">
        <a class="nav-link" href="./cash-flow-calculator.html">
          <span class="sidenav-mini-icon"> CF </span>
          <span class="sidenav-normal"> Fluxo de Pagamento </span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="./financing-simulator.html">
          <span class="sidenav-mini-icon"> FS </span>
          <span class="sidenav-normal"> Simulador de Financiamento </span>
        </a>
      </li>
    </ul>
  </div>
</li>
```

---

## **Implementation Roadmap**

### **Phase 1: Database Layer** (2-3 hours)
1. Create migration file `005_calculators_schema.sql`
2. Run migrations on Supabase
3. Verify RLS policies and indexes
4. Test helper functions

### **Phase 2: Domain Layer** (3-4 hours)
1. Implement `CashFlowCalculator` entity
2. Implement `FinancingSimulation` entity
3. Add tests for business logic
4. Validate calculations against original features

### **Phase 3: API Layer** (3-4 hours)
1. Implement `cash-flow-api.ts`
2. Implement `financing-api.ts`
3. Add Zod schemas and validation
4. Test all CRUD operations

### **Phase 4: Frontend - Cash Flow Calculator** (4-5 hours)
1. Create `cash-flow-calculator.html` page
2. Adapt HTML structure to Argon Dashboard
3. Apply design system tokens
4. Integrate with API
5. Add save/load/share functionality

### **Phase 5: Frontend - Financing Simulator** (3-4 hours)
1. Create `financing-simulator.html` page
2. Adapt wizard flow to Argon Dashboard
3. Apply design system tokens
4. Integrate with API
5. Add save/share functionality

### **Phase 6: Integration & Testing** (1-2 hours)
1. Add navigation links
2. E2E testing with real data
3. Cross-browser validation
4. Performance optimization

**Total Estimated Time**: 16-22 hours

---

## **Risk Analysis & Mitigation**

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Complex state management breaks | High | Medium | Extensive testing, TypeScript types |
| Financial calculation errors | Critical | Low | Unit tests, validation against original |
| RLS policy misconfiguration | High | Low | Test with multiple users, security audit |
| Design system integration issues | Medium | Medium | Component library, style guide adherence |
| Performance issues with large datasets | Medium | Low | Pagination, lazy loading, indexing |

---

## **Success Criteria**

✅ Both features fully functional with identical calculations
✅ Design matches Argon Dashboard theme
✅ All database operations work with RLS
✅ Save/load/share functionality operational
✅ Mobile responsive
✅ Performance: <2s page load, <200ms API response
✅ Code coverage: >80% for business logic
✅ Zero TypeScript errors
✅ WCAG 2.1 AA accessibility compliance

---

## **Next Steps**

1. ✅ Review and approve this plan
2. ⏳ Create database migration file
3. ⏳ Implement domain entities
4. ⏳ Implement API clients
5. ⏳ Develop frontend pages
6. ⏳ Integration testing
7. ⏳ Deploy to production

---

**Document Version**: 1.0
**Last Updated**: 2025-01-06
**Status**: Ready for Implementation
**Author**: Claude Code SuperClaude (Ultrathink Mode)
