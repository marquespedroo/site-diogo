# Brazilian Payment Integration - Product Requirements Document

## Document Control
- **Feature**: Brazilian Payment Gateway Integration (Stripe, Mercado Pago, Asaas)
- **Version**: 1.0.0
- **Priority**: P0 (Critical for Monetization)
- **Target Release**: Sprint 4
- **Owner**: Product Team + Finance

---

## 1. Feature Overview

### 1.1 Business Context
ImobiTools monetization requires Brazilian-compliant payment processing supporting:
- **Credit/Debit Cards**: Visa, Mastercard, Elo, Hipercard
- **PIX**: Instant payment system (dominant in Brazil)
- **Boleto Bancário**: Bank slip payment (7-day expiration)
- **Recurring Subscriptions**: Monthly billing with automatic renewal
- **Split Payments**: Commission splits with partners (future)

**Brazilian Market Requirements**:
- CPF/CNPJ validation for invoicing
- NFSe (Nota Fiscal de Serviço) generation
- LGPD compliance for payment data
- Anti-fraud measures
- Chargeback handling

### 1.2 Payment Gateway Comparison

| Feature | Stripe | Mercado Pago | Asaas |
|---------|--------|--------------|-------|
| **Credit Card** | ✅ 4.99% + R$0.39 | ✅ 4.99% + R$0.39 | ✅ 2.99% + R$0.49 |
| **PIX** | ❌ | ✅ 0.99% | ✅ 1.49% |
| **Boleto** | ❌ | ✅ R$4.00 | ✅ R$3.00 |
| **Recurring** | ✅ Excellent | ✅ Good | ✅ Good |
| **Global** | ✅ Best | ⚠️ LATAM only | ❌ Brazil only |
| **NFSe** | ❌ Manual | ⚠️ Limited | ✅ Automatic |
| **Setup** | Easy | Medium | Easy |
| **Docs** | Excellent | Good | Good |

**Recommendation**:
- **Primary**: Asaas (lowest fees, PIX + Boleto, NFSe automation)
- **Secondary**: Stripe (international expansion, best developer experience)
- **Fallback**: Mercado Pago (brand recognition)

### 1.3 Subscription Plans

```typescript
const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Gratuito',
    price: 0,
    features: {
      calculators: 3,
      marketStudies: 1,
      projects: 1,
      units: 50,
      pdfExports: 5,
      agentBranding: false,
      apiAccess: false,
      support: 'community'
    }
  },
  BASIC: {
    name: 'Básico',
    price: 29.90, // R$/month
    features: {
      calculators: 50,
      marketStudies: 10,
      projects: 5,
      units: 500,
      pdfExports: 50,
      agentBranding: true,
      apiAccess: false,
      support: 'email'
    }
  },
  UNLIMITED: {
    name: 'Ilimitado',
    price: 59.90,
    features: {
      calculators: Infinity,
      marketStudies: Infinity,
      projects: 20,
      units: 5000,
      pdfExports: Infinity,
      agentBranding: true,
      apiAccess: true,
      support: 'priority'
    }
  },
  COMBO: {
    name: 'Combo Agência',
    price: 149.90,
    features: {
      calculators: Infinity,
      marketStudies: Infinity,
      projects: Infinity,
      units: Infinity,
      pdfExports: Infinity,
      agentBranding: true,
      apiAccess: true,
      support: 'whatsapp',
      multiUser: 10
    }
  }
};
```

---

## 2. Domain Model

```typescript
/**
 * Value Objects
 */
class CPF {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new ValidationError('Invalid CPF');
    }
  }

  private isValid(cpf: string): boolean {
    // Remove formatting
    const cleaned = cpf.replace(/[^\d]/g, '');

    if (cleaned.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleaned)) return false; // All same digit

    // Validate check digits
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleaned.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cleaned.charAt(10))) return false;

    return true;
  }

  getValue(): string {
    return this.value;
  }

  format(): string {
    const cleaned = this.value.replace(/[^\d]/g, '');
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
}

class CNPJ {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new ValidationError('Invalid CNPJ');
    }
  }

  private isValid(cnpj: string): boolean {
    const cleaned = cnpj.replace(/[^\d]/g, '');
    if (cleaned.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cleaned)) return false;

    // Validation algorithm similar to CPF
    // ... implementation
    return true;
  }

  getValue(): string {
    return this.value;
  }

  format(): string {
    const cleaned = this.value.replace(/[^\d]/g, '');
    return cleaned.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5'
    );
  }
}

class TaxDocument {
  private constructor(
    private readonly type: 'cpf' | 'cnpj',
    private readonly document: CPF | CNPJ
  ) {}

  static fromCPF(cpf: string): TaxDocument {
    return new TaxDocument('cpf', new CPF(cpf));
  }

  static fromCNPJ(cnpj: string): TaxDocument {
    return new TaxDocument('cnpj', new CNPJ(cnpj));
  }

  getType(): 'cpf' | 'cnpj' {
    return this.type;
  }

  getValue(): string {
    return this.document.getValue();
  }

  format(): string {
    return this.document.format();
  }
}

/**
 * Entities
 */
class PaymentMethod {
  constructor(
    private readonly id: string,
    private readonly type: PaymentMethodType,
    private readonly details: PaymentMethodDetails
  ) {}

  getType(): PaymentMethodType {
    return this.type;
  }

  getDetails(): PaymentMethodDetails {
    return this.details;
  }
}

type PaymentMethodType = 'credit_card' | 'pix' | 'boleto';

interface PaymentMethodDetails {
  creditCard?: {
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  };
  pix?: {
    qrCode: string;
    qrCodeUrl: string;
    expiresAt: Date;
  };
  boleto?: {
    barcodeNumber: string;
    barcodeUrl: string;
    pdfUrl: string;
    expiresAt: Date;
  };
}

class Transaction {
  constructor(
    private readonly id: string,
    private readonly userId: string,
    private readonly amount: Money,
    private readonly description: string,
    private readonly paymentMethod: PaymentMethod,
    private status: TransactionStatus,
    private readonly gateway: PaymentGateway,
    private readonly externalId: string,
    private readonly createdAt: Date,
    private paidAt?: Date,
    private failureReason?: string
  ) {}

  // State transitions
  markAsPending(): void {
    this.status = 'pending';
  }

  markAsCompleted(paidAt: Date): void {
    this.status = 'completed';
    this.paidAt = paidAt;
  }

  markAsFailed(reason: string): void {
    this.status = 'failed';
    this.failureReason = reason;
  }

  markAsRefunded(): void {
    if (this.status !== 'completed') {
      throw new BusinessRuleError('Can only refund completed transactions');
    }
    this.status = 'refunded';
  }

  // Getters
  getStatus(): TransactionStatus {
    return this.status;
  }

  isCompleted(): boolean {
    return this.status === 'completed';
  }
}

type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';
type PaymentGateway = 'stripe' | 'mercadopago' | 'asaas';

/**
 * Aggregate Root
 */
class Subscription {
  private readonly id: string;
  private readonly userId: string;
  private readonly planId: string;
  private status: SubscriptionStatus;
  private readonly currentPeriodStart: Date;
  private currentPeriodEnd: Date;
  private cancelAtPeriodEnd: boolean;
  private readonly gateway: PaymentGateway;
  private readonly externalSubscriptionId: string;
  private readonly paymentMethod: PaymentMethod;
  private readonly transactions: Transaction[];

  constructor(params: SubscriptionParams) {
    this.id = params.id || generateUUID();
    this.userId = params.userId;
    this.planId = params.planId;
    this.status = params.status || 'active';
    this.currentPeriodStart = params.currentPeriodStart;
    this.currentPeriodEnd = params.currentPeriodEnd;
    this.cancelAtPeriodEnd = params.cancelAtPeriodEnd || false;
    this.gateway = params.gateway;
    this.externalSubscriptionId = params.externalSubscriptionId;
    this.paymentMethod = params.paymentMethod;
    this.transactions = params.transactions || [];
  }

  // Business Logic
  renew(periodEnd: Date): void {
    if (this.cancelAtPeriodEnd) {
      throw new BusinessRuleError('Subscription is set to cancel');
    }

    if (this.status !== 'active') {
      throw new BusinessRuleError('Can only renew active subscriptions');
    }

    this.currentPeriodEnd = periodEnd;
  }

  cancel(immediately: boolean = false): void {
    if (immediately) {
      this.status = 'cancelled';
    } else {
      this.cancelAtPeriodEnd = true;
    }
  }

  reactivate(): void {
    if (this.status === 'cancelled' && !this.isPeriodExpired()) {
      this.status = 'active';
      this.cancelAtPeriodEnd = false;
    } else {
      throw new BusinessRuleError('Cannot reactivate expired subscription');
    }
  }

  suspend(reason: string): void {
    this.status = 'suspended';
  }

  markAsPastDue(): void {
    this.status = 'past_due';
  }

  addTransaction(transaction: Transaction): void {
    this.transactions.push(transaction);

    // Update status based on transaction
    if (transaction.isCompleted()) {
      if (this.status === 'past_due') {
        this.status = 'active';
      }
    }
  }

  // Queries
  isPeriodExpired(): boolean {
    return new Date() > this.currentPeriodEnd;
  }

  getDaysUntilRenewal(): number {
    const now = new Date();
    const diff = this.currentPeriodEnd.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  isActive(): boolean {
    return this.status === 'active' && !this.isPeriodExpired();
  }

  // Getters
  getId(): string {
    return this.id;
  }

  getStatus(): SubscriptionStatus {
    return this.status;
  }

  getPlanId(): string {
    return this.planId;
  }
}

type SubscriptionStatus =
  | 'active'
  | 'cancelled'
  | 'past_due'
  | 'suspended'
  | 'expired';
```

---

## 3. Payment Gateway Abstraction (Strategy Pattern)

```typescript
/**
 * Payment Gateway Interface
 */
interface IPaymentGateway {
  /**
   * Create a subscription
   */
  createSubscription(
    input: CreateSubscriptionInput
  ): Promise<CreateSubscriptionOutput>;

  /**
   * Cancel a subscription
   */
  cancelSubscription(subscriptionId: string): Promise<void>;

  /**
   * Process a one-time payment
   */
  processPayment(input: ProcessPaymentInput): Promise<ProcessPaymentOutput>;

  /**
   * Handle webhook events
   */
  handleWebhook(payload: any, signature: string): Promise<WebhookEvent>;

  /**
   * Get customer details
   */
  getCustomer(customerId: string): Promise<Customer>;
}

/**
 * Asaas Gateway Implementation
 */
class AsaasGateway implements IPaymentGateway {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = 'https://www.asaas.com/api/v3'
  ) {}

  async createSubscription(
    input: CreateSubscriptionInput
  ): Promise<CreateSubscriptionOutput> {
    // 1. Create customer if not exists
    let customerId = input.customerId;
    if (!customerId) {
      const customer = await this.createCustomer({
        name: input.customerName,
        email: input.customerEmail,
        cpfCnpj: input.cpfCnpj
      });
      customerId = customer.id;
    }

    // 2. Create subscription
    const response = await fetch(`${this.baseUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: this.apiKey
      },
      body: JSON.stringify({
        customer: customerId,
        billingType: input.billingType, // CREDIT_CARD, PIX, BOLETO
        value: input.amount,
        cycle: 'MONTHLY',
        description: input.description
      })
    });

    if (!response.ok) {
      throw new PaymentGatewayError('Failed to create subscription');
    }

    const data = await response.json();

    return {
      subscriptionId: data.id,
      customerId: data.customer,
      status: this.mapAsaasStatus(data.status),
      nextBillingDate: new Date(data.nextDueDate)
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/subscriptions/${subscriptionId}`,
      {
        method: 'DELETE',
        headers: {
          access_token: this.apiKey
        }
      }
    );

    if (!response.ok) {
      throw new PaymentGatewayError('Failed to cancel subscription');
    }
  }

  async processPayment(
    input: ProcessPaymentInput
  ): Promise<ProcessPaymentOutput> {
    // Process one-time payment
    const response = await fetch(`${this.baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: this.apiKey
      },
      body: JSON.stringify({
        customer: input.customerId,
        billingType: input.billingType,
        value: input.amount,
        dueDate: input.dueDate || new Date(),
        description: input.description
      })
    });

    if (!response.ok) {
      throw new PaymentGatewayError('Failed to process payment');
    }

    const data = await response.json();

    return {
      transactionId: data.id,
      status: this.mapAsaasStatus(data.status),
      paymentMethod: this.extractPaymentMethod(data)
    };
  }

  async handleWebhook(payload: any, signature: string): Promise<WebhookEvent> {
    // Validate webhook signature
    if (!this.validateWebhookSignature(payload, signature)) {
      throw new SecurityError('Invalid webhook signature');
    }

    // Parse webhook event
    return {
      type: payload.event,
      data: payload.payment || payload.subscription,
      gateway: 'asaas'
    };
  }

  async getCustomer(customerId: string): Promise<Customer> {
    const response = await fetch(`${this.baseUrl}/customers/${customerId}`, {
      headers: {
        access_token: this.apiKey
      }
    });

    if (!response.ok) {
      throw new PaymentGatewayError('Failed to get customer');
    }

    const data = await response.json();

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      cpfCnpj: data.cpfCnpj
    };
  }

  private async createCustomer(input: {
    name: string;
    email: string;
    cpfCnpj: string;
  }): Promise<{ id: string }> {
    const response = await fetch(`${this.baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        access_token: this.apiKey
      },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      throw new PaymentGatewayError('Failed to create customer');
    }

    return await response.json();
  }

  private mapAsaasStatus(status: string): SubscriptionStatus {
    const mapping: Record<string, SubscriptionStatus> = {
      ACTIVE: 'active',
      EXPIRED: 'expired',
      INACTIVE: 'cancelled',
      OVERDUE: 'past_due'
    };

    return mapping[status] || 'active';
  }

  private validateWebhookSignature(payload: any, signature: string): boolean {
    // Implement Asaas webhook signature validation
    // ...
    return true;
  }

  private extractPaymentMethod(data: any): PaymentMethod {
    // Extract payment method details from Asaas response
    // ...
    return new PaymentMethod(/* ... */);
  }
}

/**
 * Stripe Gateway Implementation
 */
class StripeGateway implements IPaymentGateway {
  constructor(private readonly stripe: Stripe) {}

  async createSubscription(
    input: CreateSubscriptionInput
  ): Promise<CreateSubscriptionOutput> {
    // Stripe implementation
    const subscription = await this.stripe.subscriptions.create({
      customer: input.customerId,
      items: [{ price: input.priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent']
    });

    return {
      subscriptionId: subscription.id,
      customerId: subscription.customer as string,
      status: this.mapStripeStatus(subscription.status),
      nextBillingDate: new Date(subscription.current_period_end * 1000),
      clientSecret:
        (subscription.latest_invoice as any)?.payment_intent?.client_secret
    };
  }

  // ... other implementations
}

/**
 * Gateway Factory
 */
class PaymentGatewayFactory {
  static create(gateway: PaymentGateway): IPaymentGateway {
    switch (gateway) {
      case 'asaas':
        return new AsaasGateway(process.env.ASAAS_API_KEY!);
      case 'stripe':
        return new StripeGateway(
          new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: '2023-10-16'
          })
        );
      case 'mercadopago':
        return new MercadoPagoGateway(process.env.MP_ACCESS_TOKEN!);
      default:
        throw new Error(`Unknown gateway: ${gateway}`);
    }
  }
}
```

---

## 4. Use Cases

```typescript
/**
 * Use Case: Create Subscription
 */
class CreateSubscriptionUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly userRepository: IUserRepository,
    private readonly gatewayFactory: PaymentGatewayFactory
  ) {}

  async execute(input: CreateSubscriptionInput): Promise<CreateSubscriptionOutput> {
    // 1. Validate user
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // 2. Check if already subscribed
    const existing = await this.subscriptionRepository.findActiveByUserId(
      input.userId
    );
    if (existing) {
      throw new BusinessRuleError('User already has an active subscription');
    }

    // 3. Get payment gateway
    const gateway = PaymentGatewayFactory.create(input.gateway);

    // 4. Create subscription in gateway
    const gatewayResult = await gateway.createSubscription({
      customerId: user.getGatewayCustomerId(input.gateway),
      customerName: user.getName(),
      customerEmail: user.getEmail(),
      cpfCnpj: user.getCpfCnpj(),
      planId: input.planId,
      amount: SUBSCRIPTION_PLANS[input.planId].price,
      billingType: input.billingType,
      description: `ImobiTools - ${SUBSCRIPTION_PLANS[input.planId].name}`
    });

    // 5. Create subscription entity
    const subscription = new Subscription({
      userId: input.userId,
      planId: input.planId,
      status: gatewayResult.status,
      currentPeriodStart: new Date(),
      currentPeriodEnd: gatewayResult.nextBillingDate,
      gateway: input.gateway,
      externalSubscriptionId: gatewayResult.subscriptionId,
      paymentMethod: new PaymentMethod(/* ... */)
    });

    // 6. Persist
    const saved = await this.subscriptionRepository.save(subscription);

    // 7. Update user plan
    await this.userRepository.updatePlan(input.userId, input.planId);

    return {
      subscriptionId: saved.getId(),
      status: saved.getStatus(),
      clientSecret: gatewayResult.clientSecret // For Stripe
    };
  }
}

/**
 * Use Case: Handle Webhook Event
 */
class HandlePaymentWebhookUseCase {
  constructor(
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly transactionRepository: ITransactionRepository,
    private readonly gatewayFactory: PaymentGatewayFactory,
    private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(input: HandleWebhookInput): Promise<void> {
    // 1. Get gateway
    const gateway = PaymentGatewayFactory.create(input.gateway);

    // 2. Validate and parse webhook
    const event = await gateway.handleWebhook(input.payload, input.signature);

    // 3. Handle event type
    switch (event.type) {
      case 'PAYMENT_RECEIVED':
        await this.handlePaymentReceived(event.data);
        break;

      case 'PAYMENT_OVERDUE':
        await this.handlePaymentOverdue(event.data);
        break;

      case 'SUBSCRIPTION_CANCELLED':
        await this.handleSubscriptionCancelled(event.data);
        break;

      // ... other event types
    }
  }

  private async handlePaymentReceived(data: any): Promise<void> {
    // Find subscription
    const subscription = await this.subscriptionRepository.findByExternalId(
      data.subscription
    );

    if (!subscription) {
      console.warn('Subscription not found for payment:', data.id);
      return;
    }

    // Create transaction
    const transaction = new Transaction(
      generateUUID(),
      subscription.getUserId(),
      new Money(data.value),
      'Monthly subscription',
      new PaymentMethod(/* ... */),
      'completed',
      subscription.getGateway(),
      data.id,
      new Date(data.dateCreated),
      new Date(data.paymentDate)
    );

    // Save transaction
    await this.transactionRepository.save(transaction);

    // Add to subscription
    subscription.addTransaction(transaction);
    await this.subscriptionRepository.update(subscription);

    // Publish event
    await this.eventPublisher.publish(
      new PaymentReceivedEvent(subscription, transaction)
    );
  }

  // ... other handlers
}
```

---

## 5. API Endpoints

```typescript
/**
 * POST /api/payments/subscribe
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await authenticate(req);

    const useCase = new CreateSubscriptionUseCase(
      new SupabaseSubscriptionRepository(supabase),
      new SupabaseUserRepository(supabase),
      PaymentGatewayFactory
    );

    const result = await useCase.execute({
      userId: user.id,
      planId: req.body.planId,
      gateway: req.body.gateway,
      billingType: req.body.billingType
    });

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    return handleError(error, res);
  }
}

/**
 * POST /api/payments/webhook
 *
 * Handle webhooks from all gateways
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Determine gateway from headers or path
    const gateway = req.headers['x-gateway'] as PaymentGateway;
    const signature = req.headers['x-signature'] as string;

    const useCase = new HandlePaymentWebhookUseCase(
      new SupabaseSubscriptionRepository(supabase),
      new SupabaseTransactionRepository(supabase),
      PaymentGatewayFactory,
      new EventPublisher()
    );

    await useCase.execute({
      gateway,
      payload: req.body,
      signature
    });

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).json({ error: 'Webhook processing failed' });
  }
}

/**
 * POST /api/payments/cancel
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await authenticate(req);

    const useCase = new CancelSubscriptionUseCase(
      new SupabaseSubscriptionRepository(supabase),
      PaymentGatewayFactory
    );

    await useCase.execute({
      userId: user.id,
      immediately: req.body.immediately || false
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return handleError(error, res);
  }
}
```

---

## 6. Security Requirements

### 6.1 PCI DSS Compliance
```
- Never store credit card numbers
- Use tokenization (gateway-provided)
- Encrypt all payment data in transit (HTTPS)
- Log access to payment information
- Regular security audits
```

### 6.2 Webhook Security
```typescript
// Verify webhook signatures
function verifyWebhookSignature(
  payload: any,
  signature: string,
  secret: string
): boolean {
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  );
}

// Rate limit webhooks
const WEBHOOK_RATE_LIMIT = {
  requests: 1000,
  window: 3600 // 1 hour
};
```

---

## 7. Testing Requirements

```typescript
describe('Payment Integration', () => {
  describe('Asaas Gateway', () => {
    it('should create subscription successfully', async () => {
      // Test with Asaas sandbox
    });

    it('should handle PIX payment', async () => {
      // Test PIX generation
    });

    it('should process webhook events', async () => {
      // Test webhook handling
    });
  });

  describe('Subscription Management', () => {
    it('should prevent duplicate subscriptions', async () => {
      // Business rule test
    });

    it('should handle payment failures', async () => {
      // Test past_due status
    });

    it('should calculate renewal dates correctly', async () => {
      // Date calculation test
    });
  });
});
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-01-04 | Product + Finance | Initial PRD |
