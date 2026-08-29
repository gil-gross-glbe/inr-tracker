import { PillLogEntry, BottleState } from '../types';

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

export const getEntryPills = (entry: PillLogEntry): number => {
  if (entry.dosePills !== undefined) {
    return entry.dosePills;
  }
  if (entry.doseMg === 0) return 0;
  return entry.doseMg / 0.5; // 0.5 mg = 1 pill
};

export const formatPillLabel = (pills: number): string => {
  if (pills === 0) return 'Skipped';
  if (pills === 0.5) return '½ Pill';
  if (pills === 1) return '1 Pill';
  if (pills === 1.5) return '1½ Pills';
  if (pills === 2) return '2 Pills';
  return `${pills} Pills`;
};

export const formatPillQuantity = (pills: number): string => {
  if (pills === 0) return '0';
  if (pills === 0.5) return '½';
  if (pills === 1) return '1';
  if (pills === 1.5) return '1½';
  if (pills === 2) return '2';
  return String(pills);
};

export const calculateBottleRemaining = (
  bottle: BottleState | null | undefined,
  pillLog: PillLogEntry[]
): { remaining: number; taken: number; totalCapacity: number } => {
  if (!bottle || !bottle.openedDate) {
    return { remaining: 0, taken: 0, totalCapacity: 0 };
  }

  const effectiveInitial = bottle.initialCount + (bottle.adjustmentCount || 0);
  let totalTaken = 0;

  for (const entry of pillLog) {
    if (entry.date >= bottle.openedDate) {
      totalTaken += getEntryPills(entry);
    }
  }

  const remaining = Math.max(0, effectiveInitial - totalTaken);
  return {
    remaining,
    taken: totalTaken,
    totalCapacity: bottle.initialCount
  };
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
    return entry.doseMg === 0 || entry.dosePills === 0 ? 'skipped' : 'taken';
  }
  
  const dateObj = parseDateLocal(date).getTime();
  const todayObj = parseDateLocal(todayStr).getTime();

  if (dateObj === todayObj) {
    return 'today';
  } else if (dateObj < todayObj) {
    return 'missed';
  } else {
    return 'future';
  }
};

export const createPillEntry = (date: string, dose: number, isPillUnit = false): PillLogEntry => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  const dosePills = isPillUnit ? dose : (dose === 0 ? 0 : dose / 0.5);
  const doseMg = isPillUnit ? dose * 0.5 : dose;

  return {
    date,
    takenAt: `${hours}:${minutes}`,
    takenTimestamp: now.getTime(),
    doseMg,
    dosePills
  };
};

export const markDayAsSkipped = (date: string): PillLogEntry => {
  return createPillEntry(date, 0, true);
};
