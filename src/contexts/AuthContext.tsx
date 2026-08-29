import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { runInitialMigration } from '../utils/migrator';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

const MIGRATION_TIMEOUT_MS = 5000;



export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Handle redirect result on mount (fallback from signInWithRedirect)
  useEffect(() => {

    getRedirectResult(auth).catch(() => {
      // Redirect result is only present after a redirect flow — ignore otherwise
    });
  }, []);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Run migration with a timeout so the app never hangs
        try {
          await Promise.race([
            runInitialMigration(currentUser),
            new Promise<void>((_, reject) =>
              setTimeout(() => reject(new Error('Migration timeout')), MIGRATION_TIMEOUT_MS)
            ),
          ]);
        } catch (e) {
          console.warn('Data migration skipped or timed out:', e);
        }
      }
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: unknown) {
      // If popup was blocked or closed by COOP, fall back to redirect
      const err = error as { code?: string };
      if (
        err?.code === 'auth/popup-blocked' ||
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        console.warn('Popup failed, falling back to redirect flow');
        await signInWithRedirect(auth, provider);
      } else {
        throw error;
      }
    }
  }, []);

  const loginAsGuest = useCallback(() => {
    const guestUser = {
      uid: 'guest_user',
      displayName: 'Guest Demo',
      email: 'demo@inrtracker.app',
      emailVerified: true,
      isAnonymous: true,
    } as unknown as User;
    setUser(guestUser);
  }, []);

  const logout = useCallback(async () => {
    if (user?.uid === 'guest_user') {
      setUser(null);
      return;
    }
    await signOut(auth);
  }, [user]);

  const contextValue = useMemo(() => ({
    user, loading, signInWithGoogle, loginAsGuest, logout
  }), [user, loading, signInWithGoogle, loginAsGuest, logout]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center text-white">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6 border border-white/10 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        </div>
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
