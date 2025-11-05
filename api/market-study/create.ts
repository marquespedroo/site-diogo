import { type IMarketStudyRepository } from '@/domain/market-study/repositories/IMarketStudyRepository';
import { MarketStudy } from '@/domain/market-study/entities/MarketStudy';
import { MarketSample } from '@/domain/market-study/entities/MarketSample';
import { PropertyAddress } from '@/domain/market-study/value-objects/PropertyAddress';
import { PropertyArea } from '@/domain/market-study/value-objects/PropertyArea';
import { PropertyCharacteristics } from '@/domain/market-study/value-objects/PropertyCharacteristics';
import { ValuationService } from '@/domain/market-study/services/ValuationService';
import { Money } from '@/domain/calculator/value-objects/Money';
import { CreateMarketStudySchema } from '@/lib/validators/market-study.schema';
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
 * Market Study Repository Instance
 * Injected at runtime via setRepository()
 */
let repository: IMarketStudyRepository;

/**
 * Set the repository instance (Dependency Injection)
 * Called by the DI container at application startup
 *
 * @param repo - Market study repository implementation
 */
export function setRepository(repo: IMarketStudyRepository): void {
  repository = repo;
}

/**
 * POST /api/market-study/create
 *
 * Creates a new market study with property valuation analysis.
 * Implements the Comparative Method (NBR 14653-2).
 *
 * Process:
 * 1. Validate request data
 * 2. Build market samples with original prices
 * 3. Homogenize samples (apply adjustment factors)
 * 4. Perform statistical analysis (outlier detection, normality filtering)
 * 5. Calculate valuations for all property standards
 * 6. Create and persist MarketStudy aggregate
 *
 * @param request - HTTP POST request with market study data
 * @returns Response with market study ID and valuation results
 *
 * @example
 * POST /api/market-study/create
 * Content-Type: application/json
 *
 * {
 *   "userId": "user-123",
 *   "propertyAddress": {
 *     "street": "Rua das Flores",
 *     "number": "123",
 *     "neighborhood": "Centro",
 *     "city": "São Paulo",
 *     "state": "SP"
 *   },
 *   "propertyArea": 90,
 *   "propertyCharacteristics": {
 *     "bedrooms": 3,
 *     "bathrooms": 2,
 *     "parkingSpots": 2
 *   },
 *   "evaluationType": "sale",
 *   "factorNames": ["bedrooms", "bathrooms", "parkingSpots"],
 *   "samples": [
 *     {
 *       "location": "Rua A, 100",
 *       "area": 85,
 *       "price": 450000,
 *       "status": "sold",
 *       "characteristics": { "bedrooms": 3, "bathrooms": 2, "parkingSpots": 1 }
 *     },
 *     // ... more samples
 *   ],
 *   "perceptionFactor": 0
 * }
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // Check if repository is injected
    if (!repository) {
      throw new DatabaseError('Repository not initialized', 'create');
    }

    // Parse request body
    const body = await request.json();

    // Validate request with Zod schema
    const validated = CreateMarketStudySchema.parse(body);

    // Construct property address value object
    const propertyAddress = new PropertyAddress(
      validated.propertyAddress.street,
      validated.propertyAddress.number,
      validated.propertyAddress.neighborhood,
      validated.propertyAddress.city,
      validated.propertyAddress.state,
      validated.propertyAddress.complement,
      validated.propertyAddress.postalCode
    );

    // Construct property area value object
    const propertyArea = new PropertyArea(validated.propertyArea);

    // Construct property characteristics value object
    const propertyCharacteristics = new PropertyCharacteristics(
      validated.propertyCharacteristics.bedrooms,
      validated.propertyCharacteristics.bathrooms,
      validated.propertyCharacteristics.parkingSpots,
      validated.propertyCharacteristics.additionalFeatures || []
    );

    // Build market samples from request data (with zero homogenized value initially)
    const samples = validated.samples.map(
      (s) =>
        new MarketSample(
          crypto.randomUUID(),
          s.location,
          new PropertyArea(s.area),
          new Money(s.price),
          s.status,
          new Map(Object.entries(s.characteristics)),
          new Money(0), // Will be calculated during homogenization
          s.listingDate ? new Date(s.listingDate) : undefined,
          s.saleDate ? new Date(s.saleDate) : undefined
        )
    );

    // Initialize valuation service
    const valuationService = new ValuationService();

    // Homogenize samples by applying adjustment factors
    const targetCharacteristics = new Map<string, number>([
      ['bedrooms', validated.propertyCharacteristics.bedrooms],
      ['bathrooms', validated.propertyCharacteristics.bathrooms],
      ['parkingSpots', validated.propertyCharacteristics.parkingSpots],
    ]);

    const homogenizedSamples = valuationService.homogenizeSamples(samples, {
      characteristics: targetCharacteristics,
    });

    // Perform statistical analysis
    const analysis = valuationService.analyzeStatistics(homogenizedSamples);

    // Calculate valuations for all property standards
    const valuations = valuationService.calculateValuations(
      analysis,
      propertyArea,
      validated.perceptionFactor
    );

    // Create MarketStudy aggregate root
    const marketStudy = new MarketStudy({
      userId: validated.userId,
      propertyAddress,
      propertyArea,
      propertyCharacteristics,
      evaluationType: validated.evaluationType,
      factorNames: validated.factorNames,
      samples: homogenizedSamples,
      analysis,
      valuations,
    });

    // Persist via repository
    const savedMarketStudy = await repository.save(marketStudy);

    // Build response data
    const responseData = {
      id: savedMarketStudy.getId(),
      analysis: savedMarketStudy.getAnalysis().toJSON(),
      valuations: Array.from(savedMarketStudy.getValuations().entries()).map(
        ([standard, valuation]) => ({
          standard,
          ...valuation.toJSON(),
        })
      ),
      recommendedValuation: savedMarketStudy.getRecommendedValuation()?.toJSON(),
      createdAt: savedMarketStudy.getCreatedAt().toISOString(),
    };

    // Return success response
    return new Response(JSON.stringify(createSuccessResponse(responseData)), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': '99',
      },
    });
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
          createErrorResponse(error.code, error.message, error.toJSON())
        ),
        {
          status: error.statusCode,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle domain validation errors
    if (error instanceof Error) {
      return new Response(
        JSON.stringify(
          createErrorResponse('DOMAIN_VALIDATION_ERROR', error.message)
        ),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle unexpected errors
    console.error('Unexpected error in POST /api/market-study/create:', error);
    return new Response(
      JSON.stringify(
        createErrorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred')
      ),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
