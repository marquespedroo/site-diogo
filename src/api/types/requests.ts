/**
 * API Request Types
 *
 * Type definitions for API request payloads.
 */

/**
 * Create Calculator Request
 */
export interface CreateCalculatorRequest {
  userId: string;
  propertyValue: number;
  captationPercentage: number;
  completionDate: {
    month: number;
    year: number;
  };
  entryPayments: {
    name: string;
    installments: Array<{
      id: string;
      amount: number;
      dueDate: string;
      description: string;
    }>;
  };
  duringConstructionPayments: {
    name: string;
    installments: Array<{
      id: string;
      amount: number;
      dueDate: string;
      description: string;
    }>;
  };
  habiteSe: number;
  postConstructionPayments: {
    name: string;
    installments: Array<{
      id: string;
      amount: number;
      dueDate: string;
      description: string;
    }>;
  };
}

/**
 * Update Calculator Request
 */
export interface UpdateCalculatorRequest {
  id: string;
  propertyValue?: number;
  captationPercentage?: number;
  completionDate?: {
    month: number;
    year: number;
  };
  entryPayments?: {
    name: string;
    installments: Array<{
      id: string;
      amount: number;
      dueDate: string;
      description: string;
    }>;
  };
  duringConstructionPayments?: {
    name: string;
    installments: Array<{
      id: string;
      amount: number;
      dueDate: string;
      description: string;
    }>;
  };
  habiteSe?: number;
  postConstructionPayments?: {
    name: string;
    installments: Array<{
      id: string;
      amount: number;
      dueDate: string;
      description: string;
    }>;
  };
}

/**
 * Generate Shareable Link Request
 */
export interface GenerateShareableLinkRequest {
  calculatorId: string;
  userId: string;
}

/**
 * Load Calculator Request (query params)
 */
export interface LoadCalculatorRequest {
  shortCode: string;
}

/**
 * List Calculators Request (query params)
 */
export interface ListCalculatorsRequest {
  userId: string;
  limit?: number;
  offset?: number;
}
