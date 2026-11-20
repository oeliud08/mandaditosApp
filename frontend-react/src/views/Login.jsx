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
      <div className="login-panel">
        <div className="form-card">
          <h1>🛵</h1>
          <h2>Rider<span style={{color: "#10B981"}}>Link</span> <span style={{color: "#F59E0B"}}>MX</span></h2>
          <p className="tagline">La red de mandaditos de tu colonia: sin comisiones, trato directo y pago directo.</p>
          {error && <p className="error-message">{error}</p>}

          <div className="dark-box">
            <div className={`role-slider ${role === 'driver' ? 'slider-repa' : 'slider-cliente'}`} />
            <div className="role-selector">
              <button 
                type="button" 
                className={`role-btn ${role === 'driver' ? 'active' : ''}`}
                //onClick={() => setRole('driver')}
                onClick={() => { console.log('clicked Repa'); setRole('driver'); }}
              >
                🛵 Repa
              </button>
              <button 
                type="button" 
                className={`role-btn ${role === 'client' ? 'active' : ''}`}
                onClick={() => setRole('client')}
              >
                🛍️ Cliente
              </button>
            </div>
          </div> 

          <p className="role-note">Cada cuenta tiene un solo rol: entra con el rol con el que te registraste.</p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Correo Electrónico</label>
              <input 
                placeholder="tucorreo@ejemplo.com"
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="input-group">
              <label>Contraseña</label>
              <input 
                placeholder="Tu contraseña"
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
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
            <span>Si el servidor tarda en responder, está despertando: en Render se duerme tras un rato sin uso. Dale unos segundos y reintenta.</span>
          </div>
        </div>
      </div>
    </div>
  );
}