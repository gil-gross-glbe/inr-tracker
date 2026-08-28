import React, { useState, useCallback } from 'react';
import { PillSettings, PillLogEntry } from '../types';
import { useDataContext } from '../contexts/DataContext';
import { getTodayDateString, createPillEntry, parseDateLocal } from '../utils/pillLog';
import { Card, ButtonPrimary, ButtonSecondary, OutlinedButton, Input, Label } from '../components/Shared';
import { PillCalendar } from '../components/PillCalendar';
import { MonthlyStats } from '../components/MonthlyStats';
import { EditDayModal } from '../components/EditDayModal';
import { Settings as SettingsIcon } from 'lucide-react';

export const PillScreen: React.FC = () => {
  const { pillLog: log, savePillLog, settings, saveSettings, isLoading } = useDataContext();
  
  const [selectedDose, setSelectedDose] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);

  // Calendar month tracking (for syncing stats bar with calendar)
  const now = new Date();
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth());
  const [calendarYear, setCalendarYear] = useState(now.getFullYear());

  // All hooks MUST be above the early return
  const handleMonthChange = useCallback((year: number, month: number) => {
    setCalendarYear(year);
    setCalendarMonth(month);
  }, []);

  // Derive effective dose: user selection takes priority, otherwise fall back to default
  const effectiveDose = selectedDose ?? settings?.defaultDoseMg ?? 0;

  if (isLoading || !settings) {
    return (
      <div className="p-4 bg-screenBg min-h-[calc(100vh-60px)] pb-12 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent flex items-center justify-center rounded-full animate-spin" />
      </div>
    );
  }

  const todayStr = getTodayDateString();
  const todayEntry = log.find((e: PillLogEntry) => e.date === todayStr);
  const isTakenToday = !!todayEntry && todayEntry.doseMg > 0;

  const handleMarkTaken = async () => {
    const entry = createPillEntry(todayStr, effectiveDose);
    await savePillLog([entry]);
  };

  const handleSaveEdit = async (date: string, dose: number) => {
    const entry = createPillEntry(date, dose);
    await savePillLog([entry]);
    setEditingDate(null);
  };

  const handleSettingsChange = async (newSettings: PillSettings) => {
    await saveSettings(newSettings);
  };
  
  const todayObj = parseDateLocal(todayStr);
  const displayDate = todayObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Find the current dose for the editing date (for the modal)
  const editingEntry = editingDate ? log.find((e: PillLogEntry) => e.date === editingDate) : null;

  return (
    <div className="p-4 bg-screenBg min-h-[calc(100vh-60px)] pb-12">
      {/* Today status card */}
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
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${effectiveDose === dose ? 'bg-primary border-primary text-white' : 'border-borderDark text-textSub'}`}
                >
                  {dose}mg
                </button>
              ))}
            </div>
            <ButtonPrimary onClick={handleMarkTaken}>
              Mark as taken ({effectiveDose}mg)
            </ButtonPrimary>
          </>
        )}
      </Card>

      {/* Monthly stats bar */}
      <MonthlyStats pillLog={log} month={calendarMonth} year={calendarYear} />

      {/* Full calendar */}
      <PillCalendar
        pillLog={log}
        onDayPress={setEditingDate}
        onMonthChange={handleMonthChange}
      />
      
      {/* Settings toggle */}
      <OutlinedButton onClick={() => setShowSettings(!showSettings)} className="mb-3">
        <SettingsIcon size={14} /> Settings
      </OutlinedButton>
      
      {/* Settings panel */}
      {showSettings ? (
        <Card>
          <div className="text-[11px] font-medium text-textMuted uppercase tracking-wide mb-2">Settings</div>
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
      ) : null}

      {/* Edit day modal */}
      {editingDate ? (
        <EditDayModal
          date={editingDate}
          currentPillDose={editingEntry ? (editingEntry.dosePills ?? (editingEntry.doseMg <= 2.5 && editingEntry.doseMg > 0 ? 0.5 : 1)) : null}
          onSave={handleSaveEdit}
          onClose={() => setEditingDate(null)}
        />
      ) : null}
    </div>
  );
};
