import React, { useState, useEffect, lazy, Suspense } from 'react';
import { FaSignOutAlt, FaUser, FaShoppingCart, FaCashRegister, FaBox, FaChartBar, FaUsers, FaCog, FaStore, FaUserPlus, FaHome, FaTruck } from 'react-icons/fa';
import Registro from './Registro';
import BarraLateral from './BarraLateral';
import Productos from './Productos/Productos';
import Proveedores from './Proveedores/Proveedores';
import FormularioProducto from './Productos/FormularioProducto';
import AperturaCaja from './Caja/AperturaCaja';
import Ventas from './Ventas/Ventas';
import Empleados from './Empleados/Empleados';
import './Dashboard.css';

function Dashboard({ usuario, onCerrarSesion }) {
  const [moduloActivo, setModuloActivo] = useState('inicio');
  // Se elimina el estado esAdministrador y se usa directamente usuario?.tipo_usuario === 'jefa'
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [vistaProductos, setVistaProductos] = useState('lista');
  const [modoFormulario, setModoFormulario] = useState('crear');
  const [productoEditando, setProductoEditando] = useState(null);
  const [vistaProveedores, setVistaProveedores] = useState('lista');
  const [proveedorEditando, setProveedorEditando] = useState(null);
  
  // Estados para la gestión de caja
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [datosCaja, setDatosCaja] = useState(null);

  // Datos de ejemplo para empleados y turnos
  const empleados = [
    { id: 1, nombre: 'Lujan Ramírez' },
    { id: 2, nombre: 'María González' },
    { id: 3, nombre: 'Carlos López' }
  ];

  const turnos = [
    { id: 1, nombre: 'Turno mañana' },
    { id: 2, nombre: 'Turno tarde' },
    { id: 3, nombre: 'Turno noche' }
  ];

  // Eliminamos el useEffect que setea esAdministrador, ya no es necesario
  
  const handleVolverAlDashboard = () => {
    setMostrarRegistro(false);
    setModuloActivo('inicio');
  };

  const handleAperturaConfirmada = (datosApertura) => {
    // Encontrar el nombre del empleado y turno seleccionados
    const empleadoSeleccionado = empleados.find(emp => emp.id == datosApertura.empleado);
    const turnoSeleccionado = turnos.find(turno => turno.id == datosApertura.turno);
    
    const datosCompletos = {
      ...datosApertura,
      empleadoNombre: empleadoSeleccionado?.nombre || 'No especificado',
      turnoNombre: turnoSeleccionado?.nombre || 'No especificado',
      fechaApertura: new Date().toLocaleString()
    };
    
    setCajaAbierta(true);
    setDatosCaja(datosCompletos);
    setModuloActivo('ventas'); // Redirigir a ventas después de abrir caja
    
    console.log('Caja abierta:', datosCompletos);
  };

  const handleCerrarCaja = () => {
    // Aquí iría la lógica para cerrar la caja
    setCajaAbierta(false);
    setDatosCaja(null);
    setModuloActivo('inicio');
    console.log('Caja cerrada');
  };

  const handleNavegarAVentas = () => {
    if (!cajaAbierta) {
      // Si la caja no está abierta, mostrar apertura de caja
      setModuloActivo('caja');
    } else {
      // Si la caja está abierta, ir directamente a ventas
      setModuloActivo('ventas');
    }
  };

  if (mostrarRegistro) {
    return (
      <Registro 
        onVolverABienvenida={handleVolverAlDashboard}
        onVolverALogin={handleVolverAlDashboard}
      />
    );
  }

  const renderModulo = () => {
    switch (moduloActivo) {
      case 'ventas':
        if (!cajaAbierta) {
          return (
            <AperturaCaja 
              onAperturaConfirmada={handleAperturaConfirmada}
              empleados={empleados}
              turnos={turnos}
              onCancelar={() => setModuloActivo('inicio')}
            />
          );
        }
        return <Ventas datosCaja={datosCaja} />;
      
      case 'caja':
        return (
          <div className="modulo-contenido">
            <h2>💰 Gestión de Caja</h2>
            {cajaAbierta ? (
              <div className="caja-abierta-info">
                <div className="estado-caja positivo">Caja Actualmente Abierta</div>
                <div className="detalles-caja">
                  <p><strong>Empleado:</strong> {datosCaja?.empleadoNombre}</p>
                  <p><strong>Turno:</strong> {datosCaja?.turnoNombre}</p>
                  <p><strong>Monto inicial:</strong> ${datosCaja?.montoInicial}</p>
                  <p><strong>Fecha apertura:</strong> {datosCaja?.fechaApertura}</p>
                  <p><strong>Observaciones:</strong> {datosCaja?.observaciones || 'Ninguna'}</p>
                </div>
                <button 
                  className="btn-cerrar-caja"
                  onClick={handleCerrarCaja}
                >
                  Cerrar Caja
                </button>
              </div>
            ) : (
              <AperturaCaja 
                onAperturaConfirmada={handleAperturaConfirmada}
                empleados={empleados}
                turnos={turnos}
                onCancelar={() => setModuloActivo('inicio')}
              />
            )}
          </div>
        );

      case 'inventario':
        if (vistaProductos === 'formulario') {
          return (
            <FormularioProducto 
              modo={modoFormulario}
              productoEditar={productoEditando}
              onCancelar={() => setVistaProductos('lista')}
              onGuardado={() => {
                setVistaProductos('lista');
                setProductoEditando(null);
              }}
              mostrarProveedores={true} 
            />
          );
        }
        return (
          <Productos 
            onNavegarAFormulario={(modo, producto) => {
              setModoFormulario(modo);
              setProductoEditando(producto);
              setVistaProductos('formulario');
            }}
          />
        );

      case 'proveedores':
        return <Proveedores />;

      case 'empleados':
        // El componente Empleados recibe la información del rol del usuario
        return (
            <Empleados usuario={usuario} />
        );

      case 'configuracion':
        return (
          <div className="modulo-contenido">
            <h2>⚙️ Configuración del Sistema</h2>
            <p>Ajustes y preferencias</p>
          </div>
        );

      default:
        return (
          <div className="modulo-contenido inicio-exacto">
            {/* Header de bienvenida */}
            <div className="header-bienvenida-exacto">
              <h1>Bienvenida, {usuario?.nombre || 'Usuario'}!</h1>
              <p className="fecha-exacta">{new Date().toLocaleDateString('es-ES', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}</p>
              {cajaAbierta && (
                <div className="estado-caja-inicio positivo">
                  ✅ Caja abierta - {datosCaja?.empleadoNombre} - {datosCaja?.turnoNombre}
                </div>
              )}
            </div>

            {/* Sección Novedades */}
            <div className="novedades-exacto">
              <h2>Novedades</h2>
              <div className="botones-novedades">
                <button 
                  className="btn-nueva-venta"
                  onClick={handleNavegarAVentas}
                >
                  {cajaAbierta ? 'Nueva venta' : 'Abrir caja y vender'}
                </button>
                <button 
                  className="btn-nuevo-producto"
                  onClick={() => setModuloActivo('inventario')}
                >
                  Nuevo producto
                </button>
              </div>
            </div>

            {/* Grid principal - 2 columnas */}
            <div className="grid-productos">
              {/* Columna izquierda - AMBAS LISTAS */}
              <div className="columna-izquierda">
                {/* Productos más vendidos */}
                <div className="card-productos">
                  <h3 className="titulo-card">Productos más vendidos</h3>
                  <div className="lista-productos">
                    <div className="item-lista">
                      <span className="nombre-producto-lista">Coca Cola 2.25L</span>
                      <span className="estadistica-lista">120 ventas</span>
                    </div>
                    <div className="item-lista">
                      <span className="nombre-producto-lista">Cerveza Quilmes 1L</span>
                      <span className="estadistica-lista">40 ventas</span>
                    </div>
                    <div className="item-lista">
                      <span className="nombre-producto-lista">Azúcar Ledesma 1Kg</span>
                      <span className="estadistica-lista">60 ventas</span>
                    </div>
                  </div>
                </div>

                {/* Productos por reponer */}
                <div className="card-productos">
                  <h3 className="titulo-card">Productos por reponer</h3>
                  <div className="lista-productos">
                    <div className="item-lista">
                      <span className="nombre-producto-lista">Fanta 500ml</span>
                      <span className="stock-bajo-lista">0 unidades</span>
                    </div>
                    <div className="item-lista">
                      <span className="nombre-producto-lista">Yerba Playadito</span>
                      <span className="stock-bajo-lista">6 unidades</span>
                    </div>
                    <div className="item-lista">
                      <span className="nombre-producto-lista">Café Cabrales 250g</span>
                      <span className="stock-normal-lista">10 unidades</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna derecha - CALENDARIO */}
              <div className="columna-derecha">
                <div className="calendario-exacto">
                  <h3 className="titulo-calendario">
                    {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
                  </h3>
                  <div className="grid-calendario">
                    <div className="dias-semana-calendario">
                      <div className="dia-semana">DOM</div>
                      <div className="dia-semana">LUN</div>
                      <div className="dia-semana">MAR</div>
                      <div className="dia-semana">MIÉ</div>
                      <div className="dia-semana">JUE</div>
                      <div className="dia-semana">VIE</div>
                      <div className="dia-semana">SÁB</div>
                    </div>
                    <div className="semanas-mes">
                      {/* Las semanas se generan dinámicamente */}
                      {renderCalendario()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const renderCalendario = () => {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = fecha.getMonth();
    
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    
    const diasEnMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay();
    
    const semanas = [];
    let dia = 1;
    
    for (let i = 0; i < 6; i++) {
      const semana = [];
      for (let j = 0; j < 7; j++) {
        if ((i === 0 && j < primerDiaSemana) || dia > diasEnMes) {
          semana.push(<div key={`${i}-${j}`} className="dia-mes vacio"></div>);
        } else {
          const esHoy = dia === fecha.getDate();
          semana.push(
            <div key={`${i}-${j}`} className={`dia-mes ${esHoy ? 'hoy' : ''}`}>
              {dia}
            </div>
          );
          dia++;
        }
      }
      semanas.push(<div key={i} className="semana">{semana}</div>);
      if (dia > diasEnMes) break;
    }
    
    return semanas;
  };

  return (
    <div className="dashboard-container">
      <BarraLateral 
        onCerrarSesion={onCerrarSesion}
        usuario={usuario}
        moduloActivo={moduloActivo}
        setModuloActivo={setModuloActivo}
        cajaAbierta={cajaAbierta}
        datosCaja={datosCaja}
        onNavegarAVentas={handleNavegarAVentas}
      />

      <div className="contenido-principal">
        <div className="dashboard-content">
          {renderModulo()}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
