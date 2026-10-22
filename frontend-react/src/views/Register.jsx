// src/views/Register.jsx
import { useState } from 'react';
import { registerUser } from '../services/api';
import './Login.css'; // Shared styles with Login

const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

export default function Register({ onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    if (/\s/.test(cleanEmail) || !EMAIL_REGEX.test(cleanEmail)) {
      setError('Introduce un correo válido, sin espacios (ej. tu.correo@dominio.com).');
      return;
    }
    if (!cleanUsername) {
      setError('Elige un nombre de usuario.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await registerUser({ username: cleanUsername, email: cleanEmail, password, role });
      setSuccess('¡Registro exitoso! Ya puedes iniciar sesión.');
      setTimeout(onSwitchToLogin, 2000);
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
          <img src="/scooter-illustration.jpg" alt="Mandaditos" className="left-illustration" />
        </div>
      </div>

      <div className="login-right-panel">
        <div className="form-card">
          <h2>Crear Cuenta</h2>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Nombre de Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

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
                minLength={6}
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

            <button type="submit" className="submit-btn" disabled={loading || !!success}>
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>

          <p className="register-link">
            ¿Ya tienes cuenta?{' '}
            <a href="#login" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}>
              Inicia sesión aquí
            </a>
          </p>

          <div className="powered-by">
            <span>⚡ Powered by Netlify</span>
          </div>
        </div>
      </div>
    </div>
  );
}
