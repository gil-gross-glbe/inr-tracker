import React, { useMemo } from 'react';
import { PillLogEntry } from '../types';
import { toDateString } from '../utils/calendarUtils';
import { getDayStatus, getEntryPills, formatPillQuantity } from '../utils/pillLog';

interface MonthlyStatsProps {
  pillLog: PillLogEntry[];
  month: number;   // 0-indexed
  year: number;
}

export const MonthlyStats: React.FC<MonthlyStatsProps> = ({ pillLog, month, year }) => {
  const { taken, missed, totalPills } = useMemo(() => {
    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDay = now.getDate();

    // How many days to consider (up to today if current month, or full month if past)
    const lastDayInMonth = new Date(year, month + 1, 0).getDate();
    const maxDay =
      year === todayYear && month === todayMonth
        ? todayDay
        : year < todayYear || (year === todayYear && month < todayMonth)
          ? lastDayInMonth
          : 0;

    let takenCount = 0;
    let missedCount = 0;
    let pills = 0;

    for (let day = 1; day <= maxDay; day++) {
      const dateStr = toDateString(year, month, day);
      const status = getDayStatus(dateStr, pillLog);

      if (status === 'taken') {
        takenCount++;
        const entry = pillLog.find((e) => e.date === dateStr);
        if (entry) pills += getEntryPills(entry);
      } else if (status === 'skipped' || status === 'missed') {
        missedCount++;
      }
    }

    return { taken: takenCount, missed: missedCount, totalPills: pills };
  }, [pillLog, month, year]);

  const adherence = taken + missed > 0 ? Math.round((taken / (taken + missed)) * 100) : 100;

  return (
    <div className="flex bg-white border border-borderLight rounded-2xl overflow-hidden shadow-sm">
      <div className="flex-1 text-center py-3 px-1">
        <div className="text-xl font-bold text-primary leading-none">{taken}</div>
        <div className="text-[10px] font-medium text-textMuted uppercase tracking-wider mt-1">Days Taken</div>
      </div>
      <div className="flex-1 text-center py-3 px-1 border-l border-borderLight">
        <div className="text-xl font-bold text-textMain leading-none">{formatPillQuantity(totalPills)}</div>
        <div className="text-[10px] font-medium text-textMuted uppercase tracking-wider mt-1">Pills Used</div>
      </div>
      <div className="flex-1 text-center py-3 px-1 border-l border-borderLight">
        <div className="text-xl font-bold text-textMain leading-none">{adherence}%</div>
        <div className="text-[10px] font-medium text-textMuted uppercase tracking-wider mt-1">Adherence</div>
      </div>
    </div>
  );
};

