import { PillLogEntry } from '../types';

export type DayStatus = 'taken' | 'skipped' | 'missed' | 'today' | 'future' | 'empty';

// Helper to avoid timezone shifting when creating Dates from YYYY-MM-DD
export const parseDateLocal = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const getTodayDateString = (now = new Date()): string => {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isToday = (date: string, todayStr = getTodayDateString()): boolean => {
  return date === todayStr;
};

export const getPastNDays = (n: number, todayStr = getTodayDateString()): string[] => {
  const days: string[] = [];
  const today = parseDateLocal(todayStr);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    days.push(`${year}-${month}-${day}`);
  }
  return days;
};

export const getWeeklyDose = (pillLog: PillLogEntry[], referenceDate: string): number => {
  const refDateObj = parseDateLocal(referenceDate);
  const sevenDaysBeforeObj = new Date(refDateObj.getTime() - 7 * 24 * 60 * 60 * 1000);

  let totalDose = 0;
  for (const entry of pillLog) {
    const entryDateObj = parseDateLocal(entry.date);
    if (entryDateObj >= sevenDaysBeforeObj && entryDateObj < refDateObj) {
      totalDose += entry.doseMg;
    }
  }
  return totalDose;
};

export const getDayStatus = (date: string, pillLog: PillLogEntry[], todayStr = getTodayDateString()): DayStatus => {
  const entry = pillLog.find(e => e.date === date);
  if (entry) {
    return entry.doseMg === 0 ? 'skipped' : 'taken';
  }
  
  const dateObj = parseDateLocal(date).getTime();
  const todayObj = parseDateLocal(todayStr).getTime();

  if (dateObj === todayObj) {
    return 'today';
  } else if (dateObj < todayObj) {
    return 'empty';
  } else {
    return 'future';
  }
};

export const createPillEntry = (date: string, doseMg: number): PillLogEntry => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return {
    date,
    takenAt: `${hours}:${minutes}`,
    takenTimestamp: now.getTime(),
    doseMg
  };
};

export const markDayAsSkipped = (date: string): PillLogEntry => {
  return createPillEntry(date, 0);
};
