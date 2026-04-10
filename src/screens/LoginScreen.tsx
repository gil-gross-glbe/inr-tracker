import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Activity, ShieldCheck, CloudLightning, ActivitySquare, AlertCircle } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (error: unknown) {
      console.error('Failed to sign in', error);
      // Map Firebase error codes to user-friendly messages
      const err = error as { code?: string };
      const code = err?.code || '';
      if (code === 'auth/network-request-failed') {
        setError('Network error. Check your connection and try again.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a moment and try again.');
      } else if (code === 'auth/user-disabled') {
        setError('This account has been disabled.');
      } else {
        setError('Sign-in failed. Please try again.');
      }
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-6 text-white overflow-hidden relative">
      <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-blue-500/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[100px]" />
      
      <div className="w-full max-w-md z-10 flex flex-col items-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-8 border border-white/10">
          <ActivitySquare size={40} className="text-white" />
        </div>
        
        <h1 className="text-4xl font-bold mb-2 tracking-tight text-center">Coumadin<span className="text-blue-400">Tracker</span></h1>
        <p className="text-slate-400 mb-10 text-center text-lg">Your health data, securely synced.</p>

        <div className="w-full bg-slate-800/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl mb-8 flex flex-col items-center">
          {error && (
            <div className="w-full mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2">
              <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full py-4 px-6 bg-white text-slate-900 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 shadow-xl shadow-white/10"
          >
            {isLoggingIn ? (
              <Activity className="animate-spin text-slate-600" size={24} />
            ) : (
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
            )}
            {isLoggingIn ? 'Connecting securely...' : 'Sign in with Google'}
          </button>
        </div>

        <div className="flex w-full justify-between items-center text-sm text-slate-500 mt-4 px-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-500/70" />
            <span>Bank-level Security</span>
          </div>
          <div className="flex items-center gap-2">
            <CloudLightning size={16} className="text-blue-400/70" />
            <span>Instant Sync</span>
          </div>
        </div>
      </div>
    </div>
  );
};
