import React from 'react';
import { formatDayLong } from '../utils/calendarUtils';

interface EditDayModalProps {
  date: string;                    // YYYY-MM-DD
  currentDoseMg: number | null;    // existing entry dose, or null if no entry
  availableStrengths: number[];
  defaultDoseMg: number;
  onSave: (date: string, doseMg: number) => void;
  onClose: () => void;
}

export const EditDayModal: React.FC<EditDayModalProps> = ({
  date,
  currentDoseMg,
  availableStrengths,
  onSave,
  onClose,
}) => {
  const currentDose = currentDoseMg !== null && currentDoseMg > 0 ? currentDoseMg : null;
  const dayLabel = formatDayLong(date);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center sm:justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-4 pb-8 sm:pb-4 shadow-lg animate-in slide-in-from-bottom-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar (mobile) */}
        <div className="w-9 h-1 bg-borderDark rounded-full mx-auto mb-3.5 sm:hidden" />

        {/* Title */}
        <div className="text-sm font-medium text-textMain mb-0.5">{dayLabel}</div>
        <div className="text-xs text-textMuted mb-3">Tap a dose to log, or mark as missed</div>

        {/* Dose grid — tap saves immediately */}
        <div className="grid grid-cols-2 gap-2 mb-2.5">
          {availableStrengths.map((dose) => {
            const isCurrentEntry = currentDose === dose;
            return (
              <button
                key={dose}
                onClick={() => onSave(date, dose)}
                className={`py-2.5 border rounded-[10px] text-[13px] font-medium text-center transition-colors ${
                  isCurrentEntry
                    ? 'bg-successBg border-primary text-primary'
                    : 'bg-screenBg border-borderLight text-textMain hover:border-primary'
                }`}
              >
                {dose}mg
              </button>
            );
          })}
        </div>

        {/* Mark as missed */}
        <button
          onClick={() => onSave(date, 0)}
          className="w-full py-[9px] border border-dangerBorder rounded-[10px] text-[13px] text-danger bg-dangerBg text-center hover:opacity-90 transition-opacity"
        >
          Mark as missed (✕)
        </button>
      </div>
    </div>
  );
};
