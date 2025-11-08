import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './components/AuthPage';
import Sidenav from './components/Sidenav';
import Home from './pages/Home';
import Sessions from './pages/Sessions';
import Requests from './pages/Requests';
import Users from './pages/Users';
import Calendar from './pages/Calendar';
import SessionDetail from './pages/SessionDetail';

function App() {
  const { user, profile, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#27A4F6]/30 border-t-[#27A4F6] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#AFB6D2]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleSessionClick = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleCloseSessionDetail = () => {
    setSelectedSessionId(null);
  };

  const renderContent = () => {
    switch (currentPath) {
      case '/sessions':
        return <Sessions onSessionClick={handleSessionClick} />;
      case '/requests':
        return <Requests />;
      case '/calendar':
        return <Calendar />;
      case '/users':
        return <Users />;
      case '/':
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex">
      <Sidenav activePath={currentPath} onNavigate={setCurrentPath} />

      <main className="flex-1 lg:ml-64 p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {selectedSessionId && (
        <SessionDetail
          sessionId={selectedSessionId}
          onClose={handleCloseSessionDetail}
        />
      )}
    </div>
  );
}

export default App;
