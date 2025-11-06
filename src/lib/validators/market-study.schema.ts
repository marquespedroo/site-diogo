import { z } from 'zod';

/**
 * Validation Schemas for Market Study API
 *
 * Uses Zod for runtime type validation and type inference.
 * All API inputs should be validated against these schemas.
 */

// Property Address Schema
export const PropertyAddressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  number: z.string().min(1, 'Number is required'),
  neighborhood: z.string().min(1, 'Neighborhood is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be a 2-letter code (e.g., SP, RJ)'),
  complement: z.string().optional(),
  postalCode: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, 'Postal code must be in format XXXXX-XXX')
    .optional(),
});

// Property Characteristics Schema
export const PropertyCharacteristicsSchema = z.object({
  bedrooms: z.number().int().nonnegative().max(50),
  bathrooms: z.number().int().nonnegative().max(50),
  parkingSpots: z.number().int().nonnegative().max(50),
  additionalFeatures: z.array(z.string()).optional().default([]),
});

// Market Sample Schema
export const MarketSampleSchema = z.object({
  location: z.string().min(1, 'Location is required'),
  area: z.number().positive('Area must be positive'),
  price: z.number().positive('Price must be positive'),
  status: z.enum(['for_sale', 'sold', 'rented'], {
    errorMap: () => ({ message: 'Status must be for_sale, sold, or rented' }),
  }),
  characteristics: z.record(z.string(), z.number()),
  listingDate: z.string().datetime().optional(),
  saleDate: z.string().datetime().optional(),
});

// Property Standard Schema
export const PropertyStandardSchema = z.enum([
  'original',
  'basic',
  'renovated',
  'modernized',
  'high_end',
]);

// Create Market Study Schema
export const CreateMarketStudySchema = z
  .object({
    userId: z.string().min(1, 'User ID is required'),
    propertyAddress: PropertyAddressSchema,
    propertyArea: z.number().positive('Property area must be positive'),
    propertyCharacteristics: PropertyCharacteristicsSchema,
    evaluationType: z.enum(['sale', 'rent'], {
      errorMap: () => ({ message: 'Evaluation type must be sale or rent' }),
    }),
    factorNames: z.array(z.string()).min(1, 'At least one comparison factor is required'),
    samples: z
      .array(MarketSampleSchema)
      .min(3, 'Minimum 3 samples required for reliable valuation')
      .max(50, 'Maximum 50 samples allowed'),
    perceptionFactor: z
      .number()
      .min(-50, 'Perception factor cannot be less than -50%')
      .max(50, 'Perception factor cannot exceed 50%')
      .optional()
      .default(0),
  })
  .strict();

// Update Market Study Schema
export const UpdateMarketStudySchema = z
  .object({
    id: z.string().min(1, 'Market study ID is required'),
    selectedStandard: PropertyStandardSchema.optional(),
    agentLogo: z.string().url('Agent logo must be a valid URL').optional(),
  })
  .strict();

// Generate PDF Schema
export const GeneratePDFSchema = z
  .object({
    marketStudyId: z.string().min(1, 'Market study ID is required'),
    userId: z.string().min(1, 'User ID is required'),
  })
  .strict();

// Generate Slides Schema
export const GenerateSlidesSchema = z
  .object({
    marketStudyId: z.string().min(1, 'Market study ID is required'),
    userId: z.string().min(1, 'User ID is required'),
  })
  .strict();

// Load Market Study Schema
export const LoadMarketStudySchema = z.object({
  id: z.string().min(1, 'Market study ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

// List Market Studies Schema
export const ListMarketStudiesSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  limit: z.number().int().positive().max(100).optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
});

// Search by Location Schema
export const SearchByLocationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  city: z.string().min(1, 'City is required'),
  neighborhood: z.string().optional(),
});

// Delete Market Study Schema
export const DeleteMarketStudySchema = z.object({
  id: z.string().min(1, 'Market study ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

// Type exports for TypeScript
export type CreateMarketStudyInput = z.infer<typeof CreateMarketStudySchema>;
export type UpdateMarketStudyInput = z.infer<typeof UpdateMarketStudySchema>;
export type GeneratePDFInput = z.infer<typeof GeneratePDFSchema>;
export type GenerateSlidesInput = z.infer<typeof GenerateSlidesSchema>;
export type LoadMarketStudyInput = z.infer<typeof LoadMarketStudySchema>;
export type ListMarketStudiesInput = z.infer<typeof ListMarketStudiesSchema>;
export type SearchByLocationInput = z.infer<typeof SearchByLocationSchema>;
export type DeleteMarketStudyInput = z.infer<typeof DeleteMarketStudySchema>;
