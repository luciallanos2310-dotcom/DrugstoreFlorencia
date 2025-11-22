import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  cajaAbierta,
  datosCaja,
  esJefa,
  esModuloEditable 
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleModuloClick = (modulo) => {
    if (!esModuloEditable(modulo)) return;
    
    console.log('📍 Click en módulo:', modulo);
    
    // ✅ CORREGIDO: Lógica especial para ventas cuando la caja no está abierta
    if (modulo === 'ventas' && !cajaAbierta) {
      console.log('📍 Caja cerrada, navegando a /dashboard/caja');
      navigate('/dashboard/caja');
    } else {
      // Navegación normal para otros casos
      navigate(`/dashboard/${modulo}`);
    }
  };

  const handleCerrarSesion = () => {
    onCerrarSesion();
    navigate('/bienvenida');
  };

  const menuItems = [
    { id: 'dashboard', icon: FaTachometerAlt, label: 'Inicio', path: '/dashboard' },
    { id: 'ventas', icon: FaShoppingCart, label: 'Ventas', path: '/dashboard/ventas' },
    { id: 'compras', icon: FaShoppingBag, label: 'Compras', path: '/dashboard/compras' },
    { id: 'productos', icon: FaBox, label: 'Productos', path: '/dashboard/productos' },
    { id: 'caja', icon: FaCashRegister, label: 'Caja', path: '/dashboard/caja' },
    { id: 'reportes', icon: FaChartLine, label: 'Reportes', path: '/dashboard/reportes' },
    { id: 'empleados', icon: FaUsers, label: 'Empleados', path: '/dashboard/empleados' },
    { id: 'proveedores', icon: FaTruck, label: 'Proveedores', path: '/dashboard/proveedores' }
  ];

  // ✅ CORREGIDO: Determinar qué módulo está activo basado en la ruta actual - VERSIÓN MEJORADA
  const getModuloActivo = () => {
    const currentPath = location.pathname;
    console.log('📍 Ruta actual en BarraLateral:', currentPath);
    
    // ✅ DETECCIÓN MEJORADA: Incluir rutas de formularios
    const routeToModuleMap = {
      '/dashboard': 'dashboard',
      '/dashboard/': 'dashboard',
      
      '/dashboard/ventas': 'ventas',
      '/dashboard/ventas/': 'ventas',
      
      '/dashboard/compras': 'compras',
      '/dashboard/compras/': 'compras',
      '/dashboard/compras/nueva': 'compras', // ✅ NUEVO: Ruta de formulario
      '/dashboard/compras/editar': 'compras', // ✅ NUEVO: Ruta de edición
      
      '/dashboard/caja': 'caja',
      '/dashboard/caja/': 'caja',
      
      '/dashboard/productos': 'productos',
      '/dashboard/productos/': 'productos',
      
      '/dashboard/reportes': 'reportes',
      '/dashboard/reportes/': 'reportes',
      
      '/dashboard/empleados': 'empleados',
      '/dashboard/empleados/': 'empleados',
      
      '/dashboard/proveedores': 'proveedores',
      '/dashboard/proveedores/': 'proveedores'
    };
    
    // Buscar coincidencia exacta primero
    if (routeToModuleMap[currentPath]) {
      return routeToModuleMap[currentPath];
    }
    
    // ✅ DETECCIÓN POR PREFIJO PARA RUTAS DINÁMICAS (como /compras/editar/:id)
    if (currentPath.startsWith('/dashboard/compras/')) {
      return 'compras';
    }
    if (currentPath.startsWith('/dashboard/ventas/')) {
      return 'ventas';
    }
    if (currentPath.startsWith('/dashboard/productos/')) {
      return 'productos';
    }
    if (currentPath.startsWith('/dashboard/empleados/')) {
      return 'empleados';
    }
    if (currentPath.startsWith('/dashboard/proveedores/')) {
      return 'proveedores';
    }
    
    return 'dashboard';
  };

  const moduloActivo = getModuloActivo();
  console.log('📍 Módulo activo detectado:', moduloActivo);

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
        <div className="cerrar-sesion" onClick={handleCerrarSesion}>
          <FaSignOutAlt className="icono-menu" />
          <span>Cerrar Sesión</span>
        </div>
      </div>
    </div>
  );
}

export default BarraLateral;