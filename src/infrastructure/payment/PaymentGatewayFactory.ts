import { IPaymentGateway } from '@/domain/payment/gateways/IPaymentGateway';
import { PaymentGateway } from '@/domain/payment';
import { AsaasGateway } from './AsaasGateway';
import { StripeGateway } from './StripeGateway';
import { MercadoPagoGateway } from './MercadoPagoGateway';

/**
 * PaymentGatewayFactory
 *
 * Factory class for creating payment gateway instances.
 * Implements Factory pattern for gateway selection.
 * Centralizes gateway configuration and instantiation.
 *
 * @example
 * const gateway = PaymentGatewayFactory.create('asaas');
 * const result = await gateway.createSubscription(input);
 */
export class PaymentGatewayFactory {
  /**
   * Create a payment gateway instance
   *
   * @param gateway - Gateway type to create
   * @returns IPaymentGateway implementation
   * @throws {Error} if gateway is not configured or unknown
   */
  static create(gateway: PaymentGateway): IPaymentGateway {
    switch (gateway) {
      case 'asaas':
        return PaymentGatewayFactory.createAsaas();

      case 'stripe':
        return PaymentGatewayFactory.createStripe();

      case 'mercadopago':
        return PaymentGatewayFactory.createMercadoPago();

      default:
        throw new Error(`Unknown payment gateway: ${gateway}`);
    }
  }

  /**
   * Create Asaas gateway instance
   */
  private static createAsaas(): AsaasGateway {
    const apiKey = process.env.ASAAS_API_KEY;
    if (!apiKey) {
      throw new Error('ASAAS_API_KEY environment variable not set');
    }

    const environment =
      (process.env.ASAAS_ENVIRONMENT as 'production' | 'sandbox') || 'production';
    const webhookSecret = process.env.ASAAS_WEBHOOK_SECRET;

    return new AsaasGateway(apiKey, environment, webhookSecret);
  }

  /**
   * Create Stripe gateway instance
   */
  private static createStripe(): StripeGateway {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable not set');
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    return new StripeGateway({ apiKey, webhookSecret });
  }

  /**
   * Create Mercado Pago gateway instance
   */
  private static createMercadoPago(): MercadoPagoGateway {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('MP_ACCESS_TOKEN environment variable not set');
    }

    return new MercadoPagoGateway(accessToken);
  }

  /**
   * Get default gateway
   * Primary: Asaas (lowest fees, best Brazilian support)
   */
  static createDefault(): IPaymentGateway {
    return PaymentGatewayFactory.create('asaas');
  }

  /**
   * Get all available gateways
   */
  static getAvailableGateways(): PaymentGateway[] {
    const gateways: PaymentGateway[] = [];

    if (process.env.ASAAS_API_KEY) {
      gateways.push('asaas');
    }
    if (process.env.STRIPE_SECRET_KEY) {
      gateways.push('stripe');
    }
    if (process.env.MP_ACCESS_TOKEN) {
      gateways.push('mercadopago');
    }

    return gateways;
  }
}
