import React, { useState } from 'react';
import { INRResult, TargetRange } from '../types';
import { getTodayDateString } from '../utils/pillLog';
import { X, Droplet, Trash2 } from 'lucide-react';

interface INRLogModalProps {
  initialResult?: INRResult | null;
  targetRange: TargetRange;
  onSave: (result: INRResult) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
}

export const INRLogModal: React.FC<INRLogModalProps> = ({
  initialResult,
  targetRange,
  onSave,
  onDelete,
  onClose,
}) => {
  const [date, setDate] = useState(initialResult?.date || getTodayDateString());
  const [value, setValue] = useState(initialResult ? String(initialResult.value) : '');
  const [notes, setNotes] = useState(initialResult?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numVal = parseFloat(value);
  const isInRange = !isNaN(numVal) && numVal >= targetRange.min && numVal <= targetRange.max;
  const isHigh = !isNaN(numVal) && numVal > targetRange.max;
  const isLow = !isNaN(numVal) && numVal < targetRange.min;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(numVal) || numVal <= 0) return;

    setIsSubmitting(true);
    const result: INRResult = {
      id: initialResult?.id || `inr-${Date.now()}`,
      date,
      value: numVal,
      weeklyDoseMg: initialResult?.weeklyDoseMg || 0,
      weeklyDoseOverridden: initialResult?.weeklyDoseOverridden || false,
      notes: notes.trim() || undefined,
      createdAt: initialResult?.createdAt || Date.now(),
    };

    await onSave(result);
    setIsSubmitting(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!initialResult?.id || !onDelete) return;
    if (window.confirm('Are you sure you want to delete this INR test record?')) {
      setIsSubmitting(true);
      await onDelete(initialResult.id);
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-[380px] bg-white rounded-2xl shadow-xl border border-borderLight overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-borderLight">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-dangerBg text-danger flex items-center justify-center">
              <Droplet size={18} />
            </div>
            <h2 className="text-[15px] font-semibold text-textMain">
              {initialResult ? 'Edit INR Result' : 'Log INR Lab Test'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-textMuted hover:text-textMain p-1 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-textSub mb-1.5">
              Test Date
            </label>
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full py-2 px-3 border border-borderDark rounded-xl text-sm bg-white text-textMain focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="block text-xs font-medium text-textSub">
                INR Blood Result
              </label>
              <span className="text-[11px] text-textMuted">
                Target: {targetRange.min.toFixed(1)} – {targetRange.max.toFixed(1)}
              </span>
            </div>
            <div className="relative">
              <input 
                type="number"
                step="0.1"
                min="0.5"
                max="10"
                placeholder="e.g. 2.5"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full py-2.5 px-3 border border-borderDark rounded-xl text-base font-semibold bg-white text-textMain placeholder:font-normal placeholder:text-textMuted focus:outline-none focus:border-primary"
                required
                autoFocus
              />
              {!isNaN(numVal) && numVal > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isInRange && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-successBg text-success border border-pillTakenBorder/20">
                      In Target
                    </span>
                  )}
                  {isHigh && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-dangerBg text-danger border border-dangerBorder">
                      High
                    </span>
                  )}
                  {isLow && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-warningBg text-warning border border-warningBg">
                      Low
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-textSub mb-1.5">
              Notes (Optional)
            </label>
            <input 
              type="text"
              placeholder="e.g. Lab clinic test, dose adjusted"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full py-2 px-3 border border-borderDark rounded-xl text-xs bg-white text-textMain placeholder:text-textMuted focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex gap-2 pt-2">
            {initialResult && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-2.5 rounded-xl border border-dangerBorder text-danger hover:bg-dangerBg transition-colors"
                title="Delete Result"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 rounded-xl border border-borderDark text-textSub text-xs font-medium hover:bg-screenBg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isNaN(numVal) || numVal <= 0}
              className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-white text-xs font-medium hover:opacity-95 transition-opacity disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Result'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
