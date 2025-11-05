import { describe, it, expect } from 'vitest';
import { Money } from '../Money';

describe('Money', () => {
  describe('constructor', () => {
    it('should create money with positive amount', () => {
      const money = new Money(1000);
      expect(money.getAmount()).toBe(1000);
      expect(money.getCurrency()).toBe('BRL');
    });

    it('should create money with zero amount', () => {
      const money = new Money(0);
      expect(money.getAmount()).toBe(0);
    });

    it('should create money with custom currency', () => {
      const money = new Money(1000, 'USD');
      expect(money.getAmount()).toBe(1000);
      expect(money.getCurrency()).toBe('USD');
    });

    it('should round to 2 decimal places', () => {
      const money = new Money(1000.123456);
      expect(money.getAmount()).toBe(1000.12);
    });

    it('should throw error for negative amount', () => {
      expect(() => new Money(-100)).toThrow('Money amount cannot be negative');
    });

    it('should throw error for Infinity', () => {
      expect(() => new Money(Infinity)).toThrow('Money amount must be a finite number');
    });

    it('should throw error for NaN', () => {
      expect(() => new Money(NaN)).toThrow('Money amount must be a finite number');
    });

    it('should handle very large numbers', () => {
      const money = new Money(999999999.99);
      expect(money.getAmount()).toBe(999999999.99);
    });
  });

  describe('add', () => {
    it('should add two money objects', () => {
      const m1 = new Money(1000);
      const m2 = new Money(500);
      const result = m1.add(m2);
      expect(result.getAmount()).toBe(1500);
    });

    it('should add zero', () => {
      const m1 = new Money(1000);
      const m2 = new Money(0);
      const result = m1.add(m2);
      expect(result.getAmount()).toBe(1000);
    });

    it('should throw error for different currencies', () => {
      const brl = new Money(1000, 'BRL');
      const usd = new Money(1000, 'USD');
      expect(() => brl.add(usd)).toThrow('Currency mismatch: BRL !== USD');
    });

    it('should not mutate original objects', () => {
      const m1 = new Money(1000);
      const m2 = new Money(500);
      const result = m1.add(m2);
      expect(m1.getAmount()).toBe(1000);
      expect(m2.getAmount()).toBe(500);
      expect(result.getAmount()).toBe(1500);
    });

    it('should add decimal amounts correctly', () => {
      const m1 = new Money(10.50);
      const m2 = new Money(20.75);
      const result = m1.add(m2);
      expect(result.getAmount()).toBe(31.25);
    });
  });

  describe('subtract', () => {
    it('should subtract two money objects', () => {
      const m1 = new Money(1000);
      const m2 = new Money(300);
      const result = m1.subtract(m2);
      expect(result.getAmount()).toBe(700);
    });

    it('should subtract resulting in zero', () => {
      const m1 = new Money(1000);
      const m2 = new Money(1000);
      const result = m1.subtract(m2);
      expect(result.getAmount()).toBe(0);
    });

    it('should throw error when result would be negative', () => {
      const m1 = new Money(100);
      const m2 = new Money(200);
      expect(() => m1.subtract(m2)).toThrow('Subtraction would result in negative amount');
    });

    it('should throw error for different currencies', () => {
      const brl = new Money(1000, 'BRL');
      const usd = new Money(500, 'USD');
      expect(() => brl.subtract(usd)).toThrow('Currency mismatch: BRL !== USD');
    });

    it('should not mutate original objects', () => {
      const m1 = new Money(1000);
      const m2 = new Money(300);
      const result = m1.subtract(m2);
      expect(m1.getAmount()).toBe(1000);
      expect(m2.getAmount()).toBe(300);
      expect(result.getAmount()).toBe(700);
    });
  });

  describe('multiply', () => {
    it('should multiply by positive factor', () => {
      const money = new Money(1000);
      const result = money.multiply(2);
      expect(result.getAmount()).toBe(2000);
    });

    it('should multiply by decimal factor', () => {
      const money = new Money(1000);
      const result = money.multiply(0.5);
      expect(result.getAmount()).toBe(500);
    });

    it('should multiply by zero', () => {
      const money = new Money(1000);
      const result = money.multiply(0);
      expect(result.getAmount()).toBe(0);
    });

    it('should throw error for Infinity factor', () => {
      const money = new Money(1000);
      expect(() => money.multiply(Infinity)).toThrow('Multiplication factor must be finite');
    });

    it('should throw error for NaN factor', () => {
      const money = new Money(1000);
      expect(() => money.multiply(NaN)).toThrow('Multiplication factor must be finite');
    });

    it('should not mutate original object', () => {
      const money = new Money(1000);
      const result = money.multiply(2);
      expect(money.getAmount()).toBe(1000);
      expect(result.getAmount()).toBe(2000);
    });

    it('should handle percentage calculations', () => {
      const money = new Money(1000);
      const result = money.multiply(0.30); // 30%
      expect(result.getAmount()).toBe(300);
    });
  });

  describe('divide', () => {
    it('should divide by positive divisor', () => {
      const money = new Money(1000);
      const result = money.divide(2);
      expect(result.getAmount()).toBe(500);
    });

    it('should divide by decimal divisor', () => {
      const money = new Money(1000);
      const result = money.divide(0.5);
      expect(result.getAmount()).toBe(2000);
    });

    it('should throw error for division by zero', () => {
      const money = new Money(1000);
      expect(() => money.divide(0)).toThrow('Cannot divide by zero');
    });

    it('should throw error for Infinity divisor', () => {
      const money = new Money(1000);
      expect(() => money.divide(Infinity)).toThrow('Divisor must be finite');
    });

    it('should throw error for NaN divisor', () => {
      const money = new Money(1000);
      expect(() => money.divide(NaN)).toThrow('Divisor must be finite');
    });

    it('should not mutate original object', () => {
      const money = new Money(1000);
      const result = money.divide(2);
      expect(money.getAmount()).toBe(1000);
      expect(result.getAmount()).toBe(500);
    });

    it('should handle division resulting in decimals', () => {
      const money = new Money(100);
      const result = money.divide(3);
      expect(result.getAmount()).toBeCloseTo(33.33, 2);
    });
  });

  describe('equals', () => {
    it('should return true for equal money objects', () => {
      const m1 = new Money(1000);
      const m2 = new Money(1000);
      expect(m1.equals(m2)).toBe(true);
    });

    it('should return false for different amounts', () => {
      const m1 = new Money(1000);
      const m2 = new Money(1500);
      expect(m1.equals(m2)).toBe(false);
    });

    it('should return false for different currencies', () => {
      const m1 = new Money(1000, 'BRL');
      const m2 = new Money(1000, 'USD');
      expect(m1.equals(m2)).toBe(false);
    });

    it('should return true for zero values', () => {
      const m1 = new Money(0);
      const m2 = new Money(0);
      expect(m1.equals(m2)).toBe(true);
    });
  });

  describe('greaterThan', () => {
    it('should return true when amount is greater', () => {
      const m1 = new Money(1000);
      const m2 = new Money(500);
      expect(m1.greaterThan(m2)).toBe(true);
    });

    it('should return false when amount is less', () => {
      const m1 = new Money(500);
      const m2 = new Money(1000);
      expect(m1.greaterThan(m2)).toBe(false);
    });

    it('should return false when amounts are equal', () => {
      const m1 = new Money(1000);
      const m2 = new Money(1000);
      expect(m1.greaterThan(m2)).toBe(false);
    });

    it('should throw error for different currencies', () => {
      const brl = new Money(1000, 'BRL');
      const usd = new Money(500, 'USD');
      expect(() => brl.greaterThan(usd)).toThrow('Currency mismatch');
    });
  });

  describe('lessThan', () => {
    it('should return true when amount is less', () => {
      const m1 = new Money(500);
      const m2 = new Money(1000);
      expect(m1.lessThan(m2)).toBe(true);
    });

    it('should return false when amount is greater', () => {
      const m1 = new Money(1000);
      const m2 = new Money(500);
      expect(m1.lessThan(m2)).toBe(false);
    });

    it('should return false when amounts are equal', () => {
      const m1 = new Money(1000);
      const m2 = new Money(1000);
      expect(m1.lessThan(m2)).toBe(false);
    });

    it('should throw error for different currencies', () => {
      const brl = new Money(1000, 'BRL');
      const usd = new Money(1500, 'USD');
      expect(() => brl.lessThan(usd)).toThrow('Currency mismatch');
    });
  });

  describe('greaterThanOrEqual', () => {
    it('should return true when amount is greater', () => {
      const m1 = new Money(1000);
      const m2 = new Money(500);
      expect(m1.greaterThanOrEqual(m2)).toBe(true);
    });

    it('should return true when amounts are equal', () => {
      const m1 = new Money(1000);
      const m2 = new Money(1000);
      expect(m1.greaterThanOrEqual(m2)).toBe(true);
    });

    it('should return false when amount is less', () => {
      const m1 = new Money(500);
      const m2 = new Money(1000);
      expect(m1.greaterThanOrEqual(m2)).toBe(false);
    });

    it('should throw error for different currencies', () => {
      const brl = new Money(1000, 'BRL');
      const usd = new Money(1000, 'USD');
      expect(() => brl.greaterThanOrEqual(usd)).toThrow('Currency mismatch');
    });
  });

  describe('lessThanOrEqual', () => {
    it('should return true when amount is less', () => {
      const m1 = new Money(500);
      const m2 = new Money(1000);
      expect(m1.lessThanOrEqual(m2)).toBe(true);
    });

    it('should return true when amounts are equal', () => {
      const m1 = new Money(1000);
      const m2 = new Money(1000);
      expect(m1.lessThanOrEqual(m2)).toBe(true);
    });

    it('should return false when amount is greater', () => {
      const m1 = new Money(1000);
      const m2 = new Money(500);
      expect(m1.lessThanOrEqual(m2)).toBe(false);
    });

    it('should throw error for different currencies', () => {
      const brl = new Money(1000, 'BRL');
      const usd = new Money(1000, 'USD');
      expect(() => brl.lessThanOrEqual(usd)).toThrow('Currency mismatch');
    });
  });

  describe('format', () => {
    it('should format BRL correctly', () => {
      const money = new Money(1000);
      const formatted = money.format();
      expect(formatted).toMatch(/1\.000,00/);
    });

    it('should format zero correctly', () => {
      const money = new Money(0);
      const formatted = money.format();
      expect(formatted).toMatch(/0,00/);
    });

    it('should format large numbers correctly', () => {
      const money = new Money(1000000);
      const formatted = money.format();
      expect(formatted).toMatch(/1\.000\.000,00/);
    });

    it('should format decimals correctly', () => {
      const money = new Money(1234.56);
      const formatted = money.format();
      expect(formatted).toMatch(/1\.234,56/);
    });
  });

  describe('toJSON / fromJSON', () => {
    it('should serialize to JSON', () => {
      const money = new Money(1000, 'BRL');
      const json = money.toJSON();
      expect(json).toEqual({
        amount: 1000,
        currency: 'BRL',
      });
    });

    it('should deserialize from JSON', () => {
      const json = { amount: 1000, currency: 'BRL' };
      const money = Money.fromJSON(json);
      expect(money.getAmount()).toBe(1000);
      expect(money.getCurrency()).toBe('BRL');
    });

    it('should round-trip through JSON', () => {
      const original = new Money(1234.56, 'USD');
      const json = original.toJSON();
      const restored = Money.fromJSON(json);
      expect(restored.equals(original)).toBe(true);
    });

    it('should use default currency when not provided', () => {
      const json = { amount: 1000 };
      const money = Money.fromJSON(json);
      expect(money.getCurrency()).toBe('BRL');
    });
  });

  describe('zero', () => {
    it('should create zero money with default currency', () => {
      const money = Money.zero();
      expect(money.getAmount()).toBe(0);
      expect(money.getCurrency()).toBe('BRL');
    });

    it('should create zero money with custom currency', () => {
      const money = Money.zero('USD');
      expect(money.getAmount()).toBe(0);
      expect(money.getCurrency()).toBe('USD');
    });
  });

  describe('edge cases', () => {
    it('should handle very small decimal values', () => {
      const money = new Money(0.01);
      expect(money.getAmount()).toBe(0.01);
    });

    it('should handle precision in arithmetic operations', () => {
      const m1 = new Money(10.10);
      const m2 = new Money(20.20);
      const result = m1.add(m2);
      expect(result.getAmount()).toBe(30.30);
    });

    it('should maintain immutability through multiple operations', () => {
      const original = new Money(1000);
      const doubled = original.multiply(2);
      const halved = original.divide(2);

      expect(original.getAmount()).toBe(1000);
      expect(doubled.getAmount()).toBe(2000);
      expect(halved.getAmount()).toBe(500);
    });

    it('should chain operations correctly', () => {
      const money = new Money(1000);
      const result = money
        .add(new Money(500))
        .multiply(2)
        .subtract(new Money(1000));

      expect(result.getAmount()).toBe(2000);
    });
  });
});
