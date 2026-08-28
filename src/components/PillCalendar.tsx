import React, { useState, useCallback, useMemo } from 'react';
import { PillLogEntry, INRResult } from '../types';
import {
  daysInMonth,
  firstDayOfMonth,
  toDateString,
  formatMonthYear,
  isFutureMonth,
} from '../utils/calendarUtils';
import { getDayStatus, getTodayDateString, getEntryPills, formatPillQuantity } from '../utils/pillLog';
import { ChevronLeft, ChevronRight, Droplet } from 'lucide-react';

interface PillCalendarProps {
  pillLog: PillLogEntry[];
  inrResults?: INRResult[];
  onDayPress: (dateStr: string) => void;
  onMonthChange?: (year: number, month: number) => void;
}

const DOW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const PillCalendar: React.FC<PillCalendarProps> = ({ 
  pillLog, 
  inrResults = [],
  onDayPress, 
  onMonthChange 
}) => {
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

  // Lookup maps
  const logMap = useMemo(() => {
    const map = new Map<string, PillLogEntry>();
    pillLog.forEach((e) => map.set(e.date, e));
    return map;
  }, [pillLog]);

  const inrMap = useMemo(() => {
    const map = new Map<string, INRResult>();
    inrResults.forEach((r) => map.set(r.date, r));
    return map;
  }, [inrResults]);

  // Build cells
  const emptyCellsBefore = Array.from({ length: startDow }, (_, i) => (
    <div key={`empty-before-${i}`} className="min-h-[48px]" />
  ));

  const dayCells = Array.from({ length: totalDays }, (_, i) => {
    const day = i + 1;
    const dateStr = toDateString(displayYear, displayMonth, day);
    const status = getDayStatus(dateStr, pillLog, todayStr);
    const entry = logMap.get(dateStr);
    const inrTest = inrMap.get(dateStr);
    const isCurrentDay = dateStr === todayStr;
    const isFuture = status === 'future';

    let pillsTaken = 0;
    if (entry) {
      pillsTaken = getEntryPills(entry);
    }

    let dotClass = 'bg-pillEmpty text-textMuted border-borderLight';
    let dotContent: React.ReactNode = '';
    let doseLabel = '';

    if (status === 'taken') {
      if (pillsTaken === 0.5) {
        dotClass = 'bg-successBg text-primary border-pillTakenBorder/30';
        dotContent = '½';
        doseLabel = '½ pill';
      } else {
        dotClass = 'bg-primary text-white border-transparent';
        dotContent = pillsTaken > 1 ? formatPillQuantity(pillsTaken) : '✓';
        doseLabel = pillsTaken > 1 ? `${pillsTaken}p` : '1 pill';
      }
    } else if (status === 'skipped') {
      dotClass = 'bg-dangerBg text-danger border-dangerBorder/50';
      dotContent = '0';
      doseLabel = 'skip';
    } else if (status === 'missed') {
      dotClass = 'bg-dangerBg/50 text-danger border-dangerBorder/30';
      dotContent = '✕';
      doseLabel = '—';
    } else if (isCurrentDay) {
      dotClass = 'bg-screenBg text-textMain border-dashed border-borderDark';
      dotContent = '?';
    }

    return (
      <div
        key={dateStr}
        onClick={() => !isFuture && onDayPress(dateStr)}
        className={`
          rounded-xl min-h-[48px] flex flex-col items-center py-1 px-0.5 relative
          border transition-all
          ${isCurrentDay ? 'border-primary bg-primary/5 shadow-xs' : 'border-transparent'}
          ${!isFuture ? 'cursor-pointer hover:border-borderDark hover:bg-screenBg active:scale-95' : 'cursor-default opacity-40'}
        `}
      >
        {/* INR flag badge */}
        {inrTest && (
          <div 
            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-danger text-white flex items-center justify-center shadow-xs z-10"
            title={`INR: ${inrTest.value.toFixed(1)}`}
          >
            <Droplet size={8} fill="white" />
          </div>
        )}

        <div className={`text-[10px] font-medium leading-none mb-1 ${isCurrentDay ? 'text-primary font-bold' : 'text-textMuted'}`}>
          {day}
        </div>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${dotClass}`}>
          {dotContent}
        </div>
        {doseLabel ? (
          <div className="text-[8px] text-textMuted mt-0.5 leading-none font-medium truncate max-w-full">
            {doseLabel}
          </div>
        ) : null}
      </div>
    );
  });

  const trailing = (emptyCellsBefore.length + totalDays) % 7;
  const emptyCellsAfter = trailing > 0
    ? Array.from({ length: 7 - trailing }, (_, i) => (
        <div key={`empty-after-${i}`} className="min-h-[48px]" />
      ))
    : [];

  return (
    <div className="bg-white border border-borderLight rounded-2xl p-4 shadow-sm">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goToPrev}
          className="w-8 h-8 rounded-xl border border-borderDark bg-screenBg text-textSub flex items-center justify-center hover:bg-gray-100 active:scale-95 transition-all"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="text-sm font-semibold text-textMain">
          {formatMonthYear(displayYear, displayMonth)}
        </span>
        <button
          onClick={goToNext}
          disabled={!canGoNext}
          className={`w-8 h-8 rounded-xl border border-borderDark bg-screenBg flex items-center justify-center transition-all ${
            canGoNext ? 'text-textSub hover:bg-gray-100 active:scale-95' : 'text-borderDark cursor-not-allowed opacity-40'
          }`}
        >
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DOW_LABELS.map((label, i) => (
          <div key={i} className="text-center text-[10px] font-semibold text-textMuted py-0.5">
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {emptyCellsBefore}
        {dayCells}
        {emptyCellsAfter}
      </div>

      {/* Legend */}
      <div className="flex gap-3 justify-center mt-3.5 pt-3 border-t border-borderLight flex-wrap">
        <div className="flex items-center gap-1 text-[11px] text-textSub">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span>1 Pill</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-textSub">
          <div className="w-2.5 h-2.5 rounded-full bg-successBg border border-primary text-primary flex items-center justify-center text-[7px] font-bold">
            ½
          </div>
          <span>½ Pill</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-textSub">
          <div className="w-2.5 h-2.5 rounded-full bg-dangerBg border border-dangerBorder" />
          <span>Missed</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-textSub">
          <div className="w-2.5 h-2.5 rounded-full bg-danger text-white flex items-center justify-center">
            <Droplet size={6} fill="white" />
          </div>
          <span>INR Test</span>
        </div>
      </div>
    </div>
  );
};

