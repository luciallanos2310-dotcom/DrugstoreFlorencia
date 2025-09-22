import React from "react";
import "./BarraLateral.css";

function BarraLateral() {
  return (
    <div className="barra-lateral">
      {/* Encabezado */}
      <div className="encabezado-barra">
        <div className="nombre-principal">florencia</div>
        <div className="nombre-secundario">DRUGSTORE</div>
      </div>

      {/* Menú simple */}
      <nav className="menu-lateral">
        <div className="opcion-menu activa">
          <span>🏠</span>
          <span>Inicio</span>
        </div>
        
        <div className="opcion-menu">
          <span>📦</span>
          <span>Productos</span>
        </div>

        <div className="opcion-menu">
          <span>🚚</span>
          <span>Proveedores</span>
        </div>

        <div className="opcion-menu">
          <span>⚙️</span>
          <span>Configuración</span>
        </div>
      </nav>
    </div>
  );
}

export default BarraLateral;