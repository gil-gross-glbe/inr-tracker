import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../config/firebase';
import { doc, collection, setDoc, writeBatch, onSnapshot, query, where, type Unsubscribe } from 'firebase/firestore';
import {
  DEFAULT_SETTINGS,
  DEFAULT_TARGET_RANGE,
  DEFAULT_BOTTLE_STATE,
  loadPillLog,
  loadINRResults,
  loadSettings,
  loadBottleState,
  loadTargetRange,
} from '../utils/localStorage';

interface DataContextType {
  pillLog: PillLogEntry[];
  inrResults: INRResult[];
  settings: PillSettings;
  bottleState: BottleState;
  targetRange: TargetRange;
  isLoading: boolean;
  savePillLog: (entries: PillLogEntry[]) => Promise<void>;
  saveINRResults: (results: INRResult[]) => Promise<void>;
  saveSettings: (pillSettings: PillSettings) => Promise<void>;
  saveBottleState: (bottleState: BottleState) => Promise<void>;
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
    if (user.uid === 'guest_user') {
      setPillLog(loadPillLog());
      setPillLogLoading(false);
      return;
    }
    setPillLogLoading(true);
    const sixMonthsAgo = Date.now() - (180 * 24 * 60 * 60 * 1000);
    pillLogUnsub.current = onSnapshot(
      query(
        collection(db, `users/${user.uid}/pillLogs`),
        where('takenTimestamp', '>=', sixMonthsAgo)
      ),
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
    let updated: PillLogEntry[] = [];
    setPillLog(prev => {
      const dateSet = new Set(entries.map(e => e.date));
      updated = [...prev.filter(e => !dateSet.has(e.date)), ...entries]
        .sort((a, b) => b.takenTimestamp - a.takenTimestamp);
      return updated;
    });

    if (!user) return;
    if (user.uid === 'guest_user') {
      localStorage.setItem('pill_log', JSON.stringify(updated));
      return;
    }
    
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
    if (user.uid === 'guest_user') {
      setInrResults(loadINRResults());
      setInrResultsLoading(false);
      return;
    }
    setInrResultsLoading(true);
    const sixMonthsAgo = Date.now() - (180 * 24 * 60 * 60 * 1000);
    inrResultsUnsub.current = onSnapshot(
      query(
        collection(db, `users/${user.uid}/inrResults`),
        where('createdAt', '>=', sixMonthsAgo)
      ),
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
    let updated: INRResult[] = [];
    setInrResults(prev => {
      const idSet = new Set(results.map(r => r.id));
      updated = [...prev.filter(r => !idSet.has(r.id)), ...results]
        .sort((a, b) => a.createdAt - b.createdAt);
      return updated;
    });

    if (!user) return;
    if (user.uid === 'guest_user') {
      localStorage.setItem('inr_results', JSON.stringify(updated));
      return;
    }
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

  // ----- Settings & Bottle State -----
  const [settings, setSettingsState] = useState<PillSettings>(DEFAULT_SETTINGS);
  const [bottleState, setBottleState] = useState<BottleState>(DEFAULT_BOTTLE_STATE);
  const [targetRange, setTargetRangeState] = useState<TargetRange>(DEFAULT_TARGET_RANGE);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const settingsUnsub = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!user) {
      setSettingsState(DEFAULT_SETTINGS);
      setBottleState(DEFAULT_BOTTLE_STATE);
      setTargetRangeState(DEFAULT_TARGET_RANGE);
      setSettingsLoading(false);
      return;
    }
    if (user.uid === 'guest_user') {
      setSettingsState(loadSettings());
      setBottleState(loadBottleState());
      setTargetRangeState(loadTargetRange());
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
          if (data.bottleState) setBottleState(data.bottleState as BottleState);
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
    setSettingsState(pillSettings);
    if (!user) return;
    if (user.uid === 'guest_user') {
      localStorage.setItem('pill_settings', JSON.stringify(pillSettings));
      return;
    }
    try {
      await setDoc(doc(db, `users/${user.uid}/settings`, 'appSettings'), { pillSettings }, { merge: true });
    } catch (e) { console.error('Firebase write error', e); }
  }, [user]);

  const saveBottleState = useCallback(async (newBottleState: BottleState): Promise<void> => {
    setBottleState(newBottleState);
    if (!user) return;
    if (user.uid === 'guest_user') {
      localStorage.setItem('bottle_state', JSON.stringify(newBottleState));
      return;
    }
    try {
      await setDoc(doc(db, `users/${user.uid}/settings`, 'appSettings'), { bottleState: newBottleState }, { merge: true });
    } catch (e) { console.error('Firebase write error', e); }
  }, [user]);

  const saveTargetRange = useCallback(async (range: TargetRange): Promise<void> => {
    setTargetRangeState(range);
    if (!user) return;
    if (user.uid === 'guest_user') {
      localStorage.setItem('inr_target_range', JSON.stringify(range));
      return;
    }
    try {
      await setDoc(doc(db, `users/${user.uid}/settings`, 'appSettings'), { targetRange: range }, { merge: true });
    } catch (e) { console.error('Firebase write error', e); }
  }, [user]);

  const isLoading = pillLogLoading || inrResultsLoading || settingsLoading;

  const contextValue = useMemo(() => ({
    pillLog, inrResults, settings, bottleState, targetRange, isLoading,
    savePillLog, saveINRResults, saveSettings, saveBottleState, saveTargetRange
  }), [pillLog, inrResults, settings, bottleState, targetRange, isLoading,
       savePillLog, saveINRResults, saveSettings, saveBottleState, saveTargetRange]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

