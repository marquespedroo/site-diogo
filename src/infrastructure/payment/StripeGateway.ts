import {
  IPaymentGateway,
  CreateSubscriptionInput,
  CreateSubscriptionOutput,
  ProcessPaymentInput,
  ProcessPaymentOutput,
  WebhookEvent,
  Customer,
} from '@/domain/payment/gateways/IPaymentGateway';
import { PaymentGatewayError } from '@/lib/errors';
import { PaymentGateway } from '@/domain/payment';
import { SubscriptionStatus } from '@/domain/payment';

/**
 * Stripe Types (minimal interface - use full Stripe SDK in production)
 */
interface StripeConfig {
  apiKey: string;
  webhookSecret?: string;
}

interface StripeSubscription {
  id: string;
  customer: string;
  status: string;
  current_period_end: number;
  latest_invoice?: any;
}

interface StripePaymentIntent {
  id: string;
  status: string;
  amount: number;
  client_secret: string;
}

interface StripeCustomer {
  id: string;
  name: string;
  email: string;
  metadata: {
    cpfCnpj?: string;
  };
}

/**
 * StripeGateway Implementation
 *
 * Secondary payment gateway for international expansion.
 * Best developer experience, global reach.
 * Note: Limited PIX/Boleto support in Brazil.
 *
 * @example
 * const gateway = new StripeGateway({ apiKey: process.env.STRIPE_SECRET_KEY! });
 * const subscription = await gateway.createSubscription(input);
 */
export class StripeGateway implements IPaymentGateway {
  private readonly apiKey: string;
  private readonly webhookSecret?: string;
  private readonly baseUrl = 'https://api.stripe.com/v1';

  constructor(config: StripeConfig) {
    this.apiKey = config.apiKey;
    this.webhookSecret = config.webhookSecret;
  }

  /**
   * Get gateway name
   */
  getName(): PaymentGateway {
    return 'stripe';
  }

  // ============================================================================
  // Subscription Management
  // ============================================================================

  /**
   * Create a recurring subscription
   */
  async createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionOutput> {
    try {
      // 1. Create or get customer
      let customerId = input.customerId;
      if (!customerId) {
        const customer = await this.createCustomer({
          name: input.customerName,
          email: input.customerEmail,
          cpfCnpj: input.cpfCnpj,
        });
        customerId = customer.id;
      }

      // 2. Create price for the subscription
      const price = await this.createPrice(input.amount, input.description);

      // 3. Create subscription
      const subscription = await this.makeRequest<StripeSubscription>('/subscriptions', {
        method: 'POST',
        body: this.encodeFormData({
          customer: customerId,
          'items[0][price]': price.id,
          payment_behavior: 'default_incomplete',
          'expand[]': 'latest_invoice.payment_intent',
        }),
      });

      return {
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        status: this.mapStripeStatus(subscription.status),
        nextBillingDate: new Date(subscription.current_period_end * 1000),
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      };
    } catch (error) {
      throw new PaymentGatewayError(
        `Failed to create subscription: ${(error as Error).message}`,
        'stripe',
        'createSubscription',
        error as Error
      );
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    try {
      await this.makeRequest(`/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      throw new PaymentGatewayError(
        `Failed to cancel subscription: ${(error as Error).message}`,
        'stripe',
        'cancelSubscription',
        error as Error
      );
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    subscriptionId: string,
    updates: Partial<CreateSubscriptionInput>
  ): Promise<void> {
    try {
      const body: Record<string, string> = {};

      if (updates.amount !== undefined && updates.description !== undefined) {
        const price = await this.createPrice(updates.amount, updates.description);
        body['items[0][price]'] = price.id;
      }

      await this.makeRequest(`/subscriptions/${subscriptionId}`, {
        method: 'POST',
        body: this.encodeFormData(body),
      });
    } catch (error) {
      throw new PaymentGatewayError(
        `Failed to update subscription: ${(error as Error).message}`,
        'stripe',
        'updateSubscription',
        error as Error
      );
    }
  }

  // ============================================================================
  // One-time Payments
  // ============================================================================

  /**
   * Process a one-time payment
   */
  async processPayment(input: ProcessPaymentInput): Promise<ProcessPaymentOutput> {
    try {
      const paymentIntent = await this.makeRequest<StripePaymentIntent>('/payment_intents', {
        method: 'POST',
        body: this.encodeFormData({
          amount: Math.round(input.amount * 100), // Convert to cents
          currency: 'brl',
          customer: input.customerId,
          description: input.description,
          automatic_payment_methods: 'enabled',
        }),
      });

      return {
        transactionId: paymentIntent.id,
        status: this.mapPaymentIntentStatus(paymentIntent.status),
        paymentMethod: {
          id: paymentIntent.id,
          type: 'credit_card',
          details: {
            creditCard: {
              brand: 'unknown',
              last4: '0000',
              expiryMonth: 12,
              expiryYear: 2099,
            },
          },
        },
      };
    } catch (error) {
      throw new PaymentGatewayError(
        `Failed to process payment: ${(error as Error).message}`,
        'stripe',
        'processPayment',
        error as Error
      );
    }
  }

  // ============================================================================
  // Customer Management
  // ============================================================================

  /**
   * Create a new customer
   */
  async createCustomer(customer: {
    name: string;
    email: string;
    cpfCnpj: string;
  }): Promise<Customer> {
    try {
      const stripeCustomer = await this.makeRequest<StripeCustomer>('/customers', {
        method: 'POST',
        body: this.encodeFormData({
          name: customer.name,
          email: customer.email,
          'metadata[cpfCnpj]': customer.cpfCnpj,
        }),
      });

      return {
        id: stripeCustomer.id,
        name: stripeCustomer.name,
        email: stripeCustomer.email,
        cpfCnpj: stripeCustomer.metadata.cpfCnpj || customer.cpfCnpj,
      };
    } catch (error) {
      throw new PaymentGatewayError(
        `Failed to create customer: ${(error as Error).message}`,
        'stripe',
        'createCustomer',
        error as Error
      );
    }
  }

  /**
   * Get customer details
   */
  async getCustomer(customerId: string): Promise<Customer> {
    try {
      const stripeCustomer = await this.makeRequest<StripeCustomer>(`/customers/${customerId}`, {
        method: 'GET',
      });

      return {
        id: stripeCustomer.id,
        name: stripeCustomer.name,
        email: stripeCustomer.email,
        cpfCnpj: stripeCustomer.metadata.cpfCnpj || '',
      };
    } catch (error) {
      throw new PaymentGatewayError(
        `Failed to get customer: ${(error as Error).message}`,
        'stripe',
        'getCustomer',
        error as Error
      );
    }
  }

  // ============================================================================
  // Webhook Handling
  // ============================================================================

  /**
   * Handle webhook events from Stripe
   */
  async handleWebhook(payload: any, signature: string): Promise<WebhookEvent> {
    try {
      // In production, use Stripe SDK's webhook verification
      // stripe.webhooks.constructEvent(payload, signature, webhookSecret)

      // For now, basic validation
      if (this.webhookSecret && !signature) {
        throw new Error('Missing webhook signature');
      }

      const event = typeof payload === 'string' ? JSON.parse(payload) : payload;

      return {
        type: event.type,
        data: event.data.object,
        gateway: 'stripe',
      };
    } catch (error) {
      throw new PaymentGatewayError(
        `Failed to handle webhook: ${(error as Error).message}`,
        'stripe',
        'handleWebhook',
        error as Error
      );
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Create a price for subscription
   */
  private async createPrice(amount: number, description: string): Promise<{ id: string }> {
    return this.makeRequest('/prices', {
      method: 'POST',
      body: this.encodeFormData({
        unit_amount: Math.round(amount * 100).toString(), // Convert to cents
        currency: 'brl',
        'recurring[interval]': 'month',
        'product_data[name]': description,
      }),
    });
  }

  /**
   * Make HTTP request to Stripe API
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  }

  /**
   * Encode form data for Stripe API
   */
  private encodeFormData(data: Record<string, string>): string {
    return Object.keys(data)
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
      .join('&');
  }

  /**
   * Map Stripe subscription status to internal status
   */
  private mapStripeStatus(status: string): string {
    const mapping: Record<string, SubscriptionStatus> = {
      active: 'active',
      canceled: 'cancelled',
      incomplete: 'active',
      incomplete_expired: 'expired',
      past_due: 'past_due',
      trialing: 'active',
      unpaid: 'past_due',
    };

    return mapping[status] || 'active';
  }

  /**
   * Map Stripe payment intent status to internal status
   */
  private mapPaymentIntentStatus(status: string): string {
    const mapping: Record<string, string> = {
      succeeded: 'completed',
      processing: 'pending',
      requires_payment_method: 'pending',
      requires_confirmation: 'pending',
      requires_action: 'pending',
      canceled: 'failed',
    };

    return mapping[status] || 'pending';
  }
}
