import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../config/firebase';
import { doc, collection, setDoc, writeBatch, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { PillLogEntry, PillSettings, INRResult, TargetRange } from '../types';
import { DEFAULT_SETTINGS, DEFAULT_TARGET_RANGE } from '../utils/localStorage';

interface DataContextType {
  pillLog: PillLogEntry[];
  inrResults: INRResult[];
  settings: PillSettings;
  targetRange: TargetRange;
  isLoading: boolean;
  savePillLog: (entries: PillLogEntry[]) => Promise<void>;
  saveINRResults: (results: INRResult[]) => Promise<void>;
  saveSettings: (pillSettings: PillSettings) => Promise<void>;
  saveTargetRange: (range: TargetRange) => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useDataContext = () => useContext(DataContext);

// eslint-disable-next-line react-refresh/only-export-components
export const DataContext = createContext<DataContextType>({} as DataContextType);

// Centralized provider that handles the Firebase listeners
export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // ----- Pill Logs -----
  const [pillLog, setPillLog] = useState<PillLogEntry[]>([]);
  const [pillLogLoading, setPillLogLoading] = useState(true);
  const pillLogUnsub = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!user) {
      setPillLog([]);
      setPillLogLoading(false);
      return;
    }
    setPillLogLoading(true);
    pillLogUnsub.current = onSnapshot(
      collection(db, `users/${user.uid}/pillLogs`),
      (snapshot) => {
        const entries = snapshot.docs
          .map((d) => d.data() as PillLogEntry)
          .sort((a, b) => b.takenTimestamp - a.takenTimestamp);
        setPillLog(entries);
        setPillLogLoading(false);
      },
      (error) => {
        console.error('Firestore pillLogs listener error', error);
        setPillLogLoading(false);
      }
    );
    return () => {
      pillLogUnsub.current?.();
    };
  }, [user]);

  const savePillLog = useCallback(async (entries: PillLogEntry[]): Promise<void> => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      entries.forEach((entry) => {
        const docRef = doc(db, `users/${user.uid}/pillLogs`, entry.date);
        batch.set(docRef, entry);
      });
      await batch.commit();
    } catch (e) {
      console.error('Firebase write error', e);
    }
  }, [user]);

  // ----- INR Results -----
  const [inrResults, setInrResults] = useState<INRResult[]>([]);
  const [inrResultsLoading, setInrResultsLoading] = useState(true);
  const inrResultsUnsub = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!user) {
      setInrResults([]);
      setInrResultsLoading(false);
      return;
    }
    setInrResultsLoading(true);
    inrResultsUnsub.current = onSnapshot(
      collection(db, `users/${user.uid}/inrResults`),
      (snapshot) => {
        const results = snapshot.docs
          .map((d) => d.data() as INRResult)
          .sort((a, b) => a.createdAt - b.createdAt);
        setInrResults(results);
        setInrResultsLoading(false);
      },
      (error) => {
        console.error('Firestore inrResults listener error', error);
        setInrResultsLoading(false);
      }
    );
    return () => {
      inrResultsUnsub.current?.();
    };
  }, [user]);

  const saveINRResults = useCallback(async (results: INRResult[]): Promise<void> => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      results.forEach((result) => {
        const docRef = doc(db, `users/${user.uid}/inrResults`, result.id);
        batch.set(docRef, result);
      });
      await batch.commit();
    } catch (e) {
      console.error('Firebase write error', e);
    }
  }, [user]);

  // ----- Settings -----
  const [settings, setSettingsState] = useState<PillSettings>(DEFAULT_SETTINGS);
  const [targetRange, setTargetRangeState] = useState<TargetRange>(DEFAULT_TARGET_RANGE);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const settingsUnsub = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!user) {
      setSettingsState(DEFAULT_SETTINGS);
      setTargetRangeState(DEFAULT_TARGET_RANGE);
      setSettingsLoading(false);
      return;
    }
    setSettingsLoading(true);
    settingsUnsub.current = onSnapshot(
      doc(db, `users/${user.uid}/settings`, 'appSettings'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.pillSettings) setSettingsState(data.pillSettings as PillSettings);
          if (data.targetRange) setTargetRangeState(data.targetRange as TargetRange);
        }
        setSettingsLoading(false);
      },
      (error) => {
        console.error('Firestore settings listener error', error);
        setSettingsLoading(false);
      }
    );
    return () => {
      settingsUnsub.current?.();
    };
  }, [user]);

  const saveSettings = useCallback(async (pillSettings: PillSettings): Promise<void> => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/settings`, 'appSettings'), { pillSettings }, { merge: true });
    } catch (e) { console.error('Firebase write error', e); }
  }, [user]);

  const saveTargetRange = useCallback(async (range: TargetRange): Promise<void> => {
    if (!user) return;
    try {
      await setDoc(doc(db, `users/${user.uid}/settings`, 'appSettings'), { targetRange: range }, { merge: true });
    } catch (e) { console.error('Firebase write error', e); }
  }, [user]);

  const isLoading = pillLogLoading || inrResultsLoading || settingsLoading;

  return (
    <DataContext.Provider value={{
      pillLog, inrResults, settings, targetRange, isLoading,
      savePillLog, saveINRResults, saveSettings, saveTargetRange
    }}>
      {children}
    </DataContext.Provider>
  );
};
