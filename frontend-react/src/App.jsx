// src/App.jsx
import { useState } from 'react';
import Login from './views/Login';
import Register from './views/Register';
import ClientDashboard from './views/ClientDashboard';
import DriverDashboard from './views/DriverDashboard';
import { getStoredUser, storeUser, clearStoredUser } from './services/api';

function viewForUser(user) {
  if (!user) return 'login';
  return user.role === 'driver' ? 'driver-dashboard' : 'client-dashboard';
}

export default function App() {
  // Restore the session on refresh
  const [user, setUser] = useState(getStoredUser);
  const [currentView, setCurrentView] = useState(() => viewForUser(getStoredUser()));

  const handleLoginSuccess = (userData) => {
    storeUser(userData); // includes the login token
    setUser(userData);
    setCurrentView(viewForUser(userData));
  };

  const handleLogout = () => {
    clearStoredUser();
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
