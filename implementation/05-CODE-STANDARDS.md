# Code Standards & Best Practices

## Document Control
- **Version**: 1.0.0
- **Status**: Approved
- **Owner**: Tech Lead
- **Last Updated**: 2025-01-04

---

## 1. TypeScript Standards

### 1.1 Type Safety

```typescript
// ✅ GOOD: Explicit types for function parameters and return values
function calculateTotal(items: CartItem[]): Money {
  return items.reduce(
    (sum, item) => sum.add(item.getPrice()),
    new Money(0)
  );
}

// ❌ BAD: Implicit any types
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ✅ GOOD: Use discriminated unions for polymorphism
type PaymentMethod =
  | { type: 'credit_card'; cardId: string }
  | { type: 'pix'; qrCode: string }
  | { type: 'boleto'; barcodeNumber: string };

function processPayment(method: PaymentMethod): void {
  switch (method.type) {
    case 'credit_card':
      // TypeScript knows method.cardId exists
      break;
    case 'pix':
      // TypeScript knows method.qrCode exists
      break;
    case 'boleto':
      // TypeScript knows method.barcodeNumber exists
      break;
  }
}

// ❌ BAD: Using 'any' to bypass type checking
function processPayment(method: any): void {
  if (method.type === 'credit_card') {
    // No type safety
  }
}
```

### 1.2 Null Safety

```typescript
// ✅ GOOD: Use optional chaining and nullish coalescing
const userEmail = user?.email ?? 'no-email@example.com';
const userName = user?.profile?.name ?? 'Anonymous';

// ❌ BAD: Unsafe property access
const userEmail = user.email || 'no-email@example.com'; // Fails if user is null

// ✅ GOOD: Type guards for null checking
function processUser(user: User | null): void {
  if (!user) {
    console.log('No user provided');
    return;
  }

  // TypeScript knows user is not null here
  console.log(user.email);
}

// ✅ GOOD: Use strictNullChecks in tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noImplicitThis": true
  }
}
```

### 1.3 Naming Conventions

```typescript
// ✅ GOOD: Descriptive, intention-revealing names
class UserAuthenticationService {
  async authenticateUser(credentials: LoginCredentials): Promise<AuthToken> {
    // ...
  }
}

const MAX_LOGIN_ATTEMPTS = 3;
const PASSWORD_MIN_LENGTH = 8;

// ❌ BAD: Vague, unclear names
class UAS {
  async auth(c: any): Promise<any> {
    // ...
  }
}

const MAX = 3;
const LEN = 8;

// ✅ GOOD: Boolean naming
const isAuthenticated = true;
const hasPermission = false;
const canEdit = true;

// ❌ BAD: Boolean naming
const authenticated = true; // Could be a string
const permission = false; // Unclear what this means
```

### 1.4 Immutability

```typescript
// ✅ GOOD: Immutable value objects
class Money {
  constructor(private readonly amount: number) {}

  add(other: Money): Money {
    return new Money(this.amount + other.getAmount()); // Returns new instance
  }

  getAmount(): number {
    return this.amount;
  }
}

// ❌ BAD: Mutable state
class Money {
  public amount: number;

  constructor(amount: number) {
    this.amount = amount;
  }

  add(other: Money): void {
    this.amount += other.amount; // Mutates state
  }
}

// ✅ GOOD: Readonly arrays
function getItems(): ReadonlyArray<Item> {
  return [...this.items];
}

// ❌ BAD: Exposing mutable state
function getItems(): Item[] {
  return this.items; // Caller can mutate internal state
}
```

---

## 2. Object-Oriented Design

### 2.1 Encapsulation

```typescript
// ✅ GOOD: Private fields with controlled access
class BankAccount {
  private balance: number;

  constructor(initialBalance: number) {
    if (initialBalance < 0) {
      throw new Error('Initial balance cannot be negative');
    }
    this.balance = initialBalance;
  }

  deposit(amount: number): void {
    if (amount <= 0) {
      throw new Error('Deposit amount must be positive');
    }
    this.balance += amount;
  }

  withdraw(amount: number): void {
    if (amount > this.balance) {
      throw new Error('Insufficient funds');
    }
    this.balance -= amount;
  }

  getBalance(): number {
    return this.balance;
  }
}

// ❌ BAD: Public fields without validation
class BankAccount {
  public balance: number;

  constructor(initialBalance: number) {
    this.balance = initialBalance; // No validation
  }
}
```

### 2.2 Composition Over Inheritance

```typescript
// ✅ GOOD: Use composition
interface Flyable {
  fly(): void;
}

interface Swimmable {
  swim(): void;
}

class Duck implements Flyable, Swimmable {
  private flyBehavior: FlyBehavior;
  private swimBehavior: SwimBehavior;

  constructor(flyBehavior: FlyBehavior, swimBehavior: SwimBehavior) {
    this.flyBehavior = flyBehavior;
    this.swimBehavior = swimBehavior;
  }

  fly(): void {
    this.flyBehavior.fly();
  }

  swim(): void {
    this.swimBehavior.swim();
  }
}

// ❌ BAD: Deep inheritance hierarchies
class Animal {}
class Bird extends Animal {}
class WaterBird extends Bird {}
class Duck extends WaterBird {}
```

### 2.3 Dependency Injection

```typescript
// ✅ GOOD: Constructor injection
class UserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService,
    private readonly logger: ILogger
  ) {}

  async createUser(data: CreateUserData): Promise<User> {
    const user = await this.userRepository.save(data);
    await this.emailService.sendWelcomeEmail(user.email);
    this.logger.info('User created', { userId: user.id });
    return user;
  }
}

// ❌ BAD: Hard-coded dependencies
class UserService {
  private userRepository = new PostgresUserRepository();
  private emailService = new SendGridEmailService();
  private logger = new ConsoleLogger();

  // Impossible to test or swap implementations
}
```

---

## 3. Error Handling

### 3.1 Custom Error Classes

```typescript
// ✅ GOOD: Specific error types
class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  constructor(
    resource: string,
    public readonly id: string
  ) {
    super(`${resource} not found: ${id}`);
    this.name = 'NotFoundError';
  }
}

class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

// ❌ BAD: Generic errors
throw new Error('Something went wrong');
throw new Error('Error');
```

### 3.2 Error Handling Patterns

```typescript
// ✅ GOOD: Specific catch blocks
try {
  await userRepository.save(user);
} catch (error) {
  if (error instanceof ValidationError) {
    return { success: false, errors: [error.field] };
  } else if (error instanceof DatabaseError) {
    logger.error('Database error', { error });
    throw new ServiceUnavailableError();
  } else {
    throw error; // Re-throw unknown errors
  }
}

// ❌ BAD: Silent failures
try {
  await userRepository.save(user);
} catch (error) {
  // Swallowing errors
}

// ❌ BAD: Generic catch-all
try {
  await userRepository.save(user);
} catch (error) {
  console.log('Error:', error); // Not handling properly
}
```

### 3.3 Result Objects

```typescript
// ✅ GOOD: Use Result type for expected failures
type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

async function validateEmail(email: string): Promise<Result<Email, ValidationError>> {
  if (!email.includes('@')) {
    return {
      success: false,
      error: new ValidationError('Invalid email format', 'email', email)
    };
  }

  return {
    success: true,
    value: new Email(email)
  };
}

// Usage
const result = await validateEmail(input);
if (result.success) {
  console.log(result.value); // TypeScript knows this is Email
} else {
  console.error(result.error); // TypeScript knows this is ValidationError
}
```

---

## 4. Testing Standards

### 4.1 Test Structure (AAA Pattern)

```typescript
describe('PaymentCalculator', () => {
  describe('calculateTotal', () => {
    it('should calculate total with multiple items', () => {
      // Arrange
      const calculator = new PaymentCalculator();
      const items = [
        new CartItem('item1', new Money(100)),
        new CartItem('item2', new Money(200))
      ];

      // Act
      const total = calculator.calculateTotal(items);

      // Assert
      expect(total.getAmount()).toBe(300);
    });

    it('should return zero for empty cart', () => {
      // Arrange
      const calculator = new PaymentCalculator();
      const items: CartItem[] = [];

      // Act
      const total = calculator.calculateTotal(items);

      // Assert
      expect(total.getAmount()).toBe(0);
    });
  });
});
```

### 4.2 Test Naming Convention

```typescript
// ✅ GOOD: Descriptive test names
it('should throw ValidationError when email is invalid', () => {});
it('should return user when credentials are correct', () => {});
it('should not allow negative amounts', () => {});

// ❌ BAD: Vague test names
it('works', () => {});
it('test email', () => {});
it('should pass', () => {});
```

### 4.3 Test Coverage Requirements

```
Component           | Coverage | Priority
------------------- | -------- | --------
Domain Entities     | ≥ 95%    | Critical
Use Cases           | ≥ 90%    | Critical
Repositories        | ≥ 80%    | High
Services            | ≥ 85%    | High
API Endpoints       | ≥ 70%    | Medium
Utils/Helpers       | ≥ 80%    | Medium
UI Components       | ≥ 60%    | Low
```

### 4.4 Mock Best Practices

```typescript
// ✅ GOOD: Use interfaces for mocking
interface IEmailService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

class MockEmailService implements IEmailService {
  public sentEmails: Array<{ to: string; subject: string; body: string }> = [];

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    this.sentEmails.push({ to, subject, body });
  }
}

// Usage in tests
const mockEmailService = new MockEmailService();
const userService = new UserService(userRepository, mockEmailService, logger);

await userService.createUser(userData);

expect(mockEmailService.sentEmails).toHaveLength(1);
expect(mockEmailService.sentEmails[0].to).toBe(userData.email);

// ❌ BAD: Using jest.fn() everywhere without type safety
const mockEmailService = {
  sendEmail: jest.fn()
};
```

---

## 5. Code Review Checklist

### 5.1 Functionality
- [ ] Code implements all requirements from PRD
- [ ] Edge cases are handled
- [ ] Error cases are handled gracefully
- [ ] Business rules are correctly implemented
- [ ] No code duplication (DRY)

### 5.2 Design
- [ ] SOLID principles followed
- [ ] Proper abstraction levels
- [ ] Clear separation of concerns
- [ ] Appropriate design patterns used
- [ ] No premature optimization

### 5.3 Testing
- [ ] Unit tests written and passing
- [ ] Integration tests for critical paths
- [ ] Test coverage meets requirements
- [ ] Tests are readable and maintainable
- [ ] No flaky tests

### 5.4 Security
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Input validation implemented
- [ ] Authentication/authorization checked
- [ ] Secrets not hardcoded
- [ ] Rate limiting where appropriate

### 5.5 Performance
- [ ] No N+1 queries
- [ ] Database indexes created
- [ ] Caching used appropriately
- [ ] No memory leaks
- [ ] Async operations handled correctly

### 5.6 Documentation
- [ ] JSDoc comments for public APIs
- [ ] README updated if needed
- [ ] API documentation updated
- [ ] Complex logic explained

### 5.7 Code Quality
- [ ] TypeScript strict mode enabled
- [ ] No linter warnings
- [ ] Consistent naming conventions
- [ ] No commented-out code
- [ ] No console.log() in production code

---

## 6. Git Workflow

### 6.1 Branch Naming

```bash
# Feature branches
feature/calculator-shareable-links
feature/market-study-pdf-generation

# Bug fixes
fix/payment-webhook-validation
fix/calculator-precision-error

# Hotfixes
hotfix/critical-payment-bug

# Release branches
release/v1.0.0
release/v1.1.0
```

### 6.2 Commit Messages

```bash
# ✅ GOOD: Conventional commits format
feat(calculator): add shareable link generation
fix(payment): validate webhook signatures correctly
docs(readme): update installation instructions
test(market-study): add unit tests for valuation service
refactor(user): extract email validation to separate class
chore(deps): update dependencies to latest versions

# Commit body (optional but recommended)
feat(calculator): add shareable link generation

- Generate short codes using nanoid
- Store calculator state in database
- Return shareable URL with short code
- Add view count tracking

Closes #123

# ❌ BAD: Vague messages
fixed stuff
updates
wip
asdf
```

### 6.3 Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
```

---

## 7. Documentation Standards

### 7.1 JSDoc Comments

```typescript
/**
 * Calculates the homogenized value for a property sample
 *
 * @param sample - The market sample to homogenize
 * @param targetProperty - The property being evaluated
 * @returns Homogenized market sample with adjusted value
 *
 * @throws {ValidationError} If sample or target property is invalid
 *
 * @example
 * ```typescript
 * const homogenized = homogenizeSample(
 *   marketSample,
 *   { bedrooms: 3, bathrooms: 2 }
 * );
 * console.log(homogenized.getHomogenizedValue());
 * ```
 *
 * @see {@link https://docs.app.com/valuation | Valuation methodology}
 */
function homogenizeSample(
  sample: MarketSample,
  targetProperty: PropertyCharacteristics
): MarketSample {
  // Implementation
}
```

### 7.2 README Structure

```markdown
# Project Name

Brief description of the project

## Features
- Feature 1
- Feature 2

## Tech Stack
- Technology 1
- Technology 2

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+

### Installation
\`\`\`bash
npm install
cp .env.example .env
npm run db:migrate
\`\`\`

### Running Locally
\`\`\`bash
npm run dev
\`\`\`

## Testing
\`\`\`bash
npm test
npm run test:coverage
\`\`\`

## Deployment
See [DEPLOYMENT.md](./DEPLOYMENT.md)

## Contributing
See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License
MIT
```

---

## 8. Performance Guidelines

### 8.1 Database Optimization

```typescript
// ✅ GOOD: Use indexes
CREATE INDEX idx_calculators_user_created
ON calculators(user_id, created_at DESC);

// ✅ GOOD: Batch queries
const users = await userRepository.findByIds([id1, id2, id3]);

// ❌ BAD: N+1 queries
for (const userId of userIds) {
  const user = await userRepository.findById(userId); // N queries
}

// ✅ GOOD: Use connection pooling
const supabase = createClient(url, key, {
  db: { poolSize: 10 }
});

// ✅ GOOD: Limit result sets
const users = await userRepository.findAll({ limit: 100 });
```

### 8.2 Caching Strategy

```typescript
// ✅ GOOD: Cache expensive operations
const CACHE_TTL = 3600; // 1 hour

async function getMarketStudy(id: string): Promise<MarketStudy> {
  const cached = await cache.get(`market-study:${id}`);
  if (cached) {
    return JSON.parse(cached);
  }

  const study = await repository.findById(id);
  await cache.set(`market-study:${id}`, JSON.stringify(study), CACHE_TTL);

  return study;
}

// ✅ GOOD: Invalidate cache on updates
async function updateMarketStudy(
  id: string,
  updates: Partial<MarketStudy>
): Promise<void> {
  await repository.update(id, updates);
  await cache.delete(`market-study:${id}`);
}
```

### 8.3 Response Time Targets

```
Endpoint Type       | Target  | Max
------------------- | ------- | -------
Static Assets       | < 100ms | 200ms
API GET (cached)    | < 100ms | 200ms
API GET (uncached)  | < 300ms | 500ms
API POST/PUT        | < 500ms | 1000ms
PDF Generation      | < 5s    | 10s
Database Query      | < 50ms  | 100ms
```

---

## 9. Code Formatting

### 9.1 Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "avoid"
}
```

### 9.2 ESLint Configuration

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": "warn",
    "prefer-const": "error"
  }
}
```

---

## 10. Continuous Improvement

### 10.1 Code Metrics

```
Metric                    | Target  | Tool
------------------------- | ------- | ------------
Cyclomatic Complexity     | < 10    | SonarQube
Code Duplication          | < 3%    | SonarQube
Technical Debt Ratio      | < 5%    | SonarQube
Maintainability Index     | > 70    | CodeClimate
Test Coverage             | > 80%   | Jest/Vitest
```

### 10.2 Refactoring Triggers

- Function > 50 lines → Extract smaller functions
- Class > 300 lines → Split responsibilities
- Cyclomatic complexity > 10 → Simplify logic
- Duplicate code in 3+ places → Extract to function/class
- Test setup > 20 lines → Extract test fixtures

### 10.3 Learning Resources

- **TypeScript**: [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- **Clean Code**: "Clean Code" by Robert C. Martin
- **Design Patterns**: "Design Patterns" by Gang of Four
- **Testing**: "Test-Driven Development" by Kent Beck
- **Domain-Driven Design**: "Domain-Driven Design" by Eric Evans

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-01-04 | Tech Lead | Initial standards document |

**Next Review**: 2025-04-01 (Quarterly)
