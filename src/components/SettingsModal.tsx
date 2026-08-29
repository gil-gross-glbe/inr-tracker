import React, { useState } from 'react';
import { PillSettings, TargetRange } from '../types';
import { X, Settings, LogOut, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SettingsModalProps {
  settings: PillSettings;
  targetRange: TargetRange;
  onSaveSettings: (settings: PillSettings) => Promise<void>;
  onSaveTargetRange: (range: TargetRange) => Promise<void>;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  targetRange,
  onSaveSettings,
  onSaveTargetRange,
  onClose,
}) => {
  const { user, logout } = useAuth();
  const [defaultDose, setDefaultDose] = useState<number>(settings.defaultDosePills || 1.0);
  const [pillsPerBottle, setPillsPerBottle] = useState<number>(settings.defaultPillsPerBottle || 30);
  const [minTarget, setMinTarget] = useState<number>(targetRange.min || 2.0);
  const [maxTarget, setMaxTarget] = useState<number>(targetRange.max || 3.0);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveSettings({
      ...settings,
      defaultDosePills: defaultDose,
      defaultPillsPerBottle: pillsPerBottle,
    });
    await onSaveTargetRange({
      min: minTarget,
      max: maxTarget,
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-[380px] bg-white rounded-2xl shadow-xl border border-borderLight overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-borderLight">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-screenBg text-textMain flex items-center justify-center border border-borderDark">
              <Settings size={18} />
            </div>
            <h2 className="text-[15px] font-semibold text-textMain">App Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-textMuted hover:text-textMain p-1 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
          {/* User Profile */}
          <div className="p-3 bg-screenBg rounded-xl border border-borderLight flex items-center justify-between">
            <div className="truncate mr-2">
              <div className="text-xs font-semibold text-textMain truncate">
                {user?.displayName || 'Logged In User'}
              </div>
              <div className="text-[11px] text-textMuted truncate">{user?.email}</div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="py-1 px-2.5 rounded-lg border border-dangerBorder bg-white text-danger hover:bg-dangerBg text-xs font-medium flex items-center gap-1 shrink-0 transition-colors"
            >
              <LogOut size={13} />
              <span>Log out</span>
            </button>
          </div>

          {/* Default Daily Dose */}
          <div>
            <label className="block text-xs font-medium text-textSub mb-1.5">
              Default Daily Dose
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '1 Pill', val: 1.0 },
                { label: '½ Pill', val: 0.5 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setDefaultDose(opt.val)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                    defaultDose === opt.val
                      ? 'bg-primary border-primary text-white shadow-sm'
                      : 'border-borderDark text-textMain hover:bg-screenBg'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Default Bottle Capacity */}
          <div>
            <label className="block text-xs font-medium text-textSub mb-1.5">
              Default Bottle Size (Pills per Bottle)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[30, 60, 100].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setPillsPerBottle(size)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border transition-all ${
                    pillsPerBottle === size
                      ? 'bg-primary border-primary text-white shadow-sm'
                      : 'border-borderDark text-textMain hover:bg-screenBg'
                  }`}
                >
                  {size} Pills
                </button>
              ))}
            </div>
          </div>

          {/* INR Target Range */}
          <div>
            <label className="block text-xs font-medium text-textSub mb-1.5">
              INR Target Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-textMuted block mb-1">Target Minimum</span>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={minTarget}
                  onChange={(e) => setMinTarget(parseFloat(e.target.value))}
                  className="w-full py-2 px-3 border border-borderDark rounded-xl text-sm bg-white text-textMain focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <span className="text-[11px] text-textMuted block mb-1">Target Maximum</span>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={maxTarget}
                  onChange={(e) => setMaxTarget(parseFloat(e.target.value))}
                  className="w-full py-2 px-3 border border-borderDark rounded-xl text-sm bg-white text-textMain focus:outline-none focus:border-primary"
                  required
                />
              </div>
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
              className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-95 transition-all flex items-center justify-center gap-1"
            >
              {isSaved ? (
                <>
                  <Check size={14} />
                  <span>Saved!</span>
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
