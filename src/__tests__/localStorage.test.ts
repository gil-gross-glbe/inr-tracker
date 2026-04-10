// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  loadPillLog, savePillLog, 
  loadSettings, saveSettings, 
  loadINRResults, saveINRResults,
  DEFAULT_SETTINGS 
} from '../utils/localStorage';

describe('localStorage utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('savePillLog and loadPillLog round-trip correctly', () => {
    const data = [{ date: '2026-03-14', takenAt: '12:00', takenTimestamp: 123, doseMg: 0.5 }];
    savePillLog(data);
    expect(loadPillLog()).toEqual(data);
  });

  it('saveINRResults and loadINRResults round-trip correctly', () => {
    const data = [{ id: '1', date: '2026-03-14', value: 2.5, weeklyDoseMg: 5, weeklyDoseOverridden: false, createdAt: 1 }];
    saveINRResults(data);
    expect(loadINRResults()).toEqual(data);
  });

  it('saveSettings and loadSettings round-trip correctly', () => {
    const data = { availableStrengths: [1, 2], defaultDoseMg: 2, reminderTime: '09:00' };
    saveSettings(data);
    expect(loadSettings()).toEqual(data);
  });

  it('loadPillLog returns empty array when key does not exist', () => {
    expect(loadPillLog()).toEqual([]);
  });

  it('loadSettings returns default values when key does not exist', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('Corrupted localStorage value returns default without throwing', () => {
    localStorage.setItem('pill_settings', '{invalid-json');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
