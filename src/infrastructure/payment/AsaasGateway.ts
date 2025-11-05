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
import { PaymentMethod } from '@/domain/payment';
import crypto from 'crypto';

/**
 * Asaas API Response Types
 */
interface AsaasSubscriptionResponse {
  id: string;
  customer: string;
  status: string;
  nextDueDate: string;
  value: number;
}

interface AsaasPaymentResponse {
  id: string;
  status: string;
  billingType: string;
  value: number;
  dueDate: string;
  pixQrCodeUrl?: string;
  pixCopyAndPaste?: string;
  bankSlipUrl?: string;
  identificationField?: string;
}

interface AsaasCustomerResponse {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
}

/**
 * AsaasGateway Implementation
 *
 * Primary payment gateway for Brazilian market.
 * Features: PIX, Boleto, Credit Card, NFSe automation.
 * Lowest fees and best Brazilian market support.
 *
 * @example
 * const gateway = new AsaasGateway(process.env.ASAAS_API_KEY!);
 * const subscription = await gateway.createSubscription(input);
 */
export class AsaasGateway implements IPaymentGateway {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly webhookSecret?: string;

  constructor(
    apiKey: string,
    environment: 'production' | 'sandbox' = 'production',
    webhookSecret?: string
  ) {
    this.apiKey = apiKey;
    this.baseUrl =
      environment === 'production'
        ? 'https://www.asaas.com/api/v3'
        : 'https://sandbox.asaas.com/api/v3';
    this.webhookSecret = webhookSecret;
  }

  /**
   * Get gateway name
   */
  getName(): PaymentGateway {
    return 'asaas';
  }

  // ============================================================================
  // Subscription Management
  // ============================================================================

  /**
   * Create a recurring subscription
   */
  async createSubscription(
    input: CreateSubscriptionInput
  ): Promise<CreateSubscriptionOutput> {
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

      // 2. Create subscription
      const response = await this.makeRequest<AsaasSubscriptionResponse>(
        '/subscriptions',
        {
          method: 'POST',
          body: JSON.stringify({
            customer: customerId,
            billingType: this.mapBillingType(input.billingType),
            value: input.amount,
            cycle: 'MONTHLY',
            description: input.description,
          }),
        }
      );

      return {
        subscriptionId: response.id,
        customerId: response.customer,
        status: this.mapAsaasStatus(response.status),
        nextBillingDate: new Date(response.nextDueDate),
      };
    } catch (error) {
      throw new PaymentGatewayError(
        `Failed to create subscription: ${(error as Error).message}`,
        'asaas',
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
        'asaas',
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
        body.value = updates.amount;
      }
      if (updates.billingType !== undefined) {
        body.billingType = this.mapBillingType(updates.billingType);
      }
      if (updates.description !== undefined) {
        body.description = updates.description;
      }

      await this.makeRequest(`/subscriptions/${subscriptionId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new PaymentGatewayError(
        `Failed to update subscription: ${(error as Error).message}`,
        'asaas',
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
  async processPayment(
    input: ProcessPaymentInput
  ): Promise<ProcessPaymentOutput> {
    try {
      const response = await this.makeRequest<AsaasPaymentResponse>(
        '/payments',
        {
          method: 'POST',
          body: JSON.stringify({
            customer: input.customerId,
            billingType: this.mapBillingType(input.billingType),
            value: input.amount,
            dueDate: input.dueDate || new Date().toISOString().split('T')[0],
            description: input.description,
          }),
        }
      );

      return {
        transactionId: response.id,
        status: this.mapAsaasStatus(response.status),
        paymentMethod: this.extractPaymentMethodFromPayment(response),
      };
    } catch (error) {
      throw new PaymentGatewayError(
        `Failed to process payment: ${(error as Error).message}`,
        'asaas',
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
      const response = await this.makeRequest<AsaasCustomerResponse>(
        '/customers',
        {
          method: 'POST',
          body: JSON.stringify({
            name: customer.name,
            email: customer.email,
            cpfCnpj: customer.cpfCnpj.replace(/[^\d]/g, ''),
          }),
        }
      );

      return {
        id: response.id,
        name: response.name,
        email: response.email,
        cpfCnpj: response.cpfCnpj,
      };
    } catch (error) {
      throw new PaymentGatewayError(
        `Failed to create customer: ${(error as Error).message}`,
        'asaas',
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
      const response = await this.makeRequest<AsaasCustomerResponse>(
        `/customers/${customerId}`,
        { method: 'GET' }
      );

      return {
        id: response.id,
        name: response.name,
        email: response.email,
        cpfCnpj: response.cpfCnpj,
      };
    } catch (error) {
      throw new PaymentGatewayError(
        `Failed to get customer: ${(error as Error).message}`,
        'asaas',
        'getCustomer',
        error as Error
      );
    }
  }

  // ============================================================================
  // Webhook Handling
  // ============================================================================

  /**
   * Handle webhook events from Asaas
   * Validates signature and parses event
   */
  async handleWebhook(payload: any, signature: string): Promise<WebhookEvent> {
    try {
      // Validate webhook signature
      if (this.webhookSecret && !this.validateWebhookSignature(payload, signature)) {
        throw new Error('Invalid webhook signature');
      }

      // Parse webhook event
      return {
        type: payload.event,
        data: payload.payment || payload.subscription || payload,
        gateway: 'asaas',
      };
    } catch (error) {
      throw new PaymentGatewayError(
        `Failed to handle webhook: ${(error as Error).message}`,
        'asaas',
        'handleWebhook',
        error as Error
      );
    }
  }

  /**
   * Validate webhook signature
   */
  private validateWebhookSignature(payload: any, signature: string): boolean {
    if (!this.webhookSecret) {
      return true; // Skip validation if no secret configured
    }

    try {
      const computedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(computedSignature)
      );
    } catch (error) {
      return false;
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Make HTTP request to Asaas API
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      access_token: this.apiKey,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.errors?.[0]?.description || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Map billing type to Asaas format
   */
  private mapBillingType(type: string): string {
    const mapping: Record<string, string> = {
      credit_card: 'CREDIT_CARD',
      pix: 'PIX',
      boleto: 'BOLETO',
    };
    return mapping[type] || 'CREDIT_CARD';
  }

  /**
   * Map Asaas status to internal status
   */
  private mapAsaasStatus(status: string): string {
    const mapping: Record<string, SubscriptionStatus> = {
      ACTIVE: 'active',
      EXPIRED: 'expired',
      INACTIVE: 'cancelled',
      OVERDUE: 'past_due',
      PENDING: 'active',
      CONFIRMED: 'active',
      RECEIVED: 'active',
      RECEIVED_IN_CASH: 'active',
    };

    return mapping[status] || 'active';
  }

  /**
   * Extract payment method details from Asaas payment response
   */
  private extractPaymentMethodFromPayment(payment: AsaasPaymentResponse): any {
    const type = payment.billingType.toLowerCase();

    if (type === 'pix') {
      return {
        id: payment.id,
        type: 'pix',
        details: {
          pix: {
            qrCode: payment.pixCopyAndPaste || '',
            qrCodeUrl: payment.pixQrCodeUrl || '',
            expiresAt: new Date(payment.dueDate),
          },
        },
      };
    }

    if (type === 'boleto') {
      return {
        id: payment.id,
        type: 'boleto',
        details: {
          boleto: {
            barcodeNumber: payment.identificationField || '',
            barcodeUrl: payment.bankSlipUrl || '',
            pdfUrl: payment.bankSlipUrl || '',
            expiresAt: new Date(payment.dueDate),
          },
        },
      };
    }

    // Default to credit card
    return {
      id: payment.id,
      type: 'credit_card',
      details: {
        creditCard: {
          brand: 'unknown',
          last4: '0000',
          expiryMonth: 12,
          expiryYear: 2099,
        },
      },
    };
  }
}
