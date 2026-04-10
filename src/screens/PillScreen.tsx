import React, { useState, useEffect } from 'react';
import { PillSettings } from '../types';
import { useDataContext } from '../contexts/DataContext';
import { getTodayDateString, getDayStatus, getPastNDays, createPillEntry, parseDateLocal } from '../utils/pillLog';
import { Card, CardTitle, ButtonPrimary, ButtonSecondary, OutlinedButton, Input, Label } from '../components/Shared';
import { Settings as SettingsIcon } from 'lucide-react';

export const PillScreen: React.FC = () => {
  const { pillLog: log, savePillLog, settings, saveSettings, isLoading } = useDataContext();
  
  const [selectedDose, setSelectedDose] = useState<number>(0);
  const [showSettings, setShowSettings] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);

  // Initialize selected dose when settings load
  useEffect(() => {
    if (settings && selectedDose === 0) {
      setSelectedDose(settings.defaultDoseMg);
    }
  }, [settings, selectedDose]);

  if (isLoading || !settings) {
    return (
      <div className="p-4 bg-screenBg min-h-[calc(100vh-60px)] pb-12 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent flex items-center justify-center rounded-full animate-spin" />
      </div>
    );
  }

  const todayStr = getTodayDateString();
  const todayEntry = log.find((e: import('../types').PillLogEntry) => e.date === todayStr);
  const isTakenToday = !!todayEntry && todayEntry.doseMg > 0;

  const handleMarkTaken = async () => {
    const entry = createPillEntry(todayStr, selectedDose);
    const newLog = log.filter((e: import('../types').PillLogEntry) => e.date !== todayStr);
    newLog.push(entry);
    await savePillLog(newLog);
  };

  const handleSaveEdit = async (date: string, dose: number) => {
    const newLog = log.filter((e: import('../types').PillLogEntry) => e.date !== date);
    newLog.push(createPillEntry(date, dose));
    await savePillLog(newLog);
    setEditingDate(null);
  };

  const handleSettingsChange = async (newSettings: PillSettings) => {
    await saveSettings(newSettings);
  };
  
  const todayObj = parseDateLocal(todayStr);
  const displayDate = todayObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="p-4 bg-screenBg min-h-[calc(100vh-60px)] pb-12">
      <Card className="flex flex-col items-center">
        <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center mb-2.5 transition-colors ${isTakenToday ? 'bg-pillTaken text-success text-[26px]' : 'bg-pillEmpty text-textMuted text-[26px] border-[0px] shadow-sm'}`}>
          💊
        </div>
        
        {isTakenToday ? (
          <>
            <div className="text-[15px] font-medium text-success mb-1">Taken today at {todayEntry.takenAt}</div>
            <div className="text-xs text-textMuted mb-3">{todayEntry.doseMg}mg &middot; {displayDate}</div>
            <ButtonSecondary onClick={() => setEditingDate(todayStr)}>Edit today's entry</ButtonSecondary>
          </>
        ) : (
          <>
            <div className="text-[15px] font-medium text-textMain mb-1">Have you taken your Coumadin today?</div>
            <div className="text-xs text-textMuted mb-3">{displayDate}</div>
            <div className="flex gap-1.5 mb-3 flex-wrap justify-center">
              {settings.availableStrengths.map((dose: number) => (
                <button 
                  key={dose}
                  onClick={() => setSelectedDose(dose)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${selectedDose === dose ? 'bg-primary border-primary text-white' : 'border-borderDark text-textSub'}`}
                >
                  {dose}mg
                </button>
              ))}
            </div>
            <ButtonPrimary onClick={handleMarkTaken}>
              Mark as taken ({selectedDose}mg)
            </ButtonPrimary>
          </>
        )}
      </Card>

      <Card>
        <CardTitle>Last 7 days</CardTitle>
        <div className="flex justify-between gap-1 mt-3">
          {getPastNDays(7).reverse().map((date: string) => {
            const status = getDayStatus(date, log, todayStr);
            const entry = log.find((e: import('../types').PillLogEntry) => e.date === date);
            const dObj = parseDateLocal(date);
            const dayName = dObj.toLocaleDateString('en-US', { weekday: 'short' });
            
            let dotClass = 'bg-pillEmpty border-borderDark text-textMuted';
            let dotChar = '?';
            
            if (status === 'taken') {
              dotClass = 'bg-successBg text-success border-transparent';
              dotChar = '✓';
            } else if (status === 'skipped' || status === 'missed') {
              dotClass = 'bg-dangerBg text-danger border-transparent';
              dotChar = '✕';
            }
            
            return (
              <div key={date} className="flex flex-col items-center flex-1 cursor-pointer" onClick={() => setEditingDate(date)}>
                <div className="text-[10px] text-textMuted mb-1">{dayName}</div>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] mb-1 font-medium border ${dotClass}`}>
                  {dotChar}
                </div>
                <div className="text-[9px] text-textMuted">{status === 'taken' ? entry?.doseMg : '—'}</div>
              </div>
            );
          })}
        </div>
        <div className="text-[10px] text-textMuted text-center mt-3">Tap any day to edit</div>
      </Card>
      
      <OutlinedButton onClick={() => setShowSettings(!showSettings)} className="mb-3">
        <SettingsIcon size={14} /> Settings
      </OutlinedButton>
      
      {showSettings && (
        <Card>
          <CardTitle>Settings</CardTitle>
          <div className="bg-screenBg rounded-lg p-3 mt-2 space-y-3">
            <div>
              <Label>Pill strengths available</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {settings.availableStrengths.map((d: number) => (
                   <span key={d} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary text-white border border-primary">{d}mg</span>
                ))}
              </div>
            </div>
            <div>
              <Label>Default dose</Label>
              <select 
                className="w-full py-1.5 px-2.5 border border-borderDark rounded-lg text-[13px] bg-white text-textMain focus:outline-none focus:border-primary"
                value={settings.defaultDoseMg}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleSettingsChange({ ...settings, defaultDoseMg: Number(e.target.value) })}
              >
                {settings.availableStrengths.map((d: number) => <option key={d} value={d}>{d}mg</option>)}
              </select>
            </div>
            <div>
              <Label rightText="(coming soon)">Daily reminder</Label>
              <Input type="time" value={settings.reminderTime} disabled />
            </div>
          </div>
        </Card>
      )}

      {editingDate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center sm:justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-4 pb-8 sm:pb-4 animate-in slide-in-from-bottom-4 shadow-lg">
            <div className="w-9 h-1 bg-borderDark rounded-full mx-auto mb-3 sm:hidden" />
            
            <div className="flex justify-between items-baseline mb-1">
              <h3 className="text-sm font-medium text-textMain">
                Edit — {parseDateLocal(editingDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
            </div>
            <p className="text-xs text-textMuted mb-3">Select dose taken, or mark as skipped</p>
            
            <div className="grid grid-cols-2 gap-2 mb-3">
              {settings.availableStrengths.map((dose: number) => {
                const activeDose = log.find((e: import('../types').PillLogEntry) => e.date === editingDate)?.doseMg;
                const isSavedDose = activeDose === dose || (!activeDose && dose === settings.defaultDoseMg);
                return (
                  <button 
                    key={dose} 
                    onClick={() => handleSaveEdit(editingDate, dose)}
                    className={`p-2.5 border rounded-[10px] text-[13px] font-medium text-center transition-colors ${isSavedDose ? 'bg-successBg text-primary border-primary' : 'bg-screenBg text-textMain border-borderLight hover:border-primary'}`}
                  >
                    {dose}mg
                  </button>
                );
              })}
            </div>
            
            <button onClick={() => handleSaveEdit(editingDate, 0)} className="w-full p-[9px] border border-dangerBorder rounded-[10px] text-[13px] text-danger bg-dangerBg text-center mb-2 box-border focus:outline-none hover:opacity-90 transition-opacity">
              Mark as skipped (✕)
            </button>
            <button onClick={() => setEditingDate(null)} className="w-full text-xs text-textMuted py-2 text-center hover:text-textMain">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
