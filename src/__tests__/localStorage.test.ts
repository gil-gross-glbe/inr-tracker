// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  loadPillLog,
  loadSettings,
  loadINRResults,
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

  it('loadPillLog reads stored data correctly', () => {
    const data = [{ date: '2026-03-14', takenAt: '12:00', takenTimestamp: 123, doseMg: 0.5 }];
    localStorage.setItem('pill_log', JSON.stringify(data));
    expect(loadPillLog()).toEqual(data);
  });

  it('loadINRResults reads stored data correctly', () => {
    const data = [{ id: '1', date: '2026-03-14', value: 2.5, weeklyDoseMg: 5, weeklyDoseOverridden: false, createdAt: 1 }];
    localStorage.setItem('inr_results', JSON.stringify(data));
    expect(loadINRResults()).toEqual(data);
  });

  it('loadSettings reads stored data correctly', () => {
    const data = { availableStrengths: [1, 2], defaultDoseMg: 2, reminderTime: '09:00' };
    localStorage.setItem('pill_settings', JSON.stringify(data));
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
