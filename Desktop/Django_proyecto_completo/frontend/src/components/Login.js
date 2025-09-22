// Login.js
import React, { useState } from "react";
import "./Login.css"; 

function Login({ onLogin, onRegistro }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

  // FLORENCIA DRUGSTORE IZQUIERDA
  return (
    <div className="login-page">
      {/* Columna izquierda */}
      <div className="login-left">
        <h1>florencia</h1>
        <h2>DRUGSTORE</h2>
      </div>

      {/* Columna derecha */}
      <div className="login-right">
        <div className="login-card">
          <h2>Iniciar Sesión</h2>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <span>📧</span>
              <input
                type="email"
                placeholder="usuario@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <span>🔒</span>
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-btn">Ingresar</button>
          </form>

          <div className="login-links">
            <a href="#forgot">¿Olvidaste tu contraseña?</a>
            <br />
            <a href="#register" onClick={onRegistro}>
              ¿No estás registrado? Crear cuenta
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
