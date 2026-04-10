import { describe, it, expect } from 'vitest';
import { getINRStatus, sortINRResultsByDate, validateINRForm } from '../utils/inrResults';
import { TargetRange, INRResult } from '../types';

describe('inrResults utilities', () => {
  const range: TargetRange = { min: 2.0, max: 3.0 };

  it('getINRStatus returns "in-range" for value within min-max', () => {
    expect(getINRStatus(2.5, range)).toBe('in-range');
    expect(getINRStatus(2.0, range)).toBe('in-range');
    expect(getINRStatus(3.0, range)).toBe('in-range');
  });

  it('getINRStatus returns "above" for value above max', () => {
    expect(getINRStatus(3.2, range)).toBe('above');
    expect(getINRStatus(3.5, range)).toBe('above');
  });

  it('getINRStatus returns "below" for value below min', () => {
    expect(getINRStatus(1.8, range)).toBe('below');
  });

  it('getINRStatus returns "above-danger" for value > max + 0.5', () => {
    expect(getINRStatus(3.6, range)).toBe('above-danger');
  });

  it('getINRStatus returns "below-danger" for value < min - 0.5', () => {
    expect(getINRStatus(1.4, range)).toBe('below-danger');
  });

  it('sortINRResultsByDate returns results ordered oldest to newest', () => {
    const results: INRResult[] = [
      { id: '1', date: '2026-03-14', value: 2.5, weeklyDoseMg: 0, weeklyDoseOverridden: false, createdAt: 2 },
      { id: '2', date: '2026-03-10', value: 2.5, weeklyDoseMg: 0, weeklyDoseOverridden: false, createdAt: 1 },
      { id: '3', date: '2026-03-12', value: 2.5, weeklyDoseMg: 0, weeklyDoseOverridden: false, createdAt: 1 },
    ];
    const sorted = sortINRResultsByDate(results);
    expect(sorted[0].date).toBe('2026-03-10');
    expect(sorted[1].date).toBe('2026-03-12');
    expect(sorted[2].date).toBe('2026-03-14');
  });

  it('validateINRForm returns errors when value is missing', () => {
    const error = validateINRForm(undefined, '2026-03-14');
    expect(error).toContain('INR value is required');
  });

  it('validateINRForm returns errors when date is missing', () => {
    const error = validateINRForm(2.5, '');
    expect(error).toContain('Date is required');
  });

  it('validateINRForm returns no errors for valid inputs', () => {
    const error = validateINRForm(2.5, '2026-03-14');
    expect(error.length).toBe(0);
  });

  it('validateINRForm rejects INR value of 0', () => {
    const error = validateINRForm(0, '2026-03-14');
    expect(error).toContain('INR value must be strictly greater than 0');
  });

  it('validateINRForm rejects INR value above 10', () => {
    const error = validateINRForm(11, '2026-03-14');
    expect(error).toContain('INR value must be 10 or less');
  });
});
