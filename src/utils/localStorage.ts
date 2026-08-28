import { PillLogEntry, PillSettings, INRResult, TargetRange, BottleState } from '../types';
import { getTodayDateString } from './pillLog';

const KEYS = {
  PILL_LOG: 'pill_log',
  PILL_SETTINGS: 'pill_settings',
  INR_RESULTS: 'inr_results',
  TARGET_RANGE: 'inr_target_range',
  REMINDER_TIME: 'reminder_time', // For backwards compatibility if needed
  BOTTLE_STATE: 'bottle_state',
};

export const DEFAULT_SETTINGS: PillSettings = {
  availableStrengths: [0.25, 0.5, 0.75, 1.0],
  defaultDoseMg: 0.5,
  defaultDosePills: 1.0,
  defaultPillsPerBottle: 30,
  reminderTime: '08:00',
};

export const DEFAULT_BOTTLE_STATE: BottleState = {
  openedDate: getTodayDateString(),
  initialCount: 30,
  adjustmentCount: 0,
  pillsPerBottle: 30,
};

export const DEFAULT_TARGET_RANGE: TargetRange = {
  min: 2.0,
  max: 3.0,
};

export const loadPillLog = (): PillLogEntry[] => {
  try {
    const data = localStorage.getItem(KEYS.PILL_LOG);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const loadSettings = (): PillSettings => {
  try {
    const data = localStorage.getItem(KEYS.PILL_SETTINGS);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const loadBottleState = (): BottleState => {
  try {
    const data = localStorage.getItem(KEYS.BOTTLE_STATE);
    return data ? JSON.parse(data) : DEFAULT_BOTTLE_STATE;
  } catch {
    return DEFAULT_BOTTLE_STATE;
  }
};

export const loadINRResults = (): INRResult[] => {
  try {
    const data = localStorage.getItem(KEYS.INR_RESULTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const loadTargetRange = (): TargetRange => {
  try {
    const data = localStorage.getItem(KEYS.TARGET_RANGE);
    return data ? JSON.parse(data) : DEFAULT_TARGET_RANGE;
  } catch {
    return DEFAULT_TARGET_RANGE;
  }
};

