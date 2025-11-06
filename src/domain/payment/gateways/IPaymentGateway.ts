import { PaymentGateway } from '../entities/Transaction';
import { SubscriptionPlan } from '../entities/Subscription';
import { PaymentMethodType } from '../entities/PaymentMethod';

/**
 * Create Subscription Input
 */
export interface CreateSubscriptionInput {
  customerId?: string;
  customerName: string;
  customerEmail: string;
  cpfCnpj: string;
  planId: SubscriptionPlan;
  amount: number;
  billingType: PaymentMethodType;
  description: string;
}

/**
 * Create Subscription Output
 */
export interface CreateSubscriptionOutput {
  subscriptionId: string;
  customerId: string;
  status: string;
  nextBillingDate: Date;
  clientSecret?: string; // For Stripe client-side confirmation
}

/**
 * Process Payment Input
 */
export interface ProcessPaymentInput {
  customerId: string;
  amount: number;
  billingType: PaymentMethodType;
  description: string;
  dueDate?: Date;
}

/**
 * Process Payment Output
 */
export interface ProcessPaymentOutput {
  transactionId: string;
  status: string;
  paymentMethod: any;
}

/**
 * Webhook Event
 */
export interface WebhookEvent {
  type: string;
  data: any;
  gateway: PaymentGateway;
}

/**
 * Customer Interface
 */
export interface Customer {
  id: string;
  name: string;
  email: string;
  cpfCnpj: string;
}

/**
 * IPaymentGateway Interface
 *
 * Unified interface for all payment gateways (Stripe, Asaas, Mercado Pago).
 * Implements Strategy pattern for interchangeable payment processors.
 *
 * @example
 * const gateway: IPaymentGateway = PaymentGatewayFactory.create('stripe');
 * const result = await gateway.createSubscription(input);
 */
export interface IPaymentGateway {
  /**
   * Create a recurring subscription
   */
  createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionOutput>;

  /**
   * Cancel a subscription
   */
  cancelSubscription(subscriptionId: string): Promise<void>;

  /**
   * Update subscription (change plan, payment method, etc.)
   */
  updateSubscription(
    subscriptionId: string,
    updates: Partial<CreateSubscriptionInput>
  ): Promise<void>;

  /**
   * Process a one-time payment
   */
  processPayment(input: ProcessPaymentInput): Promise<ProcessPaymentOutput>;

  /**
   * Handle webhook events from the gateway
   * Must validate webhook signature
   */
  handleWebhook(payload: any, signature: string): Promise<WebhookEvent>;

  /**
   * Get customer details
   */
  getCustomer(customerId: string): Promise<Customer>;

  /**
   * Create a new customer
   */
  createCustomer(customer: { name: string; email: string; cpfCnpj: string }): Promise<Customer>;

  /**
   * Get gateway name
   */
  getName(): PaymentGateway;
}
