import { CancelSubscriptionSchema } from '@/lib/validators/payment.schema';
import { NotFoundError, BaseError } from '@/lib/errors';
import { PaymentGatewayFactory } from '@/infrastructure/payment/PaymentGatewayFactory';
import { SupabaseSubscriptionRepository } from '@/infrastructure/database/SupabaseSubscriptionRepository';
import { createClient } from '@supabase/supabase-js';
import { ZodError } from 'zod';

/**
 * POST /api/payment/subscription/cancel
 *
 * Cancels an existing subscription.
 * Can cancel immediately or at the end of the billing period.
 *
 * @param request - HTTP POST request with cancellation data
 * @returns Response confirming cancellation
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validated = CancelSubscriptionSchema.parse(body);

    // Initialize repository
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    const repository = new SupabaseSubscriptionRepository(supabase);

    // Find subscription
    const subscription = await repository.findById(validated.subscriptionId);
    if (!subscription) {
      throw new NotFoundError('Subscription', validated.subscriptionId);
    }

    // Cancel in payment gateway
    const gateway = PaymentGatewayFactory.create(subscription.getGateway());
    await gateway.cancelSubscription(subscription.getExternalSubscriptionId());

    // Update subscription entity
    subscription.cancel(validated.immediately);

    // Save updated subscription
    await repository.update(subscription);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          subscriptionId: subscription.getId(),
          status: subscription.getStatus(),
          cancelAtPeriodEnd: subscription.getCancelAtPeriodEnd(),
          currentPeriodEnd: subscription.getCurrentPeriodEnd().toISOString(),
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid request data' },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (error instanceof BaseError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.toJSON(),
        }),
        {
          status: error.statusCode,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.error('Error cancelling subscription:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel subscription' },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
