import { describe, it, expect } from 'vitest';
import { computePrediction, getPredictionStatus, computePredictionRate, getDoseSinceLastTest } from '../utils/prediction';
import { PillLogEntry, INRResult, TargetRange } from '../types';

describe('prediction utilities', () => {
  const range: TargetRange = { min: 2.0, max: 3.0 };

  it('computePrediction returns null when fewer than 2 INR results', () => {
    const results: INRResult[] = [
      { id: '1', date: '2026-03-14', value: 2.5, weeklyDoseMg: 0, weeklyDoseOverridden: false, createdAt: 1 }
    ];
    expect(computePrediction(results, [], '2026-03-20')).toBeNull();
  });

  it('computePrediction returns correct value for the worked example', () => {
    const results: INRResult[] = [
      { id: '1', date: '2026-02-18', value: 2.0, weeklyDoseMg: 0, weeklyDoseOverridden: false, createdAt: 1 },
      { id: '2', date: '2026-03-03', value: 2.2, weeklyDoseMg: 0, weeklyDoseOverridden: false, createdAt: 2 }
    ];
    const pillLog: PillLogEntry[] = [
      { date: '2026-02-25', takenAt: '12:00', takenTimestamp: 1, doseMg: 7.0 },
      { date: '2026-03-02', takenAt: '12:00', takenTimestamp: 2, doseMg: 6.5 },
      { date: '2026-03-10', takenAt: '12:00', takenTimestamp: 3, doseMg: 10.5 }
    ];
    
    const pred = computePrediction(results, pillLog, '2026-03-14');
    expect(pred).not.toBeNull();
    expect(pred?.estimatedINR).toBe(2.4);
    expect(pred?.totalDoseInPeriod).toBe(13.5);
    expect(pred?.doseSinceLastTest).toBe(10.5);
  });

  it('computePrediction returns INR_last when dose since last test is 0', () => {
    const results: INRResult[] = [
      { id: '1', date: '2026-02-18', value: 2.0, weeklyDoseMg: 0, weeklyDoseOverridden: false, createdAt: 1 },
      { id: '2', date: '2026-03-03', value: 2.2, weeklyDoseMg: 0, weeklyDoseOverridden: false, createdAt: 2 }
    ];
    const pillLog: PillLogEntry[] = [
      { date: '2026-02-25', takenAt: '12:00', takenTimestamp: 1, doseMg: 10.0 }
    ];
    const pred = computePrediction(results, pillLog, '2026-03-14');
    expect(pred?.estimatedINR).toBe(2.2);
    expect(pred?.doseSinceLastTest).toBe(0);
  });

  it('computePrediction handles negative rate', () => {
    const results: INRResult[] = [
      { id: '1', date: '2026-02-18', value: 3.0, weeklyDoseMg: 0, weeklyDoseOverridden: false, createdAt: 1 },
      { id: '2', date: '2026-03-03', value: 2.0, weeklyDoseMg: 0, weeklyDoseOverridden: false, createdAt: 2 }
    ];
    const pillLog: PillLogEntry[] = [
      { date: '2026-02-25', takenAt: '12:00', takenTimestamp: 1, doseMg: 10.0 }, 
      { date: '2026-03-10', takenAt: '12:00', takenTimestamp: 3, doseMg: 5.0 }  
    ];
    const pred = computePrediction(results, pillLog, '2026-03-14');
    expect(pred?.estimatedINR).toBe(1.5);
  });

  it('computePrediction caps result at 10 maximum', () => {
    const results: INRResult[] = [
      { id: '1', date: '2026-02-18', value: 2.0, weeklyDoseMg: 0, weeklyDoseOverridden: false, createdAt: 1 },
      { id: '2', date: '2026-03-03', value: 5.0, weeklyDoseMg: 0, weeklyDoseOverridden: false, createdAt: 2 }
    ];
    const pillLog: PillLogEntry[] = [
      { date: '2026-02-25', takenAt: '12:00', takenTimestamp: 1, doseMg: 1.0 },
      { date: '2026-03-10', takenAt: '12:00', takenTimestamp: 3, doseMg: 100.0 }
    ];
    const pred = computePrediction(results, pillLog, '2026-03-14');
    expect(pred?.estimatedINR).toBe(10);
  });

  it('computePrediction caps result at 0.5 minimum', () => {
    const results: INRResult[] = [
      { id: '1', date: '2026-02-18', value: 3.0, weeklyDoseMg: 0, weeklyDoseOverridden: false, createdAt: 1 },
      { id: '2', date: '2026-03-03', value: 2.0, weeklyDoseMg: 0, weeklyDoseOverridden: false, createdAt: 2 }
    ];
    const pillLog: PillLogEntry[] = [
      { date: '2026-02-25', takenAt: '12:00', takenTimestamp: 1, doseMg: 1.0 },
      { date: '2026-03-10', takenAt: '12:00', takenTimestamp: 3, doseMg: 100.0 }
    ];
    const pred = computePrediction(results, pillLog, '2026-03-14');
    expect(pred?.estimatedINR).toBe(0.5);
  });

  it('computePredictionRate calculates correctly', () => {
    expect(computePredictionRate(2.0, 2.5, 10)).toBe(0.05);
    expect(computePredictionRate(2.0, 2.5, 0)).toBe(0);
  });

  it('getPredictionStatus returns warnings correctly', () => {
    expect(getPredictionStatus(4.1, range)).toBe('high-warning');
    expect(getPredictionStatus(1.4, range)).toBe('low-warning');
    expect(getPredictionStatus(3.5, range)).toBe('above');
    expect(getPredictionStatus(1.8, range)).toBe('below');
    expect(getPredictionStatus(2.5, range)).toBe('in-range');
  });

  it('getDoseSinceLastTest sums correctly', () => {
    const pillLog: PillLogEntry[] = [
      { date: '2026-03-01', takenAt: '', takenTimestamp: 0, doseMg: 1.0 },
      { date: '2026-03-10', takenAt: '', takenTimestamp: 0, doseMg: 2.0 },
      { date: '2026-03-14', takenAt: '', takenTimestamp: 0, doseMg: 3.0 },
      { date: '2026-03-15', takenAt: '', takenTimestamp: 0, doseMg: 4.0 }, 
    ];
    expect(getDoseSinceLastTest(pillLog, '2026-03-05', '2026-03-14')).toBe(5.0);
  });

  it('getDoseSinceLastTest returns 0 when no logs exist after lastTestDate', () => {
    const pillLog: PillLogEntry[] = [
      { date: '2026-03-01', takenAt: '', takenTimestamp: 0, doseMg: 1.0 },
    ];
    expect(getDoseSinceLastTest(pillLog, '2026-03-05', '2026-03-14')).toBe(0);
  });
});
