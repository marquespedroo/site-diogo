import { SupabaseClient } from '@supabase/supabase-js';
import { IPaymentRepository } from '@/domain/payment/repositories/IPaymentRepository';
import { Transaction } from '@/domain/payment/entities/Transaction';
import { Invoice } from '@/domain/payment/entities/Invoice';
import { NotFoundError, DatabaseError } from '@/lib/errors';

/**
 * Supabase Payment Repository
 *
 * Implements IPaymentRepository for transactions and invoices.
 *
 * @example
 * const repository = new SupabasePaymentRepository(supabase);
 * await repository.saveTransaction(transaction);
 */
export class SupabasePaymentRepository implements IPaymentRepository {
  private readonly supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // ============================================================================
  // Transaction Methods
  // ============================================================================

  async saveTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      const state = transaction.toJSON();

      const { data, error } = await this.supabase
        .from('transactions')
        .insert({
          id: transaction.getId(),
          user_id: transaction.getUserId(),
          amount: transaction.getAmount().getAmount(),
          description: transaction.getDescription(),
          status: transaction.getStatus(),
          gateway: transaction.getGateway(),
          external_id: transaction.getExternalId(),
          payment_method: transaction.getPaymentMethod().toJSON(),
          state,
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError(
          `Failed to save transaction: ${error.message}`,
          'saveTransaction',
          error as Error
        );
      }

      return Transaction.fromJSON((data as any).state);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        `Unexpected error saving transaction: ${(error as Error).message}`,
        'saveTransaction',
        error as Error
      );
    }
  }

  async findTransactionById(id: string): Promise<Transaction | null> {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError(
          `Failed to find transaction: ${error.message}`,
          'findTransactionById',
          error as Error
        );
      }

      return data ? Transaction.fromJSON((data as any).state) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        `Unexpected error finding transaction: ${(error as Error).message}`,
        'findTransactionById',
        error as Error
      );
    }
  }

  async findTransactionByExternalId(
    externalId: string
  ): Promise<Transaction | null> {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('external_id', externalId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError(
          `Failed to find transaction: ${error.message}`,
          'findTransactionByExternalId',
          error as Error
        );
      }

      return data ? Transaction.fromJSON((data as any).state) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        `Unexpected error finding transaction: ${(error as Error).message}`,
        'findTransactionByExternalId',
        error as Error
      );
    }
  }

  async findTransactionsByUserId(
    userId: string,
    limit = 50
  ): Promise<Transaction[]> {
    try {
      const { data, error } = await this.supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new DatabaseError(
          `Failed to find transactions: ${error.message}`,
          'findTransactionsByUserId',
          error as Error
        );
      }

      return (data || []).map((row) => Transaction.fromJSON((row as any).state));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        `Unexpected error finding transactions: ${(error as Error).message}`,
        'findTransactionsByUserId',
        error as Error
      );
    }
  }

  async updateTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      const state = transaction.toJSON();

      const { data, error } = await this.supabase
        .from('transactions')
        .update({
          status: transaction.getStatus(),
          state,
        })
        .eq('id', transaction.getId())
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Transaction', transaction.getId());
        }
        throw new DatabaseError(
          `Failed to update transaction: ${error.message}`,
          'updateTransaction',
          error as Error
        );
      }

      return Transaction.fromJSON((data as any).state);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DatabaseError)
        throw error;
      throw new DatabaseError(
        `Unexpected error updating transaction: ${(error as Error).message}`,
        'updateTransaction',
        error as Error
      );
    }
  }

  // ============================================================================
  // Invoice Methods
  // ============================================================================

  async saveInvoice(invoice: Invoice): Promise<Invoice> {
    try {
      const state = invoice.toJSON();

      const { data, error } = await this.supabase
        .from('invoices')
        .insert({
          id: invoice.getId(),
          user_id: invoice.getUserId(),
          subscription_id: invoice.getSubscriptionId(),
          amount: invoice.getAmount().getAmount(),
          description: invoice.getDescription(),
          status: invoice.getStatus(),
          due_date: invoice.getDueDate().toISOString(),
          state,
        })
        .select()
        .single();

      if (error) {
        throw new DatabaseError(
          `Failed to save invoice: ${error.message}`,
          'saveInvoice',
          error as Error
        );
      }

      return Invoice.fromJSON((data as any).state);
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        `Unexpected error saving invoice: ${(error as Error).message}`,
        'saveInvoice',
        error as Error
      );
    }
  }

  async findInvoiceById(id: string): Promise<Invoice | null> {
    try {
      const { data, error } = await this.supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError(
          `Failed to find invoice: ${error.message}`,
          'findInvoiceById',
          error as Error
        );
      }

      return data ? Invoice.fromJSON((data as any).state) : null;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        `Unexpected error finding invoice: ${(error as Error).message}`,
        'findInvoiceById',
        error as Error
      );
    }
  }

  async findInvoicesByUserId(userId: string, limit = 50): Promise<Invoice[]> {
    try {
      const { data, error } = await this.supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new DatabaseError(
          `Failed to find invoices: ${error.message}`,
          'findInvoicesByUserId',
          error as Error
        );
      }

      return (data || []).map((row) => Invoice.fromJSON((row as any).state));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        `Unexpected error finding invoices: ${(error as Error).message}`,
        'findInvoicesByUserId',
        error as Error
      );
    }
  }

  async findInvoicesBySubscriptionId(
    subscriptionId: string
  ): Promise<Invoice[]> {
    try {
      const { data, error } = await this.supabase
        .from('invoices')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new DatabaseError(
          `Failed to find invoices: ${error.message}`,
          'findInvoicesBySubscriptionId',
          error as Error
        );
      }

      return (data || []).map((row) => Invoice.fromJSON((row as any).state));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        `Unexpected error finding invoices: ${(error as Error).message}`,
        'findInvoicesBySubscriptionId',
        error as Error
      );
    }
  }

  async findOpenInvoicesByUserId(userId: string): Promise<Invoice[]> {
    try {
      const { data, error } = await this.supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'open')
        .order('due_date', { ascending: true });

      if (error) {
        throw new DatabaseError(
          `Failed to find open invoices: ${error.message}`,
          'findOpenInvoicesByUserId',
          error as Error
        );
      }

      return (data || []).map((row) => Invoice.fromJSON((row as any).state));
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError(
        `Unexpected error finding open invoices: ${(error as Error).message}`,
        'findOpenInvoicesByUserId',
        error as Error
      );
    }
  }

  async updateInvoice(invoice: Invoice): Promise<Invoice> {
    try {
      const state = invoice.toJSON();

      const { data, error } = await this.supabase
        .from('invoices')
        .update({
          status: invoice.getStatus(),
          state,
        })
        .eq('id', invoice.getId())
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new NotFoundError('Invoice', invoice.getId());
        }
        throw new DatabaseError(
          `Failed to update invoice: ${error.message}`,
          'updateInvoice',
          error as Error
        );
      }

      return Invoice.fromJSON((data as any).state);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DatabaseError)
        throw error;
      throw new DatabaseError(
        `Unexpected error updating invoice: ${(error as Error).message}`,
        'updateInvoice',
        error as Error
      );
    }
  }
}
