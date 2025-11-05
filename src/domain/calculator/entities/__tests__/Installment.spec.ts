import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Installment } from '../Installment';
import { Money } from '../../value-objects/Money';

describe('Installment', () => {
  describe('constructor', () => {
    it('should create installment with valid parameters', () => {
      const amount = new Money(5000);
      const dueDate = new Date('2025-06-01');
      const installment = new Installment('inst-1', amount, dueDate, 'Entry 1');

      expect(installment.getId()).toBe('inst-1');
      expect(installment.getAmount().equals(amount)).toBe(true);
      expect(installment.getDueDate().toISOString()).toBe(dueDate.toISOString());
      expect(installment.getDescription()).toBe('Entry 1');
    });

    it('should throw error for empty ID', () => {
      const amount = new Money(5000);
      const dueDate = new Date('2025-06-01');
      expect(() => new Installment('', amount, dueDate, 'Description'))
        .toThrow('Installment ID cannot be empty');
    });

    it('should throw error for whitespace-only ID', () => {
      const amount = new Money(5000);
      const dueDate = new Date('2025-06-01');
      expect(() => new Installment('   ', amount, dueDate, 'Description'))
        .toThrow('Installment ID cannot be empty');
    });

    it('should throw error for empty description', () => {
      const amount = new Money(5000);
      const dueDate = new Date('2025-06-01');
      expect(() => new Installment('inst-1', amount, dueDate, ''))
        .toThrow('Installment description cannot be empty');
    });

    it('should throw error for whitespace-only description', () => {
      const amount = new Money(5000);
      const dueDate = new Date('2025-06-01');
      expect(() => new Installment('inst-1', amount, dueDate, '   '))
        .toThrow('Installment description cannot be empty');
    });

    it('should throw error for invalid date', () => {
      const amount = new Money(5000);
      const invalidDate = new Date('invalid');
      expect(() => new Installment('inst-1', amount, invalidDate, 'Description'))
        .toThrow('Invalid due date');
    });

    it('should trim description whitespace', () => {
      const amount = new Money(5000);
      const dueDate = new Date('2025-06-01');
      const installment = new Installment('inst-1', amount, dueDate, '  Entry 1  ');
      expect(installment.getDescription()).toBe('Entry 1');
    });

    it('should clone date to ensure immutability', () => {
      const amount = new Money(5000);
      const originalDate = new Date('2025-06-01');
      const installment = new Installment('inst-1', amount, originalDate, 'Entry 1');

      // Modify original date
      originalDate.setFullYear(2026);

      // Installment should still have original date
      expect(installment.getDueDate().getFullYear()).toBe(2025);
    });
  });

  describe('getId', () => {
    it('should return the installment ID', () => {
      const amount = new Money(5000);
      const dueDate = new Date('2025-06-01');
      const installment = new Installment('inst-123', amount, dueDate, 'Entry 1');
      expect(installment.getId()).toBe('inst-123');
    });
  });

  describe('getAmount', () => {
    it('should return the installment amount', () => {
      const amount = new Money(5000);
      const dueDate = new Date('2025-06-01');
      const installment = new Installment('inst-1', amount, dueDate, 'Entry 1');
      expect(installment.getAmount().equals(new Money(5000))).toBe(true);
    });

    it('should return Money object', () => {
      const amount = new Money(5000);
      const dueDate = new Date('2025-06-01');
      const installment = new Installment('inst-1', amount, dueDate, 'Entry 1');
      expect(installment.getAmount()).toBeInstanceOf(Money);
    });
  });

  describe('getDueDate', () => {
    it('should return the due date', () => {
      const amount = new Money(5000);
      const dueDate = new Date('2025-06-01');
      const installment = new Installment('inst-1', amount, dueDate, 'Entry 1');
      expect(installment.getDueDate().toISOString()).toBe(dueDate.toISOString());
    });

    it('should return cloned date to preserve immutability', () => {
      const amount = new Money(5000);
      const dueDate = new Date('2025-06-01');
      const installment = new Installment('inst-1', amount, dueDate, 'Entry 1');

      const retrievedDate = installment.getDueDate();
      retrievedDate.setFullYear(2026);

      // Original should not be affected
      expect(installment.getDueDate().getFullYear()).toBe(2025);
    });
  });

  describe('getDescription', () => {
    it('should return the description', () => {
      const amount = new Money(5000);
      const dueDate = new Date('2025-06-01');
      const installment = new Installment('inst-1', amount, dueDate, 'Entry Payment 1');
      expect(installment.getDescription()).toBe('Entry Payment 1');
    });
  });

  describe('isOverdue', () => {
    it('should return true for past due dates', () => {
      const amount = new Money(5000);
      const pastDate = new Date('2020-01-01');
      const installment = new Installment('inst-1', amount, pastDate, 'Entry 1');
      expect(installment.isOverdue()).toBe(true);
    });

    it('should return false for future due dates', () => {
      const amount = new Money(5000);
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const installment = new Installment('inst-1', amount, futureDate, 'Entry 1');
      expect(installment.isOverdue()).toBe(false);
    });

    it('should handle dates close to now', () => {
      const amount = new Money(5000);
      const now = new Date();
      const installment = new Installment('inst-1', amount, now, 'Entry 1');
      // Should be false or very close to transition
      const isOverdue = installment.isOverdue();
      expect(typeof isOverdue).toBe('boolean');
    });
  });

  describe('getDaysUntilDue', () => {
    it('should return positive days for future dates', () => {
      const amount = new Money(5000);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const installment = new Installment('inst-1', amount, futureDate, 'Entry 1');
      const days = installment.getDaysUntilDue();
      expect(days).toBeGreaterThanOrEqual(29);
      expect(days).toBeLessThanOrEqual(31);
    });

    it('should return negative days for past dates', () => {
      const amount = new Money(5000);
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const installment = new Installment('inst-1', amount, pastDate, 'Entry 1');
      const days = installment.getDaysUntilDue();
      expect(days).toBeLessThan(0);
    });

    it('should return approximately 0 for current date', () => {
      const amount = new Money(5000);
      const now = new Date();
      const installment = new Installment('inst-1', amount, now, 'Entry 1');
      const days = installment.getDaysUntilDue();
      expect(days).toBeGreaterThanOrEqual(-1);
      expect(days).toBeLessThanOrEqual(1);
    });

    it('should calculate correctly for 1 year in future', () => {
      const amount = new Money(5000);
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const installment = new Installment('inst-1', amount, futureDate, 'Entry 1');
      const days = installment.getDaysUntilDue();
      expect(days).toBeGreaterThanOrEqual(360);
      expect(days).toBeLessThanOrEqual(370);
    });
  });

  describe('formatDueDate', () => {
    it('should format date in Brazilian format', () => {
      const amount = new Money(5000);
      const dueDate = new Date('2025-06-15');
      const installment = new Installment('inst-1', amount, dueDate, 'Entry 1');
      const formatted = installment.formatDueDate();
      expect(formatted).toMatch(/15\/06\/2025/);
    });

    it('should handle different dates', () => {
      const amount = new Money(5000);
      const dueDate = new Date('2026-12-31');
      const installment = new Installment('inst-1', amount, dueDate, 'Entry 1');
      const formatted = installment.formatDueDate();
      expect(formatted).toMatch(/31\/12\/2026/);
    });

    it('should pad single digit days and months', () => {
      const amount = new Money(5000);
      const dueDate = new Date('2025-01-05');
      const installment = new Installment('inst-1', amount, dueDate, 'Entry 1');
      const formatted = installment.formatDueDate();
      expect(formatted).toMatch(/05\/01\/2025/);
    });
  });

  describe('equals', () => {
    it('should return true for installments with same ID', () => {
      const amount1 = new Money(5000);
      const amount2 = new Money(6000);
      const dueDate = new Date('2025-06-01');
      const installment1 = new Installment('inst-1', amount1, dueDate, 'Entry 1');
      const installment2 = new Installment('inst-1', amount2, dueDate, 'Entry 2');
      expect(installment1.equals(installment2)).toBe(true);
    });

    it('should return false for installments with different IDs', () => {
      const amount = new Money(5000);
      const dueDate = new Date('2025-06-01');
      const installment1 = new Installment('inst-1', amount, dueDate, 'Entry 1');
      const installment2 = new Installment('inst-2', amount, dueDate, 'Entry 1');
      expect(installment1.equals(installment2)).toBe(false);
    });

    it('should be based on ID only', () => {
      const amount = new Money(5000);
      const dueDate1 = new Date('2025-06-01');
      const dueDate2 = new Date('2025-07-01');
      const installment1 = new Installment('inst-1', amount, dueDate1, 'Description 1');
      const installment2 = new Installment('inst-1', amount, dueDate2, 'Description 2');
      expect(installment1.equals(installment2)).toBe(true);
    });
  });

  describe('toJSON / fromJSON', () => {
    it('should serialize to JSON', () => {
      const amount = new Money(5000);
      const dueDate = new Date('2025-06-01T00:00:00.000Z');
      const installment = new Installment('inst-1', amount, dueDate, 'Entry 1');
      const json = installment.toJSON();

      expect(json).toEqual({
        id: 'inst-1',
        amount: 5000,
        dueDate: '2025-06-01T00:00:00.000Z',
        description: 'Entry 1',
      });
    });

    it('should deserialize from JSON', () => {
      const json = {
        id: 'inst-1',
        amount: 5000,
        dueDate: '2025-06-01T00:00:00.000Z',
        description: 'Entry 1',
      };
      const installment = Installment.fromJSON(json);

      expect(installment.getId()).toBe('inst-1');
      expect(installment.getAmount().equals(new Money(5000))).toBe(true);
      expect(installment.getDueDate().toISOString()).toBe('2025-06-01T00:00:00.000Z');
      expect(installment.getDescription()).toBe('Entry 1');
    });

    it('should round-trip through JSON', () => {
      const amount = new Money(5000);
      const dueDate = new Date('2025-06-01');
      const original = new Installment('inst-1', amount, dueDate, 'Entry 1');

      const json = original.toJSON();
      const restored = Installment.fromJSON(json);

      expect(restored.equals(original)).toBe(true);
      expect(restored.getAmount().equals(original.getAmount())).toBe(true);
      expect(restored.getDescription()).toBe(original.getDescription());
    });

    it('should handle different amounts in JSON', () => {
      const json = {
        id: 'inst-2',
        amount: 12345.67,
        dueDate: '2026-12-31T00:00:00.000Z',
        description: 'Large Payment',
      };
      const installment = Installment.fromJSON(json);

      expect(installment.getAmount().getAmount()).toBe(12345.67);
    });
  });

  describe('edge cases', () => {
    it('should handle very long descriptions', () => {
      const amount = new Money(5000);
      const dueDate = new Date('2025-06-01');
      const longDescription = 'A'.repeat(1000);
      const installment = new Installment('inst-1', amount, dueDate, longDescription);
      expect(installment.getDescription()).toBe(longDescription);
    });

    it('should handle special characters in description', () => {
      const amount = new Money(5000);
      const dueDate = new Date('2025-06-01');
      const description = 'Entry 1 - R$ 5.000,00 (30% + IPTU)';
      const installment = new Installment('inst-1', amount, dueDate, description);
      expect(installment.getDescription()).toBe(description);
    });

    it('should handle very large amounts', () => {
      const amount = new Money(999999999);
      const dueDate = new Date('2025-06-01');
      const installment = new Installment('inst-1', amount, dueDate, 'Large Payment');
      expect(installment.getAmount().getAmount()).toBe(999999999);
    });

    it('should handle dates far in the future', () => {
      const amount = new Money(5000);
      const futureDate = new Date('2050-12-31');
      const installment = new Installment('inst-1', amount, futureDate, 'Future Payment');
      expect(installment.getDueDate().getFullYear()).toBe(2050);
    });

    it('should maintain immutability', () => {
      const amount = new Money(5000);
      const dueDate = new Date('2025-06-01');
      const installment = new Installment('inst-1', amount, dueDate, 'Entry 1');

      // Try to get values multiple times
      const id1 = installment.getId();
      const id2 = installment.getId();
      const amount1 = installment.getAmount();
      const amount2 = installment.getAmount();

      expect(id1).toBe(id2);
      expect(amount1.equals(amount2)).toBe(true);
    });
  });
});
