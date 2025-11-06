/**
 * Calculator Domain Exports
 *
 * Public API for the calculator domain.
 * Export all entities, value objects, and repository interfaces.
 */

// Value Objects
export { Money } from './value-objects/Money';
export { Percentage } from './value-objects/Percentage';
export { CompletionDate } from './value-objects/CompletionDate';

// Entities
export { Installment } from './entities/Installment';
export { PaymentPhase } from './entities/PaymentPhase';
export {
  PaymentCalculator,
  type ApprovalStatus,
  type PaymentCalculatorParams,
} from './entities/PaymentCalculator';

// Repository Interface
export { type ICalculatorRepository } from './repositories/ICalculatorRepository';
