import React, { useMemo } from 'react';
import { PillLogEntry } from '../types';
import { toDateString } from '../utils/calendarUtils';
import { getDayStatus } from '../utils/pillLog';

interface MonthlyStatsProps {
  pillLog: PillLogEntry[];
  month: number;   // 0-indexed
  year: number;
}

export const MonthlyStats: React.FC<MonthlyStatsProps> = ({ pillLog, month, year }) => {
  const { taken, missed, totalDose } = useMemo(() => {
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
          : 0; // future month → 0 days to count

    let takenCount = 0;
    let missedCount = 0;
    let dose = 0;

    for (let day = 1; day <= maxDay; day++) {
      const dateStr = toDateString(year, month, day);
      const status = getDayStatus(dateStr, pillLog);

      if (status === 'taken') {
        takenCount++;
        const entry = pillLog.find((e) => e.date === dateStr);
        if (entry) dose += entry.doseMg;
      } else if (status === 'skipped' || status === 'missed') {
        missedCount++;
      }
      // 'today' (not yet logged) is not counted in either bucket
    }

    return { taken: takenCount, missed: missedCount, totalDose: dose };
  }, [pillLog, month, year]);

  const doseLabel = totalDose % 1 === 0 ? `${totalDose}mg` : `${totalDose.toFixed(1)}mg`;

  return (
    <div className="flex bg-white border border-borderLight rounded-xl overflow-hidden mb-3 shadow-sm">
      <div className="flex-1 text-center py-2.5 px-1">
        <div className="text-lg font-medium text-primary leading-none">{taken}</div>
        <div className="text-[10px] text-textMuted mt-0.5">taken</div>
      </div>
      <div className="flex-1 text-center py-2.5 px-1 border-l border-borderLight">
        <div className="text-lg font-medium text-danger leading-none">{missed}</div>
        <div className="text-[10px] text-textMuted mt-0.5">missed</div>
      </div>
      <div className="flex-1 text-center py-2.5 px-1 border-l border-borderLight">
        <div className="text-lg font-medium text-textMain leading-none">{doseLabel}</div>
        <div className="text-[10px] text-textMuted mt-0.5">total dose</div>
      </div>
    </div>
  );
};
