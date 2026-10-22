// src/App.jsx
import { useState } from 'react';
import Login from './views/Login';
import Register from './views/Register';
import ClientDashboard from './views/ClientDashboard';
import DriverDashboard from './views/DriverDashboard';

const STORAGE_KEY = 'mandaditos_user';

function loadStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && parsed.id && (parsed.role === 'client' || parsed.role === 'driver') ? parsed : null;
  } catch {
    return null;
  }
}

function viewForUser(user) {
  if (!user) return 'login';
  return user.role === 'driver' ? 'driver-dashboard' : 'client-dashboard';
}

export default function App() {
  // Restore the session on refresh
  const [user, setUser] = useState(loadStoredUser);
  const [currentView, setCurrentView] = useState(() => viewForUser(loadStoredUser()));

  const handleLoginSuccess = (userData) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch {
      // Storage may be unavailable (private mode); the session just won't persist.
    }
    setUser(userData);
    setCurrentView(viewForUser(userData));
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setUser(null);
    setCurrentView('login');
  };

  return (
    <div>
      {currentView === 'login' && (
        <Login
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setCurrentView('register')}
        />
      )}

      {currentView === 'register' && (
        <Register onSwitchToLogin={() => setCurrentView('login')} />
      )}

      {currentView === 'client-dashboard' && (
        <ClientDashboard user={user} onLogout={handleLogout} />
      )}

      {currentView === 'driver-dashboard' && (
        <DriverDashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}
