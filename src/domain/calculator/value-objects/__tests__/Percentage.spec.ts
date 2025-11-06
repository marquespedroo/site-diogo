import { describe, it, expect } from 'vitest';
import { Percentage } from '../Percentage';

describe('Percentage', () => {
  describe('constructor', () => {
    it('should create percentage with valid value', () => {
      const percentage = new Percentage(30);
      expect(percentage.getValue()).toBe(30);
    });

    it('should create percentage with zero', () => {
      const percentage = new Percentage(0);
      expect(percentage.getValue()).toBe(0);
    });

    it('should create percentage with 100', () => {
      const percentage = new Percentage(100);
      expect(percentage.getValue()).toBe(100);
    });

    it('should round to 2 decimal places', () => {
      const percentage = new Percentage(33.333333);
      expect(percentage.getValue()).toBe(33.33);
    });

    it('should throw error for negative value', () => {
      expect(() => new Percentage(-10)).toThrow('Percentage must be between 0 and 100');
    });

    it('should throw error for value greater than 100', () => {
      expect(() => new Percentage(101)).toThrow('Percentage must be between 0 and 100');
    });

    it('should throw error for Infinity', () => {
      expect(() => new Percentage(Infinity)).toThrow('Percentage must be between 0 and 100');
    });

    it('should throw error for NaN', () => {
      expect(() => new Percentage(NaN)).toThrow('Percentage must be a finite number');
    });

    it('should handle decimal percentages', () => {
      const percentage = new Percentage(33.33);
      expect(percentage.getValue()).toBe(33.33);
    });

    it('should handle very small percentages', () => {
      const percentage = new Percentage(0.01);
      expect(percentage.getValue()).toBe(0.01);
    });
  });

  describe('toDecimal', () => {
    it('should convert 50% to 0.5', () => {
      const percentage = new Percentage(50);
      expect(percentage.toDecimal()).toBe(0.5);
    });

    it('should convert 100% to 1.0', () => {
      const percentage = new Percentage(100);
      expect(percentage.toDecimal()).toBe(1.0);
    });

    it('should convert 0% to 0.0', () => {
      const percentage = new Percentage(0);
      expect(percentage.toDecimal()).toBe(0.0);
    });

    it('should convert 33.33% to 0.3333', () => {
      const percentage = new Percentage(33.33);
      expect(percentage.toDecimal()).toBeCloseTo(0.3333, 4);
    });

    it('should convert 1% to 0.01', () => {
      const percentage = new Percentage(1);
      expect(percentage.toDecimal()).toBe(0.01);
    });

    it('should convert 75% to 0.75', () => {
      const percentage = new Percentage(75);
      expect(percentage.toDecimal()).toBe(0.75);
    });
  });

  describe('format', () => {
    it('should format percentage with 2 decimal places', () => {
      const percentage = new Percentage(30);
      expect(percentage.format()).toBe('30.00%');
    });

    it('should format zero percentage', () => {
      const percentage = new Percentage(0);
      expect(percentage.format()).toBe('0.00%');
    });

    it('should format 100 percentage', () => {
      const percentage = new Percentage(100);
      expect(percentage.format()).toBe('100.00%');
    });

    it('should format decimal percentage', () => {
      const percentage = new Percentage(33.33);
      expect(percentage.format()).toBe('33.33%');
    });

    it('should format small percentage', () => {
      const percentage = new Percentage(0.5);
      expect(percentage.format()).toBe('0.50%');
    });
  });

  describe('equals', () => {
    it('should return true for equal percentages', () => {
      const p1 = new Percentage(30);
      const p2 = new Percentage(30);
      expect(p1.equals(p2)).toBe(true);
    });

    it('should return false for different percentages', () => {
      const p1 = new Percentage(30);
      const p2 = new Percentage(50);
      expect(p1.equals(p2)).toBe(false);
    });

    it('should return true for zero percentages', () => {
      const p1 = new Percentage(0);
      const p2 = new Percentage(0);
      expect(p1.equals(p2)).toBe(true);
    });

    it('should return true for 100 percentages', () => {
      const p1 = new Percentage(100);
      const p2 = new Percentage(100);
      expect(p1.equals(p2)).toBe(true);
    });

    it('should handle decimal precision', () => {
      const p1 = new Percentage(33.33);
      const p2 = new Percentage(33.33);
      expect(p1.equals(p2)).toBe(true);
    });
  });

  describe('add', () => {
    it('should add two percentages', () => {
      const p1 = new Percentage(30);
      const p2 = new Percentage(20);
      const result = p1.add(p2);
      expect(result.getValue()).toBe(50);
    });

    it('should add to zero', () => {
      const p1 = new Percentage(30);
      const p2 = new Percentage(0);
      const result = p1.add(p2);
      expect(result.getValue()).toBe(30);
    });

    it('should add to exactly 100', () => {
      const p1 = new Percentage(60);
      const p2 = new Percentage(40);
      const result = p1.add(p2);
      expect(result.getValue()).toBe(100);
    });

    it('should throw error when sum exceeds 100', () => {
      const p1 = new Percentage(60);
      const p2 = new Percentage(50);
      expect(() => p1.add(p2)).toThrow('Sum of percentages cannot exceed 100%');
    });

    it('should throw error when sum is slightly over 100', () => {
      const p1 = new Percentage(50.5);
      const p2 = new Percentage(50);
      expect(() => p1.add(p2)).toThrow('Sum of percentages cannot exceed 100%');
    });

    it('should not mutate original objects', () => {
      const p1 = new Percentage(30);
      const p2 = new Percentage(20);
      const result = p1.add(p2);
      expect(p1.getValue()).toBe(30);
      expect(p2.getValue()).toBe(20);
      expect(result.getValue()).toBe(50);
    });

    it('should add decimal percentages', () => {
      const p1 = new Percentage(33.33);
      const p2 = new Percentage(25.5);
      const result = p1.add(p2);
      expect(result.getValue()).toBeCloseTo(58.83, 2);
    });
  });

  describe('subtract', () => {
    it('should subtract two percentages', () => {
      const p1 = new Percentage(50);
      const p2 = new Percentage(20);
      const result = p1.subtract(p2);
      expect(result.getValue()).toBe(30);
    });

    it('should subtract to zero', () => {
      const p1 = new Percentage(30);
      const p2 = new Percentage(30);
      const result = p1.subtract(p2);
      expect(result.getValue()).toBe(0);
    });

    it('should throw error when result would be negative', () => {
      const p1 = new Percentage(20);
      const p2 = new Percentage(30);
      expect(() => p1.subtract(p2)).toThrow('Subtraction would result in negative percentage');
    });

    it('should subtract from 100', () => {
      const p1 = new Percentage(100);
      const p2 = new Percentage(25);
      const result = p1.subtract(p2);
      expect(result.getValue()).toBe(75);
    });

    it('should not mutate original objects', () => {
      const p1 = new Percentage(50);
      const p2 = new Percentage(20);
      const result = p1.subtract(p2);
      expect(p1.getValue()).toBe(50);
      expect(p2.getValue()).toBe(20);
      expect(result.getValue()).toBe(30);
    });

    it('should subtract decimal percentages', () => {
      const p1 = new Percentage(75.5);
      const p2 = new Percentage(25.25);
      const result = p1.subtract(p2);
      expect(result.getValue()).toBe(50.25);
    });
  });

  describe('fromDecimal', () => {
    it('should create from 0.5 decimal', () => {
      const percentage = Percentage.fromDecimal(0.5);
      expect(percentage.getValue()).toBe(50);
    });

    it('should create from 1.0 decimal', () => {
      const percentage = Percentage.fromDecimal(1.0);
      expect(percentage.getValue()).toBe(100);
    });

    it('should create from 0.0 decimal', () => {
      const percentage = Percentage.fromDecimal(0.0);
      expect(percentage.getValue()).toBe(0);
    });

    it('should create from 0.3333 decimal', () => {
      const percentage = Percentage.fromDecimal(0.3333);
      expect(percentage.getValue()).toBeCloseTo(33.33, 2);
    });

    it('should throw error for decimal greater than 1', () => {
      expect(() => Percentage.fromDecimal(1.5)).toThrow('Decimal must be between 0 and 1');
    });

    it('should throw error for negative decimal', () => {
      expect(() => Percentage.fromDecimal(-0.5)).toThrow('Decimal must be between 0 and 1');
    });

    it('should create from very small decimal', () => {
      const percentage = Percentage.fromDecimal(0.001);
      expect(percentage.getValue()).toBe(0.1);
    });

    it('should create from 0.75 decimal', () => {
      const percentage = Percentage.fromDecimal(0.75);
      expect(percentage.getValue()).toBe(75);
    });
  });

  describe('toJSON / fromJSON', () => {
    it('should serialize to JSON', () => {
      const percentage = new Percentage(30);
      const json = percentage.toJSON();
      expect(json).toEqual({ value: 30 });
    });

    it('should deserialize from JSON', () => {
      const json = { value: 30 };
      const percentage = Percentage.fromJSON(json);
      expect(percentage.getValue()).toBe(30);
    });

    it('should round-trip through JSON', () => {
      const original = new Percentage(33.33);
      const json = original.toJSON();
      const restored = Percentage.fromJSON(json);
      expect(restored.equals(original)).toBe(true);
    });

    it('should serialize zero percentage', () => {
      const percentage = Percentage.zero();
      const json = percentage.toJSON();
      expect(json).toEqual({ value: 0 });
    });

    it('should serialize 100 percentage', () => {
      const percentage = Percentage.oneHundred();
      const json = percentage.toJSON();
      expect(json).toEqual({ value: 100 });
    });
  });

  describe('zero', () => {
    it('should create zero percentage', () => {
      const percentage = Percentage.zero();
      expect(percentage.getValue()).toBe(0);
    });

    it('should convert to 0.0 decimal', () => {
      const percentage = Percentage.zero();
      expect(percentage.toDecimal()).toBe(0.0);
    });

    it('should format as 0.00%', () => {
      const percentage = Percentage.zero();
      expect(percentage.format()).toBe('0.00%');
    });
  });

  describe('oneHundred', () => {
    it('should create 100 percentage', () => {
      const percentage = Percentage.oneHundred();
      expect(percentage.getValue()).toBe(100);
    });

    it('should convert to 1.0 decimal', () => {
      const percentage = Percentage.oneHundred();
      expect(percentage.toDecimal()).toBe(1.0);
    });

    it('should format as 100.00%', () => {
      const percentage = Percentage.oneHundred();
      expect(percentage.format()).toBe('100.00%');
    });
  });

  describe('edge cases', () => {
    it('should handle multiple rounding operations', () => {
      const p1 = new Percentage(33.333);
      const p2 = new Percentage(33.334);
      expect(p1.getValue()).toBe(33.33);
      expect(p2.getValue()).toBe(33.33);
    });

    it('should maintain immutability through operations', () => {
      const original = new Percentage(50);
      const added = original.add(new Percentage(25));
      const subtracted = original.subtract(new Percentage(25));

      expect(original.getValue()).toBe(50);
      expect(added.getValue()).toBe(75);
      expect(subtracted.getValue()).toBe(25);
    });

    it('should handle boundary values in add', () => {
      const p1 = new Percentage(99.99);
      const p2 = new Percentage(0.01);
      const result = p1.add(p2);
      expect(result.getValue()).toBe(100);
    });

    it('should handle boundary values in subtract', () => {
      const p1 = new Percentage(0.01);
      const p2 = new Percentage(0.01);
      const result = p1.subtract(p2);
      expect(result.getValue()).toBe(0);
    });

    it('should handle conversion precision', () => {
      const percentage = new Percentage(33.33);
      const decimal = percentage.toDecimal();
      const restored = Percentage.fromDecimal(decimal);
      expect(restored.getValue()).toBeCloseTo(33.33, 2);
    });

    it('should chain operations with overflow protection', () => {
      const p1 = new Percentage(30);
      const p2 = p1.add(new Percentage(20)); // 50
      const p3 = p2.subtract(new Percentage(10)); // 40

      expect(p3.getValue()).toBe(40);
      expect(p1.getValue()).toBe(30); // Original unchanged
    });
  });
});
