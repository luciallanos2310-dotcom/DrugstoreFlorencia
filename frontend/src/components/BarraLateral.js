// src/components/BarraLateral.js
import React from "react";
import { FaTachometerAlt, FaBox, FaChartLine, FaTruck, FaCog, FaSignOutAlt, FaUser, FaShoppingCart, FaCashRegister, FaUsers } from "react-icons/fa";
import "./BarraLateral.css";

function BarraLateral({ 
  onCerrarSesion, 
  usuario, 
  moduloActivo, 
  setModuloActivo,
  cajaAbierta,
  datosCaja,
  onNavegarAVentas 
}) {
  
  const handleModuloClick = (modulo) => {
    if (modulo === 'ventas') {
      // Si hacen clic en Ventas, usar la función especial que maneja la caja
      onNavegarAVentas();
    } else {
      setModuloActivo(modulo);
    }
  };

  const menuItems = [
    { id: 'inicio', icon: FaTachometerAlt, label: 'Inicio' },
    { id: 'ventas', icon: FaShoppingCart, label: 'Ventas' },
    { id: 'inventario', icon: FaBox, label: 'Productos' },
    { id: 'caja', icon: FaCashRegister, label: 'Caja' },
    { id: 'empleados', icon: FaUsers, label: 'Empleados' },
    { id: 'proveedores', icon: FaTruck, label: 'Proveedores' },
    { id: 'configuracion', icon: FaCog, label: 'Configuración' }
  ];

  return (
    <div className="barra-lateral">
      {/* Encabezado */}
      <div className="encabezado-barra">
        <div className="drugstore-info">
          <div className="imagen-drugstore">
            <img src="/images/5.png" alt="Drugstore Logo" />
          </div>
          <div className="titulo-barra">
            <div className="nombre-barra">florencia</div>
            <div className="nombre-drugstore">DRUGSTORE</div>
          </div>
        </div>
      </div>

      {/* Información del usuario */}
      <div className="info-usuario-lateral">
        <div className="avatar-usuario">
          <FaUser className="icono-avatar" />
        </div>
        <div className="datos-usuario">
          <div className="nombre-usuario">{usuario?.nombre || 'Usuario'}</div>
          <div className="rol-usuario">{usuario?.tipo_usuario || 'Empleado'}</div>
        </div>
      </div>

      {/* Información de caja */}
      <div className="info-caja-lateral">
        <div className={`estado-caja-lateral ${cajaAbierta ? 'abierta' : 'cerrada'}`}>
          {cajaAbierta ? '🟢 Caja abierta' : '🔴 Caja cerrada'}
        </div>
        {cajaAbierta && datosCaja && (
          <>
            <div className="cajera-info">{datosCaja.empleadoNombre}</div>
            <div className="turno-info">{datosCaja.turnoNombre}</div>
            <div className="monto-info">Inicial: ${datosCaja.montoInicial}</div>
          </>
        )}
      </div>

      {/* Menú de navegación */}
      <nav className="menu-lateral">
        {menuItems.map(item => {
          const Icono = item.icon;
          return (
            <div 
              key={item.id}
              className={`opcion-menu ${moduloActivo === item.id ? 'activa' : ''}`}
              onClick={() => handleModuloClick(item.id)}
            >
              <Icono className="icono-menu" />
              <span>{item.label}</span>
              {item.id === 'ventas' && cajaAbierta && (
                <span className="badge-venta-activa">●</span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Cerrar sesión en la parte inferior */}
      <div className="cerrar-sesion-contenedor">
        <div className="cerrar-sesion" onClick={onCerrarSesion}>
          <FaSignOutAlt className="icono-menu" />
          <span>Cerrar Sesión</span>
        </div>
        
        {/* Información de versión o estado del sistema */}
        <div className="info-sistema">
          <div className="version">v1.0.0</div>
          <div className="estado-sistema">🟢 En línea</div>
        </div>
      </div>
    </div>
  );
}

export default BarraLateral;