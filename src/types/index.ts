export interface PillLogEntry {
  date: string; // YYYY-MM-DD
  takenAt: string; // HH:mm
  takenTimestamp: number;
  doseMg: number;
  dosePills?: number; // 1 = 1 pill, 0.5 = half pill, 0 = skipped
}

export interface BottleState {
  openedDate: string; // YYYY-MM-DD
  initialCount: number; // e.g. 30, 60, 100
  adjustmentCount: number; // +/- manual adjustments (e.g. lost/dropped pills)
  pillsPerBottle: number; // default capacity
}

export interface PillSettings {
  availableStrengths: number[];
  defaultDoseMg: number;
  defaultDosePills?: number; // default: 1
  defaultPillsPerBottle?: number; // default: 30
  reminderTime: string;
}

export interface INRResult {
  id: string; // uuid-or-timestamp
  date: string; // YYYY-MM-DD
  value: number;
  weeklyDoseMg: number;
  weeklyDoseOverridden: boolean;
  notes?: string;
  createdAt: number;
}

export interface TargetRange {
  min: number;
  max: number;
}
