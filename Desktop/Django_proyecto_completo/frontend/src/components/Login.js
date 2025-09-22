import React, { useState } from "react";
import Register from "./Registro.js";
import "./Login.css";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showRegister, setShowRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch("http://127.0.0.1:8000/api/login/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("token", data.token);
      onLogin();
    } else {
      alert("Credenciales inválidas");
    }
  };

  const handleCancel = () => {
    setEmail("");
    setPassword("");
  };

  if (showRegister) {
    return <Register onBack={() => setShowRegister(false)} />;
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="welcome-header">
          <h1>¡Bienvenido!</h1>
          <p>Es bueno verte otra vez</p>
          <div className="store-name">florencia DRUGSTORE</div>
        </div>

        <div className="divider"></div>

        <h2>Iniciar sesión</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Usuario</label>
            <input
              type="email"
              placeholder="usuario@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="forgot-password">
            <a href="#forgot">¿Olvidaste la contraseña?</a>
          </div>

          <button type="submit" className="login-btn">Ingresar</button>
          <button type="button" onClick={handleCancel} className="cancel-btn">
            Cancelar
          </button>
        </form>

        <div className="register-link">
          <a href="#register" onClick={() => setShowRegister(true)}>
            ¿No tenes una cuenta? Registrate
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;