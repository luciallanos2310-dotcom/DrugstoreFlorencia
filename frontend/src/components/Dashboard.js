import React, { useState, useEffect } from 'react';
import { FaSignOutAlt, FaUser, FaShoppingCart, FaCashRegister, FaBox, FaChartBar, FaUsers, FaCog, FaStore, FaUserPlus, FaHome, FaTruck, FaLock, FaShoppingBag } from 'react-icons/fa';
import Registro from './Registro';
import BarraLateral from './BarraLateral';
import Productos from './Productos/Productos';
import Proveedores from './Proveedores/Proveedores';
import FormularioProducto from './Productos/FormularioProducto';
import AperturaCaja from './Caja/AperturaCaja';
import Ventas from './Ventas/Ventas';
import Empleados from './Empleados/Empleados';
import Compras from './Compras/Compras';
import FormularioCompra from './Compras/FormularioCompra';
import Reportes from './Reportes/Reportes';
import './Dashboard.css';

function Dashboard({ usuario, onCerrarSesion }) {
  const [moduloActivo, setModuloActivo] = useState('inicio');
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [vistaProductos, setVistaProductos] = useState('lista');
  const [modoFormulario, setModoFormulario] = useState('crear');
  const [productoEditando, setProductoEditando] = useState(null);
  const [vistaCompras, setVistaCompras] = useState('lista');
  const [modoFormularioCompra, setModoFormularioCompra] = useState('nueva');
  const [compraEditando, setCompraEditando] = useState(null);
      
  // Estados para la gestión de caja
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [datosCaja, setDatosCaja] = useState(null);

  // Verificar si el usuario es jefa
  const esJefa = usuario?.tipo_usuario === 'jefa';
  const esEmpleada = usuario?.tipo_usuario === 'empleada';

  // Función para verificar si un módulo es editable
  const esModuloEditable = (modulo) => {
    if (esJefa) return true; // Jefa puede editar todo
    
    // Empleada solo puede editar estos módulos
    const modulosEditablesEmpleada = [
      'inicio', 'ventas', 'caja', 'compras', 'reportes'
    ];
    
    return modulosEditablesEmpleada.includes(modulo);
  };

  // Función para manejar la navegación con permisos
  const handleNavegarA = (modulo) => {
    if (esModuloEditable(modulo)) {
      setModuloActivo(modulo);
    }
  };

  const handleVolverAlDashboard = () => {
    setMostrarRegistro(false);
    setModuloActivo('inicio');
  };

  // Función para manejar la apertura de caja confirmada
  const handleAperturaConfirmada = (datosApertura) => {
    console.log('Caja abierta exitosamente:', datosApertura);
    
    // Actualizar estado de caja
    setCajaAbierta(true);
    setDatosCaja({
      empleadoNombre: datosApertura.empleadoNombre,
      turnoNombre: datosApertura.turnoNombre,
      montoInicial: datosApertura.montoInicial,
      saldo_inicial: datosApertura.saldo_inicial,
      turno: datosApertura.turno,
      fecha_hs_apertura: datosApertura.fecha_hs_apertura,
      id: datosApertura.id,
      descripcion: datosApertura.descripcion
    });
    
    // Redirigir automáticamente a ventas
    setModuloActivo('ventas');
  };

  const handleCerrarCaja = () => {
    setCajaAbierta(false);
    setDatosCaja(null);
    setModuloActivo('inicio');
    console.log('Caja cerrada');
  };

  const handleNavegarAVentas = () => {
    if (!cajaAbierta) {
      setModuloActivo('caja');
    } else {
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
    // Si el módulo no es editable para empleada, mostrar vista de solo lectura
    if (!esModuloEditable(moduloActivo) && esEmpleada) {
      switch (moduloActivo) {
        case 'inventario':
          return (
            <div className="modulo-contenido modulo-solo-lectura">
              <div className="modulo-header-solo-lectura">
                <FaLock className="icono-bloqueo" />
                <h2>Inventario - Vista de Solo Lectura</h2>
                <p>No tiene permisos para modificar el inventario</p>
              </div>
              <Productos 
                onNavegarAFormulario={null}
                esJefa={false}
                modoLectura={true}
              />
            </div>
          );

        case 'proveedores':
          return (
            <div className="modulo-contenido modulo-solo-lectura">
              <div className="modulo-header-solo-lectura">
                <FaLock className="icono-bloqueo" />
                <h2>Proveedores - Vista de Solo Lectura</h2>
                <p>No tiene permisos para modificar proveedores</p>
              </div>
              <Proveedores 
                esJefa={false}
                modoLectura={true}
              />
            </div>
          );

        case 'empleados':
          return (
            <div className="modulo-contenido modulo-solo-lectura">
              <div className="modulo-header-solo-lectura">
                <FaLock className="icono-bloqueo" />
                <h2>Empleados - Vista de Solo Lectura</h2>
                <p>No tiene permisos para modificar empleados</p>
              </div>
              <Empleados 
                usuario={usuario}
                modoLectura={true}
              />
            </div>
          );

        case 'configuracion':
          return (
            <div className="modulo-contenido modulo-solo-lectura">
              <div className="modulo-header-solo-lectura">
                <FaLock className="icono-bloqueo" />
                <h2>Configuración - Vista de Solo Lectura</h2>
                <p>No tiene permisos para modificar la configuración</p>
              </div>
              <div className="configuracion-solo-lectura">
                <p>Esta sección está disponible solo para la jefa/encargada.</p>
              </div>
            </div>
          );

        default:
          return renderModuloNormal();
      }
    }

    return renderModuloNormal();
  };

  const renderModuloNormal = () => {
    switch (moduloActivo) {
      case 'ventas':
        if (!cajaAbierta) {
          return (
            <AperturaCaja 
              onAperturaConfirmada={handleAperturaConfirmada}
              onCancelar={() => setModuloActivo('inicio')}
              cajaAbierta={cajaAbierta}
              datosCaja={datosCaja}
            />
          );
        }
        return <Ventas datosCaja={datosCaja} onCerrarCaja={handleCerrarCaja} />;
      
      case 'caja':
        return (
          <div className="modulo-contenido">
            <AperturaCaja 
              onAperturaConfirmada={handleAperturaConfirmada}
              onCancelar={() => setModuloActivo('inicio')}
              cajaAbierta={cajaAbierta}
              datosCaja={datosCaja}
            />
          </div>
        );

      case 'compras':
        if (vistaCompras === 'formulario') {
          return (
            <FormularioCompra 
              modo={modoFormularioCompra}
              compraEditar={compraEditando}
              onCancelar={() => {
                setVistaCompras('lista');
                setCompraEditando(null);
              }}
              onGuardado={() => {
                setVistaCompras('lista');
                setCompraEditando(null);
              }}
            />
          );
        }
        return (
          <Compras 
            onNavegarAFormulario={(modo, compra) => {
              setModoFormularioCompra(modo);
              setCompraEditando(compra);
              setVistaCompras('formulario');
            }}
          />
        );

 case 'inventario':
  if (vistaProductos === 'formulario') {
    return (
      <FormularioProducto 
        modo={modoFormulario}
        producto={productoEditando}  // ✅ Cambiado de productoEditar a producto
        onCancelar={() => setVistaProductos('lista')}
        onGuardadoExitoso={() => {
          console.log('🔄 Guardado exitoso, volviendo a lista...');
          setVistaProductos('lista');
          setProductoEditando(null);
        }}
      />
    );
  }
  return (
    <Productos 
      onNavegarAFormulario={(modo, producto) => {
        console.log('🔄 Navegando a formulario:', modo, producto);
        setModoFormulario(modo);
        setProductoEditando(producto);
        setVistaProductos('formulario');
      }}
      esJefa={esJefa}
    />
  );
      case 'proveedores':
        return <Proveedores esJefa={esJefa} />;

      case 'empleados':
        return <Empleados usuario={usuario} />;

      case 'reportes':
        return <Reportes datosCaja={datosCaja} cajaAbierta={cajaAbierta} />;

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
                {esJefa && (
                  <button 
                    className="btn-nuevo-producto"
                    onClick={() => setModuloActivo('inventario')}
                  >
                    Nuevo producto
                  </button>
                )}
                <button 
                  className="btn-nueva-compra"
                  onClick={() => setModuloActivo('compras')}
                >
                  Nueva compra
                </button>
                <button 
                  className="btn-reportes"
                  onClick={() => setModuloActivo('reportes')}
                >
                  Ver Reportes
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
        setModuloActivo={handleNavegarA}
        cajaAbierta={cajaAbierta}
        datosCaja={datosCaja}
        onNavegarAVentas={handleNavegarAVentas}
        esJefa={esJefa}
        esModuloEditable={esModuloEditable}
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