import React, { useState } from 'react';
import { BottleState } from '../types';
import { getTodayDateString } from '../utils/pillLog';
import { X, PackageCheck, Sliders, AlertCircle } from 'lucide-react';

interface BottleModalProps {
  mode: 'new' | 'adjust';
  currentBottle: BottleState;
  currentRemaining: number;
  onSave: (newBottle: BottleState) => Promise<void>;
  onClose: () => void;
}

export const BottleModal: React.FC<BottleModalProps> = ({
  mode,
  currentBottle,
  currentRemaining,
  onSave,
  onClose,
}) => {
  const [openedDate, setOpenedDate] = useState(getTodayDateString());
  const [initialCount, setInitialCount] = useState<number>(currentBottle.pillsPerBottle || 30);
  const [customInitial, setCustomInitial] = useState('');
  const [adjustmentDelta, setAdjustmentDelta] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const presetSizes = [30, 60, 100];

  const handleOpenNewBottle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const count = customInitial ? Number(customInitial) : initialCount;
    const newBottle: BottleState = {
      openedDate,
      initialCount: count > 0 ? count : 30,
      adjustmentCount: 0,
      pillsPerBottle: count > 0 ? count : 30,
    };
    await onSave(newBottle);
    setIsSubmitting(false);
    onClose();
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const newBottle: BottleState = {
      ...currentBottle,
      adjustmentCount: (currentBottle.adjustmentCount || 0) + adjustmentDelta,
    };
    await onSave(newBottle);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-[380px] bg-white rounded-2xl shadow-xl border border-borderLight overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-borderLight">
          <div className="flex items-center gap-2">
            {mode === 'new' ? (
              <div className="w-8 h-8 rounded-full bg-successBg text-primary flex items-center justify-center">
                <PackageCheck size={18} />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-screenBg text-textMain flex items-center justify-center border border-borderDark">
                <Sliders size={18} />
              </div>
            )}
            <h2 className="text-[15px] font-semibold text-textMain">
              {mode === 'new' ? 'Open New Pill Bottle' : 'Adjust Bottle Count'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-textMuted hover:text-textMain p-1 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        {mode === 'new' ? (
          <form onSubmit={handleOpenNewBottle} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-textSub mb-1.5">
                Date Bottle Opened
              </label>
              <input 
                type="date"
                value={openedDate}
                onChange={(e) => setOpenedDate(e.target.value)}
                className="w-full py-2 px-3 border border-borderDark rounded-xl text-sm bg-white text-textMain focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-textSub mb-1.5">
                Pills in Bottle
              </label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {presetSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setInitialCount(size);
                      setCustomInitial('');
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border transition-all ${
                      initialCount === size && !customInitial
                        ? 'bg-primary border-primary text-white shadow-sm'
                        : 'border-borderDark text-textMain hover:bg-screenBg'
                    }`}
                  >
                    {size} Pills
                  </button>
                ))}
              </div>
              <input 
                type="number"
                min="1"
                step="1"
                placeholder="Or enter custom pill count..."
                value={customInitial}
                onChange={(e) => setCustomInitial(e.target.value)}
                className="w-full py-2 px-3 border border-borderDark rounded-xl text-sm bg-white text-textMain placeholder:text-textMuted focus:outline-none focus:border-primary"
              />
            </div>

            <div className="p-3 bg-screenBg rounded-xl text-xs text-textSub leading-relaxed flex items-start gap-2">
              <AlertCircle size={15} className="text-primary shrink-0 mt-0.5" />
              <span>
                Starting count will be set to <strong>{customInitial ? customInitial : initialCount} pills</strong> from {openedDate}. Doses taken since this date will automatically decrement this bottle.
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-3 rounded-xl border border-borderDark text-textSub text-xs font-medium hover:bg-screenBg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-white text-xs font-medium hover:opacity-95 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? 'Starting...' : 'Start Bottle'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSaveAdjustment} className="p-5 space-y-4">
            <div className="text-center py-3 bg-screenBg rounded-xl border border-borderLight">
              <div className="text-[11px] text-textMuted font-medium uppercase tracking-wider">Current Remaining</div>
              <div className="text-2xl font-bold text-textMain mt-0.5">{currentRemaining} pills</div>
              <div className="text-xs text-textSub mt-0.5">
                Adjusted: <span className="font-semibold text-primary">{Math.max(0, currentRemaining + adjustmentDelta)} pills</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-textSub mb-2 text-center">
                Manual Correction (dropped / lost / found pills)
              </label>
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustmentDelta(prev => prev - 1)}
                  className="w-10 h-10 rounded-xl border border-borderDark text-textMain font-semibold text-sm flex items-center justify-center hover:bg-screenBg active:scale-95 transition-all"
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentDelta(prev => prev - 0.5)}
                  className="w-10 h-10 rounded-xl border border-borderDark text-textMain font-medium text-xs flex items-center justify-center hover:bg-screenBg active:scale-95 transition-all"
                >
                  -½
                </button>
                <div className="w-14 text-center font-bold text-base text-primary">
                  {adjustmentDelta > 0 ? `+${adjustmentDelta}` : adjustmentDelta}
                </div>
                <button
                  type="button"
                  onClick={() => setAdjustmentDelta(prev => prev + 0.5)}
                  className="w-10 h-10 rounded-xl border border-borderDark text-textMain font-medium text-xs flex items-center justify-center hover:bg-screenBg active:scale-95 transition-all"
                >
                  +½
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentDelta(prev => prev + 1)}
                  className="w-10 h-10 rounded-xl border border-borderDark text-textMain font-semibold text-sm flex items-center justify-center hover:bg-screenBg active:scale-95 transition-all"
                >
                  +1
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-3 rounded-xl border border-borderDark text-textSub text-xs font-medium hover:bg-screenBg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || adjustmentDelta === 0}
                className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-white text-xs font-medium hover:opacity-95 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Apply Correction'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
