import { z } from 'zod';

/**
 * Validation Schemas for Projects API
 *
 * Uses Zod for runtime type validation and type inference.
 * All API inputs should be validated against these schemas.
 */

// ============================================================================
// Common Schemas
// ============================================================================

/**
 * Project Location Schema
 */
export const ProjectLocationSchema = z.object({
  city: z.string().min(1, 'City is required').max(100),
  neighborhood: z.string().min(1, 'Neighborhood is required').max(100),
  state: z
    .string()
    .length(2, 'State must be a 2-letter code')
    .regex(/^[A-Z]{2}$/, 'State must be uppercase letters'),
});

/**
 * Unit Identifier Schema
 */
export const UnitIdentifierSchema = z.object({
  tower: z.string().min(1, 'Tower is required').max(10),
  number: z.string().min(1, 'Unit number is required').max(20),
});

/**
 * Unit Status Schema
 */
export const UnitStatusSchema = z.enum([
  'available',
  'reserved',
  'sold',
  'unavailable',
]);

/**
 * Unit Origin Schema
 */
export const UnitOriginSchema = z.enum(['real', 'permutante']);

/**
 * Unit Schema
 */
export const UnitSchema = z.object({
  id: z.string().optional(),
  projectId: z.string().min(1),
  identifier: UnitIdentifierSchema,
  area: z.number().positive().max(100000, 'Area cannot exceed 100,000 m²'),
  price: z
    .number()
    .positive()
    .max(1000000000, 'Price cannot exceed R$ 1 billion'),
  parkingSpots: z.string().max(10),
  origin: UnitOriginSchema,
  status: UnitStatusSchema.optional(),
  metadata: z.record(z.any()).optional(),
});

// ============================================================================
// Project Schemas
// ============================================================================

/**
 * Create Project Schema
 */
export const CreateProjectSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(200, 'Project name cannot exceed 200 characters'),
  location: ProjectLocationSchema,
  description: z.string().max(2000, 'Description cannot exceed 2000 characters'),
});

/**
 * Update Project Schema
 */
export const UpdateProjectSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(200, 'Project name cannot exceed 200 characters')
    .optional(),
  location: ProjectLocationSchema.optional(),
  description: z
    .string()
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional(),
});

/**
 * Get Project Schema
 */
export const GetProjectSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
});

/**
 * List Projects Schema
 */
export const ListProjectsSchema = z.object({
  userId: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2).optional(),
  searchTerm: z.string().optional(),
  includeShared: z.boolean().optional().default(true),
  limit: z.number().int().positive().max(100).optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
  sortBy: z
    .enum(['name', 'createdAt', 'updatedAt'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Share Project Schema
 */
export const ShareProjectSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

/**
 * Delete Project Schema
 */
export const DeleteProjectSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
});

// ============================================================================
// Unit Schemas
// ============================================================================

/**
 * Create Unit Schema
 */
export const CreateUnitSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  tower: z.string().min(1, 'Tower is required').max(10),
  unitNumber: z.string().min(1, 'Unit number is required').max(20),
  area: z.number().positive().max(100000),
  price: z.number().positive().max(1000000000),
  parkingSpots: z.string().max(10),
  origin: UnitOriginSchema,
});

/**
 * Update Unit Status Schema
 */
export const UpdateUnitStatusSchema = z.object({
  unitId: z.string().min(1, 'Unit ID is required'),
  status: UnitStatusSchema,
  metadata: z
    .object({
      soldDate: z.string().datetime().optional(),
      soldPrice: z.number().positive().optional(),
      reservedBy: z.string().optional(),
      reservedUntil: z.string().datetime().optional(),
    })
    .optional(),
});

/**
 * Get Unit Schema
 */
export const GetUnitSchema = z.object({
  id: z.string().min(1, 'Unit ID is required'),
});

/**
 * List Units Schema
 */
export const ListUnitsSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  status: UnitStatusSchema.optional(),
  tower: z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  minArea: z.number().positive().optional(),
  maxArea: z.number().positive().optional(),
  origin: UnitOriginSchema.optional(),
  limit: z.number().int().positive().max(1000).optional().default(100),
  offset: z.number().int().nonnegative().optional().default(0),
  sortBy: z
    .enum(['price', 'area', 'createdAt', 'identifier'])
    .optional()
    .default('identifier'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

/**
 * Delete Unit Schema
 */
export const DeleteUnitSchema = z.object({
  id: z.string().min(1, 'Unit ID is required'),
});

// ============================================================================
// CSV Import/Export Schemas
// ============================================================================

/**
 * CSV Row Schema for Unit Import
 */
export const CSVUnitRowSchema = z.object({
  tower: z.string().min(1, 'Tower is required'),
  unitNumber: z.string().min(1, 'Unit number is required'),
  area: z
    .string()
    .transform((val) => parseFloat(val.replace(',', '.')))
    .pipe(z.number().positive()),
  price: z
    .string()
    .transform((val) => parseFloat(val.replace(/[^\d.,]/g, '').replace(',', '.')))
    .pipe(z.number().positive()),
  parkingSpots: z.string().default('0'),
  origin: z
    .string()
    .transform((val) => val.toLowerCase())
    .pipe(UnitOriginSchema),
});

/**
 * Bulk Import Units Schema
 */
export const BulkImportUnitsSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  units: z
    .array(CSVUnitRowSchema)
    .min(1, 'At least one unit is required')
    .max(10000, 'Cannot import more than 10,000 units at once'),
});

/**
 * Export Units Schema
 */
export const ExportUnitsSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  status: UnitStatusSchema.optional(),
  tower: z.string().optional(),
  format: z.enum(['csv', 'xlsx']).optional().default('csv'),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type GetProjectInput = z.infer<typeof GetProjectSchema>;
export type ListProjectsInput = z.infer<typeof ListProjectsSchema>;
export type ShareProjectInput = z.infer<typeof ShareProjectSchema>;
export type DeleteProjectInput = z.infer<typeof DeleteProjectSchema>;

export type CreateUnitInput = z.infer<typeof CreateUnitSchema>;
export type UpdateUnitStatusInput = z.infer<typeof UpdateUnitStatusSchema>;
export type GetUnitInput = z.infer<typeof GetUnitSchema>;
export type ListUnitsInput = z.infer<typeof ListUnitsSchema>;
export type DeleteUnitInput = z.infer<typeof DeleteUnitSchema>;

export type CSVUnitRow = z.infer<typeof CSVUnitRowSchema>;
export type BulkImportUnitsInput = z.infer<typeof BulkImportUnitsSchema>;
export type ExportUnitsInput = z.infer<typeof ExportUnitsSchema>;
