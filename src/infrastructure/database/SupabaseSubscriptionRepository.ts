import { SupabaseClient } from '@supabase/supabase-js';
import { ISubscriptionRepository } from '@/domain/payment/repositories/ISubscriptionRepository';
import { Subscription } from '@/domain/payment/entities/Subscription';
import { NotFoundError, DatabaseError } from '@/lib/errors';
import { PAGINATION } from '@/lib/constants';

/**
 * Database row type for subscriptions table
 */
interface SubscriptionRow {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  amount: number;
  gateway: string;
  external_subscription_id: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  payment_method: Record<string, any>;
  state: Record<string, any>;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
}

/**
 * Supabase Subscription Repository
 *
 * Implements ISubscriptionRepository using Supabase as the persistence layer.
 * Handles mapping between Subscription domain entities and database rows.
 *
 * @example
 * const supabase = createClient();
 * const repository = new SupabaseSubscriptionRepository(supabase);
 * const subscription = new Subscription({ ... });
 * await repository.save(subscription);
 */
export class SupabaseSubscriptionRepository implements ISubscriptionRepository {
  private readonly supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Save a new subscription
   */
  async save(subscription: Subscription): Promise<Subscription> {
    try {
      const state = subscription.toJSON();

      const { data, error } = await this.supabase
        .from('subscriptions')
        .insert({
          id: subscription.getId(),
          user_id: subscription.getUserId(),
          plan_id: subscription.getPlanId(),
          status: subscription.getStatus(),
          amount: subscription.getAmount().getAmount(),
          gateway: subscription.getGateway(),
          external_subscription_id: subscription.getExternalSubscriptionId(),
          current_period_start: subscription.getCurrentPeriodStart().toISOString(),
          current_period_end: subscription.getCurrentPeriodEnd().toISOString(),
          cancel_at_period_end: subscription.getCancelAtPeriodEnd(),
          payment_method: subscription.getPaymentMethod().toJSON(),
          state,
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError(
          `Failed to save subscription: ${error.message}`,
          'save',
          error as Error
        );
      }

      return this.mapRowToSubscription(data as SubscriptionRow);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        `Unexpected error saving subscription: ${(error as Error).message}`,
        'save',
        error as Error
      );
    }
  }

  /**
   * Find subscription by ID
   */
  async findById(id: string): Promise<Subscription | null> {
    try {
      const { data, error } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError(
          `Failed to find subscription: ${error.message}`,
          'findById',
          error as Error
        );
      }

      return data ? this.mapRowToSubscription(data as SubscriptionRow) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        `Unexpected error finding subscription: ${(error as Error).message}`,
        'findById',
        error as Error
      );
    }
  }

  /**
   * Find subscription by external gateway ID
   */
  async findByExternalId(externalId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('external_subscription_id', externalId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError(
          `Failed to find subscription by external ID: ${error.message}`,
          'findByExternalId',
          error as Error
        );
      }

      return data ? this.mapRowToSubscription(data as SubscriptionRow) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        `Unexpected error finding subscription: ${(error as Error).message}`,
        'findByExternalId',
        error as Error
      );
    }
  }

  /**
   * Find active subscription for a user
   */
  async findActiveByUserId(userId: string): Promise<Subscription | null> {
    try {
      const { data, error } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError(
          `Failed to find active subscription: ${error.message}`,
          'findActiveByUserId',
          error as Error
        );
      }

      return data ? this.mapRowToSubscription(data as SubscriptionRow) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        `Unexpected error finding active subscription: ${(error as Error).message}`,
        'findActiveByUserId',
        error as Error
      );
    }
  }

  /**
   * Find all subscriptions for a user
   */
  async findByUserId(userId: string, limit = PAGINATION.DEFAULT_LIMIT): Promise<Subscription[]> {
    try {
      const { data, error } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new DatabaseError(
          `Failed to find subscriptions: ${error.message}`,
          'findByUserId',
          error as Error
        );
      }

      return (data || []).map((row) => this.mapRowToSubscription(row as SubscriptionRow));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        `Unexpected error finding subscriptions: ${(error as Error).message}`,
        'findByUserId',
        error as Error
      );
    }
  }

  /**
   * Update existing subscription
   */
  async update(subscription: Subscription): Promise<Subscription> {
    try {
      const state = subscription.toJSON();

      const { data, error } = await this.supabase
        .from('subscriptions')
        .update({
          plan_id: subscription.getPlanId(),
          status: subscription.getStatus(),
          amount: subscription.getAmount().getAmount(),
          current_period_end: subscription.getCurrentPeriodEnd().toISOString(),
          cancel_at_period_end: subscription.getCancelAtPeriodEnd(),
          payment_method: subscription.getPaymentMethod().toJSON(),
          state,
        })
        .eq('id', subscription.getId())
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Subscription', subscription.getId());
        }
        throw new DatabaseError(
          `Failed to update subscription: ${error.message}`,
          'update',
          error as Error
        );
      }

      return this.mapRowToSubscription(data as SubscriptionRow);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        `Unexpected error updating subscription: ${(error as Error).message}`,
        'update',
        error as Error
      );
    }
  }

  /**
   * Delete subscription by ID
   */
  async delete(id: string): Promise<void> {
    try {
      const { error, count } = await this.supabase
        .from('subscriptions')
        .delete({ count: 'exact' })
        .eq('id', id);

      if (error) {
        throw new DatabaseError(
          `Failed to delete subscription: ${error.message}`,
          'delete',
          error as Error
        );
      }

      if (count === 0) {
        throw new NotFoundError('Subscription', id);
      }
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        `Unexpected error deleting subscription: ${(error as Error).message}`,
        'delete',
        error as Error
      );
    }
  }

  /**
   * Find subscriptions ending soon
   */
  async findEndingSoon(daysUntilEnd: number): Promise<Subscription[]> {
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysUntilEnd);

      const { data, error } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active')
        .lte('current_period_end', endDate.toISOString())
        .gte('current_period_end', new Date().toISOString());

      if (error) {
        throw new DatabaseError(
          `Failed to find ending subscriptions: ${error.message}`,
          'findEndingSoon',
          error as Error
        );
      }

      return (data || []).map((row) => this.mapRowToSubscription(row as SubscriptionRow));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        `Unexpected error finding ending subscriptions: ${(error as Error).message}`,
        'findEndingSoon',
        error as Error
      );
    }
  }

  /**
   * Find past due subscriptions
   */
  async findPastDue(): Promise<Subscription[]> {
    try {
      const { data, error } = await this.supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'past_due');

      if (error) {
        throw new DatabaseError(
          `Failed to find past due subscriptions: ${error.message}`,
          'findPastDue',
          error as Error
        );
      }

      return (data || []).map((row) => this.mapRowToSubscription(row as SubscriptionRow));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        `Unexpected error finding past due subscriptions: ${(error as Error).message}`,
        'findPastDue',
        error as Error
      );
    }
  }

  /**
   * Map database row to Subscription entity
   */
  private mapRowToSubscription(row: SubscriptionRow): Subscription {
    return Subscription.fromJSON(row.state);
  }
}
