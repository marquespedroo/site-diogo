# ImobiTools - System Architecture & Technical Specifications

## Document Control
- **Version**: 2.0.0
- **Date**: 2025-01-04
- **Status**: UPDATED - PDF & Payment Integration Fixed
- **Stakeholders**: Tech Lead, Product Owner, DevOps
- **Critical Updates**: PDFKit implementation, Brazilian payment integration

---

## 1. Executive Summary

ImobiTools is a SaaS platform providing professional real estate tools for Brazilian agents. The platform features:
- Payment flow calculator with shareable links
- Property valuation via comparative market analysis
- Multi-agent real estate projects database
- Brazilian payment gateway integration (Stripe, Mercado Pago, Asaas)

**Key Requirements**:
- Zero-to-low initial infrastructure cost ($0-2/month)
- Auto-scaling for viral growth potential (0 → 100K users)
- Enterprise-grade code quality (SOLID, DRY, OOP)
- Brazilian market compliance (payment methods, tax, privacy)

---

## 2. Technology Stack

### 2.1 Frontend Layer

```
Technology: Static HTML + Progressive Enhancement
├── HTML5 Semantic Markup
├── TailwindCSS 3.x (utility-first CSS)
├── Vanilla JavaScript (ES6+)
└── TypeScript (gradual migration)

Rationale:
- Keep existing validated UI/UX
- Zero framework lock-in
- Fast initial load (<1s)
- SEO-friendly static pages
```

### 2.2 Backend Layer

```
Architecture: Serverless + Edge Computing
├── Vercel Edge Functions (API routes)
├── Middleware: Auth, CORS, Rate Limiting
├── Supabase PostgreSQL (primary database)
└── Supabase Storage (files, images, PDFs)

Rationale:
- Auto-scaling serverless architecture
- Pay-per-execution model (cost-efficient)
- Global CDN edge deployment
- Zero server management
```

### 2.3 Database Architecture

```sql
Platform: Supabase (PostgreSQL 15+)
├── ACID compliance
├── Row-Level Security (RLS)
├── Real-time subscriptions
├── Built-in Auth
└── RESTful + GraphQL APIs

Connection Pool:
- Min: 0 (serverless)
- Max: 100 connections
- Timeout: 30s
```

### 2.4 Infrastructure

```
Hosting: Vercel
├── CDN: Global edge network (>70 locations)
├── SSL: Auto-provisioned certificates
├── Deployments: Git-based CI/CD
├── Preview: Branch deployments
└── Analytics: Core Web Vitals tracking

DNS: Cloudflare (optional)
├── DDoS protection
├── Rate limiting
├── Caching rules
└── Firewall rules
```

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Landing Page │  │ Calculator   │  │ Market Study │  │
│  │   (Static)   │  │   (Static)   │  │   (Static)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                    ┌────────▼────────┐
                    │   VERCEL CDN    │ (Global Edge)
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
  ┌───────▼────────┐ ┌──────▼───────┐ ┌───────▼────────┐
  │ Edge Functions │ │ Middleware   │ │  Static Assets │
  │  (Serverless)  │ │ (Auth, CORS) │ │  (CDN Cached)  │
  └───────┬────────┘ └──────┬───────┘ └────────────────┘
          │                  │
          └──────────────────┘
                    │
          ┌─────────▼─────────┐
          │     SUPABASE      │
          │ ┌───────────────┐ │
          │ │  PostgreSQL   │ │ (Primary DB)
          │ └───────────────┘ │
          │ ┌───────────────┐ │
          │ │  Auth Service │ │ (JWT + OAuth)
          │ └───────────────┘ │
          │ ┌───────────────┐ │
          │ │    Storage    │ │ (S3-compatible)
          │ └───────────────┘ │
          └───────────────────┘
                    │
          ┌─────────▼─────────┐
          │ EXTERNAL SERVICES │
          │ ├── Stripe (BR)   │
          │ ├── Mercado Pago  │ (Installments)
          │ ├── Asaas (PIX)   │ (PIX + Boleto)
          │ └── PDFKit        │ (Fast PDF gen)
          └───────────────────┘
```

### 3.2 Data Flow Architecture

```
1. USER REQUEST
   ↓
2. VERCEL EDGE (Routing + Caching)
   ↓
3. MIDDLEWARE (Auth + Validation)
   ↓
4. EDGE FUNCTION (Business Logic)
   ↓
5. SUPABASE (Data Layer)
   ↓
6. RESPONSE (JSON/HTML/PDF)
   ↓
7. CDN CACHE (24h for static, 5min for dynamic)
```

---

## 4. Design Patterns & Architecture Principles

### 4.1 SOLID Principles Application

#### S - Single Responsibility Principle
```typescript
// ❌ BAD: God object doing everything
class Calculator {
  calculatePayment() {}
  saveToDatabase() {}
  generatePDF() {}
  sendEmail() {}
}

// ✅ GOOD: Separate responsibilities
class PaymentCalculator {
  calculate(input: PaymentInput): PaymentResult {}
}

class CalculatorRepository {
  save(calc: Calculator): Promise<string> {}
  findById(id: string): Promise<Calculator> {}
}

class PDFGenerator {
  generate(data: CalculatorResult): Promise<Buffer> {}
}

class EmailService {
  send(recipient: string, pdf: Buffer): Promise<void> {}
}
```

#### O - Open/Closed Principle
```typescript
// ✅ Open for extension, closed for modification
interface PaymentMethod {
  calculate(amount: number): PaymentResult;
}

class CashPayment implements PaymentMethod {
  calculate(amount: number): PaymentResult {
    return { total: amount, discount: 0.05 };
  }
}

class FinancingPayment implements PaymentMethod {
  calculate(amount: number): PaymentResult {
    return { total: amount * 1.1, installments: 120 };
  }
}

// Add new payment methods without modifying existing code
class PIXPayment implements PaymentMethod {
  calculate(amount: number): PaymentResult {
    return { total: amount, discount: 0.02 };
  }
}
```

#### L - Liskov Substitution Principle
```typescript
// ✅ Subtypes must be substitutable for their base types
abstract class Report {
  abstract generate(data: any): Promise<Buffer>;

  async saveToStorage(buffer: Buffer): Promise<string> {
    // Common implementation for all reports
    return await storage.upload(buffer);
  }
}

class PDFReport extends Report {
  async generate(data: any): Promise<Buffer> {
    return await pdfkit.generatePDF(data);
  }
}

class ExcelReport extends Report {
  async generate(data: any): Promise<Buffer> {
    return await xlsx.generate(data);
  }
}

// Usage: Any Report subtype works
async function processReport(report: Report, data: any) {
  const buffer = await report.generate(data);
  const url = await report.saveToStorage(buffer);
  return url;
}
```

#### I - Interface Segregation Principle
```typescript
// ❌ BAD: Fat interface
interface User {
  login(): void;
  logout(): void;
  createProject(): void;
  deleteProject(): void;
  generateInvoice(): void;
  processPayment(): void;
}

// ✅ GOOD: Segregated interfaces
interface Authenticatable {
  login(): void;
  logout(): void;
}

interface ProjectManager {
  createProject(): void;
  deleteProject(): void;
}

interface BillingCapable {
  generateInvoice(): void;
  processPayment(): void;
}

class AdminUser implements Authenticatable, ProjectManager, BillingCapable {
  // Implements all interfaces
}

class FreeUser implements Authenticatable, ProjectManager {
  // Only implements what they need
}
```

#### D - Dependency Inversion Principle
```typescript
// ✅ Depend on abstractions, not concretions
interface PaymentGateway {
  processPayment(amount: number): Promise<PaymentResult>;
}

class StripeGateway implements PaymentGateway {
  async processPayment(amount: number): Promise<PaymentResult> {
    // Stripe-specific implementation
  }
}

class MercadoPagoGateway implements PaymentGateway {
  async processPayment(amount: number): Promise<PaymentResult> {
    // Mercado Pago implementation
  }
}

// High-level module depends on abstraction
class PaymentService {
  constructor(private gateway: PaymentGateway) {}

  async process(amount: number): Promise<PaymentResult> {
    return await this.gateway.processPayment(amount);
  }
}

// Dependency injection at runtime
const service = new PaymentService(
  process.env.PAYMENT_PROVIDER === 'stripe'
    ? new StripeGateway()
    : new MercadoPagoGateway()
);
```

### 4.2 DRY (Don't Repeat Yourself)

```typescript
// ❌ BAD: Repeated validation logic
function createUser(email: string) {
  if (!email.includes('@')) throw new Error('Invalid email');
  // ...
}

function updateUser(email: string) {
  if (!email.includes('@')) throw new Error('Invalid email');
  // ...
}

// ✅ GOOD: Extract to validator
class EmailValidator {
  static validate(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static assert(email: string): void {
    if (!this.validate(email)) {
      throw new ValidationError('Invalid email format');
    }
  }
}

function createUser(email: string) {
  EmailValidator.assert(email);
  // ...
}

function updateUser(email: string) {
  EmailValidator.assert(email);
  // ...
}
```

### 4.3 Design Patterns

#### Repository Pattern
```typescript
interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Partial<T>): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

class CalculatorRepository implements IRepository<Calculator> {
  constructor(private db: SupabaseClient) {}

  async findById(id: string): Promise<Calculator | null> {
    const { data, error } = await this.db
      .from('calculators')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return Calculator.fromDatabase(data);
  }

  // ... other methods
}
```

#### Factory Pattern
```typescript
interface ReportGenerator {
  generate(data: any): Promise<Buffer>;
}

class ReportFactory {
  static create(type: 'pdf' | 'excel' | 'slides'): ReportGenerator {
    switch (type) {
      case 'pdf':
        return new PDFReportGenerator();
      case 'excel':
        return new ExcelReportGenerator();
      case 'slides':
        return new SlidesReportGenerator();
      default:
        throw new Error(`Unknown report type: ${type}`);
    }
  }
}

// Usage
const generator = ReportFactory.create('pdf');
const buffer = await generator.generate(marketStudyData);
```

#### Strategy Pattern
```typescript
interface PricingStrategy {
  calculate(basePrice: number): number;
}

class RegularPricing implements PricingStrategy {
  calculate(basePrice: number): number {
    return basePrice;
  }
}

class DiscountPricing implements PricingStrategy {
  constructor(private discountPercent: number) {}

  calculate(basePrice: number): number {
    return basePrice * (1 - this.discountPercent / 100);
  }
}

class SeasonalPricing implements PricingStrategy {
  calculate(basePrice: number): number {
    const month = new Date().getMonth();
    const isHighSeason = [11, 0, 1].includes(month); // Dec, Jan, Feb
    return isHighSeason ? basePrice * 1.2 : basePrice * 0.9;
  }
}

class Property {
  constructor(private pricingStrategy: PricingStrategy) {}

  getPrice(basePrice: number): number {
    return this.pricingStrategy.calculate(basePrice);
  }
}
```

#### Observer Pattern (for Real-time Updates)
```typescript
interface Observer {
  update(data: any): void;
}

class ProjectObserver {
  private observers: Observer[] = [];

  subscribe(observer: Observer): void {
    this.observers.push(observer);
  }

  unsubscribe(observer: Observer): void {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  notify(data: any): void {
    this.observers.forEach(observer => observer.update(data));
  }
}

class RealtimeProjectSync implements Observer {
  update(data: any): void {
    // Sync to Supabase Realtime
    supabase.channel('projects').send({
      type: 'broadcast',
      event: 'project-update',
      payload: data
    });
  }
}
```

---

## 5. Project Structure

```
site-diogo/
├── public/                          # Static assets
│   ├── index.html                   # Landing page
│   ├── calculadora.html             # Calculator tool
│   ├── estudo-mercado.html          # Market study tool
│   └── tabela-empreendimentos.html  # Projects table
│
├── src/
│   ├── lib/                         # Core libraries
│   │   ├── supabase/
│   │   │   ├── client.ts            # Supabase client singleton
│   │   │   ├── auth.ts              # Authentication helpers
│   │   │   └── storage.ts           # File storage helpers
│   │   │
│   │   ├── validators/              # Input validation
│   │   │   ├── email.validator.ts
│   │   │   ├── payment.validator.ts
│   │   │   └── property.validator.ts
│   │   │
│   │   ├── errors/                  # Custom error classes
│   │   │   ├── base.error.ts
│   │   │   ├── validation.error.ts
│   │   │   └── payment.error.ts
│   │   │
│   │   └── utils/                   # Utility functions
│   │       ├── formatters.ts
│   │       ├── dates.ts
│   │       └── currency.ts
│   │
│   ├── domain/                      # Business logic (OOP)
│   │   ├── calculator/
│   │   │   ├── entities/
│   │   │   │   ├── Calculator.ts
│   │   │   │   ├── PaymentPlan.ts
│   │   │   │   └── Installment.ts
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   └── CalculatorRepository.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── CalculatorService.ts
│   │   │   │   └── LinkGenerator.ts
│   │   │   │
│   │   │   └── use-cases/
│   │   │       ├── CreateCalculator.ts
│   │   │       ├── ShareCalculator.ts
│   │   │       └── LoadCalculator.ts
│   │   │
│   │   ├── market-study/
│   │   │   ├── entities/
│   │   │   │   ├── MarketStudy.ts
│   │   │   │   ├── Property.ts
│   │   │   │   └── Valuation.ts
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   └── MarketStudyRepository.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── ValuationService.ts
│   │   │   │   ├── PDFGenerator.ts
│   │   │   │   └── SlidesGenerator.ts
│   │   │   │
│   │   │   └── use-cases/
│   │   │       ├── CreateMarketStudy.ts
│   │   │       ├── GenerateReport.ts
│   │   │       └── GenerateSlides.ts
│   │   │
│   │   ├── projects/
│   │   │   ├── entities/
│   │   │   │   ├── Project.ts
│   │   │   │   └── Unit.ts
│   │   │   │
│   │   │   ├── repositories/
│   │   │   │   ├── ProjectRepository.ts
│   │   │   │   └── UnitRepository.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   └── ProjectService.ts
│   │   │   │
│   │   │   └── use-cases/
│   │   │       ├── CreateProject.ts
│   │   │       ├── AddUnit.ts
│   │   │       └── ShareProject.ts
│   │   │
│   │   └── payments/
│   │       ├── entities/
│   │       │   ├── Subscription.ts
│   │       │   └── Transaction.ts
│   │       │
│   │       ├── gateways/
│   │       │   ├── IPaymentGateway.ts
│   │       │   ├── StripeGateway.ts
│   │       │   ├── MercadoPagoGateway.ts
│   │       │   └── AsaasGateway.ts
│   │       │
│   │       ├── services/
│   │       │   ├── PaymentService.ts
│   │       │   └── SubscriptionService.ts
│   │       │
│   │       └── use-cases/
│   │           ├── ProcessPayment.ts
│   │           ├── CreateSubscription.ts
│   │           └── CancelSubscription.ts
│   │
│   └── api/                         # Serverless endpoints
│       ├── middleware/
│       │   ├── auth.ts              # JWT validation
│       │   ├── cors.ts              # CORS configuration
│       │   ├── rate-limit.ts        # Rate limiting
│       │   └── error-handler.ts     # Global error handler
│       │
│       ├── calculator/
│       │   ├── create.ts            # POST /api/calculator
│       │   ├── load.ts              # GET /api/calculator/:id
│       │   └── share.ts             # POST /api/calculator/:id/share
│       │
│       ├── market-study/
│       │   ├── create.ts            # POST /api/market-study
│       │   ├── generate-pdf.ts      # POST /api/market-study/:id/pdf
│       │   └── generate-slides.ts   # POST /api/market-study/:id/slides
│       │
│       ├── projects/
│       │   ├── list.ts              # GET /api/projects
│       │   ├── create.ts            # POST /api/projects
│       │   ├── update.ts            # PUT /api/projects/:id
│       │   └── units/
│       │       ├── list.ts          # GET /api/projects/:id/units
│       │       ├── create.ts        # POST /api/projects/:id/units
│       │       └── update.ts        # PUT /api/projects/:id/units/:unitId
│       │
│       └── payments/
│           ├── webhook.ts           # POST /api/payments/webhook
│           ├── subscribe.ts         # POST /api/payments/subscribe
│           └── cancel.ts            # POST /api/payments/cancel
│
├── tests/
│   ├── unit/                        # Unit tests
│   │   ├── domain/
│   │   └── lib/
│   │
│   ├── integration/                 # Integration tests
│   │   ├── api/
│   │   └── database/
│   │
│   └── e2e/                         # End-to-end tests
│       ├── calculator.spec.ts
│       ├── market-study.spec.ts
│       └── projects.spec.ts
│
├── database/
│   ├── migrations/                  # SQL migrations
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_payments.sql
│   │   └── 003_add_rls_policies.sql
│   │
│   └── seeds/                       # Test data
│       └── dev_data.sql
│
├── docs/
│   ├── api/                         # API documentation
│   │   └── openapi.yaml
│   │
│   └── architecture/                # Architecture diagrams
│       └── system-design.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml                   # Continuous Integration
│       ├── cd.yml                   # Continuous Deployment
│       └── security.yml             # Security scanning
│
├── vercel.json                      # Vercel configuration
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Dependencies
├── .env.example                     # Environment variables template
└── README.md                        # Project documentation
```

---

## 6. Database Schema

### 6.1 Core Tables

```sql
-- Users and Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  plan_id UUID REFERENCES subscription_plans(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription Plans
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- 'free', 'basic', 'unlimited', 'combo'
  price_brl DECIMAL(10,2) NOT NULL,
  features JSONB NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calculators
CREATE TABLE calculators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  short_code TEXT UNIQUE NOT NULL, -- for shareable links
  state JSONB NOT NULL, -- calculator configuration
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  INDEX idx_short_code (short_code),
  INDEX idx_user_id (user_id)
);

-- Market Studies
CREATE TABLE market_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  property_address TEXT NOT NULL,
  property_area DECIMAL(10,2) NOT NULL,
  samples JSONB NOT NULL, -- market samples data
  valuation_result JSONB NOT NULL, -- calculated values
  agent_logo_url TEXT,
  pdf_url TEXT,
  slides_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at DESC)
);

-- Projects and Units
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  shared_with UUID[], -- array of user IDs with access
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_user_id (user_id)
);

CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  tower TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  parking_spots TEXT,
  area DECIMAL(10,2) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  origin TEXT NOT NULL, -- 'Real' or 'Permutante'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_project_id (project_id),
  INDEX idx_price (price),
  UNIQUE(project_id, tower, unit_number)
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT NOT NULL, -- 'active', 'cancelled', 'past_due', 'expired'
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  external_subscription_id TEXT, -- Stripe/MP/Asaas ID
  payment_gateway TEXT NOT NULL, -- 'stripe', 'mercadopago', 'asaas'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
  payment_method TEXT NOT NULL, -- 'credit_card', 'pix', 'boleto'
  payment_gateway TEXT NOT NULL,
  external_transaction_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at DESC)
);

-- Usage Limits (for plan enforcement)
CREATE TABLE usage_limits (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  calculator_exports_month INTEGER DEFAULT 0,
  market_studies_month INTEGER DEFAULT 0,
  projects_count INTEGER DEFAULT 0,
  units_count INTEGER DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_last_reset (last_reset_at)
);
```

### 6.2 Row-Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculators ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users: can only see their own data
CREATE POLICY user_select_own ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY user_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

-- Calculators: owner + public read for shared links
CREATE POLICY calculator_select_own ON calculators
  FOR SELECT USING (auth.uid() = user_id OR short_code IS NOT NULL);

CREATE POLICY calculator_insert_own ON calculators
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY calculator_update_own ON calculators
  FOR UPDATE USING (auth.uid() = user_id);

-- Market Studies: owner only
CREATE POLICY market_study_all_own ON market_studies
  FOR ALL USING (auth.uid() = user_id);

-- Projects: owner + shared users
CREATE POLICY project_select ON projects
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() = ANY(shared_with)
  );

CREATE POLICY project_insert_own ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY project_update_own ON projects
  FOR UPDATE USING (auth.uid() = user_id);

-- Units: inherit from project access
CREATE POLICY unit_select ON units
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = units.project_id
      AND (projects.user_id = auth.uid() OR auth.uid() = ANY(projects.shared_with))
    )
  );

CREATE POLICY unit_insert ON units
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = units.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Subscriptions & Transactions: owner only
CREATE POLICY subscription_all_own ON subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY transaction_select_own ON transactions
  FOR SELECT USING (auth.uid() = user_id);
```

---

## 7. API Design

### 7.1 RESTful Conventions

```
HTTP Method | Endpoint                    | Description
----------- | --------------------------- | -----------------------
GET         | /api/resources              | List all resources
GET         | /api/resources/:id          | Get single resource
POST        | /api/resources              | Create new resource
PUT         | /api/resources/:id          | Update entire resource
PATCH       | /api/resources/:id          | Partial update
DELETE      | /api/resources/:id          | Delete resource

Response Codes:
200 OK                  - Success
201 Created             - Resource created
204 No Content          - Success with no body
400 Bad Request         - Validation error
401 Unauthorized        - Not authenticated
403 Forbidden           - Not authorized
404 Not Found           - Resource not found
409 Conflict            - Duplicate resource
422 Unprocessable       - Business logic error
429 Too Many Requests   - Rate limit exceeded
500 Internal Error      - Server error
```

### 7.2 Standard Response Format

```typescript
// Success Response
{
  "success": true,
  "data": {
    // resource data
  },
  "meta": {
    "timestamp": "2025-01-04T12:00:00Z",
    "requestId": "uuid"
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-04T12:00:00Z",
    "requestId": "uuid"
  }
}
```

### 7.3 Authentication

```typescript
// JWT Token Structure
{
  "sub": "user-uuid",           // user ID
  "email": "user@example.com",
  "role": "user",               // or "admin"
  "plan": "basic",              // subscription plan
  "iat": 1704369600,            // issued at
  "exp": 1704456000             // expires at (24h)
}

// Request Header
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 8. Brazilian Payment Integration

### 8.1 Payment Methods Overview

```
Method           | Gateway      | Market Share | Use Case
---------------- | ------------ | ------------ | ---------------------------
PIX              | Asaas        | 48%          | Instant payment, 0% fees
Boleto           | Asaas        | 23%          | Bank slip, 3-day settlement
Credit Card      | Mercado Pago | 29%          | Installments (parcelamento)
Credit Card (BR) | Stripe       | Secondary    | Backup gateway
```

### 8.2 PIX Integration (Primary)

**Provider**: Asaas
**Market Penetration**: 48% of Brazilian e-commerce (2024)
**Settlement**: Instant (< 10 seconds)
**Cost**: R$0.99 per transaction (no percentage fee)

#### Implementation Flow

```typescript
// PIX Payment Service
class PIXPaymentService {
  constructor(private asaas: AsaasClient) {}

  async createPayment(params: PIXPaymentParams): Promise<PIXPayment> {
    const payment = await this.asaas.payments.create({
      customer: params.customerId,
      billingType: 'PIX',
      value: params.amount,
      dueDate: this.getExpirationDate(15), // 15 min expiration
      description: `ImobiTools - ${params.planName}`,
      externalReference: params.subscriptionId
    });

    return {
      id: payment.id,
      qrCode: payment.encodedImage, // Base64 QR code
      qrCodeText: payment.payload,  // PIX copy-paste code
      expiresAt: payment.dueDate,
      status: 'pending'
    };
  }

  async checkPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    const payment = await this.asaas.payments.findById(paymentId);

    return {
      id: payment.id,
      status: this.mapStatus(payment.status),
      paidAt: payment.confirmedDate,
      amount: payment.value
    };
  }

  private mapStatus(asaasStatus: string): PaymentStatus {
    const statusMap = {
      'PENDING': 'pending',
      'RECEIVED': 'completed',
      'CONFIRMED': 'completed',
      'OVERDUE': 'failed',
      'REFUNDED': 'refunded'
    };
    return statusMap[asaasStatus] || 'pending';
  }

  private getExpirationDate(minutes: number): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
  }
}
```

#### Webhook Handling

```typescript
// PIX Webhook Handler
async function handlePIXWebhook(req: Request): Promise<Response> {
  // 1. Verify webhook signature
  const signature = req.headers.get('asaas-signature');
  if (!verifyAsaasSignature(req.body, signature)) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = await req.json();

  // 2. Handle payment confirmation
  if (event.event === 'PAYMENT_RECEIVED' || event.event === 'PAYMENT_CONFIRMED') {
    const payment = event.payment;

    // 3. Update subscription status
    await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: new Date(),
        current_period_end: addMonths(new Date(), 1)
      })
      .eq('external_subscription_id', payment.externalReference);

    // 4. Record transaction
    await supabase
      .from('transactions')
      .insert({
        user_id: payment.customer,
        amount: payment.value,
        status: 'completed',
        payment_method: 'pix',
        payment_gateway: 'asaas',
        external_transaction_id: payment.id,
        metadata: { event: event.event }
      });

    // 5. Send confirmation email
    await sendEmail({
      to: payment.customer,
      template: 'payment-confirmed',
      data: { amount: payment.value, method: 'PIX' }
    });
  }

  return new Response('OK', { status: 200 });
}
```

### 8.3 Boleto Integration (Secondary)

**Provider**: Asaas
**Market Penetration**: 23% of Brazilian e-commerce
**Settlement**: 3 business days
**Cost**: R$3.50 per boleto

#### Implementation

```typescript
class BoletoPaymentService {
  constructor(private asaas: AsaasClient) {}

  async createBoleto(params: BoletoParams): Promise<BoletoPayment> {
    const payment = await this.asaas.payments.create({
      customer: params.customerId,
      billingType: 'BOLETO',
      value: params.amount,
      dueDate: this.getDueDate(3), // 3 days expiration
      description: `ImobiTools - ${params.planName}`,
      externalReference: params.subscriptionId,
      fine: { value: 2.0 }, // 2% late fee
      interest: { value: 1.0 } // 1% monthly interest
    });

    return {
      id: payment.id,
      boletoUrl: payment.bankSlipUrl,
      barcodeNumber: payment.identificationField,
      dueDate: payment.dueDate,
      status: 'pending'
    };
  }

  private getDueDate(days: number): string {
    const now = new Date();
    now.setDate(now.getDate() + days);
    return now.toISOString().split('T')[0];
  }
}
```

### 8.4 Credit Card Installments (Parcelamento)

**Provider**: Mercado Pago (Primary)
**Market Behavior**: 12x installments common for R$500+ purchases
**Cost**: 4.99% + R$0.39 per transaction + installment fees

#### Installment Calculation

```typescript
interface InstallmentOption {
  installments: number;
  installmentAmount: number;
  totalAmount: number;
  interestRate: number;
  recommendedMessage: string;
}

class InstallmentCalculator {
  // Mercado Pago interest rates (2024)
  private readonly INTEREST_RATES = {
    1: 0,      // No interest
    2: 0,      // No interest
    3: 0,      // No interest
    4: 2.99,   // 2.99% per month
    5: 3.99,
    6: 4.99,
    7: 5.99,
    8: 6.99,
    9: 7.99,
    10: 8.99,
    11: 9.99,
    12: 10.99
  };

  calculateOptions(amount: number): InstallmentOption[] {
    const options: InstallmentOption[] = [];

    for (let i = 1; i <= 12; i++) {
      const interestRate = this.INTEREST_RATES[i] || 0;
      const totalWithInterest = amount * (1 + (interestRate / 100) * i);
      const installmentAmount = totalWithInterest / i;

      // Brazilian market rule: installment must be >= R$5
      if (installmentAmount < 5) continue;

      options.push({
        installments: i,
        installmentAmount: Math.round(installmentAmount * 100) / 100,
        totalAmount: Math.round(totalWithInterest * 100) / 100,
        interestRate,
        recommendedMessage: this.getRecommendation(i, interestRate)
      });
    }

    return options;
  }

  private getRecommendation(installments: number, rate: number): string {
    if (installments <= 3) return `${installments}x sem juros`;
    return `${installments}x de ${rate}% ao mês`;
  }
}
```

#### Credit Card Payment Flow

```typescript
class CreditCardPaymentService {
  constructor(private mercadopago: MercadoPagoClient) {}

  async processPayment(params: CardPaymentParams): Promise<PaymentResult> {
    const payment = await this.mercadopago.payment.create({
      transaction_amount: params.amount,
      token: params.cardToken, // Tokenized card (PCI compliance)
      description: `ImobiTools - ${params.planName}`,
      installments: params.installments,
      payment_method_id: params.paymentMethodId,
      payer: {
        email: params.email,
        identification: {
          type: params.documentType, // CPF or CNPJ
          number: params.documentNumber
        }
      },
      external_reference: params.subscriptionId,
      notification_url: `${process.env.APP_URL}/api/payments/webhook/mercadopago`
    });

    return {
      id: payment.id,
      status: this.mapStatus(payment.status),
      statusDetail: payment.status_detail,
      installments: payment.installments,
      installmentAmount: payment.transaction_amount / payment.installments
    };
  }

  private mapStatus(mpStatus: string): PaymentStatus {
    const statusMap = {
      'approved': 'completed',
      'pending': 'pending',
      'in_process': 'pending',
      'rejected': 'failed',
      'cancelled': 'cancelled',
      'refunded': 'refunded',
      'charged_back': 'refunded'
    };
    return statusMap[mpStatus] || 'pending';
  }
}
```

### 8.5 Payment Gateway Selection Strategy

```typescript
class PaymentGatewayRouter {
  selectGateway(params: PaymentParams): PaymentGateway {
    // Primary: Asaas for PIX and Boleto (lowest fees)
    if (params.method === 'pix' || params.method === 'boleto') {
      return new AsaasGateway();
    }

    // Primary: Mercado Pago for credit cards (best installment support)
    if (params.method === 'credit_card') {
      return new MercadoPagoGateway();
    }

    // Fallback: Stripe (backup gateway)
    return new StripeGateway();
  }

  // Circuit breaker for gateway failures
  async processWithFallback(params: PaymentParams): Promise<PaymentResult> {
    const primaryGateway = this.selectGateway(params);

    try {
      return await primaryGateway.processPayment(params);
    } catch (error) {
      console.error(`Primary gateway failed: ${error.message}`);

      // Fallback to Stripe for credit cards only
      if (params.method === 'credit_card') {
        const fallbackGateway = new StripeGateway();
        return await fallbackGateway.processPayment(params);
      }

      throw error;
    }
  }
}
```

### 8.6 Brazilian Tax Compliance (NFSe)

**Requirement**: Electronic invoice (Nota Fiscal de Serviço Eletrônica)
**Trigger**: All completed payments
**Tax**: ISS (2% - 5% depending on municipality)

#### Invoice Generation Integration

```typescript
class BrazilianInvoiceService {
  constructor(private nfeio: NFEioClient) {}

  async generateInvoice(payment: Payment): Promise<Invoice> {
    // Only generate for completed payments
    if (payment.status !== 'completed') {
      throw new Error('Invoice can only be generated for completed payments');
    }

    const invoice = await this.nfeio.createServiceInvoice({
      // Company data (ImobiTools)
      provider: {
        cnpj: process.env.COMPANY_CNPJ,
        municipalInscription: process.env.MUNICIPAL_INSCRIPTION,
        cityServiceCode: '01.07.00', // Software as a Service
        description: 'Assinatura mensal ImobiTools'
      },

      // Customer data
      borrower: {
        name: payment.customer.name,
        email: payment.customer.email,
        cpfCnpj: payment.customer.document,
        address: payment.customer.address
      },

      // Service details
      service: {
        amount: payment.amount,
        issRate: 3.0, // 3% ISS for software services
        withholdIss: false, // ImobiTools retains ISS
        description: `Assinatura ImobiTools - ${payment.planName}`,
        cityCode: '5300108' // Brasília, DF
      },

      // Payment info
      payment: {
        method: payment.method,
        paidAt: payment.paidAt,
        transactionId: payment.id
      }
    });

    // Store invoice reference
    await supabase
      .from('transactions')
      .update({
        metadata: {
          ...payment.metadata,
          nfse_id: invoice.id,
          nfse_number: invoice.number,
          nfse_url: invoice.pdfUrl
        }
      })
      .eq('id', payment.id);

    // Send invoice to customer
    await sendEmail({
      to: payment.customer.email,
      template: 'invoice-generated',
      attachments: [{
        filename: `NFSe-${invoice.number}.pdf`,
        url: invoice.pdfUrl
      }]
    });

    return invoice;
  }
}
```

### 8.7 Payment Integration Test Cases

```typescript
// Test: PIX Payment Flow
describe('PIX Payment Integration', () => {
  it('should create PIX payment with QR code', async () => {
    const payment = await pixService.createPayment({
      customerId: 'cus_123',
      amount: 49.90,
      planName: 'Plano Básico',
      subscriptionId: 'sub_456'
    });

    expect(payment.qrCode).toBeDefined();
    expect(payment.qrCodeText).toMatch(/^00020126/); // PIX format
    expect(payment.expiresAt).toBeDefined();
  });

  it('should confirm payment via webhook', async () => {
    const webhookPayload = {
      event: 'PAYMENT_RECEIVED',
      payment: {
        id: 'pay_789',
        value: 49.90,
        externalReference: 'sub_456'
      }
    };

    const response = await handlePIXWebhook(webhookPayload);
    expect(response.status).toBe(200);

    const subscription = await getSubscription('sub_456');
    expect(subscription.status).toBe('active');
  });
});

// Test: Installment Calculation
describe('Credit Card Installments', () => {
  it('should calculate installments correctly', () => {
    const calculator = new InstallmentCalculator();
    const options = calculator.calculateOptions(299.90);

    expect(options).toHaveLength(12);
    expect(options[0].installments).toBe(1);
    expect(options[0].interestRate).toBe(0);
    expect(options[11].installments).toBe(12);
    expect(options[11].interestRate).toBe(10.99);
  });

  it('should respect minimum R$5 per installment', () => {
    const calculator = new InstallmentCalculator();
    const options = calculator.calculateOptions(20.00);

    // R$20 / 12 = R$1.67 (below minimum)
    expect(options.length).toBeLessThan(12);
    expect(options.every(opt => opt.installmentAmount >= 5)).toBe(true);
  });
});
```

### 8.8 Payment Error Handling

```typescript
class PaymentErrorHandler {
  handle(error: PaymentError): PaymentErrorResponse {
    const errorMap: Record<string, PaymentErrorResponse> = {
      // PIX errors
      'pix_expired': {
        code: 'PIX_EXPIRED',
        message: 'QR Code expirado. Gere um novo pagamento.',
        userMessage: 'O tempo para pagamento expirou. Por favor, tente novamente.',
        retryable: true
      },

      // Credit card errors
      'card_declined': {
        code: 'CARD_DECLINED',
        message: 'Cartão recusado pela operadora',
        userMessage: 'Seu cartão foi recusado. Verifique os dados ou use outro cartão.',
        retryable: true
      },
      'insufficient_funds': {
        code: 'INSUFFICIENT_FUNDS',
        message: 'Saldo insuficiente',
        userMessage: 'Saldo insuficiente. Tente com outro cartão ou método de pagamento.',
        retryable: true
      },
      'invalid_cvv': {
        code: 'INVALID_CVV',
        message: 'CVV inválido',
        userMessage: 'Código de segurança (CVV) inválido. Verifique e tente novamente.',
        retryable: true
      },

      // Boleto errors
      'boleto_expired': {
        code: 'BOLETO_EXPIRED',
        message: 'Boleto vencido',
        userMessage: 'Boleto vencido. Gere um novo boleto para pagamento.',
        retryable: true
      },

      // Gateway errors
      'gateway_timeout': {
        code: 'GATEWAY_TIMEOUT',
        message: 'Timeout na comunicação com gateway',
        userMessage: 'Erro temporário. Por favor, tente novamente em alguns instantes.',
        retryable: true
      }
    };

    return errorMap[error.code] || {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      userMessage: 'Erro no processamento do pagamento. Contate o suporte.',
      retryable: false
    };
  }
}
```

### 8.9 Payment Cost Comparison

```
Gateway        | Method      | Transaction Fee          | Settlement | Best For
-------------- | ----------- | ------------------------ | ---------- | -------------------
Asaas          | PIX         | R$0.99 flat              | Instant    | Subscriptions ✅
Asaas          | Boleto      | R$3.50 flat              | 3 days     | One-time payments
Mercado Pago   | Credit Card | 4.99% + R$0.39          | 14-30 days | Installments ✅
Stripe         | Credit Card | 3.99% + R$0.39          | 2 days     | Backup gateway

Monthly Cost Projection (1,000 transactions):
- 500 PIX @ R$0.99 = R$495
- 300 Credit Card @ 4.99% (avg R$100) = R$1,614
- 200 Boleto @ R$3.50 = R$700
TOTAL: R$2,809/month in payment fees
```

---

## 9. PDF Generation with PDFKit

### 9.1 Why PDFKit over Puppeteer

**Performance Comparison**:
```
Metric              | Puppeteer      | PDFKit        | Improvement
------------------- | -------------- | ------------- | -----------
Cold Start          | 5-15s          | 50-200ms      | 25-75x faster
Memory Usage        | 512MB-2GB      | 10-50MB       | 10-40x less
Cost per 1K PDFs    | $60/month      | $0.50/month   | 120x cheaper
Bundle Size         | 150MB          | 2MB           | 75x smaller
Serverless Friendly | ❌ Poor        | ✅ Excellent  | Yes
```

**Decision**: PDFKit provides enterprise-grade PDF generation with 10x better performance and 100x cost reduction.

### 9.2 PDFKit Architecture

```typescript
// PDF Generator Interface
interface IPDFGenerator {
  generateMarketStudy(data: MarketStudyData): Promise<Buffer>;
  generateCalculator(data: CalculatorData): Promise<Buffer>;
  generateInvoice(data: InvoiceData): Promise<Buffer>;
}

// PDFKit Implementation
import PDFDocument from 'pdfkit';

class PDFKitGenerator implements IPDFGenerator {
  private readonly BRAND_COLORS = {
    primary: '#667eea',
    secondary: '#764ba2',
    success: '#10b981',
    text: '#1f2937'
  };

  async generateMarketStudy(data: MarketStudyData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: 'Estudo de Mercado - ImobiTools',
          Author: data.agentName,
          Subject: 'Avaliação de Imóvel',
          CreationDate: new Date()
        }
      });

      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header with logo
      if (data.agentLogo) {
        doc.image(data.agentLogo, 50, 45, { width: 100 });
      }

      // Title
      doc
        .fontSize(24)
        .fillColor(this.BRAND_COLORS.primary)
        .text('ESTUDO DE MERCADO', { align: 'center' })
        .moveDown();

      // Property details
      doc
        .fontSize(12)
        .fillColor(this.BRAND_COLORS.text)
        .text(`Endereço: ${data.propertyAddress}`)
        .text(`Área: ${data.propertyArea} m²`)
        .text(`Data: ${new Date().toLocaleDateString('pt-BR')}`)
        .moveDown(2);

      // Samples table
      doc.fontSize(16).text('Amostras de Mercado', { underline: true }).moveDown();

      const tableTop = doc.y;
      const tableHeaders = ['Endereço', 'Área (m²)', 'Valor', 'Valor/m²'];
      const colWidths = [200, 80, 100, 100];

      // Table header
      let xPos = 50;
      tableHeaders.forEach((header, i) => {
        doc
          .fontSize(10)
          .fillColor(this.BRAND_COLORS.primary)
          .text(header, xPos, tableTop, { width: colWidths[i] });
        xPos += colWidths[i];
      });

      // Table rows
      let yPos = tableTop + 20;
      data.samples.forEach(sample => {
        xPos = 50;
        const row = [
          sample.address,
          sample.area.toFixed(2),
          this.formatCurrency(sample.price),
          this.formatCurrency(sample.pricePerSqm)
        ];

        row.forEach((cell, i) => {
          doc
            .fontSize(9)
            .fillColor(this.BRAND_COLORS.text)
            .text(cell, xPos, yPos, { width: colWidths[i] });
          xPos += colWidths[i];
        });

        yPos += 25;
      });

      // Valuation results
      doc
        .moveDown(3)
        .fontSize(16)
        .fillColor(this.BRAND_COLORS.primary)
        .text('Resultado da Avaliação', { underline: true })
        .moveDown();

      doc
        .fontSize(12)
        .fillColor(this.BRAND_COLORS.text)
        .text(`Valor Médio de Mercado: ${this.formatCurrency(data.valuation.average)}`)
        .text(`Valor Mínimo: ${this.formatCurrency(data.valuation.min)}`)
        .text(`Valor Máximo: ${this.formatCurrency(data.valuation.max)}`)
        .moveDown();

      // Footer
      doc
        .fontSize(8)
        .fillColor('#666')
        .text(
          `Gerado por ImobiTools em ${new Date().toLocaleDateString('pt-BR')}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );

      doc.end();
    });
  }

  async generateCalculator(data: CalculatorData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });

      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc
        .fontSize(20)
        .fillColor(this.BRAND_COLORS.primary)
        .text('SIMULAÇÃO DE FINANCIAMENTO', { align: 'center' })
        .moveDown(2);

      // Property info
      doc
        .fontSize(14)
        .fillColor(this.BRAND_COLORS.text)
        .text('Dados do Imóvel')
        .fontSize(12)
        .text(`Valor Total: ${this.formatCurrency(data.propertyValue)}`)
        .text(`Entrada: ${this.formatCurrency(data.downPayment)}`)
        .text(`Saldo a Financiar: ${this.formatCurrency(data.loanAmount)}`)
        .moveDown(2);

      // Payment plan
      doc
        .fontSize(14)
        .text('Plano de Pagamento')
        .moveDown();

      data.installments.forEach((installment, index) => {
        doc
          .fontSize(10)
          .text(`${index + 1}ª Parcela: ${this.formatCurrency(installment.amount)} (${installment.date})`, {
            indent: 20
          });
      });

      // Summary
      doc
        .moveDown(2)
        .fontSize(14)
        .fillColor(this.BRAND_COLORS.success)
        .text(`Total a Pagar: ${this.formatCurrency(data.totalPayment)}`)
        .text(`Total de Juros: ${this.formatCurrency(data.totalInterest)}`);

      doc.end();
    });
  }

  async generateInvoice(data: InvoiceData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4' });

      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Invoice header
      doc
        .fontSize(24)
        .fillColor(this.BRAND_COLORS.primary)
        .text('NOTA FISCAL', { align: 'center' })
        .moveDown();

      doc
        .fontSize(12)
        .fillColor(this.BRAND_COLORS.text)
        .text(`NFSe: ${data.invoiceNumber}`)
        .text(`Data de Emissão: ${new Date(data.issuedAt).toLocaleDateString('pt-BR')}`)
        .moveDown(2);

      // Provider info
      doc.fontSize(14).text('Prestador de Serviço').moveDown(0.5);
      doc
        .fontSize(10)
        .text(`ImobiTools Tecnologia Ltda`)
        .text(`CNPJ: ${data.providerCnpj}`)
        .text(`Inscrição Municipal: ${data.providerInscription}`)
        .moveDown(2);

      // Service details
      doc.fontSize(14).text('Descrição do Serviço').moveDown(0.5);
      doc.fontSize(10).text(data.description).moveDown();

      doc
        .fontSize(12)
        .text(`Valor do Serviço: ${this.formatCurrency(data.amount)}`)
        .text(`ISS (3%): ${this.formatCurrency(data.amount * 0.03)}`)
        .fontSize(14)
        .fillColor(this.BRAND_COLORS.success)
        .text(`Total: ${this.formatCurrency(data.amount)}`);

      doc.end();
    });
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}
```

### 9.3 API Endpoint Implementation

```typescript
// Edge Function: Generate Market Study PDF
export default async function handler(req: Request): Promise<Response> {
  // 1. Authenticate user
  const user = await authenticate(req);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Get market study data
  const { id } = await req.json();
  const { data: study } = await supabase
    .from('market_studies')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!study) {
    return new Response('Not found', { status: 404 });
  }

  // 3. Generate PDF
  const pdfGenerator = new PDFKitGenerator();
  const pdfBuffer = await pdfGenerator.generateMarketStudy({
    propertyAddress: study.property_address,
    propertyArea: study.property_area,
    samples: study.samples,
    valuation: study.valuation_result,
    agentName: user.name,
    agentLogo: study.agent_logo_url
  });

  // 4. Upload to Supabase Storage
  const fileName = `market-study-${id}.pdf`;
  const { data: upload } = await supabase.storage
    .from('pdfs')
    .upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true
    });

  // 5. Get public URL
  const { data: urlData } = supabase.storage.from('pdfs').getPublicUrl(fileName);

  // 6. Update market study record
  await supabase
    .from('market_studies')
    .update({ pdf_url: urlData.publicUrl })
    .eq('id', id);

  // 7. Return PDF
  return new Response(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}
```

### 9.4 Performance Optimization

```typescript
// PDF generation with caching
class CachedPDFGenerator {
  private cache = new Map<string, { buffer: Buffer; timestamp: number }>();
  private readonly CACHE_TTL = 3600000; // 1 hour

  async generate(data: any, type: 'market' | 'calculator'): Promise<Buffer> {
    const cacheKey = this.getCacheKey(data, type);

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.buffer;
    }

    // Generate new PDF
    const generator = new PDFKitGenerator();
    const buffer =
      type === 'market'
        ? await generator.generateMarketStudy(data)
        : await generator.generateCalculator(data);

    // Store in cache
    this.cache.set(cacheKey, { buffer, timestamp: Date.now() });

    return buffer;
  }

  private getCacheKey(data: any, type: string): string {
    return `${type}-${JSON.stringify(data)}`;
  }
}
```

### 9.5 Cost Analysis: PDFKit vs Puppeteer

```
Scenario: 10,000 PDFs per month

Puppeteer (Vercel Serverless):
- Avg execution time: 10s (with cold start)
- Memory: 1GB
- Cost: 10s × 1GB × 10,000 = 100,000 GB-seconds
- Price: $0.20 per 1,000 GB-seconds
- Monthly cost: $20/month baseline + $200 for execution = $220/month

PDFKit (Vercel Edge):
- Avg execution time: 200ms
- Memory: 50MB
- Cost: 0.2s × 0.05GB × 10,000 = 100 GB-seconds
- Price: $0.20 per 1,000 GB-seconds
- Monthly cost: $0.02/month

SAVINGS: $219.98/month (99.99% reduction) ✅
```

---

## 10. Security Requirements

### 10.1 Security Checklist

- [ ] **Authentication**: JWT-based with refresh tokens
- [ ] **Authorization**: Row-Level Security (RLS) on all tables
- [ ] **Input Validation**: Zod schemas for all inputs
- [ ] **SQL Injection**: Parameterized queries only (Supabase client)
- [ ] **XSS Protection**: Content-Security-Policy headers
- [ ] **CSRF Protection**: SameSite cookies + CSRF tokens
- [ ] **Rate Limiting**: 100 req/min per IP, 1000 req/hour per user
- [ ] **HTTPS Only**: Force SSL for all connections
- [ ] **Secrets Management**: Environment variables, never in code
- [ ] **Logging**: Audit logs for sensitive operations
- [ ] **Data Encryption**: At rest (database) and in transit (SSL)
- [ ] **LGPD Compliance**: Data privacy for Brazilian users

### 8.2 Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... # Server-side only!

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxx
MERCADOPAGO_WEBHOOK_SECRET=xxx
ASAAS_API_KEY=xxx
ASAAS_WEBHOOK_SECRET=xxx

# Brazilian Payment Configuration
PIX_ENABLED=true
BOLETO_ENABLED=true
INSTALLMENTS_ENABLED=true
MAX_INSTALLMENTS=12

# Other Services
SENDGRID_API_KEY=xxx # For emails

# App Config
APP_URL=https://imobitools.com.br
JWT_SECRET=xxx
RATE_LIMIT_WINDOW=60000 # 1 minute
RATE_LIMIT_MAX=100
```

---

## 9. Performance Requirements

### 9.1 Metrics

```
Metric                   | Target        | Measurement
------------------------ | ------------- | ---------------------
Time to First Byte (TTFB)| < 200ms       | Lighthouse
First Contentful Paint   | < 1.5s        | Lighthouse
Largest Contentful Paint | < 2.5s        | Core Web Vitals
Cumulative Layout Shift  | < 0.1         | Core Web Vitals
API Response Time        | < 300ms       | p95
Database Query Time      | < 50ms        | p95
PDF Generation Time      | < 1s          | Average (PDFKit)
Concurrent Users         | 10,000+       | Load testing
```

### 9.2 Optimization Strategies

```typescript
// 1. Database Indexing
CREATE INDEX idx_calculators_user_date ON calculators(user_id, created_at DESC);
CREATE INDEX idx_projects_shared ON projects USING GIN(shared_with);

// 2. Caching Strategy
const cacheHeaders = {
  'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200'
};

// 3. Connection Pooling
const supabase = createClient(url, key, {
  db: {
    poolSize: 10 // Adjust based on load
  }
});

// 4. Lazy Loading
<script type="module" async src="/calculator.js"></script>

// 5. Image Optimization
<img
  src="/logo.png"
  loading="lazy"
  decoding="async"
  width="200"
  height="80"
/>
```

---

## 10. Monitoring & Observability

### 10.1 Monitoring Stack

```
Service                  | Purpose                | Cost
------------------------ | ---------------------- | --------
Vercel Analytics         | Core Web Vitals        | $10/mo
Supabase Dashboard       | Database metrics       | Free
Sentry                   | Error tracking         | Free tier
LogTail                  | Centralized logging    | $5/mo
UptimeRobot              | Uptime monitoring      | Free
```

### 10.2 Key Metrics

```typescript
// Application Metrics
- Active users (daily/monthly)
- API request rate (requests/second)
- Error rate (%)
- Conversion rate (free → paid)
- Churn rate (monthly)

// Technical Metrics
- API response time (p50, p95, p99)
- Database query time
- Cache hit rate (%)
- PDF generation success rate (%)
- Payment success rate (%)

// Business Metrics
- MRR (Monthly Recurring Revenue)
- ARPU (Average Revenue Per User)
- LTV (Lifetime Value)
- CAC (Customer Acquisition Cost)
```

---

## 11. Deployment Strategy

### 11.1 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:unit
      - run: npm run test:integration

  deploy-preview:
    needs: test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 11.2 Environments

```
Environment | Branch  | URL                           | Database
----------- | ------- | ----------------------------- | ----------
Development | develop | dev.imobitools.com.br         | Supabase Dev
Staging     | staging | staging.imobitools.com.br     | Supabase Staging
Production  | main    | imobitools.com.br             | Supabase Prod
```

---

## 12. Testing Strategy

### 12.1 Test Pyramid

```
          /\
         /  \        10% E2E Tests (Playwright)
        /____\       - User flows
       /      \      - Critical paths
      /        \
     /__________\    30% Integration Tests (Jest + Supertest)
    /            \   - API endpoints
   /              \  - Database operations
  /________________\
 /                  \ 60% Unit Tests (Jest + Vitest)
/____________________\ - Business logic
                       - Utilities
                       - Validators
```

### 12.2 Test Coverage Requirements

```
Type              | Coverage | Tool
----------------- | -------- | ---------------
Unit Tests        | ≥ 80%    | Jest/Vitest
Integration Tests | ≥ 70%    | Jest + Supertest
E2E Tests         | Critical | Playwright
Type Coverage     | 100%     | TypeScript
```

---

## 13. Documentation Requirements

### 13.1 Required Documentation

```
Document                  | Location           | Owner
------------------------- | ------------------ | -----------
Architecture Overview     | /docs/README.md    | Tech Lead
API Documentation         | /docs/api/         | Backend Dev
Database Schema           | /docs/database/    | Backend Dev
Deployment Guide          | /docs/deploy/      | DevOps
Contributing Guide        | CONTRIBUTING.md    | Tech Lead
Security Policy           | SECURITY.md        | Security Lead
```

### 13.2 Code Documentation

```typescript
/**
 * Generates a shareable calculator link
 *
 * @param calculatorId - UUID of the calculator
 * @param options - Link generation options
 * @returns Short URL for sharing
 *
 * @throws {CalculatorNotFoundError} If calculator doesn't exist
 * @throws {UnauthorizedError} If user doesn't own calculator
 *
 * @example
 * ```typescript
 * const url = await generateShareableLink(
 *   'uuid-here',
 *   { expiresIn: 30 } // days
 * );
 * // Returns: 'https://app.com/c/abc123'
 * ```
 */
async function generateShareableLink(
  calculatorId: string,
  options: LinkOptions
): Promise<string> {
  // Implementation
}
```

---

## 14. Success Criteria

### 14.1 Launch Checklist

- [ ] All core features functional
- [ ] 80%+ test coverage
- [ ] Performance metrics met
- [ ] Security audit passed
- [ ] LGPD compliance verified
- [ ] Payment integration tested
- [ ] Monitoring configured
- [ ] Documentation complete
- [ ] Disaster recovery plan
- [ ] Customer support ready

### 14.2 Post-Launch Metrics (30 days)

```
Metric                    | Target
------------------------- | ----------
Monthly Active Users      | 1,000+
Paid Conversion Rate      | 5%+
Average Session Duration  | 10+ minutes
Error Rate                | < 0.5%
Page Load Time            | < 2s
Customer Satisfaction     | 4.5+ stars
```

---

## 15. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Payment gateway downtime | High | Low | Multi-gateway fallback |
| Database performance | Medium | Medium | Connection pooling, indexes |
| PDF generation timeout | Medium | Low | Queue system, async processing |
| Viral traffic spike | High | Medium | Auto-scaling, CDN caching |
| Data breach | Critical | Low | RLS, encryption, audit logs |
| Brazilian regulation | High | Low | LGPD compliance, legal review |

---

## 16. Next Steps

1. **Architecture Review**: Schedule review with stakeholders
2. **PRD Documentation**: Create feature-specific PRDs
3. **Database Design**: Finalize schema and migrations
4. **API Specification**: OpenAPI documentation
5. **Security Review**: Third-party audit
6. **Development Kickoff**: Sprint planning

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-01-04 | Tech Lead | Initial architecture document |
| 2.0.0 | 2025-01-04 | Senior Architect | **CRITICAL UPDATES**: Replaced Puppeteer with PDFKit (99.99% cost reduction, 25x faster). Added comprehensive Brazilian payment integration (PIX, Boleto, Installments, NFSe). Updated environment variables. Performance targets improved (<1s PDF generation). |

---

**Approval Status**:
- [x] Senior Architect Review (v2.0.0 - 2025-01-04)
- [ ] Tech Lead Approval
- [ ] Product Owner Approval
- [ ] Security Team Review
- [ ] DevOps Team Review

**Critical Changes Approved**:
- ✅ PDF Generation: Puppeteer → PDFKit (99.99% cost reduction)
- ✅ Payment Integration: Full Brazilian payment support (PIX, Boleto, Installments)
- ✅ Tax Compliance: NFSe invoice generation integrated
- ✅ Performance: <1s PDF generation target

**Next Review**: 2025-02-01 (or after implementation feedback)
