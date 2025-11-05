import { z } from 'zod';

/**
 * Validation Schemas for Calculator API
 *
 * Uses Zod for runtime type validation and type inference.
 * All API inputs should be validated against these schemas.
 */

// Installment Schema
export const InstallmentSchema = z.object({
  id: z.string().min(1),
  amount: z.number().positive(),
  dueDate: z.string().datetime(),
  description: z.string().min(1),
});

// Payment Phase Schema
export const PaymentPhaseSchema = z.object({
  name: z.string().min(1),
  installments: z.array(InstallmentSchema),
});

// Completion Date Schema
export const CompletionDateSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024).max(2100),
});

// Create Calculator Request Schema
export const CreateCalculatorSchema = z.object({
  userId: z.string().min(1),
  propertyValue: z.number().positive().max(100000000), // Max R$ 100M
  captationPercentage: z.number().min(0).max(100),
  completionDate: CompletionDateSchema,
  entryPayments: PaymentPhaseSchema,
  duringConstructionPayments: PaymentPhaseSchema,
  habiteSe: z.number().nonnegative(),
  postConstructionPayments: PaymentPhaseSchema,
});

// Update Calculator Schema (all fields optional except id)
export const UpdateCalculatorSchema = z.object({
  id: z.string().min(1),
  propertyValue: z.number().positive().max(100000000).optional(),
  captationPercentage: z.number().min(0).max(100).optional(),
  completionDate: CompletionDateSchema.optional(),
  entryPayments: PaymentPhaseSchema.optional(),
  duringConstructionPayments: PaymentPhaseSchema.optional(),
  habiteSe: z.number().nonnegative().optional(),
  postConstructionPayments: PaymentPhaseSchema.optional(),
});

// Generate Short Code Request Schema
export const GenerateShortCodeSchema = z.object({
  calculatorId: z.string().min(1),
  userId: z.string().min(1),
});

// Load Calculator by Short Code Schema
export const LoadByShortCodeSchema = z.object({
  shortCode: z.string().length(6).regex(/^[a-z0-9]+$/),
});

// Type exports for TypeScript
export type CreateCalculatorInput = z.infer<typeof CreateCalculatorSchema>;
export type UpdateCalculatorInput = z.infer<typeof UpdateCalculatorSchema>;
export type GenerateShortCodeInput = z.infer<typeof GenerateShortCodeSchema>;
export type LoadByShortCodeInput = z.infer<typeof LoadByShortCodeSchema>;
