import { Subscription, PaymentMethod, Money } from '@/domain/payment';
import { TaxDocument } from '@/domain/payment';
import { CreateSubscriptionSchema } from '@/lib/validators/payment.schema';
import {
  ValidationError,
  BusinessRuleError,
  BaseError,
} from '@/lib/errors';
import { PaymentGatewayFactory } from '@/infrastructure/payment/PaymentGatewayFactory';
import { SupabaseSubscriptionRepository } from '@/infrastructure/database/SupabaseSubscriptionRepository';
import { createClient } from '@supabase/supabase-js';
import { ZodError } from 'zod';

/**
 * Subscription Plans Configuration
 */
const SUBSCRIPTION_PLANS = {
  FREE: { name: 'Gratuito', price: 0 },
  BASIC: { name: 'Básico', price: 29.90 },
  UNLIMITED: { name: 'Ilimitado', price: 59.90 },
  COMBO: { name: 'Combo Agência', price: 149.90 },
};

/**
 * POST /api/payment/subscription/create
 *
 * Creates a new subscription with payment gateway integration.
 * Validates request, creates subscription in gateway, persists to database.
 *
 * @param request - HTTP POST request with subscription data
 * @returns Response with subscription details
 */
export async function POST(request: Request): Promise<Response> {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validated = CreateSubscriptionSchema.parse(body);

    // Validate tax document
    const taxDocument = TaxDocument.create(validated.cpfCnpj);

    // Get subscription plan price
    const plan = SUBSCRIPTION_PLANS[validated.planId];
    if (!plan) {
      throw new ValidationError(`Invalid plan ID: ${validated.planId}`);
    }

    // Create payment gateway
    const gateway = PaymentGatewayFactory.create(validated.gateway);

    // Create subscription in gateway
    const gatewayResult = await gateway.createSubscription({
      customerName: validated.customerName,
      customerEmail: validated.customerEmail,
      cpfCnpj: taxDocument.getValue(),
      planId: validated.planId,
      amount: plan.price,
      billingType: validated.billingType,
      description: `ImobiTools - ${plan.name}`,
    });

    // Create payment method entity
    const paymentMethod = new PaymentMethod(
      gatewayResult.subscriptionId,
      validated.billingType,
      {} // Details will be populated by gateway
    );

    // Create subscription entity
    const subscription = new Subscription({
      userId: validated.userId,
      planId: validated.planId,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: gatewayResult.nextBillingDate,
      gateway: validated.gateway,
      externalSubscriptionId: gatewayResult.subscriptionId,
      paymentMethod,
      amount: new Money(plan.price),
    });

    // Initialize Supabase and repository
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    const repository = new SupabaseSubscriptionRepository(supabase);

    // Check for existing active subscription
    const existing = await repository.findActiveByUserId(validated.userId);
    if (existing) {
      throw new BusinessRuleError(
        'User already has an active subscription',
        'DUPLICATE_SUBSCRIPTION'
      );
    }

    // Save subscription
    const savedSubscription = await repository.save(subscription);

    // Return response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          subscriptionId: savedSubscription.getId(),
          planId: savedSubscription.getPlanId(),
          status: savedSubscription.getStatus(),
          amount: savedSubscription.getAmount().format(),
          currentPeriodEnd: savedSubscription.getCurrentPeriodEnd().toISOString(),
          clientSecret: gatewayResult.clientSecret,
        },
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const validationError = new ValidationError(
        'Invalid request data',
        error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))
      );

      return new Response(
        JSON.stringify({
          success: false,
          error: validationError.toJSON(),
        }),
        {
          status: validationError.statusCode,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle application errors
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

    // Handle unexpected errors
    console.error('Unexpected error in POST /api/payment/subscription/create:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
