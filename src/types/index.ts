/**
 * ImobiTools - TypeScript Type Definitions
 * Version: 1.0.0
 * Last Updated: 2025-01-05
 *
 * These interfaces serve as documentation and can be used with JSDoc
 * in vanilla JavaScript files for better IDE autocomplete and type checking.
 *
 * Usage in JS:
 * @type {ButtonProps}
 * const props = { variant: 'primary', size: 'base' };
 */

// ============================================================================
// UI Component Props
// ============================================================================

/**
 * Button Component Props
 */
export interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outlined';
  size: 'sm' | 'base' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
  className?: string;
  onClick?: (event: MouseEvent) => void;
}

/**
 * Card Component Props
 */
export interface CardProps {
  variant?: 'default' | 'elevated' | 'bordered' | 'flat' | 'interactive';
  padding?: 'none' | 'sm' | 'base' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'base' | 'md' | 'lg' | 'xl';
  borderRadius?: 'none' | 'sm' | 'base' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: (event: MouseEvent) => void;
}

/**
 * Input Component Props
 */
export interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  size?: 'sm' | 'base' | 'md' | 'lg';
  value?: string | number;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  readonly?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  autocomplete?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  className?: string;
  onChange?: (event: Event, value: string) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
}

/**
 * Select Component Props
 */
export interface SelectProps {
  options: SelectOption[];
  value?: string | number;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  multiple?: boolean;
  ariaLabel?: string;
  className?: string;
  onChange?: (value: string | number | string[] | number[]) => void;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: string;
}

/**
 * Checkbox Component Props
 */
export interface CheckboxProps {
  checked?: boolean;
  label?: string;
  disabled?: boolean;
  indeterminate?: boolean;
  required?: boolean;
  ariaLabel?: string;
  className?: string;
  onChange?: (checked: boolean, event: Event) => void;
}

/**
 * Radio Component Props
 */
export interface RadioProps {
  name: string;
  value: string | number;
  checked?: boolean;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  ariaLabel?: string;
  className?: string;
  onChange?: (value: string | number, event: Event) => void;
}

/**
 * Switch Component Props
 */
export interface SwitchProps {
  checked?: boolean;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'base' | 'lg';
  ariaLabel?: string;
  className?: string;
  onChange?: (checked: boolean, event: Event) => void;
}

/**
 * Toast/Notification Props
 */
export interface ToastProps {
  id?: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title?: string;
  message: string;
  duration?: number; // milliseconds, 0 = no auto-dismiss
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  dismissible?: boolean;
  action?: ToastAction;
  onDismiss?: (id: string) => void;
}

export interface ToastAction {
  label: string;
  onClick: () => void;
}

/**
 * Modal Component Props
 */
export interface ModalProps {
  isOpen: boolean;
  title?: string;
  size?: 'sm' | 'base' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  footer?: boolean;
  ariaLabel?: string;
  className?: string;
  onClose: () => void;
}

/**
 * Tooltip Component Props
 */
export interface TooltipProps {
  content: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  trigger?: 'hover' | 'click' | 'focus';
  delay?: number;
  arrow?: boolean;
  className?: string;
}

/**
 * Avatar Component Props
 */
export interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square' | 'rounded';
  border?: boolean;
  status?: 'online' | 'offline' | 'away' | 'busy';
  gradient?: boolean;
  className?: string;
}

/**
 * Badge Component Props
 */
export interface BadgeProps {
  variant: 'success' | 'error' | 'warning' | 'info' | 'default';
  size?: 'sm' | 'base' | 'lg';
  dot?: boolean;
  outlined?: boolean;
  rounded?: boolean;
  className?: string;
}

/**
 * Table Component Props
 */
export interface TableProps {
  columns: TableColumn[];
  data: any[];
  sortable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  selectedRows?: Set<string | number>;
  pagination?: TablePagination;
  loading?: boolean;
  emptyMessage?: string;
  stickyHeader?: boolean;
  className?: string;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  onSelect?: (selectedIds: Set<string | number>) => void;
  onRowClick?: (row: any, index: number) => void;
}

export interface TableColumn {
  key: string;
  label: string;
  width?: string | number;
  sortable?: boolean;
  filterable?: boolean;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any, index: number) => string | HTMLElement;
}

export interface TablePagination {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

/**
 * Loading Skeleton Props
 */
export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
}

/**
 * Empty State Props
 */
export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

/**
 * Progress Bar Props
 */
export interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  size?: 'sm' | 'base' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  showValue?: boolean;
  striped?: boolean;
  animated?: boolean;
  label?: string;
  className?: string;
}

// ============================================================================
// Business Domain Types
// ============================================================================

/**
 * User Interface
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  planId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subscription Plan Interface
 */
export interface SubscriptionPlan {
  id: string;
  name: 'free' | 'basic' | 'unlimited' | 'combo';
  priceBRL: number;
  features: string[];
  limits: PlanLimits;
  active: boolean;
  createdAt: Date;
}

export interface PlanLimits {
  calculatorExportsPerMonth: number;
  marketStudiesPerMonth: number;
  projectsCount: number;
  unitsCount: number;
  pdfExports: boolean;
  slidesExports: boolean;
  collaboration: boolean;
}

/**
 * Payment Calculator Interface
 */
export interface Calculator {
  id: string;
  userId: string;
  shortCode: string;
  configuration: CalculatorConfiguration;
  views: number;
  createdAt: Date;
  expiresAt?: Date;
}

export interface CalculatorConfiguration {
  propertyValue: number;
  downPayment: number;
  loanAmount: number;
  interestRate: number;
  installments: number;
  paymentPlan: Installment[];
}

export interface Installment {
  number: number;
  amount: number;
  principal: number;
  interest: number;
  balance: number;
  date: string;
}

/**
 * Market Study Interface
 */
export interface MarketStudy {
  id: string;
  userId: string;
  propertyAddress: string;
  propertyArea: number;
  samples: MarketSample[];
  valuationResult: ValuationResult;
  agentLogoUrl?: string;
  pdfUrl?: string;
  slidesUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketSample {
  id: string;
  address: string;
  area: number;
  price: number;
  pricePerSqm: number;
  status: 'vendido' | 'em_venda' | 'alugado';
  bedrooms?: number;
  bathrooms?: number;
  parkingSpots?: number;
  condition?: 'novo' | 'usado' | 'reformado';
  factors?: SampleFactors;
}

export interface SampleFactors {
  factor1: number;
  factor2: number;
  factor3: number;
  factor4: number;
}

export interface ValuationResult {
  average: number;
  median: number;
  min: number;
  max: number;
  standardDeviation: number;
  coefficientOfVariation: number;
  confidence: 'high' | 'medium' | 'low';
  sampleCount: number;
}

/**
 * Project & Units Interface
 */
export interface Project {
  id: string;
  userId: string;
  name: string;
  location: string;
  description?: string;
  sharedWith: string[]; // user IDs with access
  units: Unit[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Unit {
  id: string;
  projectId: string;
  tower: string;
  unitNumber: string;
  parkingSpots?: string;
  area: number;
  price: number;
  pricePerSqm?: number;
  origin: 'Real' | 'Permutante';
  status?: 'available' | 'reserved' | 'sold';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transaction & Payment Interface
 */
export interface Transaction {
  id: string;
  userId: string;
  subscriptionId?: string;
  amount: number;
  currency: 'BRL';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'credit_card' | 'pix' | 'boleto';
  paymentGateway: 'stripe' | 'mercadopago' | 'asaas';
  externalTransactionId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'cancelled' | 'past_due' | 'expired';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  externalSubscriptionId?: string;
  paymentGateway: 'stripe' | 'mercadopago' | 'asaas';
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Chart Types
// ============================================================================

export interface ChartConfiguration {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  data: ChartData;
  options?: ChartOptions;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  animation?: boolean;
  legend?: {
    display: boolean;
    position?: 'top' | 'right' | 'bottom' | 'left';
  };
  tooltip?: {
    enabled: boolean;
    mode?: 'point' | 'nearest' | 'index';
  };
}

// ============================================================================
// Form Validation Types
// ============================================================================

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  message?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  rule: string;
}

export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ValidationError[];
}

export interface ApiMeta {
  timestamp: string;
  requestId: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make all properties required recursively
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Extract keys of specific type
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Omit multiple keys
 */
export type OmitMultiple<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// ============================================================================
// Event Handler Types
// ============================================================================

export type EventHandler<T = Event> = (event: T) => void;
export type MouseEventHandler = EventHandler<MouseEvent>;
export type KeyboardEventHandler = EventHandler<KeyboardEvent>;
export type FocusEventHandler = EventHandler<FocusEvent>;
export type InputEventHandler = EventHandler<InputEvent>;
export type SubmitEventHandler = EventHandler<SubmitEvent>;
export type ChangeEventHandler = (value: any, event?: Event) => void;

// ============================================================================
// Component State Types
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T = any> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  status: LoadingState;
}

// ============================================================================
// Toast Manager Types
// ============================================================================

export interface ToastManager {
  show: (props: Omit<ToastProps, 'id'>) => string;
  success: (message: string, options?: Partial<ToastProps>) => string;
  error: (message: string, options?: Partial<ToastProps>) => string;
  warning: (message: string, options?: Partial<ToastProps>) => string;
  info: (message: string, options?: Partial<ToastProps>) => string;
  loading: (message: string, options?: Partial<ToastProps>) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// ============================================================================
// Storage Types
// ============================================================================

export interface StorageAdapter {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

// ============================================================================
// Accessibility Types
// ============================================================================

export interface AriaProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean;
  'aria-disabled'?: boolean;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
  'aria-hidden'?: boolean;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  role?: string;
}

// ============================================================================
// Export All
// ============================================================================

export default {
  // Export types for easier importing
};
