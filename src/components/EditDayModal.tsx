import React, { useState } from 'react';
import { formatDayLong } from '../utils/calendarUtils';
import { X, Check } from 'lucide-react';

interface EditDayModalProps {
  date: string; // YYYY-MM-DD
  currentPillDose: number | null; // e.g. 1, 0.5, 0
  onSave: (date: string, dosePills: number) => void;
  onClose: () => void;
}

export const EditDayModal: React.FC<EditDayModalProps> = ({
  date,
  currentPillDose,
  onSave,
  onClose,
}) => {
  const [customVal, setCustomVal] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const dayLabel = formatDayLong(date);

  const quickOptions = [
    { label: '1 Pill', val: 1.0, sub: 'Standard' },
    { label: '½ Pill', val: 0.5, sub: 'Half Dose' },
    { label: '1½ Pills', val: 1.5, sub: 'Extended' },
    { label: '2 Pills', val: 2.0, sub: 'Double' },
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(customVal);
    if (!isNaN(val) && val >= 0) {
      onSave(date, val);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center sm:justify-center p-0 sm:p-4 animate-in fade-in duration-150" 
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-borderLight animate-in slide-in-from-bottom-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-borderDark rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-textMain">{dayLabel}</h3>
            <p className="text-xs text-textMuted">Select dose taken for this day</p>
          </div>
          <button 
            onClick={onClose}
            className="text-textMuted hover:text-textMain p-1 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick dose selection cards */}
        {!isCustomMode ? (
          <div className="space-y-2 mb-3">
            <div className="grid grid-cols-2 gap-2">
              {quickOptions.map((opt) => {
                const isSelected = currentPillDose === opt.val;
                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => {
                      onSave(date, opt.val);
                      onClose();
                    }}
                    className={`py-3 px-3 rounded-xl border text-left flex flex-col justify-between transition-all active:scale-[0.98] ${
                      isSelected
                        ? 'bg-successBg border-primary text-primary ring-1 ring-primary'
                        : 'border-borderDark bg-white hover:bg-screenBg text-textMain'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-sm">{opt.label}</span>
                      {isSelected && <Check size={16} className="text-primary" />}
                    </div>
                    <span className="text-[11px] text-textMuted mt-0.5">{opt.sub}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onSave(date, 0);
                  onClose();
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                  currentPillDose === 0
                    ? 'bg-dangerBg border-danger text-danger font-semibold'
                    : 'border-borderDark text-danger hover:bg-dangerBg/50'
                }`}
              >
                Mark as Skipped (0)
              </button>
              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className="py-2.5 px-3 rounded-xl border border-borderDark text-textSub text-xs font-medium hover:bg-screenBg transition-colors"
              >
                Custom Dose
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-textSub mb-1">
                Enter Pill Amount (e.g. 0.25, 0.75, 1.25)
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                max="10"
                placeholder="Number of pills"
                value={customVal}
                onChange={(e) => setCustomVal(e.target.value)}
                className="w-full py-2 px-3 border border-borderDark rounded-xl text-sm bg-white text-textMain focus:outline-none focus:border-primary"
                autoFocus
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsCustomMode(false)}
                className="flex-1 py-2 px-3 rounded-xl border border-borderDark text-textSub text-xs font-medium hover:bg-screenBg"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-3 rounded-xl bg-primary text-white text-xs font-medium hover:opacity-95"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

