import { PaymentGatewayFactory } from '@/infrastructure/payment/PaymentGatewayFactory';
import { SupabaseSubscriptionRepository } from '@/infrastructure/database/SupabaseSubscriptionRepository';
import { SupabasePaymentRepository } from '@/infrastructure/database/SupabasePaymentRepository';
import { Transaction, PaymentMethod, Money } from '@/domain/payment';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/payment/webhook/asaas
 *
 * Handles webhook events from Asaas payment gateway.
 * Validates signature and processes payment events.
 *
 * Security:
 * - Validates webhook signature using HMAC SHA256
 * - Idempotent - safe to process same event multiple times
 * - Logs all events for audit trail
 *
 * @param request - HTTP POST request from Asaas
 * @returns Response confirming receipt
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const signature = request.headers.get('asaas-signature') || '';
    const payload = await request.json();

    // Initialize gateway and validate webhook
    const gateway = PaymentGatewayFactory.create('asaas');
    const event = await gateway.handleWebhook(payload, signature);

    console.log('Asaas webhook received:', event.type, event.data);

    // Initialize repositories
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    const subscriptionRepo = new SupabaseSubscriptionRepository(supabase);
    const paymentRepo = new SupabasePaymentRepository(supabase);

    // Handle different event types
    switch (event.type) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        await handlePaymentReceived(event.data, subscriptionRepo, paymentRepo);
        break;

      case 'PAYMENT_OVERDUE':
        await handlePaymentOverdue(event.data, subscriptionRepo);
        break;

      case 'PAYMENT_DELETED':
      case 'PAYMENT_REFUNDED':
        await handlePaymentRefunded(event.data, paymentRepo);
        break;

      default:
        console.log('Unhandled Asaas event type:', event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Asaas webhook error:', error);
    return new Response(
      JSON.stringify({
        error: 'Webhook processing failed',
        message: (error as Error).message,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Handle payment received event
 */
async function handlePaymentReceived(
  data: any,
  subscriptionRepo: SupabaseSubscriptionRepository,
  paymentRepo: SupabasePaymentRepository
): Promise<void> {
  // Find subscription by external ID
  const subscription = await subscriptionRepo.findByExternalId(data.subscription);
  if (!subscription) {
    console.warn('Subscription not found for payment:', data.id);
    return;
  }

  // Check if transaction already exists (idempotency)
  const existing = await paymentRepo.findTransactionByExternalId(data.id);
  if (existing) {
    console.log('Transaction already processed:', data.id);
    return;
  }

  // Create payment method from data
  const paymentMethod = new PaymentMethod(
    data.id,
    data.billingType.toLowerCase(),
    {}
  );

  // Create transaction entity
  const transaction = new Transaction(
    'txn_' + data.id,
    subscription.getUserId(),
    new Money(data.value),
    'Monthly subscription payment',
    paymentMethod,
    'completed',
    'asaas',
    data.id,
    new Date(data.dateCreated),
    new Date(data.paymentDate)
  );

  // Save transaction
  await paymentRepo.saveTransaction(transaction);

  // Update subscription status if it was past due
  if (subscription.isPastDue()) {
    subscription.addTransaction(transaction);
    await subscriptionRepo.update(subscription);
  }

  console.log('Payment received and processed:', data.id);
}

/**
 * Handle payment overdue event
 */
async function handlePaymentOverdue(
  data: any,
  subscriptionRepo: SupabaseSubscriptionRepository
): Promise<void> {
  const subscription = await subscriptionRepo.findByExternalId(data.subscription);
  if (!subscription) {
    console.warn('Subscription not found for overdue payment:', data.id);
    return;
  }

  subscription.markAsPastDue();
  await subscriptionRepo.update(subscription);

  console.log('Subscription marked as past due:', subscription.getId());
}

/**
 * Handle payment refunded event
 */
async function handlePaymentRefunded(
  data: any,
  paymentRepo: SupabasePaymentRepository
): Promise<void> {
  const transaction = await paymentRepo.findTransactionByExternalId(data.id);
  if (!transaction) {
    console.warn('Transaction not found for refund:', data.id);
    return;
  }

  transaction.markAsRefunded();
  await paymentRepo.updateTransaction(transaction);

  console.log('Transaction marked as refunded:', data.id);
}
