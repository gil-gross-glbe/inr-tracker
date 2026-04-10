import { useState } from 'react';
import { TabBar } from './components/Shared';
import { PillScreen } from './screens/PillScreen';
import { INRScreen } from './screens/INRScreen';
import { PredictScreen } from './screens/PredictScreen';
import { LoginScreen } from './screens/LoginScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { LogOut } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'pill' | 'inr' | 'predict'>('pill');
  const { user, logout } = useAuth();

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-grayBg font-sans md:py-8 flex justify-center">
      <div className="w-full max-w-[430px] bg-white relative shadow-2xl h-full md:min-h-[800px] border-x border-borderLight flex flex-col md:rounded-3xl overflow-hidden">
        
        <div className="bg-screenBg text-center py-2 text-xs font-medium text-textMain border-b border-borderLight flex justify-between items-center px-4 shrink-0">
          <span>9:41</span>
          <button onClick={logout} className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors">
            <span className="font-semibold">{user.displayName?.split(' ')[0] || 'User'}</span>
            <LogOut size={14} />
          </button>
        </div>

        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex-1 overflow-y-auto w-full bg-screenBg relative">
          {activeTab === 'pill' && <PillScreen />}
          {activeTab === 'inr' && <INRScreen />}
          {activeTab === 'predict' && <PredictScreen />}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
