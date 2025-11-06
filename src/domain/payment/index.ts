/**
 * Payment Domain Exports
 *
 * Centralized export of all payment domain classes and interfaces.
 */

// Value Objects
export { CPF } from './value-objects/CPF';
export { CNPJ } from './value-objects/CNPJ';
export { TaxDocument, type TaxDocumentType } from './value-objects/TaxDocument';

// Entities
export {
  PaymentMethod,
  type PaymentMethodType,
  type CreditCardDetails,
  type PixDetails,
  type BoletoDetails,
  type PaymentMethodDetails,
} from './entities/PaymentMethod';

export { Transaction, type TransactionStatus, type PaymentGateway } from './entities/Transaction';

export { Invoice, type InvoiceStatus } from './entities/Invoice';

export {
  Subscription,
  type SubscriptionStatus,
  type SubscriptionPlan,
  type SubscriptionParams,
} from './entities/Subscription';

// Repositories
export type { ISubscriptionRepository } from './repositories/ISubscriptionRepository';
export type { IPaymentRepository } from './repositories/IPaymentRepository';

// Gateways
export {
  type IPaymentGateway,
  type CreateSubscriptionInput,
  type CreateSubscriptionOutput,
  type ProcessPaymentInput,
  type ProcessPaymentOutput,
  type WebhookEvent,
  type Customer,
} from './gateways/IPaymentGateway';
