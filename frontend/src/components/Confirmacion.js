import React from "react";
import { FaCheckCircle } from "react-icons/fa";
import "./Confirmacion.css";

function Confirmacion({ email, onContinuar }) {
  return (
    <div className="confirmacion-page">
      {/* Columna izquierda */}
      <div className="confirmacion-left">
        <h1>florencia</h1>
        <h2>DRUGSTORE</h2>
      </div>

      {/* Columna derecha */}
      <div className="confirmacion-right">
        <div className="confirmacion-card">
          <h2>Cuenta Creada</h2>
          
          <div className="mensaje-confirmacion">
            <p>Tu cuenta ha sido creada correctamente.</p>
            <p className="email-confirmado">{email}</p>
            <p>Ya puedes iniciar sesión en la plataforma.</p>
          </div>

          <button onClick={onContinuar} className="continuar-btn">
            Continuar al Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Confirmacion;