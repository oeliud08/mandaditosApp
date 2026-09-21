// src/App.jsx
import { useState } from 'react';
import Login from './views/Login';
import Register from './views/Register';
import ClientDashboard from './views/ClientDashboard';
import DriverDashboard from './views/DriverDashboard';

export default function App() {
  const [user, setUser] = useState(null); // Almacena los datos del usuario logueado
  const [currentView, setCurrentView] = useState('login'); // 'login', 'register', 'client-dashboard'

  // Función que se ejecuta cuando el login es exitoso
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    
    // Verificamos el rol para redirigir a su vista correspondiente
    if (userData.role === 'driver') {
      setCurrentView('driver-dashboard'); //mandamos el login a su panel
      
    } else {
      setCurrentView('client-dashboard');
    }
  };

  // Función para cerrar sesión
  const handleLogout = () => {
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
        <Register 
          onSwitchToLogin={() => setCurrentView('login')} 
        />
      )}

      {currentView === 'client-dashboard' && (
        <ClientDashboard 
          user={user} 
          onLogout={handleLogout} 
        />
      )}

      {currentView === 'driver-dashboard' && (
        <DriverDashboard 
          user={user} 
          onLogout={handleLogout} 
        />
      )}
    </div>
  );
}