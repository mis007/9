import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import TourGuide from './components/TourGuide';
import AdminSubmissionForm from './components/AdminSubmissionForm';
import WelcomeModal from './components/WelcomeModal'; // Import new component
import { Spinner } from './components/common/Spinner';
import { useGeolocation } from './hooks/useGeolocation';

const App: React.FC = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false); // State for welcome modal

  const { coordinates, loading: geoLoading, error: geoError } = useGeolocation();

  useEffect(() => {
    const storedUserId = localStorage.getItem("village_user_id");
    if (storedUserId) {
      setUserId(storedUserId);
    }
    setTimeout(() => setIsAppLoading(false), 500);
  }, []);

  const handleLogin = useCallback((newUserId: string) => {
    localStorage.setItem("village_user_id", newUserId);
    setUserId(newUserId);
    
    // Check if we should show the welcome modal (once per day logic)
    const lastVisitDate = localStorage.getItem("last_visit_date");
    const today = new Date().toDateString();

    if (lastVisitDate !== today) {
        setShowWelcome(true);
        localStorage.setItem("last_visit_date", today);
    }
  }, []);

  const handleLogout = useCallback(() => {
    if (window.confirm("确定要退出登录吗？")) {
      localStorage.removeItem("village_user_id");
      setUserId(null);
    }
  }, []);

  if (isAppLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-stone-50">
        <Spinner />
      </div>
    );
  }

  if (showAdminForm) {
    return <AdminSubmissionForm onBack={() => setShowAdminForm(false)} />;
  }

  return (
    <div className="w-full min-h-screen font-brand text-stone-800">
      {showWelcome && (
          <WelcomeModal onClose={() => setShowWelcome(false)} />
      )}

      {userId ? (
        <TourGuide
          userId={userId}
          onLogout={handleLogout}
          coordinates={coordinates}
          geoLoading={geoLoading}
          geoError={geoError}
        />
      ) : (
        <Login
          onLogin={handleLogin}
          onAdminClick={() => setShowAdminForm(true)}
          geoLoading={geoLoading}
          geoError={geoError}
        />
      )}
    </div>
  );
};

export default App;