import { SupabaseClient } from '@supabase/supabase-js';
import {
  IUnitRepository,
  UnitFilterOptions,
} from '../../domain/projects/repositories/IUnitRepository';
import { Unit } from '../../domain/projects/entities/Unit';
import { UnitIdentifier } from '../../domain/projects/value-objects/UnitIdentifier';
import { PropertyArea } from '../../domain/calculator/value-objects/PropertyArea';
import { Money } from '../../domain/calculator/value-objects/Money';
import { NotFoundError, DatabaseError } from '../../lib/errors';
import { isValidUUID } from '@/lib/utils/uuid';
import { PAGINATION } from '@/lib/constants';

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
 * Supabase Unit Repository
 *
 * Implements IUnitRepository using Supabase as the persistence layer.
 * Provides direct access to units for queries and bulk operations.
 *
 * Note: Units are typically managed through their parent Project aggregate,
 * but this repository provides direct access when needed.
 *
 * @example
 * const supabase = createClient();
 * const repository = new SupabaseUnitRepository(supabase);
 *
 * const units = await repository.findByProjectId('proj-123');
 */
export class SupabaseUnitRepository implements IUnitRepository {
  private readonly supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Save a new unit to the database
   *
   * @param unit - Unit to save
   * @returns Saved unit with database-generated ID
   * @throws {DatabaseError} if save operation fails
   */
  async save(unit: Unit): Promise<Unit> {
    try {
      const json = unit.toJSON();

      // Ensure ID is a valid UUID
      let id = json.id;
      if (!isValidUUID(id)) {
        id = crypto.randomUUID();
      }

      // Convert metadata Map to object
      const metadata: Record<string, any> = {};
      if (json.metadata && typeof json.metadata === 'object') {
        Object.entries(json.metadata).forEach(([key, value]) => {
          if (value instanceof Date) {
            metadata[key] = value.toISOString();
          } else if (value && typeof value === 'object' && 'amount' in value) {
            metadata[key] = value;
          } else {
            metadata[key] = value;
          }
        });
      }

      const { data, error } = await this.supabase
        .from('units')
        .insert({
          id,
          project_id: json.projectId,
          tower: json.identifier.tower,
          unit_number: json.identifier.number,
          area: json.area,
          price: json.price,
          parking_spots: json.parkingSpots,
          origin: json.origin,
          status: json.status,
          metadata,
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError(`Failed to save unit: ${error.message}`, 'save', error as Error);
      }

      if (!data) {
        throw new DatabaseError('Failed to save unit: No data returned', 'save');
      }

      return this.mapRowToUnit(data as UnitRow);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error saving unit: ${(error as Error).message}`,
        'save',
        error as Error
      );
    }
  }

  /**
   * Save multiple units at once (bulk insert)
   *
   * @param units - Array of units to save
   * @returns Array of saved units
   * @throws {DatabaseError} if save fails
   */
  async saveMany(units: Unit[]): Promise<Unit[]> {
    try {
      if (units.length === 0) {
        return [];
      }

      const unitsToInsert = units.map((unit) => {
        const json = unit.toJSON();
        const id = isValidUUID(json.id) ? json.id : crypto.randomUUID();

        // Convert metadata
        const metadata: Record<string, any> = {};
        if (json.metadata && typeof json.metadata === 'object') {
          Object.entries(json.metadata).forEach(([key, value]) => {
            if (value instanceof Date) {
              metadata[key] = value.toISOString();
            } else if (value && typeof value === 'object' && 'amount' in value) {
              metadata[key] = value;
            } else {
              metadata[key] = value;
            }
          });
        }

        return {
          id,
          project_id: json.projectId,
          tower: json.identifier.tower,
          unit_number: json.identifier.number,
          area: json.area,
          price: json.price,
          parking_spots: json.parkingSpots,
          origin: json.origin,
          status: json.status,
          metadata,
        };
      });

      const { data, error } = await this.supabase.from('units').insert(unitsToInsert).select();

      if (error) {
        throw new DatabaseError(
          `Failed to save units: ${error.message}`,
          'saveMany',
          error as Error
        );
      }

      if (!data) {
        throw new DatabaseError('Failed to save units: No data returned', 'saveMany');
      }

      return data.map((row) => this.mapRowToUnit(row as UnitRow));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error saving units: ${(error as Error).message}`,
        'saveMany',
        error as Error
      );
    }
  }

  /**
   * Find unit by ID
   *
   * @param id - Unit ID
   * @returns Unit or null if not found
   * @throws {DatabaseError} if query fails
   */
  async findById(id: string): Promise<Unit | null> {
    try {
      const { data, error } = await this.supabase.from('units').select('*').eq('id', id).single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new DatabaseError(
          `Failed to find unit: ${error.message}`,
          'findById',
          error as Error
        );
      }

      if (!data) {
        return null;
      }

      return this.mapRowToUnit(data as UnitRow);
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error finding unit: ${(error as Error).message}`,
        'findById',
        error as Error
      );
    }
  }

  /**
   * Find all units in a project
   *
   * @param projectId - Project ID
   * @returns Array of units
   * @throws {DatabaseError} if query fails
   */
  async findByProjectId(projectId: string): Promise<Unit[]> {
    try {
      const { data, error } = await this.supabase
        .from('units')
        .select('*')
        .eq('project_id', projectId)
        .order('tower', { ascending: true })
        .order('unit_number', { ascending: true });

      if (error) {
        throw new DatabaseError(
          `Failed to find units by project: ${error.message}`,
          'findByProjectId',
          error as Error
        );
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((row) => this.mapRowToUnit(row as UnitRow));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error finding units by project: ${(error as Error).message}`,
        'findByProjectId',
        error as Error
      );
    }
  }

  /**
   * Find units with filters
   *
   * @param filters - Filter options
   * @returns Array of units
   * @throws {DatabaseError} if query fails
   */
  async findAll(filters: UnitFilterOptions): Promise<Unit[]> {
    try {
      let query = this.supabase.from('units').select('*');

      // Apply filters
      if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.tower) {
        query = query.eq('tower', filters.tower);
      }

      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters.minArea !== undefined) {
        query = query.gte('area', filters.minArea);
      }

      if (filters.maxArea !== undefined) {
        query = query.lte('area', filters.maxArea);
      }

      if (filters.origin) {
        query = query.eq('origin', filters.origin);
      }

      // Sorting
      const sortBy = filters.sortBy || 'identifier';
      const sortOrder = filters.sortOrder || 'asc';

      if (sortBy === 'identifier') {
        query = query.order('tower', { ascending: sortOrder === 'asc' });
        query = query.order('unit_number', { ascending: sortOrder === 'asc' });
      } else {
        const sortColumn = sortBy === 'createdAt' ? 'created_at' : sortBy;
        query = query.order(sortColumn, { ascending: sortOrder === 'asc' });
      }

      // Pagination
      const limit = filters.limit || PAGINATION.MAX_LIMIT;
      const offset = filters.offset || PAGINATION.DEFAULT_OFFSET;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        throw new DatabaseError(
          `Failed to find units: ${error.message}`,
          'findAll',
          error as Error
        );
      }

      if (!data || data.length === 0) {
        return [];
      }

      return data.map((row) => this.mapRowToUnit(row as UnitRow));
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error finding units: ${(error as Error).message}`,
        'findAll',
        error as Error
      );
    }
  }

  /**
   * Update existing unit
   *
   * @param unit - Unit to update
   * @returns Updated unit
   * @throws {NotFoundError} if unit doesn't exist
   * @throws {DatabaseError} if update fails
   */
  async update(unit: Unit): Promise<Unit> {
    try {
      const id = unit.getId();
      const json = unit.toJSON();

      // Convert metadata
      const metadata: Record<string, any> = {};
      if (json.metadata && typeof json.metadata === 'object') {
        Object.entries(json.metadata).forEach(([key, value]) => {
          if (value instanceof Date) {
            metadata[key] = value.toISOString();
          } else if (value && typeof value === 'object' && 'amount' in value) {
            metadata[key] = value;
          } else {
            metadata[key] = value;
          }
        });
      }

      const { data, error } = await this.supabase
        .from('units')
        .update({
          tower: json.identifier.tower,
          unit_number: json.identifier.number,
          area: json.area,
          price: json.price,
          parking_spots: json.parkingSpots,
          origin: json.origin,
          status: json.status,
          metadata,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Unit', id);
        }
        throw new DatabaseError(
          `Failed to update unit: ${error.message}`,
          'update',
          error as Error
        );
      }

      if (!data) {
        throw new NotFoundError('Unit', id);
      }

      return this.mapRowToUnit(data as UnitRow);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error updating unit: ${(error as Error).message}`,
        'update',
        error as Error
      );
    }
  }

  /**
   * Update multiple units at once (bulk update)
   *
   * @param units - Array of units to update
   * @returns Array of updated units
   * @throws {DatabaseError} if update fails
   */
  async updateMany(units: Unit[]): Promise<Unit[]> {
    try {
      // Supabase doesn't support bulk update well, so we'll use individual updates
      const updatePromises = units.map((unit) => this.update(unit));
      return await Promise.all(updatePromises);
    } catch (error) {
      throw new DatabaseError(
        `Failed to update units: ${(error as Error).message}`,
        'updateMany',
        error as Error
      );
    }
  }

  /**
   * Delete unit by ID
   *
   * @param id - Unit ID
   * @throws {NotFoundError} if unit doesn't exist
   * @throws {DatabaseError} if delete fails
   */
  async delete(id: string): Promise<void> {
    try {
      const { error, count } = await this.supabase
        .from('units')
        .delete({ count: 'exact' })
        .eq('id', id);

      if (error) {
        throw new DatabaseError(
          `Failed to delete unit: ${error.message}`,
          'delete',
          error as Error
        );
      }

      if (count === 0) {
        throw new NotFoundError('Unit', id);
      }
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error deleting unit: ${(error as Error).message}`,
        'delete',
        error as Error
      );
    }
  }

  /**
   * Delete all units in a project
   *
   * @param projectId - Project ID
   * @returns Number of units deleted
   * @throws {DatabaseError} if delete fails
   */
  async deleteByProjectId(projectId: string): Promise<number> {
    try {
      const { error, count } = await this.supabase
        .from('units')
        .delete({ count: 'exact' })
        .eq('project_id', projectId);

      if (error) {
        throw new DatabaseError(
          `Failed to delete units by project: ${error.message}`,
          'deleteByProjectId',
          error as Error
        );
      }

      return count ?? 0;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error deleting units by project: ${(error as Error).message}`,
        'deleteByProjectId',
        error as Error
      );
    }
  }

  /**
   * Count units
   *
   * @param filters - Optional filters
   * @returns Count of units
   * @throws {DatabaseError} if query fails
   */
  async count(filters: UnitFilterOptions = {}): Promise<number> {
    try {
      let query = this.supabase.from('units').select('id', { count: 'exact', head: true });

      // Apply filters
      if (filters.projectId) {
        query = query.eq('project_id', filters.projectId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.tower) {
        query = query.eq('tower', filters.tower);
      }

      const { count, error } = await query;

      if (error) {
        throw new DatabaseError(`Failed to count units: ${error.message}`, 'count', error as Error);
      }

      return count ?? 0;
    } catch (error) {
      if (error instanceof DatabaseError) {
        throw error;
      }
      throw new DatabaseError(
        `Unexpected error counting units: ${(error as Error).message}`,
        'count',
        error as Error
      );
    }
  }

  /**
   * Check if unit exists
   *
   * @param id - Unit ID
   * @returns true if exists
   * @throws {DatabaseError} if query fails
   */
  async exists(id: string): Promise<boolean> {
    try {
      const { count, error } = await this.supabase
        .from('units')
        .select('id', { count: 'exact', head: true })
        .eq('id', id);

      if (error) {
        throw new DatabaseError(
          `Failed to check unit existence: ${error.message}`,
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
        `Unexpected error checking unit existence: ${(error as Error).message}`,
        'exists',
        error as Error
      );
    }
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
        if (value && typeof value === 'object' && 'amount' in value && 'currency' in value) {
          metadata.set(key, Money.fromJSON(value as any));
        }
        // Reconstruct Date objects
        else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
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
}
