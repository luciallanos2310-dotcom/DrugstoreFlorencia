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
    <div className="contenedor-registro">
      <div className="tarjeta-registro">
        <div className="encabezado-registro">
          <h1>Crear Cuenta</h1>
          <div className="nombre-tienda">florencia DRUGSTORE</div>
        </div>

        <div className="divisor"></div>

        <form className="formulario-registro" onSubmit={manejarEnvio}>
          <div className="grupo-formulario">
            <label>Usuario</label>
            <input
              type="email"
              placeholder="usuario@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grupo-formulario">
            <label>Contraseña</label>
            <input
              type="password"
              placeholder="crea una contraseña segura"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="grupo-formulario">
            <label>Confirmar Contraseña</label>
            <input
              type="password"
              placeholder="repite tu contraseña"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              required
            />
          </div>

          <div className="grupo-botones">
            <button type="submit" className="boton-registrar">
              Crear Cuenta
            </button>
            <button type="button" onClick={onBack} className="boton-volver">
              Volver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Registro;