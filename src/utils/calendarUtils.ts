/**
 * Pure date/calendar math utilities for the PillCalendar component.
 */

/** Number of days in a given month (0-indexed month, like JS Date) */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Day-of-week (0=Sun … 6=Sat) for the 1st of the given month */
export function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/** Build a "YYYY-MM-DD" string from year, month (0-indexed), day */
export function toDateString(year: number, month: number, day: number): string {
  const y = String(year);
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Format "YYYY-MM-DD" → "Monday, April 6" */
export function formatDayLong(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/** Format month + year → "April 2026" */
export function formatMonthYear(year: number, month: number): string {
  const d = new Date(year, month, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Check whether a given year/month is the current month */
export function isCurrentMonth(year: number, month: number): boolean {
  const now = new Date();
  return year === now.getFullYear() && month === now.getMonth();
}

/** Check whether a given year/month is in the future (strictly after current month) */
export function isFutureMonth(year: number, month: number): boolean {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  return year > currentYear || (year === currentYear && month > currentMonth);
}
