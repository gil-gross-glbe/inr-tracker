import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isToday, getWeeklyDose, markDayAsSkipped, getPastNDays, getDayStatus, getTodayDateString, createPillEntry } from '../utils/pillLog';
import { PillLogEntry } from '../types';

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

  it('markDayAsSkipped(date) saves a skipped entry with doseMg = 0', () => {
    const skipped = markDayAsSkipped('2026-03-13');
    expect(skipped.doseMg).toBe(0);
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
});
