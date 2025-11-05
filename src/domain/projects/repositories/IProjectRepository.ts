import { Project } from '../entities/Project';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Real-time Event Interface
 */
export interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  data: any;
}

/**
 * Project Filter Options
 */
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

/**
 * IProjectRepository Interface
 *
 * Repository interface for Project aggregate persistence.
 * Follows Repository pattern from DDD.
 *
 * Implementations should:
 * - Handle transaction management
 * - Map between domain entities and database models
 * - Provide optimistic locking for concurrent updates
 * - Support real-time subscriptions
 *
 * @example
 * const repository = new SupabaseProjectRepository(supabase);
 * const project = new Project({ ... });
 * await repository.save(project);
 */
export interface IProjectRepository {
  /**
   * Save a new project
   *
   * @param project - Project to save
   * @returns Saved project with generated ID
   * @throws {DatabaseError} if save fails
   */
  save(project: Project): Promise<Project>;

  /**
   * Find project by ID
   *
   * @param id - Project ID
   * @returns Project or null if not found
   * @throws {DatabaseError} if query fails
   */
  findById(id: string): Promise<Project | null>;

  /**
   * Find all projects with optional filters
   *
   * @param filters - Filter options
   * @returns Array of projects
   * @throws {DatabaseError} if query fails
   */
  findAll(filters?: ProjectFilterOptions): Promise<Project[]>;

  /**
   * Find projects by user ID (owned or shared)
   *
   * @param userId - User ID
   * @param includeShared - Include projects shared with user
   * @returns Array of projects
   * @throws {DatabaseError} if query fails
   */
  findByUserId(userId: string, includeShared?: boolean): Promise<Project[]>;

  /**
   * Update existing project
   *
   * @param project - Project to update
   * @returns Updated project
   * @throws {NotFoundError} if project doesn't exist
   * @throws {DatabaseError} if update fails
   */
  update(project: Project): Promise<Project>;

  /**
   * Delete project by ID
   *
   * Cascades to all units in the project.
   *
   * @param id - Project ID
   * @throws {NotFoundError} if project doesn't exist
   * @throws {DatabaseError} if delete fails
   */
  delete(id: string): Promise<void>;

  /**
   * Check if project exists
   *
   * @param id - Project ID
   * @returns true if exists
   * @throws {DatabaseError} if query fails
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count total projects
   *
   * @param filters - Optional filters
   * @returns Count of projects
   * @throws {DatabaseError} if query fails
   */
  count(filters?: ProjectFilterOptions): Promise<number>;

  /**
   * Subscribe to real-time updates for a project
   *
   * @param projectId - Project ID to subscribe to
   * @param callback - Callback function for updates
   * @returns RealtimeChannel for managing subscription
   */
  subscribeToProject(
    projectId: string,
    callback: (event: RealtimeEvent) => void
  ): RealtimeChannel;

  /**
   * Subscribe to real-time updates for all user's projects
   *
   * @param userId - User ID
   * @param callback - Callback function for updates
   * @returns RealtimeChannel for managing subscription
   */
  subscribeToUserProjects(
    userId: string,
    callback: (event: RealtimeEvent) => void
  ): RealtimeChannel;
}
