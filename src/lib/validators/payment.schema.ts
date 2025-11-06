import { z } from 'zod';

/**
 * Validation Schemas for Payment API
 *
 * Uses Zod for runtime type validation and type inference.
 * All payment API inputs should be validated against these schemas.
 */

// ============================================================================
// Value Object Schemas
// ============================================================================

/**
 * CPF validation schema
 */
export const CPFSchema = z.string().regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, 'Invalid CPF format');

/**
 * CNPJ validation schema
 */
export const CNPJSchema = z
  .string()
  .regex(/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/, 'Invalid CNPJ format');

/**
 * Tax Document schema (CPF or CNPJ)
 */
export const TaxDocumentSchema = z.object({
  type: z.enum(['cpf', 'cnpj']),
  value: z.string().min(11).max(18),
});

// ============================================================================
// Payment Method Schemas
// ============================================================================

/**
 * Credit Card Details Schema
 */
export const CreditCardDetailsSchema = z.object({
  brand: z.string().min(1),
  last4: z
    .string()
    .length(4)
    .regex(/^\d{4}$/),
  expiryMonth: z.number().int().min(1).max(12),
  expiryYear: z.number().int().min(2024).max(2099),
  holderName: z.string().optional(),
});

/**
 * PIX Details Schema
 */
export const PixDetailsSchema = z.object({
  qrCode: z.string().min(1),
  qrCodeUrl: z.string().url(),
  expiresAt: z.string().datetime(),
});

/**
 * Boleto Details Schema
 */
export const BoletoDetailsSchema = z.object({
  barcodeNumber: z.string().min(1),
  barcodeUrl: z.string().url(),
  pdfUrl: z.string().url(),
  expiresAt: z.string().datetime(),
});

/**
 * Payment Method Type Schema
 */
export const PaymentMethodTypeSchema = z.enum(['credit_card', 'pix', 'boleto']);

// ============================================================================
// Subscription Schemas
// ============================================================================

/**
 * Subscription Plan Schema
 */
export const SubscriptionPlanSchema = z.enum(['FREE', 'BASIC', 'UNLIMITED', 'COMBO']);

/**
 * Subscription Status Schema
 */
export const SubscriptionStatusSchema = z.enum([
  'active',
  'cancelled',
  'past_due',
  'suspended',
  'expired',
]);

/**
 * Payment Gateway Schema
 */
export const PaymentGatewaySchema = z.enum(['stripe', 'mercadopago', 'asaas']);

// ============================================================================
// API Request Schemas
// ============================================================================

/**
 * Create Subscription Request Schema
 */
export const CreateSubscriptionSchema = z.object({
  userId: z.string().min(1),
  planId: SubscriptionPlanSchema,
  gateway: PaymentGatewaySchema,
  billingType: PaymentMethodTypeSchema,
  cpfCnpj: z.string().min(11).max(18),
  customerName: z.string().min(1).max(255),
  customerEmail: z.string().email(),
});

/**
 * Update Subscription Request Schema
 */
export const UpdateSubscriptionSchema = z.object({
  subscriptionId: z.string().min(1),
  planId: SubscriptionPlanSchema.optional(),
  paymentMethodId: z.string().optional(),
});

/**
 * Cancel Subscription Request Schema
 */
export const CancelSubscriptionSchema = z.object({
  subscriptionId: z.string().min(1),
  immediately: z.boolean().default(false),
  reason: z.string().optional(),
});

/**
 * Process Payment Request Schema
 */
export const ProcessPaymentSchema = z.object({
  userId: z.string().min(1),
  amount: z.number().positive().max(100000), // Max R$ 100k
  description: z.string().min(1).max(255),
  billingType: PaymentMethodTypeSchema,
  gateway: PaymentGatewaySchema,
  cpfCnpj: z.string().min(11).max(18),
  customerName: z.string().min(1).max(255),
  customerEmail: z.string().email(),
});

/**
 * Webhook Payload Schema (Asaas)
 */
export const AsaasWebhookSchema = z.object({
  event: z.string(),
  payment: z.any().optional(),
  subscription: z.any().optional(),
});

/**
 * Webhook Payload Schema (Stripe)
 */
export const StripeWebhookSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.any(),
  }),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof UpdateSubscriptionSchema>;
export type CancelSubscriptionInput = z.infer<typeof CancelSubscriptionSchema>;
export type ProcessPaymentInput = z.infer<typeof ProcessPaymentSchema>;
export type AsaasWebhookPayload = z.infer<typeof AsaasWebhookSchema>;
export type StripeWebhookPayload = z.infer<typeof StripeWebhookSchema>;
