import { describe, it, expect, beforeEach } from 'vitest';
import { PaymentCalculator } from '../PaymentCalculator';
import { PaymentPhase } from '../PaymentPhase';
import { Installment } from '../Installment';
import { Money } from '../../value-objects/Money';
import { Percentage } from '../../value-objects/Percentage';
import { CompletionDate } from '../../value-objects/CompletionDate';

describe('PaymentCalculator', () => {
  const createBasicCalculator = () => {
    const propertyValue = new Money(1000000); // R$ 1,000,000
    const captationPercentage = new Percentage(30); // 30%
    const completionDate = new CompletionDate(12, 2026);

    const entryInstallments = [
      new Installment('e1', new Money(100000), new Date('2025-06-01'), 'Entry 1'),
      new Installment('e2', new Money(100000), new Date('2025-07-01'), 'Entry 2'),
    ];
    const entryPayments = new PaymentPhase('Entry', entryInstallments);

    const duringInstallments = [
      new Installment('d1', new Money(50000), new Date('2025-08-01'), 'During 1'),
      new Installment('d2', new Money(50000), new Date('2025-09-01'), 'During 2'),
    ];
    const duringConstructionPayments = new PaymentPhase('During Construction', duringInstallments);

    const habiteSe = new Money(0);

    const postInstallments = [
      new Installment('p1', new Money(100000), new Date('2027-01-01'), 'Post 1'),
    ];
    const postConstructionPayments = new PaymentPhase('Post Construction', postInstallments);

    return new PaymentCalculator({
      userId: 'user-123',
      propertyValue,
      captationPercentage,
      completionDate,
      entryPayments,
      duringConstructionPayments,
      habiteSe,
      postConstructionPayments,
    });
  };

  describe('constructor', () => {
    it('should create calculator with valid parameters', () => {
      const calculator = createBasicCalculator();

      expect(calculator.getUserId()).toBe('user-123');
      expect(calculator.getPropertyValue().getAmount()).toBe(1000000);
      expect(calculator.getCaptationPercentage().getValue()).toBe(30);
    });

    it('should generate ID if not provided', () => {
      const calculator = createBasicCalculator();
      expect(calculator.getId()).toBeDefined();
      expect(calculator.getId().length).toBeGreaterThan(0);
    });

    it('should use provided ID', () => {
      const propertyValue = new Money(1000000);
      const captationPercentage = new Percentage(30);
      const completionDate = new CompletionDate(12, 2026);
      const emptyPhase = PaymentPhase.empty('Empty');

      const calculator = new PaymentCalculator({
        id: 'custom-id',
        userId: 'user-123',
        propertyValue,
        captationPercentage,
        completionDate,
        entryPayments: emptyPhase,
        duringConstructionPayments: emptyPhase,
        habiteSe: Money.zero(),
        postConstructionPayments: emptyPhase,
      });

      expect(calculator.getId()).toBe('custom-id');
    });

    it('should throw error for empty userId', () => {
      const propertyValue = new Money(1000000);
      const captationPercentage = new Percentage(30);
      const completionDate = new CompletionDate(12, 2026);
      const emptyPhase = PaymentPhase.empty('Empty');

      expect(() => new PaymentCalculator({
        userId: '',
        propertyValue,
        captationPercentage,
        completionDate,
        entryPayments: emptyPhase,
        duringConstructionPayments: emptyPhase,
        habiteSe: Money.zero(),
        postConstructionPayments: emptyPhase,
      })).toThrow('User ID is required');
    });

    it('should throw error for whitespace-only userId', () => {
      const propertyValue = new Money(1000000);
      const captationPercentage = new Percentage(30);
      const completionDate = new CompletionDate(12, 2026);
      const emptyPhase = PaymentPhase.empty('Empty');

      expect(() => new PaymentCalculator({
        userId: '   ',
        propertyValue,
        captationPercentage,
        completionDate,
        entryPayments: emptyPhase,
        duringConstructionPayments: emptyPhase,
        habiteSe: Money.zero(),
        postConstructionPayments: emptyPhase,
      })).toThrow('User ID is required');
    });

    it('should throw error when total paid exceeds 150% of property value', () => {
      const propertyValue = new Money(1000000); // R$ 1M
      const captationPercentage = new Percentage(30);
      const completionDate = new CompletionDate(12, 2026);

      // Total: 1,600,000 (160% of property value)
      const entryInstallments = [
        new Installment('e1', new Money(800000), new Date('2025-06-01'), 'Entry 1'),
      ];
      const entryPayments = new PaymentPhase('Entry', entryInstallments);

      const postInstallments = [
        new Installment('p1', new Money(800000), new Date('2027-01-01'), 'Post 1'),
      ];
      const postConstructionPayments = new PaymentPhase('Post', postInstallments);

      expect(() => new PaymentCalculator({
        userId: 'user-123',
        propertyValue,
        captationPercentage,
        completionDate,
        entryPayments,
        duringConstructionPayments: PaymentPhase.empty('During'),
        habiteSe: Money.zero(),
        postConstructionPayments,
      })).toThrow('exceeds 150% of property value');
    });

    it('should accept total paid at exactly 150% of property value', () => {
      const propertyValue = new Money(1000000); // R$ 1M
      const captationPercentage = new Percentage(30);
      const completionDate = new CompletionDate(12, 2026);

      // Total: 1,500,000 (exactly 150%)
      const entryInstallments = [
        new Installment('e1', new Money(750000), new Date('2025-06-01'), 'Entry 1'),
      ];
      const entryPayments = new PaymentPhase('Entry', entryInstallments);

      const postInstallments = [
        new Installment('p1', new Money(750000), new Date('2027-01-01'), 'Post 1'),
      ];
      const postConstructionPayments = new PaymentPhase('Post', postInstallments);

      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue,
        captationPercentage,
        completionDate,
        entryPayments,
        duringConstructionPayments: PaymentPhase.empty('During'),
        habiteSe: Money.zero(),
        postConstructionPayments,
      });

      expect(calculator).toBeDefined();
    });

    it('should set default createdAt if not provided', () => {
      const calculator = createBasicCalculator();
      const createdAt = calculator.getCreatedAt();
      expect(createdAt).toBeInstanceOf(Date);
    });

    it('should use provided createdAt', () => {
      const propertyValue = new Money(1000000);
      const captationPercentage = new Percentage(30);
      const completionDate = new CompletionDate(12, 2026);
      const emptyPhase = PaymentPhase.empty('Empty');
      const customDate = new Date('2024-01-01');

      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue,
        captationPercentage,
        completionDate,
        entryPayments: emptyPhase,
        duringConstructionPayments: emptyPhase,
        habiteSe: Money.zero(),
        postConstructionPayments: emptyPhase,
        createdAt: customDate,
      });

      expect(calculator.getCreatedAt().getTime()).toBe(customDate.getTime());
    });

    it('should set default viewCount to 0', () => {
      const calculator = createBasicCalculator();
      expect(calculator.getViewCount()).toBe(0);
    });

    it('should use provided viewCount', () => {
      const propertyValue = new Money(1000000);
      const captationPercentage = new Percentage(30);
      const completionDate = new CompletionDate(12, 2026);
      const emptyPhase = PaymentPhase.empty('Empty');

      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue,
        captationPercentage,
        completionDate,
        entryPayments: emptyPhase,
        duringConstructionPayments: emptyPhase,
        habiteSe: Money.zero(),
        postConstructionPayments: emptyPhase,
        viewCount: 42,
      });

      expect(calculator.getViewCount()).toBe(42);
    });
  });

  describe('isApproved', () => {
    it('should return true when actual captation >= required', () => {
      const propertyValue = new Money(1000000);
      const captationPercentage = new Percentage(30); // Requires R$ 300,000

      const entryInstallments = [
        new Installment('e1', new Money(200000), new Date('2025-06-01'), 'Entry 1'),
      ];
      const duringInstallments = [
        new Installment('d1', new Money(100000), new Date('2025-08-01'), 'During 1'),
      ];

      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue,
        captationPercentage,
        completionDate: new CompletionDate(12, 2026),
        entryPayments: new PaymentPhase('Entry', entryInstallments),
        duringConstructionPayments: new PaymentPhase('During', duringInstallments),
        habiteSe: Money.zero(),
        postConstructionPayments: PaymentPhase.empty('Post'),
      });

      expect(calculator.isApproved()).toBe(true);
    });

    it('should return false when actual captation < required', () => {
      const propertyValue = new Money(1000000);
      const captationPercentage = new Percentage(30); // Requires R$ 300,000

      const entryInstallments = [
        new Installment('e1', new Money(100000), new Date('2025-06-01'), 'Entry 1'),
      ];

      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue,
        captationPercentage,
        completionDate: new CompletionDate(12, 2026),
        entryPayments: new PaymentPhase('Entry', entryInstallments),
        duringConstructionPayments: PaymentPhase.empty('During'),
        habiteSe: Money.zero(),
        postConstructionPayments: PaymentPhase.empty('Post'),
      });

      expect(calculator.isApproved()).toBe(false);
    });

    it('should return true when actual equals required exactly', () => {
      const propertyValue = new Money(1000000);
      const captationPercentage = new Percentage(30); // Requires exactly R$ 300,000

      const entryInstallments = [
        new Installment('e1', new Money(300000), new Date('2025-06-01'), 'Entry 1'),
      ];

      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue,
        captationPercentage,
        completionDate: new CompletionDate(12, 2026),
        entryPayments: new PaymentPhase('Entry', entryInstallments),
        duringConstructionPayments: PaymentPhase.empty('During'),
        habiteSe: Money.zero(),
        postConstructionPayments: PaymentPhase.empty('Post'),
      });

      expect(calculator.isApproved()).toBe(true);
    });

    it('should include habite-se in actual captation', () => {
      const propertyValue = new Money(1000000);
      const captationPercentage = new Percentage(30); // Requires R$ 300,000

      const entryInstallments = [
        new Installment('e1', new Money(150000), new Date('2025-06-01'), 'Entry 1'),
      ];

      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue,
        captationPercentage,
        completionDate: new CompletionDate(12, 2026),
        entryPayments: new PaymentPhase('Entry', entryInstallments),
        duringConstructionPayments: PaymentPhase.empty('During'),
        habiteSe: new Money(150000), // Makes up the difference
        postConstructionPayments: PaymentPhase.empty('Post'),
      });

      expect(calculator.isApproved()).toBe(true);
    });
  });

  describe('getApprovalStatus', () => {
    it('should return correct status when approved', () => {
      const propertyValue = new Money(1000000);
      const captationPercentage = new Percentage(30); // Requires R$ 300,000

      const entryInstallments = [
        new Installment('e1', new Money(350000), new Date('2025-06-01'), 'Entry 1'),
      ];

      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue,
        captationPercentage,
        completionDate: new CompletionDate(12, 2026),
        entryPayments: new PaymentPhase('Entry', entryInstallments),
        duringConstructionPayments: PaymentPhase.empty('During'),
        habiteSe: Money.zero(),
        postConstructionPayments: PaymentPhase.empty('Post'),
      });

      const status = calculator.getApprovalStatus();

      expect(status.approved).toBe(true);
      expect(status.requiredCaptation.getAmount()).toBe(300000);
      expect(status.actualCaptation.getAmount()).toBe(350000);
      expect(status.difference.getAmount()).toBe(50000);
      expect(status.percentagePaid).toBe(35); // 350k / 1M = 35%
    });

    it('should return correct status when not approved', () => {
      const propertyValue = new Money(1000000);
      const captationPercentage = new Percentage(30); // Requires R$ 300,000

      const entryInstallments = [
        new Installment('e1', new Money(200000), new Date('2025-06-01'), 'Entry 1'),
      ];

      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue,
        captationPercentage,
        completionDate: new CompletionDate(12, 2026),
        entryPayments: new PaymentPhase('Entry', entryInstallments),
        duringConstructionPayments: PaymentPhase.empty('During'),
        habiteSe: Money.zero(),
        postConstructionPayments: PaymentPhase.empty('Post'),
      });

      const status = calculator.getApprovalStatus();

      expect(status.approved).toBe(false);
      expect(status.requiredCaptation.getAmount()).toBe(300000);
      expect(status.actualCaptation.getAmount()).toBe(200000);
      expect(status.difference.getAmount()).toBe(100000); // Shortfall
      expect(status.percentagePaid).toBe(20); // 200k / 1M = 20%
    });

    it('should calculate percentage paid correctly', () => {
      const propertyValue = new Money(1000000);
      const captationPercentage = new Percentage(30);

      const entryInstallments = [
        new Installment('e1', new Money(500000), new Date('2025-06-01'), 'Entry 1'),
      ];

      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue,
        captationPercentage,
        completionDate: new CompletionDate(12, 2026),
        entryPayments: new PaymentPhase('Entry', entryInstallments),
        duringConstructionPayments: PaymentPhase.empty('During'),
        habiteSe: Money.zero(),
        postConstructionPayments: PaymentPhase.empty('Post'),
      });

      const status = calculator.getApprovalStatus();
      expect(status.percentagePaid).toBe(50); // 500k / 1M = 50%
    });
  });

  describe('getRequiredCaptation', () => {
    it('should calculate required captation as percentage of property value', () => {
      const propertyValue = new Money(1000000);
      const captationPercentage = new Percentage(30);

      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue,
        captationPercentage,
        completionDate: new CompletionDate(12, 2026),
        entryPayments: PaymentPhase.empty('Entry'),
        duringConstructionPayments: PaymentPhase.empty('During'),
        habiteSe: Money.zero(),
        postConstructionPayments: PaymentPhase.empty('Post'),
      });

      const required = calculator.getRequiredCaptation();
      expect(required.getAmount()).toBe(300000); // 30% of 1M
    });

    it('should handle different percentages', () => {
      const propertyValue = new Money(1000000);
      const captationPercentage = new Percentage(50);

      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue,
        captationPercentage,
        completionDate: new CompletionDate(12, 2026),
        entryPayments: PaymentPhase.empty('Entry'),
        duringConstructionPayments: PaymentPhase.empty('During'),
        habiteSe: Money.zero(),
        postConstructionPayments: PaymentPhase.empty('Post'),
      });

      const required = calculator.getRequiredCaptation();
      expect(required.getAmount()).toBe(500000); // 50% of 1M
    });
  });

  describe('getActualCaptation', () => {
    it('should sum entry + during + habite-se', () => {
      const entryInstallments = [
        new Installment('e1', new Money(100000), new Date('2025-06-01'), 'Entry 1'),
      ];
      const duringInstallments = [
        new Installment('d1', new Money(50000), new Date('2025-08-01'), 'During 1'),
      ];

      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue: new Money(1000000),
        captationPercentage: new Percentage(30),
        completionDate: new CompletionDate(12, 2026),
        entryPayments: new PaymentPhase('Entry', entryInstallments),
        duringConstructionPayments: new PaymentPhase('During', duringInstallments),
        habiteSe: new Money(25000),
        postConstructionPayments: PaymentPhase.empty('Post'),
      });

      const actual = calculator.getActualCaptation();
      expect(actual.getAmount()).toBe(175000); // 100k + 50k + 25k
    });

    it('should return zero when all phases are empty', () => {
      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue: new Money(1000000),
        captationPercentage: new Percentage(30),
        completionDate: new CompletionDate(12, 2026),
        entryPayments: PaymentPhase.empty('Entry'),
        duringConstructionPayments: PaymentPhase.empty('During'),
        habiteSe: Money.zero(),
        postConstructionPayments: PaymentPhase.empty('Post'),
      });

      const actual = calculator.getActualCaptation();
      expect(actual.getAmount()).toBe(0);
    });

    it('should not include post-construction payments', () => {
      const postInstallments = [
        new Installment('p1', new Money(100000), new Date('2027-01-01'), 'Post 1'),
      ];

      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue: new Money(1000000),
        captationPercentage: new Percentage(30),
        completionDate: new CompletionDate(12, 2026),
        entryPayments: PaymentPhase.empty('Entry'),
        duringConstructionPayments: PaymentPhase.empty('During'),
        habiteSe: Money.zero(),
        postConstructionPayments: new PaymentPhase('Post', postInstallments),
      });

      const actual = calculator.getActualCaptation();
      expect(actual.getAmount()).toBe(0); // Post-construction not included
    });
  });

  describe('getTotalPaid', () => {
    it('should sum all payments including post-construction', () => {
      const entryInstallments = [
        new Installment('e1', new Money(100000), new Date('2025-06-01'), 'Entry 1'),
      ];
      const duringInstallments = [
        new Installment('d1', new Money(50000), new Date('2025-08-01'), 'During 1'),
      ];
      const postInstallments = [
        new Installment('p1', new Money(200000), new Date('2027-01-01'), 'Post 1'),
      ];

      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue: new Money(1000000),
        captationPercentage: new Percentage(30),
        completionDate: new CompletionDate(12, 2026),
        entryPayments: new PaymentPhase('Entry', entryInstallments),
        duringConstructionPayments: new PaymentPhase('During', duringInstallments),
        habiteSe: new Money(25000),
        postConstructionPayments: new PaymentPhase('Post', postInstallments),
      });

      const total = calculator.getTotalPaid();
      expect(total.getAmount()).toBe(375000); // 100k + 50k + 25k + 200k
    });

    it('should equal actual captation when no post-construction', () => {
      const entryInstallments = [
        new Installment('e1', new Money(100000), new Date('2025-06-01'), 'Entry 1'),
      ];

      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue: new Money(1000000),
        captationPercentage: new Percentage(30),
        completionDate: new CompletionDate(12, 2026),
        entryPayments: new PaymentPhase('Entry', entryInstallments),
        duringConstructionPayments: PaymentPhase.empty('During'),
        habiteSe: Money.zero(),
        postConstructionPayments: PaymentPhase.empty('Post'),
      });

      const total = calculator.getTotalPaid();
      const actual = calculator.getActualCaptation();
      expect(total.equals(actual)).toBe(true);
    });
  });

  describe('getRemainingBalance', () => {
    it('should calculate remaining balance correctly', () => {
      const entryInstallments = [
        new Installment('e1', new Money(300000), new Date('2025-06-01'), 'Entry 1'),
      ];

      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue: new Money(1000000),
        captationPercentage: new Percentage(30),
        completionDate: new CompletionDate(12, 2026),
        entryPayments: new PaymentPhase('Entry', entryInstallments),
        duringConstructionPayments: PaymentPhase.empty('During'),
        habiteSe: Money.zero(),
        postConstructionPayments: PaymentPhase.empty('Post'),
      });

      const remaining = calculator.getRemainingBalance();
      expect(remaining.getAmount()).toBe(700000); // 1M - 300k
    });

    it('should return zero when total paid >= property value', () => {
      const entryInstallments = [
        new Installment('e1', new Money(1000000), new Date('2025-06-01'), 'Entry 1'),
      ];

      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue: new Money(1000000),
        captationPercentage: new Percentage(30),
        completionDate: new CompletionDate(12, 2026),
        entryPayments: new PaymentPhase('Entry', entryInstallments),
        duringConstructionPayments: PaymentPhase.empty('During'),
        habiteSe: Money.zero(),
        postConstructionPayments: PaymentPhase.empty('Post'),
      });

      const remaining = calculator.getRemainingBalance();
      expect(remaining.getAmount()).toBe(0);
    });

    it('should return property value when no payments made', () => {
      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue: new Money(1000000),
        captationPercentage: new Percentage(30),
        completionDate: new CompletionDate(12, 2026),
        entryPayments: PaymentPhase.empty('Entry'),
        duringConstructionPayments: PaymentPhase.empty('During'),
        habiteSe: Money.zero(),
        postConstructionPayments: PaymentPhase.empty('Post'),
      });

      const remaining = calculator.getRemainingBalance();
      expect(remaining.getAmount()).toBe(1000000);
    });
  });

  describe('getMonthsUntilCompletion', () => {
    it('should delegate to completion date', () => {
      const calculator = createBasicCalculator();
      const months = calculator.getMonthsUntilCompletion();
      expect(months).toBeGreaterThanOrEqual(0);
      expect(typeof months).toBe('number');
    });
  });

  describe('generateShortCode', () => {
    it('should generate 6 character alphanumeric code', () => {
      const calculator = createBasicCalculator();
      const code = calculator.generateShortCode();

      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[a-z0-9]{6}$/);
    });

    it('should return same code on subsequent calls', () => {
      const calculator = createBasicCalculator();
      const code1 = calculator.generateShortCode();
      const code2 = calculator.generateShortCode();

      expect(code1).toBe(code2);
    });

    it('should return provided shortCode if exists', () => {
      const propertyValue = new Money(1000000);
      const captationPercentage = new Percentage(30);
      const completionDate = new CompletionDate(12, 2026);
      const emptyPhase = PaymentPhase.empty('Empty');

      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue,
        captationPercentage,
        completionDate,
        entryPayments: emptyPhase,
        duringConstructionPayments: emptyPhase,
        habiteSe: Money.zero(),
        postConstructionPayments: emptyPhase,
        shortCode: 'abc123',
      });

      expect(calculator.generateShortCode()).toBe('abc123');
    });

    it('should generate unique codes for different calculators', () => {
      const calculator1 = createBasicCalculator();
      const calculator2 = createBasicCalculator();

      const code1 = calculator1.generateShortCode();
      const code2 = calculator2.generateShortCode();

      // Note: There's a tiny chance they could be equal by random chance
      expect(code1).not.toBe(code2);
    });
  });

  describe('getShareableUrl', () => {
    it('should generate shareable URL with base URL', () => {
      const calculator = createBasicCalculator();
      calculator.generateShortCode();

      const url = calculator.getShareableUrl('https://example.com');
      expect(url).toMatch(/^https:\/\/example\.com\/c\/[a-z0-9]{6}$/);
    });

    it('should throw error if short code not generated', () => {
      const calculator = createBasicCalculator();
      expect(() => calculator.getShareableUrl('https://example.com'))
        .toThrow('Short code not generated');
    });

    it('should work with different base URLs', () => {
      const calculator = createBasicCalculator();
      const code = calculator.generateShortCode();

      const url1 = calculator.getShareableUrl('https://domain1.com');
      const url2 = calculator.getShareableUrl('https://domain2.com');

      expect(url1).toBe(`https://domain1.com/c/${code}`);
      expect(url2).toBe(`https://domain2.com/c/${code}`);
    });
  });

  describe('getShortCode', () => {
    it('should return undefined before generation', () => {
      const calculator = createBasicCalculator();
      expect(calculator.getShortCode()).toBeUndefined();
    });

    it('should return code after generation', () => {
      const calculator = createBasicCalculator();
      const code = calculator.generateShortCode();
      expect(calculator.getShortCode()).toBe(code);
    });
  });

  describe('incrementViewCount', () => {
    it('should increment view count', () => {
      const calculator = createBasicCalculator();
      expect(calculator.getViewCount()).toBe(0);

      calculator.incrementViewCount();
      expect(calculator.getViewCount()).toBe(1);

      calculator.incrementViewCount();
      expect(calculator.getViewCount()).toBe(2);
    });

    it('should work with initial view count', () => {
      const propertyValue = new Money(1000000);
      const captationPercentage = new Percentage(30);
      const completionDate = new CompletionDate(12, 2026);
      const emptyPhase = PaymentPhase.empty('Empty');

      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue,
        captationPercentage,
        completionDate,
        entryPayments: emptyPhase,
        duringConstructionPayments: emptyPhase,
        habiteSe: Money.zero(),
        postConstructionPayments: emptyPhase,
        viewCount: 10,
      });

      calculator.incrementViewCount();
      expect(calculator.getViewCount()).toBe(11);
    });
  });

  describe('getters', () => {
    it('should return all values correctly', () => {
      const calculator = createBasicCalculator();

      expect(calculator.getUserId()).toBe('user-123');
      expect(calculator.getPropertyValue().getAmount()).toBe(1000000);
      expect(calculator.getCaptationPercentage().getValue()).toBe(30);
      expect(calculator.getCompletionDate().getMonth()).toBe(12);
      expect(calculator.getCompletionDate().getYear()).toBe(2026);
      expect(calculator.getEntryPayments().getName()).toBe('Entry');
      expect(calculator.getDuringConstructionPayments().getName()).toBe('During Construction');
      expect(calculator.getHabiteSe().getAmount()).toBe(0);
      expect(calculator.getPostConstructionPayments().getName()).toBe('Post Construction');
    });

    it('should return cloned date for createdAt', () => {
      const calculator = createBasicCalculator();
      const date1 = calculator.getCreatedAt();
      const date2 = calculator.getCreatedAt();

      date1.setFullYear(2020);
      expect(date2.getFullYear()).not.toBe(2020);
    });
  });

  describe('toJSON / fromJSON', () => {
    it('should serialize to JSON', () => {
      const calculator = createBasicCalculator();
      calculator.generateShortCode();

      const json = calculator.toJSON();

      expect(json.id).toBeDefined();
      expect(json.userId).toBe('user-123');
      expect(json.propertyValue).toBe(1000000);
      expect(json.captationPercentage).toBe(30);
      expect(json.completionDate).toBeDefined();
      expect(json.entryPayments).toBeDefined();
      expect(json.duringConstructionPayments).toBeDefined();
      expect(json.habiteSe).toBe(0);
      expect(json.postConstructionPayments).toBeDefined();
      expect(json.shortCode).toBeDefined();
      expect(json.viewCount).toBe(0);
      expect(json.createdAt).toBeDefined();
    });

    it('should deserialize from JSON', () => {
      const original = createBasicCalculator();
      const json = original.toJSON();
      const restored = PaymentCalculator.fromJSON(json);

      expect(restored.getId()).toBe(original.getId());
      expect(restored.getUserId()).toBe(original.getUserId());
      expect(restored.getPropertyValue().equals(original.getPropertyValue())).toBe(true);
      expect(restored.getCaptationPercentage().equals(original.getCaptationPercentage())).toBe(true);
    });

    it('should round-trip through JSON', () => {
      const original = createBasicCalculator();
      original.generateShortCode();
      original.incrementViewCount();

      const json = original.toJSON();
      const restored = PaymentCalculator.fromJSON(json);

      expect(restored.getId()).toBe(original.getId());
      expect(restored.getShortCode()).toBe(original.getShortCode());
      expect(restored.getViewCount()).toBe(original.getViewCount());
      expect(restored.isApproved()).toBe(original.isApproved());
    });
  });

  describe('edge cases', () => {
    it('should handle zero property value', () => {
      const propertyValue = new Money(0);
      const captationPercentage = new Percentage(30);
      const completionDate = new CompletionDate(12, 2026);
      const emptyPhase = PaymentPhase.empty('Empty');

      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue,
        captationPercentage,
        completionDate,
        entryPayments: emptyPhase,
        duringConstructionPayments: emptyPhase,
        habiteSe: Money.zero(),
        postConstructionPayments: emptyPhase,
      });

      expect(calculator.getRequiredCaptation().getAmount()).toBe(0);
      expect(calculator.isApproved()).toBe(true);
    });

    it('should handle 100% captation percentage', () => {
      const propertyValue = new Money(1000000);
      const captationPercentage = new Percentage(100);
      const completionDate = new CompletionDate(12, 2026);

      const entryInstallments = [
        new Installment('e1', new Money(1000000), new Date('2025-06-01'), 'Entry 1'),
      ];

      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue,
        captationPercentage,
        completionDate,
        entryPayments: new PaymentPhase('Entry', entryInstallments),
        duringConstructionPayments: PaymentPhase.empty('During'),
        habiteSe: Money.zero(),
        postConstructionPayments: PaymentPhase.empty('Post'),
      });

      expect(calculator.getRequiredCaptation().getAmount()).toBe(1000000);
      expect(calculator.isApproved()).toBe(true);
    });

    it('should handle very large property values', () => {
      const propertyValue = new Money(999999999);
      const captationPercentage = new Percentage(30);
      const completionDate = new CompletionDate(12, 2026);
      const emptyPhase = PaymentPhase.empty('Empty');

      const calculator = new PaymentCalculator({
        userId: 'user-123',
        propertyValue,
        captationPercentage,
        completionDate,
        entryPayments: emptyPhase,
        duringConstructionPayments: emptyPhase,
        habiteSe: Money.zero(),
        postConstructionPayments: emptyPhase,
      });

      const required = calculator.getRequiredCaptation();
      expect(required.getAmount()).toBeCloseTo(299999999.7, 0);
    });

    it('should maintain immutability', () => {
      const calculator = createBasicCalculator();

      const userId = calculator.getUserId();
      const propertyValue = calculator.getPropertyValue();
      const approved = calculator.isApproved();

      // Call various methods
      calculator.getApprovalStatus();
      calculator.getTotalPaid();
      calculator.getRemainingBalance();
      calculator.generateShortCode();
      calculator.incrementViewCount();

      // Original values should not change (except view count)
      expect(calculator.getUserId()).toBe(userId);
      expect(calculator.getPropertyValue().equals(propertyValue)).toBe(true);
      expect(calculator.isApproved()).toBe(approved);
    });
  });
});
