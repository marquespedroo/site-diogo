import { describe, it, expect } from 'vitest';
import { PaymentPhase } from '../PaymentPhase';
import { Installment } from '../Installment';
import { Money } from '../../value-objects/Money';

describe('PaymentPhase', () => {
  const createInstallment = (id: string, amount: number, daysOffset: number = 0) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysOffset);
    return new Installment(id, new Money(amount), dueDate, `Installment ${id}`);
  };

  describe('constructor', () => {
    it('should create payment phase with valid parameters', () => {
      const installments = [createInstallment('1', 5000), createInstallment('2', 3000)];
      const phase = new PaymentPhase('Entry Payments', installments);

      expect(phase.getName()).toBe('Entry Payments');
      expect(phase.getInstallmentCount()).toBe(2);
    });

    it('should create empty payment phase', () => {
      const phase = new PaymentPhase('Entry Payments', []);
      expect(phase.getName()).toBe('Entry Payments');
      expect(phase.getInstallmentCount()).toBe(0);
    });

    it('should throw error for empty name', () => {
      const installments = [createInstallment('1', 5000)];
      expect(() => new PaymentPhase('', installments)).toThrow(
        'Payment phase name cannot be empty'
      );
    });

    it('should throw error for whitespace-only name', () => {
      const installments = [createInstallment('1', 5000)];
      expect(() => new PaymentPhase('   ', installments)).toThrow(
        'Payment phase name cannot be empty'
      );
    });

    it('should throw error for non-array installments', () => {
      expect(() => new PaymentPhase('Entry', 'not an array' as any)).toThrow(
        'Installments must be an array'
      );
    });

    it('should trim phase name', () => {
      const installments = [createInstallment('1', 5000)];
      const phase = new PaymentPhase('  Entry Payments  ', installments);
      expect(phase.getName()).toBe('Entry Payments');
    });

    it('should freeze installments array for immutability', () => {
      const installments = [createInstallment('1', 5000)];
      const phase = new PaymentPhase('Entry', installments);
      const retrieved = phase.getInstallments();
      expect(Object.isFrozen(retrieved)).toBe(true);
    });

    it('should create with single installment', () => {
      const installment = createInstallment('1', 5000);
      const phase = new PaymentPhase('Entry', [installment]);
      expect(phase.getInstallmentCount()).toBe(1);
    });

    it('should create with many installments', () => {
      const installments = Array.from({ length: 50 }, (_, i) => createInstallment(`${i}`, 1000));
      const phase = new PaymentPhase('Construction', installments);
      expect(phase.getInstallmentCount()).toBe(50);
    });
  });

  describe('getName', () => {
    it('should return phase name', () => {
      const phase = new PaymentPhase('Entry Payments', []);
      expect(phase.getName()).toBe('Entry Payments');
    });
  });

  describe('getInstallments', () => {
    it('should return all installments', () => {
      const installments = [createInstallment('1', 5000), createInstallment('2', 3000)];
      const phase = new PaymentPhase('Entry', installments);
      const retrieved = phase.getInstallments();

      expect(retrieved.length).toBe(2);
      expect(retrieved[0].getId()).toBe('1');
      expect(retrieved[1].getId()).toBe('2');
    });

    it('should return empty array for empty phase', () => {
      const phase = new PaymentPhase('Entry', []);
      expect(phase.getInstallments()).toEqual([]);
    });

    it('should return readonly array', () => {
      const installments = [createInstallment('1', 5000)];
      const phase = new PaymentPhase('Entry', installments);
      const retrieved = phase.getInstallments();

      // Should be frozen
      expect(() => {
        (retrieved as any).push(createInstallment('2', 3000));
      }).toThrow();
    });
  });

  describe('getTotalAmount', () => {
    it('should calculate total of all installments', () => {
      const installments = [
        createInstallment('1', 5000),
        createInstallment('2', 3000),
        createInstallment('3', 2000),
      ];
      const phase = new PaymentPhase('Entry', installments);
      const total = phase.getTotalAmount();

      expect(total.getAmount()).toBe(10000);
    });

    it('should return zero for empty phase', () => {
      const phase = new PaymentPhase('Entry', []);
      const total = phase.getTotalAmount();

      expect(total.getAmount()).toBe(0);
      expect(total.getCurrency()).toBe('BRL');
    });

    it('should handle single installment', () => {
      const installments = [createInstallment('1', 7500)];
      const phase = new PaymentPhase('Entry', installments);
      const total = phase.getTotalAmount();

      expect(total.getAmount()).toBe(7500);
    });

    it('should handle large amounts', () => {
      const installments = [
        createInstallment('1', 100000),
        createInstallment('2', 200000),
        createInstallment('3', 300000),
      ];
      const phase = new PaymentPhase('Entry', installments);
      const total = phase.getTotalAmount();

      expect(total.getAmount()).toBe(600000);
    });

    it('should handle decimal amounts', () => {
      const installments = [createInstallment('1', 1000.5), createInstallment('2', 2000.75)];
      const phase = new PaymentPhase('Entry', installments);
      const total = phase.getTotalAmount();

      expect(total.getAmount()).toBe(3001.25);
    });
  });

  describe('getInstallmentCount', () => {
    it('should return correct count', () => {
      const installments = [createInstallment('1', 5000), createInstallment('2', 3000)];
      const phase = new PaymentPhase('Entry', installments);
      expect(phase.getInstallmentCount()).toBe(2);
    });

    it('should return 0 for empty phase', () => {
      const phase = new PaymentPhase('Entry', []);
      expect(phase.getInstallmentCount()).toBe(0);
    });

    it('should return correct count for many installments', () => {
      const installments = Array.from({ length: 100 }, (_, i) => createInstallment(`${i}`, 1000));
      const phase = new PaymentPhase('Construction', installments);
      expect(phase.getInstallmentCount()).toBe(100);
    });
  });

  describe('getInstallmentAt', () => {
    it('should return installment at valid index', () => {
      const installments = [
        createInstallment('1', 5000),
        createInstallment('2', 3000),
        createInstallment('3', 2000),
      ];
      const phase = new PaymentPhase('Entry', installments);

      const first = phase.getInstallmentAt(0);
      const second = phase.getInstallmentAt(1);
      const third = phase.getInstallmentAt(2);

      expect(first?.getId()).toBe('1');
      expect(second?.getId()).toBe('2');
      expect(third?.getId()).toBe('3');
    });

    it('should return undefined for negative index', () => {
      const installments = [createInstallment('1', 5000)];
      const phase = new PaymentPhase('Entry', installments);
      expect(phase.getInstallmentAt(-1)).toBeUndefined();
    });

    it('should return undefined for index >= length', () => {
      const installments = [createInstallment('1', 5000)];
      const phase = new PaymentPhase('Entry', installments);
      expect(phase.getInstallmentAt(1)).toBeUndefined();
      expect(phase.getInstallmentAt(100)).toBeUndefined();
    });

    it('should return undefined for empty phase', () => {
      const phase = new PaymentPhase('Entry', []);
      expect(phase.getInstallmentAt(0)).toBeUndefined();
    });
  });

  describe('hasInstallments', () => {
    it('should return true when phase has installments', () => {
      const installments = [createInstallment('1', 5000)];
      const phase = new PaymentPhase('Entry', installments);
      expect(phase.hasInstallments()).toBe(true);
    });

    it('should return false when phase is empty', () => {
      const phase = new PaymentPhase('Entry', []);
      expect(phase.hasInstallments()).toBe(false);
    });

    it('should be opposite of isEmpty', () => {
      const emptyPhase = new PaymentPhase('Entry', []);
      const fullPhase = new PaymentPhase('Entry', [createInstallment('1', 5000)]);

      expect(emptyPhase.hasInstallments()).toBe(!emptyPhase.isEmpty());
      expect(fullPhase.hasInstallments()).toBe(!fullPhase.isEmpty());
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty phase', () => {
      const phase = new PaymentPhase('Entry', []);
      expect(phase.isEmpty()).toBe(true);
    });

    it('should return false when phase has installments', () => {
      const installments = [createInstallment('1', 5000)];
      const phase = new PaymentPhase('Entry', installments);
      expect(phase.isEmpty()).toBe(false);
    });
  });

  describe('getEarliestDueDate', () => {
    it('should return earliest due date', () => {
      const installments = [
        createInstallment('1', 5000, 30), // 30 days from now
        createInstallment('2', 3000, 10), // 10 days from now (earliest)
        createInstallment('3', 2000, 60), // 60 days from now
      ];
      const phase = new PaymentPhase('Entry', installments);
      const earliest = phase.getEarliestDueDate();

      expect(earliest).not.toBeNull();
      expect(earliest!.getTime()).toBe(installments[1].getDueDate().getTime());
    });

    it('should return null for empty phase', () => {
      const phase = new PaymentPhase('Entry', []);
      expect(phase.getEarliestDueDate()).toBeNull();
    });

    it('should handle single installment', () => {
      const installment = createInstallment('1', 5000, 30);
      const phase = new PaymentPhase('Entry', [installment]);
      const earliest = phase.getEarliestDueDate();

      expect(earliest!.getTime()).toBe(installment.getDueDate().getTime());
    });

    it('should handle all same dates', () => {
      const dueDate = new Date('2025-06-01');
      const installments = [
        new Installment('1', new Money(1000), dueDate, 'Inst 1'),
        new Installment('2', new Money(2000), dueDate, 'Inst 2'),
        new Installment('3', new Money(3000), dueDate, 'Inst 3'),
      ];
      const phase = new PaymentPhase('Entry', installments);
      const earliest = phase.getEarliestDueDate();

      expect(earliest!.getTime()).toBe(dueDate.getTime());
    });
  });

  describe('getLatestDueDate', () => {
    it('should return latest due date', () => {
      const installments = [
        createInstallment('1', 5000, 30),
        createInstallment('2', 3000, 10),
        createInstallment('3', 2000, 60), // 60 days from now (latest)
      ];
      const phase = new PaymentPhase('Entry', installments);
      const latest = phase.getLatestDueDate();

      expect(latest).not.toBeNull();
      expect(latest!.getTime()).toBe(installments[2].getDueDate().getTime());
    });

    it('should return null for empty phase', () => {
      const phase = new PaymentPhase('Entry', []);
      expect(phase.getLatestDueDate()).toBeNull();
    });

    it('should handle single installment', () => {
      const installment = createInstallment('1', 5000, 30);
      const phase = new PaymentPhase('Entry', [installment]);
      const latest = phase.getLatestDueDate();

      expect(latest!.getTime()).toBe(installment.getDueDate().getTime());
    });

    it('should handle all same dates', () => {
      const dueDate = new Date('2025-06-01');
      const installments = [
        new Installment('1', new Money(1000), dueDate, 'Inst 1'),
        new Installment('2', new Money(2000), dueDate, 'Inst 2'),
        new Installment('3', new Money(3000), dueDate, 'Inst 3'),
      ];
      const phase = new PaymentPhase('Entry', installments);
      const latest = phase.getLatestDueDate();

      expect(latest!.getTime()).toBe(dueDate.getTime());
    });
  });

  describe('getAverageInstallmentAmount', () => {
    it('should calculate average correctly', () => {
      const installments = [
        createInstallment('1', 6000),
        createInstallment('2', 3000),
        createInstallment('3', 3000),
      ];
      const phase = new PaymentPhase('Entry', installments);
      const average = phase.getAverageInstallmentAmount();

      expect(average.getAmount()).toBe(4000); // (6000 + 3000 + 3000) / 3
    });

    it('should return zero for empty phase', () => {
      const phase = new PaymentPhase('Entry', []);
      const average = phase.getAverageInstallmentAmount();
      expect(average.getAmount()).toBe(0);
    });

    it('should handle single installment', () => {
      const installments = [createInstallment('1', 5000)];
      const phase = new PaymentPhase('Entry', installments);
      const average = phase.getAverageInstallmentAmount();

      expect(average.getAmount()).toBe(5000);
    });

    it('should handle decimal averages', () => {
      const installments = [
        createInstallment('1', 1000),
        createInstallment('2', 2000),
        createInstallment('3', 3000),
      ];
      const phase = new PaymentPhase('Entry', installments);
      const average = phase.getAverageInstallmentAmount();

      expect(average.getAmount()).toBe(2000);
    });

    it('should handle uneven division', () => {
      const installments = [
        createInstallment('1', 100),
        createInstallment('2', 200),
        createInstallment('3', 300),
      ];
      const phase = new PaymentPhase('Entry', installments);
      const average = phase.getAverageInstallmentAmount();

      expect(average.getAmount()).toBe(200); // 600 / 3
    });
  });

  describe('toJSON / fromJSON', () => {
    it('should serialize to JSON', () => {
      const dueDate = new Date('2025-06-01T00:00:00.000Z');
      const installments = [
        new Installment('1', new Money(5000), dueDate, 'Inst 1'),
        new Installment('2', new Money(3000), dueDate, 'Inst 2'),
      ];
      const phase = new PaymentPhase('Entry Payments', installments);
      const json = phase.toJSON();

      expect(json.name).toBe('Entry Payments');
      expect(json.installments).toHaveLength(2);
      expect(json.installments[0].id).toBe('1');
      expect(json.installments[0].amount).toBe(5000);
      expect(json.installments[1].id).toBe('2');
      expect(json.installments[1].amount).toBe(3000);
    });

    it('should deserialize from JSON', () => {
      const json = {
        name: 'Entry Payments',
        installments: [
          {
            id: '1',
            amount: 5000,
            dueDate: '2025-06-01T00:00:00.000Z',
            description: 'Inst 1',
          },
          {
            id: '2',
            amount: 3000,
            dueDate: '2025-06-01T00:00:00.000Z',
            description: 'Inst 2',
          },
        ],
      };
      const phase = PaymentPhase.fromJSON(json);

      expect(phase.getName()).toBe('Entry Payments');
      expect(phase.getInstallmentCount()).toBe(2);
      expect(phase.getInstallmentAt(0)?.getId()).toBe('1');
      expect(phase.getInstallmentAt(1)?.getId()).toBe('2');
    });

    it('should round-trip through JSON', () => {
      const dueDate = new Date('2025-06-01');
      const installments = [new Installment('1', new Money(5000), dueDate, 'Inst 1')];
      const original = new PaymentPhase('Entry', installments);

      const json = original.toJSON();
      const restored = PaymentPhase.fromJSON(json);

      expect(restored.getName()).toBe(original.getName());
      expect(restored.getInstallmentCount()).toBe(original.getInstallmentCount());
      expect(restored.getTotalAmount().equals(original.getTotalAmount())).toBe(true);
    });

    it('should handle empty phase in JSON', () => {
      const phase = new PaymentPhase('Empty Phase', []);
      const json = phase.toJSON();
      const restored = PaymentPhase.fromJSON(json);

      expect(restored.getName()).toBe('Empty Phase');
      expect(restored.isEmpty()).toBe(true);
    });
  });

  describe('empty', () => {
    it('should create empty payment phase', () => {
      const phase = PaymentPhase.empty('Entry');
      expect(phase.getName()).toBe('Entry');
      expect(phase.isEmpty()).toBe(true);
      expect(phase.getInstallmentCount()).toBe(0);
    });

    it('should have zero total amount', () => {
      const phase = PaymentPhase.empty('Entry');
      expect(phase.getTotalAmount().getAmount()).toBe(0);
    });

    it('should return null for earliest/latest dates', () => {
      const phase = PaymentPhase.empty('Entry');
      expect(phase.getEarliestDueDate()).toBeNull();
      expect(phase.getLatestDueDate()).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle phase with many installments', () => {
      const installments = Array.from({ length: 100 }, (_, i) =>
        createInstallment(`${i}`, 1000, i)
      );
      const phase = new PaymentPhase('Construction', installments);

      expect(phase.getInstallmentCount()).toBe(100);
      expect(phase.getTotalAmount().getAmount()).toBe(100000);
    });

    it('should maintain immutability', () => {
      const installments = [createInstallment('1', 5000)];
      const phase = new PaymentPhase('Entry', installments);

      const name = phase.getName();
      const count = phase.getInstallmentCount();
      const total = phase.getTotalAmount();

      // Call methods multiple times
      phase.getName();
      phase.getInstallments();
      phase.getTotalAmount();

      // Values should remain the same
      expect(phase.getName()).toBe(name);
      expect(phase.getInstallmentCount()).toBe(count);
      expect(phase.getTotalAmount().equals(total)).toBe(true);
    });

    it('should handle special characters in phase name', () => {
      const installments = [createInstallment('1', 5000)];
      const name = 'Entry Payments (30% + IPTU) - Phase 1';
      const phase = new PaymentPhase(name, installments);
      expect(phase.getName()).toBe(name);
    });

    it('should calculate totals correctly with varying amounts', () => {
      const installments = [
        createInstallment('1', 1234.56),
        createInstallment('2', 2345.67),
        createInstallment('3', 3456.78),
      ];
      const phase = new PaymentPhase('Entry', installments);
      const total = phase.getTotalAmount();

      expect(total.getAmount()).toBeCloseTo(7037.01, 2);
    });
  });
});
