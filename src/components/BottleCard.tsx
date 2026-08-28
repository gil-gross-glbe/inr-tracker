import React from 'react';
import { BottleState } from '../types';
import { Package, PlusCircle, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { parseDateLocal } from '../utils/pillLog';

interface BottleCardProps {
  bottleState: BottleState;
  remainingPills: number;
  totalTakenSinceOpen: number;
  onOpenNewBottle: () => void;
  onAdjustCount: () => void;
}

export const BottleCard: React.FC<BottleCardProps> = ({
  bottleState,
  remainingPills,
  totalTakenSinceOpen,
  onOpenNewBottle,
  onAdjustCount,
}) => {
  const initial = bottleState.initialCount || 30;
  const percentage = Math.min(100, Math.max(0, Math.round((remainingPills / initial) * 100)));
  const isLow = remainingPills <= 5;
  const isCritical = remainingPills <= 2;

  const openedDateObj = bottleState.openedDate ? parseDateLocal(bottleState.openedDate) : new Date();
  const openedFormatted = openedDateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-white border border-borderLight rounded-2xl p-4 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            isLow ? 'bg-warningBg text-warning' : 'bg-screenBg text-textMain border border-borderLight'
          }`}>
            <Package size={17} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-textMuted uppercase tracking-wider">
              Pill Bottle Inventory
            </div>
            <div className="text-xs text-textSub">
              Opened on {openedFormatted} ({initial} count)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onAdjustCount}
            className="p-1.5 rounded-lg border border-borderLight text-textSub hover:text-textMain hover:bg-screenBg text-xs font-medium flex items-center gap-1 transition-colors"
            title="Adjust Pill Count"
          >
            <SlidersHorizontal size={13} />
            <span>Adjust</span>
          </button>
          <button
            onClick={onOpenNewBottle}
            className="py-1 px-2.5 rounded-lg bg-screenBg text-primary hover:bg-successBg border border-borderDark text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <PlusCircle size={13} />
            <span>New Bottle</span>
          </button>
        </div>
      </div>

      {/* Main Pill Count Hero */}
      <div className="bg-screenBg rounded-xl p-3.5 border border-borderLight flex items-baseline justify-between mb-3">
        <div>
          <div className="text-xs text-textMuted font-medium">Physical Bottle Should Have:</div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={`text-3xl font-extrabold tracking-tight ${
              isCritical ? 'text-danger' : isLow ? 'text-warning' : 'text-textMain'
            }`}>
              {remainingPills}
            </span>
            <span className="text-xs font-medium text-textSub">pills left</span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] text-textMuted">{totalTakenSinceOpen} pills taken</div>
          <div className="text-xs font-semibold text-textMain mt-0.5">
            {percentage}% remaining
          </div>
        </div>
      </div>

      {/* Visual progress bar */}
      <div className="w-full bg-borderLight h-2 rounded-full overflow-hidden mb-2">
        <div 
          className={`h-full transition-all duration-300 rounded-full ${
            isCritical ? 'bg-danger' : isLow ? 'bg-warning' : 'bg-primary'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isLow && (
        <div className="flex items-center gap-1.5 text-[11px] text-warning font-medium mt-2 pt-1 border-t border-borderLight/60">
          <AlertCircle size={13} />
          <span>Low bottle warning: refill prescription soon!</span>
        </div>
      )}
    </div>
  );
};
