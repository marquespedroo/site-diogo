/**
 * Market Study API Client
 *
 * Provides methods to interact with market study API endpoints.
 * Follows the same pattern as calculator-api.ts.
 */

import type {
  SuccessResponse,
  ErrorResponse,
} from '../api/types/responses';

/**
 * Market Study Request Types
 */
export interface CreateMarketStudyRequest {
  userId: string;
  propertyAddress: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  propertyArea: number;
  propertyCharacteristics: {
    bedrooms: number;
    bathrooms: number;
    parkingSpots: number;
  };
  samples: Array<{
    address: string;
    area: number;
    price: number;
    characteristics: {
      bedrooms: number;
      bathrooms: number;
      parkingSpots: number;
    };
  }>;
}

export interface LoadMarketStudyRequest {
  id: string;
}

export interface ListMarketStudiesRequest {
  userId: string;
  limit?: number;
  offset?: number;
}

export interface GeneratePDFRequest {
  id: string;
}

/**
 * Market Study Response Types
 */
export interface MarketStudyData {
  id: string;
  userId: string;
  propertyAddress: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  propertyArea: number;
  propertyCharacteristics: {
    bedrooms: number;
    bathrooms: number;
    parkingSpots: number;
  };
  samples: Array<{
    address: string;
    area: number;
    price: number;
    characteristics: {
      bedrooms: number;
      bathrooms: number;
      parkingSpots: number;
    };
  }>;
  valuation: {
    averageValue: number;
    minValue: number;
    maxValue: number;
    averagePricePerSqm: number;
    recommendedValue: number;
    valuationStandard: string;
  };
  statisticalAnalysis: {
    sampleCount: number;
    outliers: number[];
    coefficientOfVariation: number;
    standardDeviation: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateMarketStudyResponse {
  id: string;
  valuation: MarketStudyData['valuation'];
  statisticalAnalysis: MarketStudyData['statisticalAnalysis'];
  createdAt: string;
}

export interface LoadMarketStudyResponse extends MarketStudyData {}

export interface ListMarketStudiesResponse {
  studies: MarketStudyData[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Market Study API Client Class
 */
export class MarketStudyAPI {
  private baseUrl: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // ms

  constructor(baseUrl: string = '/api/market-study') {
    this.baseUrl = baseUrl;
  }

  /**
   * Creates a new market study with valuation
   */
  async create(data: CreateMarketStudyRequest): Promise<CreateMarketStudyResponse> {
    return this.fetchWithRetry<CreateMarketStudyResponse>(`${this.baseUrl}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Loads a market study by its ID
   */
  async load(id: string): Promise<LoadMarketStudyResponse> {
    const params = new URLSearchParams({ id });

    return this.fetchWithRetry<LoadMarketStudyResponse>(
      `${this.baseUrl}/load?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  /**
   * Lists all market studies for a user
   */
  async list(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<ListMarketStudiesResponse> {
    const params = new URLSearchParams({
      userId,
      limit: limit.toString(),
      offset: offset.toString(),
    });

    return this.fetchWithRetry<ListMarketStudiesResponse>(
      `${this.baseUrl}/list?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  /**
   * Generates a PDF report for a market study
   * Opens the PDF in a new tab
   */
  async generatePDF(id: string): Promise<void> {
    const url = `${this.baseUrl}/generate-pdf?id=${id}`;
    window.open(url, '_blank');
  }

  /**
   * Fetch with automatic retry logic for network errors
   */
  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit,
    retryCount: number = 0
  ): Promise<T> {
    try {
      const response = await fetch(url, options);

      // Parse response
      const data = await response.json();

      // Handle error responses
      if (!response.ok) {
        const errorData = data as ErrorResponse;
        throw new APIError(
          errorData.error.message,
          errorData.error.code,
          response.status,
          errorData.error.details
        );
      }

      // Extract data from success response
      const successData = data as SuccessResponse<T>;
      return successData.data;
    } catch (error) {
      // Retry on network errors
      if (retryCount < this.maxRetries && this.isRetryableError(error)) {
        await this.sleep(this.retryDelay * Math.pow(2, retryCount));
        return this.fetchWithRetry<T>(url, options, retryCount + 1);
      }

      // Re-throw if not retryable or max retries exceeded
      if (error instanceof APIError) {
        throw error;
      }

      throw new APIError(
        'Network error occurred',
        'NETWORK_ERROR',
        0,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Determines if an error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof APIError) {
      return (
        error.statusCode >= 500 ||
        error.statusCode === 429 ||
        error.statusCode === 408
      );
    }
    return true;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Custom API Error class
 */
export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Export singleton instance for convenience
 */
export const marketStudyAPI = new MarketStudyAPI();
