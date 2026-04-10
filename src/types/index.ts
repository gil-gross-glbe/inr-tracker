export interface PillLogEntry {
  date: string; // YYYY-MM-DD
  takenAt: string; // HH:mm
  takenTimestamp: number;
  doseMg: number;
}

export interface PillSettings {
  availableStrengths: number[];
  defaultDoseMg: number;
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
