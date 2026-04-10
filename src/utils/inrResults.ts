import { INRResult, TargetRange } from '../types';

export type INRStatus = 'in-range' | 'above' | 'below' | 'above-danger' | 'below-danger';

export const getINRStatus = (value: number, range: TargetRange): INRStatus => {
  if (value < range.min - 0.5) return 'below-danger';
  if (value < range.min) return 'below';
  if (value > range.max + 0.5) return 'above-danger';
  if (value > range.max) return 'above';
  return 'in-range';
};

export const sortINRResultsByDate = (results: INRResult[]): INRResult[] => {
  return [...results].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) return dateA - dateB;
    return a.createdAt - b.createdAt;
  });
};

export const validateINRForm = (value: number | undefined, date: string): string[] => {
  const errors: string[] = [];
  if (value === undefined || isNaN(value)) {
    errors.push('INR value is required');
  } else if (value <= 0) {
    errors.push('INR value must be strictly greater than 0');
  } else if (value > 10) {
    errors.push('INR value must be 10 or less');
  }
  
  if (!date) {
    errors.push('Date is required');
  }
  return errors;
};
