import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import {
  IProjectRepository,
  ProjectFilterOptions,
  RealtimeEvent,
} from '../../domain/projects/repositories/IProjectRepository';
import { Project } from '../../domain/projects/entities/Project';
import { Unit } from '../../domain/projects/entities/Unit';
import { ProjectLocation } from '../../domain/projects/value-objects/ProjectLocation';
import { UnitIdentifier } from '../../domain/projects/value-objects/UnitIdentifier';
import { PropertyArea } from '../../domain/calculator/value-objects/PropertyArea';
import { Money } from '../../domain/calculator/value-objects/Money';
import { NotFoundError, DatabaseError } from '../../lib/errors';

/**
 * Database row type for projects table
 */
interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  location: {
    city: string;
    neighborhood: string;
    state: string;
  };
  shared_with: string[];
  created_at: string;
  updated_at: string;
  units?: UnitRow[];
}

/**
 * Database row type for units table
 */
interface UnitRow {
  id: string;
  project_id: string;
  tower: string;
  unit_number: string;
  area: number;
  price: number;
  parking_spots: string;
  origin: 'real' | 'permutante';
  status: 'available' | 'reserved' | 'sold' | 'unavailable';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Supabase Project Repository
 *
 * Implements IProjectRepository using Supabase as the persistence layer.
 * Handles mapping between Project domain entities and database rows.
 * Supports real-time subscriptions via Supabase Realtime.
 *
 * @example
 * const supabase = createClient();
 * const repository = new SupabaseProjectRepository(supabase);
 *
 * const project = new Project({ ... });
 * await repository.save(project);
 */
export class SupabaseProjectRepository implements IProjectRepository {
  private readonly supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Save a new project to the database
   *
   * Saves project and all associated units in a transaction.
   *
   * @param project - Project to save
   * @returns Saved project with database-generated ID
   * @throws {DatabaseError} if save operation fails
   */
  async save(project: Project): Promise<Project> {
    try {
      const json = project.toJSON();

      // Ensure ID is a valid UUID
      let id = json.id;
      if (!this.isValidUUID(id)) {
        id = crypto.randomUUID();
      }

      // Insert project
      const { data: projectData, error: projectError } = await this.supabase
        .from('projects')
        .insert({
          id,
          user_id: json.userId,
          name: json.name,
          description: json.description,
          location: json.location,
          shared_with: json.sharedWith,
        })
        .select()
        .single();

      if (projectError) {
        throw new DatabaseError(
          `Failed to save project: ${projectError.message}`,
          'save',
          projectError as Error
        );
      }

      // Insert units if any
      if (json.units && json.units.length > 0) {
        const unitsToInsert = json.units.map((unit: any) => ({
          id: this.isValidUUID(unit.id) ? unit.id : crypto.randomUUID(),
          project_id: id,
          tower: unit.identifier.tower,
          unit_number: unit.identifier.number,
          area: unit.area,
          price: unit.price,
          parking_spots: unit.parkingSpots,
          origin: unit.origin,
          status: unit.status,
          metadata: unit.metadata || {},
        }));

        const { error: unitsError } = await this.supabase
          .from('units')
          .insert(unitsToInsert);

        if (unitsError) {
          // Rollback project
          await this.supabase.from('projects').delete().eq('id', id);
          throw new DatabaseError(
            `Failed to save units: ${unitsError.message}`,
            'save',
            unitsError as Error
          );
        }
      }

      // Fetch complete project with units
      return await this.findById(id) as Project;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error saving project: ${(error as Error).message}`,
        'save',
        error as Error
      );
    }
  }

  /**
   * Find project by ID
   *
   * @param id - Project ID
   * @returns Project with all units or null if not found
   * @throws {DatabaseError} if query fails
   */
  async findById(id: string): Promise<Project | null> {
    try {
      // Fetch project with units
      const { data: projectData, error: projectError } = await this.supabase
        .from('projects')
        .select('*, units(*)')
        .eq('id', id)
        .single();

      if (projectError) {
        if (projectError.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError(
          `Failed to find project: ${projectError.message}`,
          'findById',
          projectError as Error
        );
      }

      if (!projectData) {
        return null;
      }

      return this.mapRowToProject(projectData as unknown as ProjectRow);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error finding project: ${(error as Error).message}`,
        'findById',
        error as Error
      );
    }
  }

  /**
   * Find all projects with optional filters
   *
   * @param filters - Filter options
   * @returns Array of projects
   * @throws {DatabaseError} if query fails
   */
  async findAll(filters: ProjectFilterOptions = {}): Promise<Project[]> {
    try {
      let query = this.supabase
        .from('projects')
        .select('*, units(*)');

      // Apply filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.sharedWith) {
        query = query.contains('shared_with', [filters.sharedWith]);
      }

      if (filters.city) {
        query = query.eq('location->>city', filters.city);
      }

      if (filters.state) {
        query = query.eq('location->>state', filters.state);
      }

      if (filters.searchTerm) {
        query = query.or(
          `name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`
        );
      }

      // Sorting
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';
      const sortColumn = sortBy === 'createdAt' ? 'created_at' : sortBy === 'updatedAt' ? 'updated_at' : sortBy;
      query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

      // Pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError(
          `Failed to find projects: ${error.message}`,
          'findAll',
          error as Error
        );
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((row) => this.mapRowToProject(row as unknown as ProjectRow));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error finding projects: ${(error as Error).message}`,
        'findAll',
        error as Error
      );
    }
  }

  /**
   * Find projects by user ID (owned or shared)
   *
   * @param userId - User ID
   * @param includeShared - Include projects shared with user
   * @returns Array of projects
   * @throws {DatabaseError} if query fails
   */
  async findByUserId(
    userId: string,
    includeShared: boolean = true
  ): Promise<Project[]> {
    try {
      let query = this.supabase
        .from('projects')
        .select('*, units(*)');

      if (includeShared) {
        // Find projects where user is owner OR user is in shared_with array
        query = query.or(
          `user_id.eq.${userId},shared_with.cs.{${userId}}`
        );
      } else {
        // Only owned projects
        query = query.eq('user_id', userId);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError(
          `Failed to find user projects: ${error.message}`,
          'findByUserId',
          error as Error
        );
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((row) => this.mapRowToProject(row as unknown as ProjectRow));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error finding user projects: ${(error as Error).message}`,
        'findByUserId',
        error as Error
      );
    }
  }

  /**
   * Update existing project
   *
   * Updates project details and manages units (adds new, updates existing, removes deleted).
   *
   * @param project - Project to update
   * @returns Updated project
   * @throws {NotFoundError} if project doesn't exist
   * @throws {DatabaseError} if update fails
   */
  async update(project: Project): Promise<Project> {
    try {
      const id = project.getId();
      const json = project.toJSON();

      // Update project
      const { data: projectData, error: projectError } = await this.supabase
        .from('projects')
        .update({
          name: json.name,
          description: json.description,
          location: json.location,
          shared_with: json.sharedWith,
        })
        .eq('id', id)
        .select()
        .single();

      if (projectError) {
        if (projectError.code === 'PGRST116') {
          throw new NotFoundError('Project', id);
        }
        throw new DatabaseError(
          `Failed to update project: ${projectError.message}`,
          'update',
          projectError as Error
        );
      }

      // Handle units: Delete all existing and re-insert
      // (Simpler than trying to diff and update individually)
      await this.supabase.from('units').delete().eq('project_id', id);

      if (json.units && json.units.length > 0) {
        const unitsToInsert = json.units.map((unit: any) => ({
          id: this.isValidUUID(unit.id) ? unit.id : crypto.randomUUID(),
          project_id: id,
          tower: unit.identifier.tower,
          unit_number: unit.identifier.number,
          area: unit.area,
          price: unit.price,
          parking_spots: unit.parkingSpots,
          origin: unit.origin,
          status: unit.status,
          metadata: unit.metadata || {},
        }));

        const { error: unitsError } = await this.supabase
          .from('units')
          .insert(unitsToInsert);

        if (unitsError) {
          throw new DatabaseError(
            `Failed to update units: ${unitsError.message}`,
            'update',
            unitsError as Error
          );
        }
      }

      // Fetch complete updated project
      return await this.findById(id) as Project;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error updating project: ${(error as Error).message}`,
        'update',
        error as Error
      );
    }
  }

  /**
   * Delete project by ID
   *
   * Cascades to all units in the project.
   *
   * @param id - Project ID
   * @throws {NotFoundError} if project doesn't exist
   * @throws {DatabaseError} if delete fails
   */
  async delete(id: string): Promise<void> {
    try {
      const { error, count } = await this.supabase
        .from('projects')
        .delete({ count: 'exact' })
        .eq('id', id);

      if (error) {
        throw new DatabaseError(
          `Failed to delete project: ${error.message}`,
          'delete',
          error as Error
        );
      }

      if (count === 0) {
        throw new NotFoundError('Project', id);
      }
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error deleting project: ${(error as Error).message}`,
        'delete',
        error as Error
      );
    }
  }

  /**
   * Check if project exists
   *
   * @param id - Project ID
   * @returns true if exists
   * @throws {DatabaseError} if query fails
   */
  async exists(id: string): Promise<boolean> {
    try {
      const { count, error } = await this.supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('id', id);

      if (error) {
        throw new DatabaseError(
          `Failed to check project existence: ${error.message}`,
          'exists',
          error as Error
        );
      }

      return (count ?? 0) > 0;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error checking project existence: ${(error as Error).message}`,
        'exists',
        error as Error
      );
    }
  }

  /**
   * Count total projects
   *
   * @param filters - Optional filters
   * @returns Count of projects
   * @throws {DatabaseError} if query fails
   */
  async count(filters: ProjectFilterOptions = {}): Promise<number> {
    try {
      let query = this.supabase
        .from('projects')
        .select('id', { count: 'exact', head: true });

      // Apply filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.city) {
        query = query.eq('location->>city', filters.city);
      }

      if (filters.state) {
        query = query.eq('location->>state', filters.state);
      }

      const { count, error } = await query;

      if (error) {
        throw new DatabaseError(
          `Failed to count projects: ${error.message}`,
          'count',
          error as Error
        );
      }

      return count ?? 0;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error counting projects: ${(error as Error).message}`,
        'count',
        error as Error
      );
    }
  }

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
  ): RealtimeChannel {
    const channel = this.supabase
      .channel(`project:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'units',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          callback({
            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            data: payload.new || payload.old,
          });
        }
      )
      .subscribe();

    return channel;
  }

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
  ): RealtimeChannel {
    const channel = this.supabase
      .channel(`user-projects:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback({
            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            data: payload.new || payload.old,
          });
        }
      )
      .subscribe();

    return channel;
  }

  /**
   * Map database row to Project entity
   *
   * @private
   * @param row - Database row
   * @returns Project instance
   */
  private mapRowToProject(row: ProjectRow): Project {
    // Map units
    const units = (row.units || []).map((unitRow) => this.mapRowToUnit(unitRow));

    return new Project({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      location: ProjectLocation.fromJSON(row.location),
      description: row.description,
      units,
      sharedWith: row.shared_with || [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  /**
   * Map database row to Unit entity
   *
   * @private
   * @param row - Database row
   * @returns Unit instance
   */
  private mapRowToUnit(row: UnitRow): Unit {
    // Convert metadata to Map
    const metadata = new Map<string, any>();
    if (row.metadata && typeof row.metadata === 'object') {
      Object.entries(row.metadata).forEach(([key, value]) => {
        // Reconstruct Money objects
        if (
          value &&
          typeof value === 'object' &&
          'amount' in value &&
          'currency' in value
        ) {
          metadata.set(key, Money.fromJSON(value as any));
        }
        // Reconstruct Date objects
        else if (
          typeof value === 'string' &&
          /^\d{4}-\d{2}-\d{2}T/.test(value)
        ) {
          metadata.set(key, new Date(value));
        }
        // Keep other values as-is
        else {
          metadata.set(key, value);
        }
      });
    }

    return new Unit({
      id: row.id,
      projectId: row.project_id,
      identifier: new UnitIdentifier(row.tower, row.unit_number),
      area: new PropertyArea(row.area),
      price: new Money(row.price),
      parkingSpots: row.parking_spots,
      origin: row.origin,
      status: row.status,
      metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  /**
   * Check if a string is a valid UUID
   *
   * @private
   * @param str - String to check
   * @returns true if valid UUID
   */
  private isValidUUID(str: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }
}
