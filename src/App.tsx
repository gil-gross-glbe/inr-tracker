import { DashboardScreen } from './screens/DashboardScreen';
import { LoginScreen } from './screens/LoginScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-grayBg font-sans md:py-6 flex justify-center">
      <div className="w-full max-w-[440px] bg-white relative shadow-2xl min-h-screen md:min-h-[840px] border-x border-borderLight flex flex-col md:rounded-3xl overflow-hidden">
        <DashboardScreen />
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

