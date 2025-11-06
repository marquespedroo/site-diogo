/**
 * Projects API Client
 *
 * Provides methods to interact with projects and units API endpoints.
 * Follows the same pattern as calculator-api.ts and market-study-api.ts.
 *
 * NOTE: This API client is a CONTRACT that defines the interface between
 * frontend and backend. Backend endpoints MUST implement these exact signatures.
 */

import type {
  SuccessResponse,
  ErrorResponse,
} from '../api/types/responses';

/**
 * Type Definitions (matching domain entities)
 */
export type UnitStatus = 'available' | 'reserved' | 'sold' | 'unavailable';
export type UnitOrigin = 'real' | 'permutante';

export interface ProjectLocation {
  city: string;
  neighborhood: string;
  state: string;
}

export interface UnitIdentifier {
  tower: string;
  number: string;
}

export interface UnitData {
  id: string;
  projectId: string;
  tower: string;
  number: string;
  area: number;
  price: number;
  parkingSpots: string;
  origin: UnitOrigin;
  status: UnitStatus;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectData {
  id: string;
  userId: string;
  name: string;
  location: ProjectLocation;
  description: string;
  units: UnitData[];
  sharedWith: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStatistics {
  totalUnits: number;
  availableUnits: number;
  soldUnits: number;
  reservedUnits: number;
  totalValue: number;
  averagePricePerSqM: number;
  minPrice: number;
  maxPrice: number;
}

/**
 * Request Types
 */
export interface CreateProjectRequest {
  userId: string;
  name: string;
  location: ProjectLocation;
  description: string;
}

export interface UpdateProjectRequest {
  id: string;
  name?: string;
  location?: ProjectLocation;
  description?: string;
}

export interface CreateUnitRequest {
  projectId: string;
  tower: string;
  number: string;
  area: number;
  price: number;
  parkingSpots: string;
  origin: UnitOrigin;
  status?: UnitStatus;
}

export interface UpdateUnitRequest {
  id: string;
  projectId: string;
  tower?: string;
  number?: string;
  area?: number;
  price?: number;
  parkingSpots?: string;
  origin?: UnitOrigin;
  status?: UnitStatus;
}

export interface ProjectFilterOptions {
  userId?: string;
  sharedWith?: string;
  city?: string;
  state?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UnitFilterOptions {
  projectId?: string;
  status?: UnitStatus;
  tower?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  origin?: UnitOrigin;
  limit?: number;
  offset?: number;
  sortBy?: 'price' | 'area' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Response Types
 */
export interface CreateProjectResponse {
  id: string;
  name: string;
  location: ProjectLocation;
  description: string;
  createdAt: string;
}

export interface LoadProjectResponse extends ProjectData {}

export interface ListProjectsResponse {
  projects: ProjectData[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateUnitResponse {
  id: string;
  projectId: string;
  tower: string;
  number: string;
  createdAt: string;
}

export interface LoadUnitResponse extends UnitData {}

export interface ListUnitsResponse {
  units: UnitData[];
  total: number;
  limit: number;
  offset: number;
}

export interface ProjectStatisticsResponse {
  projectId: string;
  statistics: ProjectStatistics;
}

/**
 * Projects API Client Class
 */
export class ProjectsAPI {
  private baseUrl: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // ms

  constructor(baseUrl: string = '/api/projects') {
    this.baseUrl = baseUrl;
  }

  // ============================================================================
  // Project Operations
  // ============================================================================

  /**
   * Creates a new project
   */
  async createProject(data: CreateProjectRequest): Promise<CreateProjectResponse> {
    return this.fetchWithRetry<CreateProjectResponse>(`${this.baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * Loads a project by its ID (includes units)
   */
  async loadProject(id: string): Promise<LoadProjectResponse> {
    return this.fetchWithRetry<LoadProjectResponse>(`${this.baseUrl}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Lists all projects for a user
   */
  async listProjects(filters: ProjectFilterOptions = {}): Promise<ListProjectsResponse> {
    const params = new URLSearchParams();

    if (filters.userId) params.append('userId', filters.userId);
    if (filters.sharedWith) params.append('sharedWith', filters.sharedWith);
    if (filters.city) params.append('city', filters.city);
    if (filters.state) params.append('state', filters.state);
    if (filters.searchTerm) params.append('searchTerm', filters.searchTerm);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    return this.fetchWithRetry<ListProjectsResponse>(
      `${this.baseUrl}?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  /**
   * Updates an existing project
   */
  async updateProject(data: UpdateProjectRequest): Promise<ProjectData> {
    const { id, ...updateData } = data;
    return this.fetchWithRetry<ProjectData>(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });
  }

  /**
   * Deletes a project (cascades to all units)
   */
  async deleteProject(id: string): Promise<void> {
    await this.fetchWithRetry<void>(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Gets project statistics
   */
  async getProjectStatistics(id: string): Promise<ProjectStatisticsResponse> {
    return this.fetchWithRetry<ProjectStatisticsResponse>(
      `${this.baseUrl}/${id}/statistics`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // ============================================================================
  // Unit Operations
  // ============================================================================

  /**
   * Creates a new unit in a project
   */
  async createUnit(data: CreateUnitRequest): Promise<CreateUnitResponse> {
    const { projectId, ...unitData } = data;
    return this.fetchWithRetry<CreateUnitResponse>(
      `${this.baseUrl}/${projectId}/units`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(unitData),
      }
    );
  }

  /**
   * Loads a specific unit
   */
  async loadUnit(projectId: string, unitId: string): Promise<LoadUnitResponse> {
    return this.fetchWithRetry<LoadUnitResponse>(
      `${this.baseUrl}/${projectId}/units/${unitId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  /**
   * Lists all units in a project or with filters
   */
  async listUnits(filters: UnitFilterOptions = {}): Promise<ListUnitsResponse> {
    const { projectId, ...queryFilters } = filters;

    if (!projectId) {
      throw new Error('projectId is required for listUnits');
    }

    const params = new URLSearchParams();

    if (queryFilters.status) params.append('status', queryFilters.status);
    if (queryFilters.tower) params.append('tower', queryFilters.tower);
    if (queryFilters.minPrice) params.append('minPrice', queryFilters.minPrice.toString());
    if (queryFilters.maxPrice) params.append('maxPrice', queryFilters.maxPrice.toString());
    if (queryFilters.minArea) params.append('minArea', queryFilters.minArea.toString());
    if (queryFilters.maxArea) params.append('maxArea', queryFilters.maxArea.toString());
    if (queryFilters.origin) params.append('origin', queryFilters.origin);
    if (queryFilters.limit) params.append('limit', queryFilters.limit.toString());
    if (queryFilters.offset) params.append('offset', queryFilters.offset.toString());
    if (queryFilters.sortBy) params.append('sortBy', queryFilters.sortBy);
    if (queryFilters.sortOrder) params.append('sortOrder', queryFilters.sortOrder);

    return this.fetchWithRetry<ListUnitsResponse>(
      `${this.baseUrl}/${projectId}/units?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  /**
   * Updates an existing unit
   */
  async updateUnit(data: UpdateUnitRequest): Promise<UnitData> {
    const { id, projectId, ...updateData } = data;
    return this.fetchWithRetry<UnitData>(
      `${this.baseUrl}/${projectId}/units/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      }
    );
  }

  /**
   * Deletes a unit
   */
  async deleteUnit(projectId: string, unitId: string): Promise<void> {
    await this.fetchWithRetry<void>(
      `${this.baseUrl}/${projectId}/units/${unitId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  /**
   * Exports units to CSV
   */
  async exportUnitsCSV(projectId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/${projectId}/units/export`, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv',
      },
    });

    if (!response.ok) {
      throw new APIError(
        'Failed to export CSV',
        'EXPORT_ERROR',
        response.status
      );
    }

    return response.blob();
  }

  /**
   * Imports units from CSV
   */
  async importUnitsCSV(projectId: string, file: File): Promise<{ added: number; errors: Array<{ row: number; error: string }> }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/${projectId}/units/import`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorData = data as ErrorResponse;
      throw new APIError(
        errorData.error.message,
        errorData.error.code,
        response.status,
        errorData.error.details
      );
    }

    const successData = data as SuccessResponse<{ added: number; errors: Array<{ row: number; error: string }> }>;
    return successData.data;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

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

      // Handle void responses (DELETE operations)
      if (response.status === 204 || response.status === 200 && !response.headers.get('content-type')?.includes('application/json')) {
        return undefined as T;
      }

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
export const projectsAPI = new ProjectsAPI();
