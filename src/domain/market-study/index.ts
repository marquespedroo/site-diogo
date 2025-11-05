/**
 * Market Study Domain Layer Exports
 *
 * Centralized export of all market study domain entities, value objects,
 * services, and repository interfaces.
 */

// Value Objects
export { PropertyAddress } from './value-objects/PropertyAddress';
export { PropertyArea } from './value-objects/PropertyArea';
export { PropertyCharacteristics } from './value-objects/PropertyCharacteristics';

// Entities
export { MarketSample, type MarketSampleStatus } from './entities/MarketSample';
export { StatisticalAnalysis } from './entities/StatisticalAnalysis';
export {
  PropertyValuation,
  type PropertyStandard,
} from './entities/PropertyValuation';
export {
  MarketStudy,
  type EvaluationType,
  type MarketStudyParams,
} from './entities/MarketStudy';

// Services
export { ValuationService } from './services/ValuationService';

// Repository Interfaces
export { type IMarketStudyRepository } from './repositories/IMarketStudyRepository';
