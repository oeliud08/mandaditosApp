// src/views/Register.jsx
import { useState } from "react";
import { registerUser } from "../services/api";
import "./Login.css"; // Shared styles with Login

const EMAIL_REGEX = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

export default function Register({ onSwitchToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("client");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    if (/\s/.test(cleanEmail) || !EMAIL_REGEX.test(cleanEmail)) {
      setError(
        "Introduce un correo válido, sin espacios (ej. tu.correo@dominio.com).",
      );
      return;
    }
    if (!cleanUsername) {
      setError("Elige un nombre de usuario.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        username: cleanUsername,
        email: cleanEmail,
        password,
        role,
      });
      setSuccess("¡Registro exitoso! Ya puedes iniciar sesión.");
      setTimeout(onSwitchToLogin, 2000);
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
          <h2 className="brand-title">
            Rider<span style={{ color: "#10B981" }}>Link</span>{" "}
            <span style={{ color: "#F59E0B" }}>MX</span>
          </h2>
          <p className="tagline">
            La red de mandaditos de tu colonia: sin comisiones, trato directo y
            pago directo.
          </p>
          <h2 style={{ fontSize: "2rem" }}>Crear Cuenta</h2>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <div className="dark-box">
            <div
              className={`role-slider ${role === "driver" ? "slider-repa" : "slider-cliente"}`}
            />
            <div className="role-selector">
              <button
                type="button"
                className={`role-btn ${role === "driver" ? "active" : ""}`}
                onClick={() => setRole("driver")}
              >
                🛵 Repartidor
              </button>
              <button
                type="button"
                className={`role-btn ${role === "client" ? "active" : ""}`}
                onClick={() => setRole("client")}
              >
                👤 Cliente
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Nombre de Usuario</label>
              <input
                placeholder="Ingresa tu nombre"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

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
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={loading || !!success}
            >
              {loading ? "Registrando..." : "Registrarse"}
            </button>
          </form>

          <p className="register-link">
            ¿Ya tienes cuenta?{" "}
            <a
              href="#login"
              onClick={(e) => {
                e.preventDefault();
                onSwitchToLogin();
              }}
            >
              Inicia sesión aquí
            </a>
          </p>

          <div className="powered-by">
            <span>
              Si el servidor tarda en responder, está despertando: en Render se
              duerme tras un rato sin uso. Dale unos segundos y reintenta.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
