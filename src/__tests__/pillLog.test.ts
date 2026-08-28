import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isToday,
  getWeeklyDose,
  markDayAsSkipped,
  getPastNDays,
  getDayStatus,
  getTodayDateString,
  createPillEntry,
  calculateBottleRemaining,
  getEntryPills,
  formatPillLabel,
  formatPillQuantity,
} from '../utils/pillLog';
import { PillLogEntry, BottleState } from '../types';

describe('pillLog utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-14T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('isToday(date) returns true for todays date', () => {
    const todayStr = getTodayDateString(new Date('2026-03-14T10:00:00Z'));
    expect(isToday(todayStr, todayStr)).toBe(true);
  });

  it('isToday(date) returns false for yesterday', () => {
    const todayStr = getTodayDateString(new Date('2026-03-14T10:00:00Z'));
    expect(isToday('2026-03-13', todayStr)).toBe(false);
  });

  it('getWeeklyDose(pillLog, referenceDate) sums doses for the 7 days before referenceDate', () => {
    const log: PillLogEntry[] = [
      createPillEntry('2026-03-10', 0.5),
      createPillEntry('2026-03-11', 1.0),
      createPillEntry('2026-03-12', 0.5),
    ];
    expect(getWeeklyDose(log, '2026-03-14')).toBe(2.0);
  });

  it('getWeeklyDose returns 0 when no entries exist in range', () => {
    const log: PillLogEntry[] = [
      createPillEntry('2026-03-01', 0.5),
    ];
    expect(getWeeklyDose(log, '2026-03-14')).toBe(0);
  });

  it('getWeeklyDose excludes entries outside the 7-day window', () => {
    const log: PillLogEntry[] = [
      createPillEntry('2026-03-06', 0.5), 
      createPillEntry('2026-03-07', 1.0), 
      createPillEntry('2026-03-13', 0.5), 
      createPillEntry('2026-03-14', 1.0), 
    ];
    expect(getWeeklyDose(log, '2026-03-14')).toBe(1.5);
  });

  it('getWeeklyDose counts partial weeks correctly', () => {
    const log: PillLogEntry[] = [
      createPillEntry('2026-03-10', 0.5),
      createPillEntry('2026-03-12', 0.5),
    ];
    expect(getWeeklyDose(log, '2026-03-14')).toBe(1.0);
  });

  it('markDayAsSkipped(date) saves a skipped entry with doseMg = 0 and dosePills = 0', () => {
    const skipped = markDayAsSkipped('2026-03-13');
    expect(skipped.doseMg).toBe(0);
    expect(skipped.dosePills).toBe(0);
    expect(skipped.date).toBe('2026-03-13');
  });

  it('getPastNDays(n) returns correct array of date strings', () => {
    expect(getPastNDays(3, '2026-03-14')).toEqual([
      '2026-03-12',
      '2026-03-13',
      '2026-03-14',
    ]);
  });

  it('getDayStatus returns "taken" for a logged day', () => {
    const log: PillLogEntry[] = [createPillEntry('2026-03-13', 0.5)];
    expect(getDayStatus('2026-03-13', log, '2026-03-14')).toBe('taken');
  });

  it('getDayStatus returns "skipped" for an explicitly skipped day', () => {
    const log: PillLogEntry[] = [createPillEntry('2026-03-13', 0)];
    expect(getDayStatus('2026-03-13', log, '2026-03-14')).toBe('skipped');
  });

  it('getDayStatus returns "missed" for a past day with no entry', () => {
    expect(getDayStatus('2026-03-13', [], '2026-03-14')).toBe('missed');
  });

  it('getDayStatus returns "today" for today with no entry', () => {
    expect(getDayStatus('2026-03-14', [], '2026-03-14')).toBe('today');
  });

  describe('Bottle remaining and pill dosage calculations', () => {
    it('calculateBottleRemaining accurately counts down remaining pills from opened date', () => {
      const bottle: BottleState = {
        openedDate: '2026-03-10',
        initialCount: 30,
        adjustmentCount: 0,
        pillsPerBottle: 30,
      };

      const log: PillLogEntry[] = [
        createPillEntry('2026-03-08', 1.0, true), // before openedDate -> ignored
        createPillEntry('2026-03-10', 1.0, true), // 1 pill
        createPillEntry('2026-03-11', 0.5, true), // 0.5 pill
        createPillEntry('2026-03-12', 1.0, true), // 1 pill
        createPillEntry('2026-03-13', 0.0, true), // skipped -> 0
      ];

      const result = calculateBottleRemaining(bottle, log);
      expect(result.taken).toBe(2.5);
      expect(result.remaining).toBe(27.5);
    });

    it('calculateBottleRemaining factors in manual adjustment delta', () => {
      const bottle: BottleState = {
        openedDate: '2026-03-10',
        initialCount: 30,
        adjustmentCount: -1, // dropped 1 pill
        pillsPerBottle: 30,
      };

      const log: PillLogEntry[] = [
        createPillEntry('2026-03-10', 1.0, true),
      ];

      const result = calculateBottleRemaining(bottle, log);
      expect(result.taken).toBe(1.0);
      expect(result.remaining).toBe(28); // 30 - 1 (adjustment) - 1 (taken) = 28
    });

    it('getEntryPills retrieves pill count from both new and legacy formats', () => {
      expect(getEntryPills(createPillEntry('2026-03-10', 1.0, true))).toBe(1.0);
      expect(getEntryPills(createPillEntry('2026-03-10', 0.5, true))).toBe(0.5);
      expect(getEntryPills({ date: '2026-03-10', takenAt: '08:00', takenTimestamp: 1, doseMg: 0.5 })).toBe(1.0);
      expect(getEntryPills({ date: '2026-03-10', takenAt: '08:00', takenTimestamp: 1, doseMg: 0.25 })).toBe(0.5);
    });

    it('formatPillLabel and formatPillQuantity format properly', () => {
      expect(formatPillLabel(1.0)).toBe('1 Pill');
      expect(formatPillLabel(0.5)).toBe('½ Pill');
      expect(formatPillLabel(1.5)).toBe('1½ Pills');
      expect(formatPillLabel(0)).toBe('Skipped');

      expect(formatPillQuantity(1.0)).toBe('1');
      expect(formatPillQuantity(0.5)).toBe('½');
      expect(formatPillQuantity(1.5)).toBe('1½');
    });
  });
});

