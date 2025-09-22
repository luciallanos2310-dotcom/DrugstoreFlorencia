// Registro.js
import React, { useState } from "react";
import "./Registro.css";

function Registro({ onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const manejarEnvio = async (e) => {
    e.preventDefault();

    if (password !== confirmarPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    const respuesta = await fetch("http://127.0.0.1:8000/api/register/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: email, password }),
    });

    if (respuesta.ok) {
      alert("Usuario creado con éxito. Ahora puedes iniciar sesión.");
      onBack();
    } else {
      alert("Error al registrar usuario.");
    }
  };

  return (
    <div className="registro-page">
      {/* Columna izquierda */}
      <div className="registro-left">
        <h1>florencia</h1>
        <h2>DRUGSTORE</h2>
      </div>

      {/* Columna derecha */}
      <div className="registro-right">
        <div className="registro-card">
          <h2>Crear Cuenta</h2>

          <form onSubmit={manejarEnvio}>
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
                placeholder="Crea una contraseña segura"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <span>🔒</span>
              <input
                type="password"
                placeholder="Repite tu contraseña"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="registro-btn">Crear Cuenta</button>
            <button type="button" onClick={onBack} className="volver-btn">Volver</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Registro;

