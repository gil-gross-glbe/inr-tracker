import { User } from 'firebase/auth';
import { db } from '../config/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { loadPillLog, loadINRResults, loadSettings, loadTargetRange, DEFAULT_SETTINGS, DEFAULT_TARGET_RANGE } from './localStorage';

export const runInitialMigration = async (user: User) => {
  const hasMigrated = localStorage.getItem('firebase_migrated');
  if (hasMigrated === 'true') return;

  const pillLogs = loadPillLog();
  const inrResults = loadINRResults();
  const settings = loadSettings();
  const targetRange = loadTargetRange();

  // If there's literally no data, no need to migrate
  if (pillLogs.length === 0 && inrResults.length === 0 && 
      JSON.stringify(settings) === JSON.stringify(DEFAULT_SETTINGS) &&
      JSON.stringify(targetRange) === JSON.stringify(DEFAULT_TARGET_RANGE)) {
    localStorage.setItem('firebase_migrated', 'true');
    return;
  }

  try {
    const batch = writeBatch(db);

    // Settings & Target Range
    const settingsRef = doc(db, `users/${user.uid}/settings`, 'appSettings');
    batch.set(settingsRef, {
      pillSettings: settings,
      targetRange: targetRange
    }, { merge: true });

    // Pill Logs
    pillLogs.forEach(entry => {
      const docRef = doc(db, `users/${user.uid}/pillLogs`, entry.date);
      batch.set(docRef, entry);
    });

    // INR Results
    inrResults.forEach(entry => {
      const docRef = doc(db, `users/${user.uid}/inrResults`, entry.id);
      batch.set(docRef, entry);
    });

    await batch.commit();

    // Mark as migrated
    localStorage.setItem('firebase_migrated', 'true');
    
    // Clear local storage data to free up space
    localStorage.removeItem('pill_log');
    localStorage.removeItem('inr_results');
    localStorage.removeItem('pill_settings');
    localStorage.removeItem('inr_target_range');

    console.log("Successfully migrated local data to Firebase");
  } catch (err) {
    console.error("Failed to migrate data to Firebase", err);
  }
};
