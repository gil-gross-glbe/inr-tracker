import React, { useState, useCallback, useMemo } from 'react';
import { PillLogEntry } from '../types';
import {
  daysInMonth,
  firstDayOfMonth,
  toDateString,
  formatMonthYear,
  isFutureMonth,
} from '../utils/calendarUtils';
import { getDayStatus, getTodayDateString } from '../utils/pillLog';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PillCalendarProps {
  pillLog: PillLogEntry[];
  onDayPress: (dateStr: string) => void;
  /** Callback to inform parent of the currently viewed month/year */
  onMonthChange?: (year: number, month: number) => void;
}

const DOW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const PillCalendar: React.FC<PillCalendarProps> = ({ pillLog, onDayPress, onMonthChange }) => {
  const now = new Date();
  const [displayYear, setDisplayYear] = useState(now.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(now.getMonth()); // 0-indexed

  const todayStr = getTodayDateString();

  const goToPrev = useCallback(() => {
    setDisplayMonth((prev) => {
      let newMonth = prev - 1;
      let newYear = displayYear;
      if (newMonth < 0) {
        newMonth = 11;
        newYear = displayYear - 1;
        setDisplayYear(newYear);
      }
      onMonthChange?.(newYear, newMonth);
      return newMonth;
    });
  }, [displayYear, onMonthChange]);

  const goToNext = useCallback(() => {
    const nextMonth = displayMonth + 1 > 11 ? 0 : displayMonth + 1;
    const nextYear = displayMonth + 1 > 11 ? displayYear + 1 : displayYear;
    // Don't navigate past current month
    if (isFutureMonth(nextYear, nextMonth)) return;
    setDisplayMonth(nextMonth);
    if (nextMonth === 0) setDisplayYear(nextYear);
    onMonthChange?.(nextYear, nextMonth);
  }, [displayMonth, displayYear, onMonthChange]);

  const canGoNext = !isFutureMonth(
    displayMonth + 1 > 11 ? displayYear + 1 : displayYear,
    displayMonth + 1 > 11 ? 0 : displayMonth + 1
  );

  const totalDays = daysInMonth(displayYear, displayMonth);
  const startDow = firstDayOfMonth(displayYear, displayMonth);

  // Build a lookup map for fast access
  const logMap = useMemo(() => {
    const map = new Map<string, PillLogEntry>();
    pillLog.forEach((e) => map.set(e.date, e));
    return map;
  }, [pillLog]);

  // Build cells
  const emptyCellsBefore = Array.from({ length: startDow }, (_, i) => (
    <div key={`empty-before-${i}`} className="min-h-[46px]" />
  ));

  const dayCells = Array.from({ length: totalDays }, (_, i) => {
    const day = i + 1;
    const dateStr = toDateString(displayYear, displayMonth, day);
    const status = getDayStatus(dateStr, pillLog, todayStr);
    const entry = logMap.get(dateStr);
    const isToday = dateStr === todayStr;
    const isFuture = status === 'future';

    // Dot styling
    let dotClass = 'bg-pillEmpty border border-borderLight text-textMuted';
    let dotChar = '';
    let doseLabel = '';

    if (status === 'taken') {
      dotClass = 'bg-successBg text-success border-transparent';
      dotChar = '✓';
      doseLabel = entry ? `${entry.doseMg}mg` : '';
    } else if (status === 'skipped' || status === 'missed') {
      dotClass = 'bg-dangerBg text-danger border-transparent';
      dotChar = '✕';
      doseLabel = '—';
    } else if (isToday) {
      dotChar = '?';
      doseLabel = '—';
    }

    return (
      <div
        key={dateStr}
        onClick={() => !isFuture && onDayPress(dateStr)}
        className={`
          rounded-lg min-h-[46px] flex flex-col items-center py-[3px] px-[1px]
          border transition-colors
          ${isToday ? 'border-primary' : 'border-transparent'}
          ${!isFuture ? 'cursor-pointer hover:border-borderDark hover:bg-screenBg' : 'cursor-default'}
        `}
      >
        <div className={`text-[10px] leading-none mb-[2px] ${isToday ? 'text-primary font-medium' : 'text-textMuted'}`}>
          {day}
        </div>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium border ${dotClass}`}>
          {dotChar}
        </div>
        {doseLabel ? (
          <div className="text-[8px] text-textMuted mt-[1px] leading-none">{doseLabel}</div>
        ) : null}
      </div>
    );
  });

  const trailing = (emptyCellsBefore.length + totalDays) % 7;
  const emptyCellsAfter = trailing > 0
    ? Array.from({ length: 7 - trailing }, (_, i) => (
        <div key={`empty-after-${i}`} className="min-h-[46px]" />
      ))
    : [];

  return (
    <div className="bg-white border border-borderLight rounded-[14px] p-3.5 mb-3 shadow-sm">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2.5">
        <button
          onClick={goToPrev}
          className="w-7 h-7 rounded-full border border-borderDark bg-screenBg text-textSub flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm font-medium text-textMain">
          {formatMonthYear(displayYear, displayMonth)}
        </span>
        <button
          onClick={goToNext}
          disabled={!canGoNext}
          className={`w-7 h-7 rounded-full border border-borderDark bg-screenBg flex items-center justify-center transition-colors ${
            canGoNext ? 'text-textSub hover:bg-gray-100' : 'text-borderDark cursor-not-allowed opacity-50'
          }`}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-[2px] mb-[2px]">
        {DOW_LABELS.map((label, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-textMuted pb-1">
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-[2px]">
        {emptyCellsBefore}
        {dayCells}
        {emptyCellsAfter}
      </div>

      {/* Legend */}
      <div className="flex gap-2.5 justify-center mt-2.5 flex-wrap">
        <div className="flex items-center gap-1 text-[10px] text-textMuted">
          <div className="w-2.5 h-2.5 rounded-full bg-successBg border border-[#C0DD97]" />
          Taken
        </div>
        <div className="flex items-center gap-1 text-[10px] text-textMuted">
          <div className="w-2.5 h-2.5 rounded-full bg-dangerBg border border-dangerBorder" />
          Missed
        </div>
        <div className="flex items-center gap-1 text-[10px] text-textMuted">
          <div className="w-2.5 h-2.5 rounded-full bg-pillEmpty border border-borderDark" />
          Upcoming
        </div>
      </div>

      {/* Hint */}
      <div className="text-[10px] text-textMuted text-center mt-2">
        Tap any day to log or edit
      </div>
    </div>
  );
};
