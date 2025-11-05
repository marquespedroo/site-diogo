/**
 * API Response Types
 *
 * Standard response formats for all API endpoints.
 * Follows consistent structure across the application.
 */

/**
 * Success Response
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
  };
}

/**
 * Error Response
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Create calculator response data
 */
export interface CreateCalculatorResponse {
  id: string;
  approvalStatus: {
    approved: boolean;
    requiredCaptation: number;
    actualCaptation: number;
    difference: number;
    percentagePaid: number;
  };
  createdAt: string;
}

/**
 * Load calculator response data
 */
export interface LoadCalculatorResponse {
  calculator: {
    id: string;
    userId: string;
    propertyValue: number;
    captationPercentage: number;
    completionDate: {
      month: number;
      year: number;
    };
    entryPayments: any;
    duringConstructionPayments: any;
    habiteSe: number;
    postConstructionPayments: any;
    shortCode?: string;
    viewCount: number;
    createdAt: string;
  };
  approvalStatus: {
    approved: boolean;
    requiredCaptation: number;
    actualCaptation: number;
    difference: number;
    percentagePaid: number;
  };
  owner?: {
    name: string;
    logo?: string;
  };
}

/**
 * Generate shareable link response data
 */
export interface GenerateShareableLinkResponse {
  shortUrl: string;
  shortCode: string;
  expiresAt: string | null;
}

/**
 * List calculators response data
 */
export interface ListCalculatorsResponse {
  calculators: Array<{
    id: string;
    propertyValue: number;
    approvalStatus: {
      approved: boolean;
      percentagePaid: number;
    };
    createdAt: string;
  }>;
  total: number;
}

/**
 * Helper function to create success response
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: SuccessResponse['meta']
): SuccessResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

/**
 * Helper function to create error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: any,
  meta?: ErrorResponse['meta']
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}
