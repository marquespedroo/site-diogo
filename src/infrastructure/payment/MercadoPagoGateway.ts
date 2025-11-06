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

/**
 * MercadoPagoGateway Implementation
 *
 * Fallback payment gateway for Brazilian market.
 * Good brand recognition, supports PIX and Boleto.
 * Medium fees, LATAM coverage.
 *
 * @example
 * const gateway = new MercadoPagoGateway(process.env.MP_ACCESS_TOKEN!);
 * const subscription = await gateway.createSubscription(input);
 */
export class MercadoPagoGateway implements IPaymentGateway {
  private readonly accessToken: string;
  private readonly baseUrl = 'https://api.mercadopago.com';

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Get gateway name
   */
  getName(): PaymentGateway {
    return 'mercadopago';
  }

  // ============================================================================
  // Subscription Management
  // ============================================================================

  /**
   * Create a recurring subscription
   */
  async createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionOutput> {
    try {
      // MercadoPago uses preapproval plans for subscriptions
      const response = await this.makeRequest('/preapproval', {
        method: 'POST',
        body: JSON.stringify({
          reason: input.description,
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: input.amount,
            currency_id: 'BRL',
          },
          payer_email: input.customerEmail,
          back_url: 'https://imobitools.com/subscription/success',
          status: 'authorized',
        }),
      });

      return {
        subscriptionId: response.id,
        customerId: input.customerId || response.payer_id || '',
        status: 'active',
        nextBillingDate: new Date(response.next_payment_date),
      };
    } catch (error) {
      throw new PaymentGatewayError(
        `Failed to create subscription: ${(error as Error).message}`,
        'mercadopago',
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
      await this.makeRequest(`/preapproval/${subscriptionId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'cancelled' }),
      });
    } catch (error) {
      throw new PaymentGatewayError(
        `Failed to cancel subscription: ${(error as Error).message}`,
        'mercadopago',
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
      const body: any = {};

      if (updates.amount !== undefined) {
        body.auto_recurring = {
          transaction_amount: updates.amount,
        };
      }

      await this.makeRequest(`/preapproval/${subscriptionId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new PaymentGatewayError(
        `Failed to update subscription: ${(error as Error).message}`,
        'mercadopago',
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
      const response = await this.makeRequest('/v1/payments', {
        method: 'POST',
        body: JSON.stringify({
          transaction_amount: input.amount,
          description: input.description,
          payment_method_id: this.mapPaymentMethodId(input.billingType),
          payer: {
            email: input.customerId, // Simplified - should use actual email
          },
        }),
      });

      return {
        transactionId: response.id.toString(),
        status: this.mapMercadoPagoStatus(response.status),
        paymentMethod: {
          id: response.id.toString(),
          type: input.billingType,
          details: {},
        },
      };
    } catch (error) {
      throw new PaymentGatewayError(
        `Failed to process payment: ${(error as Error).message}`,
        'mercadopago',
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
    // MercadoPago doesn't have a dedicated customer creation endpoint
    // Return a mock customer with email as ID
    return {
      id: customer.email,
      name: customer.name,
      email: customer.email,
      cpfCnpj: customer.cpfCnpj,
    };
  }

  /**
   * Get customer details
   */
  async getCustomer(customerId: string): Promise<Customer> {
    // Mock implementation
    return {
      id: customerId,
      name: 'Customer',
      email: customerId,
      cpfCnpj: '',
    };
  }

  // ============================================================================
  // Webhook Handling
  // ============================================================================

  /**
   * Handle webhook events from MercadoPago
   */
  async handleWebhook(payload: any, signature: string): Promise<WebhookEvent> {
    try {
      // MercadoPago webhook validation would go here
      // They use x-signature and x-request-id headers

      return {
        type: payload.action || payload.type,
        data: payload.data || payload,
        gateway: 'mercadopago',
      };
    } catch (error) {
      throw new PaymentGatewayError(
        `Failed to handle webhook: ${(error as Error).message}`,
        'mercadopago',
        'handleWebhook',
        error as Error
      );
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Make HTTP request to MercadoPago API
   */
  private async makeRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.accessToken}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  }

  /**
   * Map payment method type to MercadoPago payment method ID
   */
  private mapPaymentMethodId(type: string): string {
    const mapping: Record<string, string> = {
      credit_card: 'credit_card',
      pix: 'pix',
      boleto: 'bolbradesco', // Boleto Bradesco as default
    };
    return mapping[type] || 'pix';
  }

  /**
   * Map MercadoPago status to internal status
   */
  private mapMercadoPagoStatus(status: string): string {
    const mapping: Record<string, string> = {
      approved: 'completed',
      authorized: 'active',
      pending: 'pending',
      in_process: 'pending',
      rejected: 'failed',
      cancelled: 'cancelled',
      refunded: 'refunded',
    };

    return mapping[status] || 'pending';
  }
}
