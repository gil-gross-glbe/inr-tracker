import React from 'react';
import { PillLogEntry } from '../types';
import { getTodayDateString, parseDateLocal, getEntryPills, formatPillLabel } from '../utils/pillLog';
import { CheckCircle2, CircleDot, Edit3, Check } from 'lucide-react';

interface TodayDoseCardProps {
  todayEntry: PillLogEntry | undefined;
  defaultPills: number;
  onTakeDose: (pills: number) => Promise<void>;
  onEditDose: () => void;
}

export const TodayDoseCard: React.FC<TodayDoseCardProps> = ({
  todayEntry,
  onTakeDose,
  onEditDose,
}) => {
  const todayStr = getTodayDateString();
  const todayObj = parseDateLocal(todayStr);
  const formattedDate = todayObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const isTaken = !!todayEntry && (todayEntry.dosePills !== undefined ? todayEntry.dosePills > 0 : todayEntry.doseMg > 0);
  const isSkipped = !!todayEntry && (todayEntry.dosePills === 0 || todayEntry.doseMg === 0);

  const pillsTaken = todayEntry ? getEntryPills(todayEntry) : 0;

  return (
    <div className="bg-white border border-borderLight rounded-2xl p-4 shadow-sm relative overflow-hidden">
      <div className="flex justify-between items-center mb-3">
        <div>
          <span className="text-[11px] font-semibold text-textMuted uppercase tracking-wider">
            Today's Dose
          </span>
          <h1 className="text-base font-bold text-textMain">{formattedDate}</h1>
        </div>
        {isTaken ? (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-successBg text-success flex items-center gap-1 border border-pillTakenBorder/20">
            <CheckCircle2 size={14} />
            Taken
          </span>
        ) : isSkipped ? (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-dangerBg text-danger flex items-center gap-1 border border-dangerBorder">
            Skipped
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-screenBg text-textSub border border-borderDark flex items-center gap-1">
            <CircleDot size={14} className="text-warning animate-pulse" />
            Pending
          </span>
        )}
      </div>

      {isTaken ? (
        <div className="bg-screenBg rounded-xl p-4 border border-borderLight flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-successBg text-success flex items-center justify-center font-bold text-xl border border-pillTakenBorder/30">
              💊
            </div>
            <div>
              <div className="text-base font-bold text-textMain">
                {formatPillLabel(pillsTaken)}
              </div>
              <div className="text-xs text-textSub">
                Logged at {todayEntry?.takenAt}
              </div>
            </div>
          </div>

          <button
            onClick={onEditDose}
            className="py-1.5 px-3 rounded-lg border border-borderDark bg-white text-textMain hover:bg-screenBg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Edit3 size={13} />
            <span>Change</span>
          </button>
        </div>
      ) : isSkipped ? (
        <div className="bg-screenBg rounded-xl p-4 border border-borderLight flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-danger">Dose Skipped Today</div>
            <div className="text-xs text-textMuted">Marked as 0 pills</div>
          </div>
          <button
            onClick={onEditDose}
            className="py-1.5 px-3 rounded-lg border border-borderDark bg-white text-textMain hover:bg-screenBg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Edit3 size={13} />
            <span>Change</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="text-xs text-textSub">
            Have you taken your Coumadin dose today?
          </div>

          {/* Quick Action Dose Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onTakeDose(1.0)}
              className="py-3 px-3 rounded-xl bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all shadow-sm"
            >
              <Check size={16} />
              <span>Take 1 Pill</span>
            </button>

            <button
              onClick={() => onTakeDose(0.5)}
              className="py-3 px-3 rounded-xl border border-borderDark bg-screenBg text-textMain font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-white active:scale-[0.98] transition-all"
            >
              <span>Take ½ Pill</span>
            </button>
          </div>

          <div className="flex gap-2 pt-0.5">
            <button
              onClick={() => onTakeDose(0)}
              className="flex-1 py-1.5 px-2 rounded-lg border border-borderLight text-textMuted hover:text-danger hover:bg-dangerBg/40 text-[11px] font-medium transition-colors"
            >
              Skip Today (0)
            </button>
            <button
              onClick={onEditDose}
              className="flex-1 py-1.5 px-2 rounded-lg border border-borderLight text-textSub hover:text-textMain hover:bg-screenBg text-[11px] font-medium transition-colors"
            >
              Other Amount...
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
