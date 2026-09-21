// src/views/Login.jsx
import { useState } from 'react';
import { loginUser } from '../services/api';
import './Login.css';

export default function Login({ onLoginSuccess, onSwitchToRegister }) { // <-- Asegúrate de recibir esta prop aquí
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginUser({ email, password, role });
      // Llamamos a la función que viene desde App.jsx pasándole los datos del usuario
      onLoginSuccess(data); 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left-panel">
        <div className="brand-content">
          <h1>Mandaditos<br />Comunitarios</h1>
          <img src="/scooter-illustration.png" alt="Mandaditos" className="left-illustration" />
        </div>
      </div>

      <div className="login-right-panel">
        <div className="form-card">
          <h2>Iniciar Sesión</h2>
          {error && <p className="error-message">{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Correo Electrónico</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="input-group">
              <label>Contraseña</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>

            <div className="role-selector">
              <button 
                type="button" 
                className={`role-btn ${role === 'client' ? 'active' : ''}`}
                onClick={() => setRole('client')}
              >
                👤 Cliente
              </button>
              <button 
                type="button" 
                className={`role-btn ${role === 'driver' ? 'active' : ''}`}
                onClick={() => setRole('driver')}
              >
                🛵 Repartidor
              </button>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Enlace conectado correctamente para cambiar al registro */}
          <p className="register-link">
            ¿No tienes cuenta? <a href="#register" onClick={(e) => { e.preventDefault(); onSwitchToRegister(); }}>Regístrate aquí</a>
          </p>

          <div className="powered-by">
            <span>⚡ Powered by Netlify</span>
          </div>
        </div>
      </div>
    </div>
  );
}