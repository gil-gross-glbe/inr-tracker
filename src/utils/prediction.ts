import { INRResult, PillLogEntry, TargetRange } from '../types';
import { parseDateLocal } from './pillLog';

export interface PredictionResult {
  estimatedINR: number;
  rate: number;
  totalDoseInPeriod: number;
  doseSinceLastTest: number;
  inrStart: number;
  inrEnd: number;
  daysInPeriod: number;
  periodStartDate: string;
  periodEndDate: string;
}

export type PredictionStatus = 'in-range' | 'high-warning' | 'low-warning' | 'above' | 'below';

export const getDoseBetweenDates = (pillLog: PillLogEntry[], MathStart: string, MathEnd: string): number => {
  const startObj = parseDateLocal(MathStart).getTime();
  const endObj = parseDateLocal(MathEnd).getTime();
  let totalDose = 0;
  for (const entry of pillLog) {
    const entryTime = parseDateLocal(entry.date).getTime();
    if (entryTime >= startObj && entryTime <= endObj) {
      totalDose += entry.doseMg;
    }
  }
  return totalDose;
};

export const computePredictionRate = (inrStart: number, inrEnd: number, totalDose: number): number => {
  if (totalDose <= 0) return 0;
  return (inrEnd - inrStart) / totalDose;
};

export const getDoseSinceLastTest = (pillLog: PillLogEntry[], lastTestDate: string, todayDate: string): number => {
  const lastTest = parseDateLocal(lastTestDate).getTime();
  const today = parseDateLocal(todayDate).getTime();
  let totalDose = 0;
  for (const entry of pillLog) {
    const entryTime = parseDateLocal(entry.date).getTime();
    // > lastTest makes sense for "since last test"
    if (entryTime > lastTest && entryTime <= today) {
      totalDose += entry.doseMg;
    }
  }
  return totalDose;
};

export const computePrediction = (
  resultsSorted: INRResult[], 
  pillLog: PillLogEntry[],
  todayDate: string
): PredictionResult | null => {
  if (resultsSorted.length < 2) return null;
  
  // Sort oldest to newest logic implicitly assumed from argument Name ResultsSorted
  const lastResult = resultsSorted[resultsSorted.length - 1];
  const prevResult = resultsSorted[resultsSorted.length - 2];
  
  const totalDoseInPeriod = getDoseBetweenDates(pillLog, prevResult.date, lastResult.date);
  const rate = computePredictionRate(prevResult.value, lastResult.value, totalDoseInPeriod);
  
  const doseSinceLastTest = getDoseSinceLastTest(pillLog, lastResult.date, todayDate);
  let estimatedINR = lastResult.value + (doseSinceLastTest * rate);
  
  if (estimatedINR > 10) estimatedINR = 10;
  if (estimatedINR < 0.5) estimatedINR = 0.5;
  
  const startObj = parseDateLocal(prevResult.date).getTime();
  const endObj = parseDateLocal(lastResult.date).getTime();
  const daysInPeriod = Math.max(1, Math.round((endObj - startObj) / (1000 * 60 * 60 * 24)));
  
  return {
    estimatedINR: Math.round(estimatedINR * 10) / 10,
    rate,
    totalDoseInPeriod,
    doseSinceLastTest,
    inrStart: prevResult.value,
    inrEnd: lastResult.value,
    daysInPeriod,
    periodStartDate: prevResult.date,
    periodEndDate: lastResult.date,
  };
};

export const getPredictionStatus = (value: number, range: TargetRange): PredictionStatus => {
  if (value > 4.0) return 'high-warning';
  if (value < 1.5) return 'low-warning';
  if (value > range.max) return 'above';
  if (value < range.min) return 'below';
  return 'in-range';
};
