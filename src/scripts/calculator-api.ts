/**
 * Calculator API Client
 *
 * Provides methods to interact with calculator API endpoints.
 */

import type {
  CreateCalculatorRequest,
  UpdateCalculatorRequest,
  GenerateShareableLinkRequest,
  LoadCalculatorRequest,
  ListCalculatorsRequest,
} from '../api/types/requests';

import type {
  SuccessResponse,
  ErrorResponse,
  CreateCalculatorResponse,
  LoadCalculatorResponse,
  GenerateShareableLinkResponse,
  ListCalculatorsResponse,
} from '../api/types/responses';

export class CalculatorAPI {
  private baseUrl: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // ms

  constructor(baseUrl: string = '/api/calculator') {
    this.baseUrl = baseUrl;
  }

  /**
   * Creates a new calculator with the provided data
   */
  async create(data: CreateCalculatorRequest): Promise<CreateCalculatorResponse> {
    return this.fetchWithRetry<CreateCalculatorResponse>(
      `${this.baseUrl}/create`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
  }

  /**
   * Updates an existing calculator
   */
  async update(data: UpdateCalculatorRequest): Promise<CreateCalculatorResponse> {
    return this.fetchWithRetry<CreateCalculatorResponse>(
      `${this.baseUrl}/update`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );
  }

  /**
   * Loads a calculator by its short code
   */
  async load(shortCode: string): Promise<LoadCalculatorResponse> {
    const params = new URLSearchParams({ shortCode });

    return this.fetchWithRetry<LoadCalculatorResponse>(
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
   * Generates a shareable link for a calculator
   * Returns the full shareable URL
   */
  async generateShareableLink(
    calculatorId: string,
    userId: string
  ): Promise<string> {
    const requestData: GenerateShareableLinkRequest = {
      calculatorId,
      userId,
    };

    const response = await this.fetchWithRetry<GenerateShareableLinkResponse>(
      `${this.baseUrl}/share`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      }
    );

    // Build full URL for sharing
    const origin = window.location.origin;
    return `${origin}/calculator-shared.html?code=${response.shortCode}`;
  }

  /**
   * Lists all calculators for a user
   */
  async list(
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<ListCalculatorsResponse> {
    const params = new URLSearchParams({
      userId,
      limit: limit.toString(),
      offset: offset.toString(),
    });

    return this.fetchWithRetry<ListCalculatorsResponse>(
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
      if (
        retryCount < this.maxRetries &&
        this.isRetryableError(error)
      ) {
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
      // Retry on 5xx server errors and specific 4xx errors
      return (
        error.statusCode >= 500 ||
        error.statusCode === 429 || // Rate limit
        error.statusCode === 408    // Request timeout
      );
    }

    // Retry on network errors
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
export const calculatorAPI = new CalculatorAPI();
