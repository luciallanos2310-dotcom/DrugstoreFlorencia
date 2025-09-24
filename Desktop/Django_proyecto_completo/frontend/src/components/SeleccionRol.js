import React from "react";
import { FaUserTie, FaCrown, FaUser } from "react-icons/fa"; // 👈 Importa los iconos
import "./SeleccionRol.css";

function SeleccionRol({ onSeleccionRol }) {
  return (
    <div className="seleccion-rol-page">
      {/* Columna izquierda - Logo */}
      <div className="rol-left">
        <h1>florencia</h1>
        <h2>DRUGSTORE</h2>
      </div>

      {/* Columna derecha - Selección de rol */}
      <div className="rol-right">
        <div className="rol-card">
          <h2>Selecciona tu rol</h2>
          <p>Elige cómo quieres acceder al sistema</p>
          
          <div className="opciones-rol">
            <button 
              className="rol-btn empleado-btn"
              onClick={() => onSeleccionRol('empleado')}
            >
              <span className="rol-icon"><FaUser /></span>
              <span className="rol-text">
                <strong>Empleado</strong>
                <small>Acceso al sistema de ventas</small>
              </span>
            </button>
            
            <button 
              className="rol-btn dueno-btn"
              onClick={() => onSeleccionRol('dueño')}
            >
              <span className="rol-icon"><FaUserTie /></span>
              <span className="rol-text">
                <strong>Dueño</strong>
                <small>Acceso administrativo completo</small>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SeleccionRol;
