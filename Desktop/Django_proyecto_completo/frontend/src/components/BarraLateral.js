import React from "react";
import { FaTachometerAlt, FaBox, FaChartLine, FaTruck, FaCog, FaSignOutAlt, FaUser } from "react-icons/fa";
import "./BarraLateral.css";

function BarraLateral({ onCerrarSesion, usuario }) {
  return (
    <div className="barra-lateral">
      {/* Encabezado */}
      <div className="encabezado-barra">
        <div className="usuario-info">
          <div className="avatar-usuario">
            <FaUser />
          </div>
          <div className="info-usuario">
            <div className="nombre-usuario">{usuario?.nombre || "Andrea"}</div>
            <div className="rol-usuario">Dueña</div>
          </div>
        </div>
        <div className="nombre-empresa">florencia DRUGSTORE</div>
      </div>

      {/* Menú simple */}
      <nav className="menu-lateral">
        <div className="opcion-menu activa">
          <FaTachometerAlt className="icono-menu" />
          <span>Dashboard</span>
        </div>
        
        <div className="opcion-menu">
          <FaBox className="icono-menu" />
          <span>Inventario</span>
        </div>

        <div className="opcion-menu">
          <FaChartLine className="icono-menu" />
          <span>Ventas</span>
        </div>

        <div className="opcion-menu">
          <FaTruck className="icono-menu" />
          <span>Proveedores</span>
        </div>

        <div className="opcion-menu">
          <FaCog className="icono-menu" />
          <span>Configuración</span>
        </div>
      </nav>

      {/* Cerrar sesión en la parte inferior */}
      <div className="cerrar-sesion" onClick={onCerrarSesion}>
        <FaSignOutAlt className="icono-menu" />
        <span>Cerrar Sesión</span>
      </div>
    </div>
  );
}

export default BarraLateral;