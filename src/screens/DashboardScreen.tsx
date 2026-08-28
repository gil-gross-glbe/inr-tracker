import React, { useState, useCallback } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { PillLogEntry, INRResult, BottleState } from '../types';
import {
  getTodayDateString,
  createPillEntry,
  calculateBottleRemaining,
  getEntryPills,
} from '../utils/pillLog';
import { TodayDoseCard } from '../components/TodayDoseCard';
import { BottleCard } from '../components/BottleCard';
import { INRQuickCard } from '../components/INRQuickCard';
import { PillCalendar } from '../components/PillCalendar';
import { MonthlyStats } from '../components/MonthlyStats';
import { BottleModal } from '../components/BottleModal';
import { INRLogModal } from '../components/INRLogModal';
import { EditDayModal } from '../components/EditDayModal';
import { SettingsModal } from '../components/SettingsModal';
import { Settings } from 'lucide-react';

export const DashboardScreen: React.FC = () => {
  const {
    pillLog,
    savePillLog,
    inrResults,
    saveINRResults,
    settings,
    saveSettings,
    bottleState,
    saveBottleState,
    targetRange,
    saveTargetRange,
    isLoading,
  } = useDataContext();

  // Modals state
  const [bottleModalMode, setBottleModalMode] = useState<'new' | 'adjust' | null>(null);
  const [showINRModal, setShowINRModal] = useState(false);
  const [editingINRResult, setEditingINRResult] = useState<INRResult | null>(null);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Month navigation sync
  const now = new Date();
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth());
  const [calendarYear, setCalendarYear] = useState(now.getFullYear());

  const handleMonthChange = useCallback((year: number, month: number) => {
    setCalendarYear(year);
    setCalendarMonth(month);
  }, []);

  if (isLoading || !settings) {
    return (
      <div className="p-8 bg-screenBg min-h-[calc(100vh-60px)] flex flex-col justify-center items-center gap-3">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent flex items-center justify-center rounded-full animate-spin" />
        <span className="text-xs text-textMuted font-medium">Loading your health data...</span>
      </div>
    );
  }

  const todayStr = getTodayDateString();
  const todayEntry = pillLog.find((e: PillLogEntry) => e.date === todayStr);

  // Bottle remaining calculation
  const { remaining: remainingPills, taken: totalTakenSinceOpen } = calculateBottleRemaining(
    bottleState,
    pillLog
  );

  // Dose actions
  const handleTakeDose = async (pills: number) => {
    const entry = createPillEntry(todayStr, pills, true);
    await savePillLog([entry]);
  };

  const handleSaveDayEdit = async (date: string, pills: number) => {
    const entry = createPillEntry(date, pills, true);
    await savePillLog([entry]);
    setEditingDate(null);
  };

  // Bottle actions
  const handleSaveBottle = async (newBottle: BottleState) => {
    await saveBottleState(newBottle);
  };

  // INR actions
  const handleSaveINR = async (result: INRResult) => {
    await saveINRResults([result]);
    setEditingINRResult(null);
  };

  const handleDeleteINR = async (id: string) => {
    const remaining = inrResults.filter((r) => r.id !== id);
    // Overwrite with remaining
    await saveINRResults(remaining);
    setEditingINRResult(null);
  };

  // Editing day entry lookup
  const editingDayEntry = editingDate
    ? pillLog.find((e: PillLogEntry) => e.date === editingDate)
    : null;

  return (
    <div className="min-h-screen bg-screenBg flex flex-col">
      {/* Refined Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-borderLight px-4 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-xs">
            💊
          </div>
          <div>
            <h1 className="text-sm font-bold text-textMain leading-tight">INR Tracker</h1>
            <span className="text-[10px] text-textMuted font-medium block">Daily Pill & Lab Monitor</span>
          </div>
        </div>

        <button
          onClick={() => setShowSettings(true)}
          className="w-8 h-8 rounded-xl border border-borderDark bg-screenBg text-textSub flex items-center justify-center hover:bg-gray-100 hover:text-textMain active:scale-95 transition-all"
          title="Settings"
        >
          <Settings size={16} />
        </button>
      </header>

      {/* Main Single Screen Feed */}
      <main className="flex-1 p-3.5 sm:p-4 max-w-md mx-auto w-full space-y-3 pb-12">
        {/* 1. Today's Dose Card */}
        <TodayDoseCard
          todayEntry={todayEntry}
          defaultPills={settings.defaultDosePills || 1.0}
          onTakeDose={handleTakeDose}
          onEditDose={() => setEditingDate(todayStr)}
        />

        {/* 2. Bottle Inventory Tracker */}
        <BottleCard
          bottleState={bottleState}
          remainingPills={remainingPills}
          totalTakenSinceOpen={totalTakenSinceOpen}
          onOpenNewBottle={() => setBottleModalMode('new')}
          onAdjustCount={() => setBottleModalMode('adjust')}
        />

        {/* 3. INR Lab Quick Status Card */}
        <INRQuickCard
          inrResults={inrResults}
          targetRange={targetRange}
          onLogINR={() => {
            setEditingINRResult(null);
            setShowINRModal(true);
          }}
          onEditINR={(res) => {
            setEditingINRResult(res);
            setShowINRModal(true);
          }}
        />

        {/* 4. Monthly Performance Stats */}
        <MonthlyStats
          pillLog={pillLog}
          month={calendarMonth}
          year={calendarYear}
        />

        {/* 5. Interactive Calendar */}
        <PillCalendar
          pillLog={pillLog}
          inrResults={inrResults}
          onDayPress={setEditingDate}
          onMonthChange={handleMonthChange}
        />
      </main>

      {/* Modals */}
      {bottleModalMode && (
        <BottleModal
          mode={bottleModalMode}
          currentBottle={bottleState}
          currentRemaining={remainingPills}
          onSave={handleSaveBottle}
          onClose={() => setBottleModalMode(null)}
        />
      )}

      {showINRModal && (
        <INRLogModal
          initialResult={editingINRResult}
          targetRange={targetRange}
          onSave={handleSaveINR}
          onDelete={handleDeleteINR}
          onClose={() => {
            setShowINRModal(false);
            setEditingINRResult(null);
          }}
        />
      )}

      {editingDate && (
        <EditDayModal
          date={editingDate}
          currentPillDose={editingDayEntry ? getEntryPills(editingDayEntry) : null}
          onSave={handleSaveDayEdit}
          onClose={() => setEditingDate(null)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          targetRange={targetRange}
          onSaveSettings={saveSettings}
          onSaveTargetRange={saveTargetRange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};
