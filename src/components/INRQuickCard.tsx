import React from 'react';
import { INRResult, TargetRange } from '../types';
import { Droplet, PlusCircle, Calendar, ChevronRight } from 'lucide-react';
import { parseDateLocal } from '../utils/pillLog';

interface INRQuickCardProps {
  inrResults: INRResult[];
  targetRange: TargetRange;
  onLogINR: () => void;
  onEditINR: (result: INRResult) => void;
}

export const INRQuickCard: React.FC<INRQuickCardProps> = ({
  inrResults,
  targetRange,
  onLogINR,
  onEditINR,
}) => {
  // Sort descending by date
  const sorted = [...inrResults].sort((a, b) => {
    return parseDateLocal(b.date).getTime() - parseDateLocal(a.date).getTime();
  });

  const latest = sorted[0];

  const getDaysAgo = (dateStr: string) => {
    const testDate = parseDateLocal(dateStr).getTime();
    const today = new Date().setHours(0, 0, 0, 0);
    const diffDays = Math.round((today - testDate) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const isInRange = (val: number) => val >= targetRange.min && val <= targetRange.max;
  const isHigh = (val: number) => val > targetRange.max;

  return (
    <div className="bg-white border border-borderLight rounded-2xl p-4 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-dangerBg text-danger flex items-center justify-center">
            <Droplet size={17} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-textMuted uppercase tracking-wider">
              INR Lab Status
            </div>
            <div className="text-xs text-textSub">
              Target: {targetRange.min.toFixed(1)} – {targetRange.max.toFixed(1)}
            </div>
          </div>
        </div>

        <button
          onClick={onLogINR}
          className="py-1 px-2.5 rounded-lg bg-screenBg text-primary hover:bg-successBg border border-borderDark text-xs font-medium flex items-center gap-1 transition-colors"
        >
          <PlusCircle size={13} />
          <span>Log INR</span>
        </button>
      </div>

      {latest ? (
        <div className="space-y-2.5">
          <div 
            onClick={() => onEditINR(latest)}
            className="bg-screenBg rounded-xl p-3.5 border border-borderLight flex items-center justify-between cursor-pointer hover:border-borderDark transition-colors group"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-extrabold tracking-tight ${
                  isInRange(latest.value)
                    ? 'text-primary'
                    : isHigh(latest.value)
                    ? 'text-danger'
                    : 'text-warning'
                }`}>
                  {latest.value.toFixed(1)}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                  isInRange(latest.value)
                    ? 'bg-successBg text-success border-pillTakenBorder/20'
                    : isHigh(latest.value)
                    ? 'bg-dangerBg text-danger border-dangerBorder'
                    : 'bg-warningBg text-warning border-warningBg'
                }`}>
                  {isInRange(latest.value) ? 'In Target' : isHigh(latest.value) ? 'High' : 'Low'}
                </span>
              </div>
              <div className="text-xs text-textMuted mt-0.5 flex items-center gap-1.5">
                <Calendar size={12} />
                <span>{latest.date} ({getDaysAgo(latest.date)})</span>
                {latest.notes && <span className="truncate max-w-[140px]">· {latest.notes}</span>}
              </div>
            </div>

            <ChevronRight size={16} className="text-textMuted group-hover:text-textMain transition-colors" />
          </div>

          {/* Recent INR list if multiple */}
          {sorted.length > 1 && (
            <div className="pt-1 flex items-center gap-2 overflow-x-auto pb-1 text-xs text-textSub">
              <span className="text-[11px] text-textMuted shrink-0 font-medium">History:</span>
              {sorted.slice(1, 4).map((res) => (
                <button
                  key={res.id}
                  onClick={() => onEditINR(res)}
                  className="px-2 py-1 bg-screenBg rounded-lg border border-borderLight text-[11px] hover:border-borderDark shrink-0 flex items-center gap-1.5"
                >
                  <span className="font-semibold text-textMain">{res.value.toFixed(1)}</span>
                  <span className="text-textMuted">{res.date.slice(5)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-screenBg rounded-xl p-4 border border-borderLight text-center">
          <div className="text-xs text-textMuted mb-2">No INR test results recorded yet</div>
          <button
            onClick={onLogINR}
            className="py-1.5 px-3 rounded-lg bg-white border border-borderDark text-xs font-semibold text-textMain hover:border-primary transition-colors"
          >
            Log your first test result
          </button>
        </div>
      )}
    </div>
  );
};
