import { type IUnitRepository } from '@/domain/projects/repositories/IUnitRepository';
import { Unit } from '@/domain/projects/entities/Unit';
import { UnitIdentifier } from '@/domain/projects/value-objects/UnitIdentifier';
import { PropertyArea } from '@/domain/calculator/value-objects/PropertyArea';
import { Money } from '@/domain/calculator/value-objects/Money';
import { CSVUnitRowSchema } from '@/lib/validators/projects.schema';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/api/types/responses';
import {
  ValidationError,
  DatabaseError,
  BaseError,
} from '@/lib/errors';
import { ZodError } from 'zod';

/**
 * Unit Repository Instance
 * Injected at runtime via setRepository()
 */
let repository: IUnitRepository;

/**
 * Set the repository instance (Dependency Injection)
 * Called by the DI container at application startup
 *
 * @param repo - Unit repository implementation
 */
export function setRepository(repo: IUnitRepository): void {
  repository = repo;
}

/**
 * POST /api/projects/units-import?projectId=project-id
 *
 * Imports units from CSV file.
 * Validates projectId query parameter.
 * Parses CSV file from FormData.
 * Creates Unit entities and saves via repository.
 * Returns summary with count of added units and errors.
 *
 * @param request - HTTP POST request with projectId query parameter and CSV file in FormData
 * @returns Response with import summary
 *
 * @example
 * POST /api/projects/units-import?projectId=proj-abc123
 * Content-Type: multipart/form-data
 *
 * file: units.csv
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "added": 45,
 *     "errors": [
 *       {
 *         "row": 3,
 *         "error": "Invalid area value"
 *       }
 *     ]
 *   }
 * }
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // Check if repository is injected
    if (!repository) {
      throw new DatabaseError(
        'Repository not initialized',
        'import'
      );
    }

    // Parse query parameters from URL
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');

    if (!projectId) {
      throw new ValidationError('Project ID is required in query parameter', [
        { field: 'projectId', message: 'Project ID is required' },
      ]);
    }

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new ValidationError('CSV file is required', [
        { field: 'file', message: 'CSV file is required' },
      ]);
    }

    // Read file content
    const fileContent = await file.text();
    const lines = fileContent.split('\n').filter((line) => line.trim().length > 0);

    if (lines.length < 2) {
      throw new ValidationError('CSV file must contain at least a header and one data row', [
        { field: 'file', message: 'CSV file is empty or invalid' },
      ]);
    }

    // Parse CSV (skip header)
    const header = lines[0].split(',').map((col) => col.trim());
    const dataLines = lines.slice(1);

    const units: Unit[] = [];
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < dataLines.length; i++) {
      const rowNumber = i + 2; // +2 because: 1 for header, 1 for 0-index
      const line = dataLines[i];
      const values = line.split(',').map((val) => val.trim());

      try {
        // Build CSV row object
        const csvRow = {
          tower: values[0] || '',
          unitNumber: values[1] || '',
          area: values[2] || '',
          price: values[3] || '',
          parkingSpots: values[4] || '0',
          origin: values[5] || '',
        };

        // Validate with Zod schema
        const validated = CSVUnitRowSchema.parse(csvRow);

        // Create Unit entity
        const unit = new Unit({
          projectId,
          identifier: new UnitIdentifier(validated.tower, validated.unitNumber),
          area: new PropertyArea(validated.area),
          price: new Money(validated.price),
          parkingSpots: validated.parkingSpots,
          origin: validated.origin,
          status: 'available', // Default status for imported units
        });

        units.push(unit);
      } catch (error) {
        const errorMessage = error instanceof ZodError
          ? error.errors.map((e) => e.message).join(', ')
          : (error as Error).message;

        errors.push({
          row: rowNumber,
          error: errorMessage,
        });
      }
    }

    // Save all valid units
    let savedCount = 0;
    if (units.length > 0) {
      try {
        const savedUnits = await repository.saveMany(units);
        savedCount = savedUnits.length;
      } catch (error) {
        throw new DatabaseError(
          `Failed to save units: ${(error as Error).message}`,
          'import',
          error as Error
        );
      }
    }

    // Build response data
    const responseData = {
      added: savedCount,
      errors,
    };

    // Return success response
    return new Response(
      JSON.stringify(createSuccessResponse(responseData)),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const validationError = new ValidationError(
        'Invalid request data',
        error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))
      );

      return new Response(
        JSON.stringify(
          createErrorResponse(
            validationError.code,
            validationError.message,
            validationError.details
          )
        ),
        {
          status: validationError.statusCode,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle custom application errors
    if (error instanceof BaseError) {
      return new Response(
        JSON.stringify(
          createErrorResponse(
            error.code,
            error.message,
            error.toJSON()
          )
        ),
        {
          status: error.statusCode,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle domain validation errors (from value objects/entities)
    if (error instanceof Error) {
      return new Response(
        JSON.stringify(
          createErrorResponse(
            'DOMAIN_VALIDATION_ERROR',
            error.message
          )
        ),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle unexpected errors
    console.error('Unexpected error in POST /api/projects/units-import:', error);
    return new Response(
      JSON.stringify(
        createErrorResponse(
          'INTERNAL_SERVER_ERROR',
          'An unexpected error occurred'
        )
      ),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
