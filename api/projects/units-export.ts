import { type IUnitRepository } from '@/domain/projects/repositories/IUnitRepository';
import { ExportUnitsSchema } from '@/lib/validators/projects.schema';
import {
  createErrorResponse,
} from '@/api/types/responses';
import {
  ValidationError,
  DatabaseError,
  BaseError,
} from '@/lib/errors';
import { z } from 'zod';

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
 * GET /api/projects/units-export?projectId=project-id
 *
 * Exports units to CSV format.
 * Validates projectId query parameter.
 * Retrieves units from repository.
 * Generates CSV file with all units.
 * Returns CSV file (Content-Type: text/csv).
 *
 * @param request - HTTP GET request with projectId query parameter
 * @returns Response with CSV file
 *
 * @example
 * GET /api/projects/units-export?projectId=proj-abc123
 *
 * Response:
 * Content-Type: text/csv
 * Content-Disposition: attachment; filename="units-proj-abc123.csv"
 *
 * tower,number,area,price,parkingSpots,origin,status
 * A,101,150,500000,2,real,available
 * A,102,150,500000,2,real,sold
 */
export async function GET(request: Request): Promise<Response> {
  try {
    // Check if repository is injected
    if (!repository) {
      throw new DatabaseError(
        'Repository not initialized',
        'export'
      );
    }

    // Parse query parameters from URL
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');

    // Validate query parameters
    const validated = ExportUnitsSchema.parse({ projectId });

    // Find all units in the project
    const units = await repository.findByProjectId(validated.projectId);

    // Build CSV content
    const csvHeader = 'tower,number,area,price,parkingSpots,origin,status\n';
    const csvRows = units.map((unit) => {
      const tower = unit.getIdentifier().getTower();
      const number = unit.getIdentifier().getNumber();
      const area = unit.getArea().getSquareMeters();
      const price = unit.getPrice().getAmount();
      const parkingSpots = unit.getParkingSpots();
      const origin = unit.getOrigin();
      const status = unit.getStatus();

      return `${tower},${number},${area},${price},${parkingSpots},${origin},${status}`;
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    // Return CSV response
    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="units-${validated.projectId}.csv"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const validationError = new ValidationError(
        'Invalid query parameters',
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

    // Handle unexpected errors
    console.error('Unexpected error in GET /api/projects/units-export:', error);
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
