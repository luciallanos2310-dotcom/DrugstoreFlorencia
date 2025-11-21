import React from "react";
import { 
  FaTachometerAlt, 
  FaBox, 
  FaChartLine, 
  FaTruck, 
  FaSignOutAlt, 
  FaUser, 
  FaShoppingCart, 
  FaCashRegister, 
  FaUsers, 
  FaShoppingBag 
} from "react-icons/fa";
import "./BarraLateral.css";

function BarraLateral({ 
  onCerrarSesion, 
  usuario, 
  moduloActivo, 
  setModuloActivo,
  cajaAbierta,
  datosCaja,
  onNavegarAVentas,
  esJefa,
  esModuloEditable 
}) {
  
  const handleModuloClick = (modulo) => {
    if (!esModuloEditable(modulo)) return; // No hacer nada si no es editable
    
    if (modulo === 'ventas') {
      onNavegarAVentas();
    } else {
      setModuloActivo(modulo);
    }
  };

  const menuItems = [
    { id: 'inicio', icon: FaTachometerAlt, label: 'Inicio' },
    { id: 'ventas', icon: FaShoppingCart, label: 'Ventas' },
    { id: 'compras', icon: FaShoppingBag, label: 'Compras' },
    { id: 'inventario', icon: FaBox, label: 'Productos' },
    { id: 'caja', icon: FaCashRegister, label: 'Caja' },
    { id: 'reportes', icon: FaChartLine, label: 'Reportes' },
    { id: 'empleados', icon: FaUsers, label: 'Empleados' },
    { id: 'proveedores', icon: FaTruck, label: 'Proveedores' }
    // ✅ CONFIGURACIÓN ELIMINADA
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
          <div className="rol-usuario">{usuario?.tipo_usuario === 'jefa' ? 'Jefa/Encargada' : 'Empleada'}</div>
        </div>
      </div>

      {/* Información de caja */}
      <div className="info-caja-lateral">
        <div className="estado-caja-lateral">
          {cajaAbierta ? '🟢 Caja abierta' : '🔴 Caja cerrada'}
        </div>
        {cajaAbierta && datosCaja && (
          <>
            <div className="cajera-info">Por: {datosCaja.empleadoNombre}</div>
            <div className="turno-info">{datosCaja.turnoNombre}</div>
          </>
        )}
      </div>

      {/* Menú de navegación */}
      <nav className="menu-lateral">
        {menuItems.map(item => {
          const Icono = item.icon;
          const esEditable = esModuloEditable(item.id);
          const estaActivo = moduloActivo === item.id && esEditable;
          
          return (
            <div 
              key={item.id}
              className={`opcion-menu ${estaActivo ? 'activa' : ''} ${!esEditable ? 'no-editable' : ''}`}
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
      </div>
    </div>
  );
}

export default BarraLateral;