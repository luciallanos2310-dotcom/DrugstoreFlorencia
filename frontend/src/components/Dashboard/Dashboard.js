import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { FaLock } from 'react-icons/fa';
import Registro from '../Registro/Registro';
import BarraLateral from '../BarraLateral/BarraLateral';
import Productos from '../Productos/Productos';
import Proveedores from '../Proveedores/Proveedores';
import FormularioProducto from '../Productos/FormularioProducto';
import AperturaCaja from '../Caja/AperturaCaja';
import Ventas from '../Ventas/Ventas';
import Empleados from '../Empleados/Empleados';
import Compras from '../Compras/Compras';
import FormularioCompra from '../Compras/FormularioCompra';
import Reportes from '../Reportes/Reportes';
import FormularioEmpleado from '../Empleados/FormularioEmpleado';
import FormularioProveedor from '../Proveedores/FormularioProveedor';
import './Dashboard.css';

function Dashboard({ usuario, onCerrarSesion }) {
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  
  // Estados para la gestión de caja
  const [cajaAbierta, setCajaAbierta] = useState(false);
  const [datosCaja, setDatosCaja] = useState(null);
  const [cargandoCaja, setCargandoCaja] = useState(true); // ✅ NUEVO: Estado de carga

  const navigate = useNavigate();
  const location = useLocation();

  // ✅ CORREGIDO: Cargar estado persistente de la caja con verificación de fecha
  useEffect(() => {
    const cargarEstadoCaja = async () => {
      try {
        setCargandoCaja(true);
        const cajaEstado = localStorage.getItem('cajaEstado');
        const cajaDatos = localStorage.getItem('cajaDatos');
        
        console.log('🔍 Cargando estado de caja:', { cajaEstado, cajaDatos });
        
        if (cajaEstado === 'abierta' && cajaDatos) {
          const datos = JSON.parse(cajaDatos);
          
          // ✅ VERIFICAR SI LA CAJA ES DEL DÍA ACTUAL
          const fechaApertura = new Date(datos.fecha_hs_apertura);
          const fechaActual = new Date();
          const mismoDia = fechaApertura.toDateString() === fechaActual.toDateString();
          
          console.log('📅 Verificación de fecha:', {
            fechaApertura: fechaApertura.toDateString(),
            fechaActual: fechaActual.toDateString(),
            mismoDia
          });
          
          if (mismoDia) {
            // ✅ VERIFICAR EN LA BASE DE DATOS SI LA CAJA SIGUE ABIERTA
            try {
              const token = localStorage.getItem('token');
              const response = await fetch(`http://localhost:8000/api/cajas/${datos.id}/`, {
                headers: {
                  'Authorization': `Token ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.ok) {
                const cajaBD = await response.json();
                if (cajaBD.estado === 'abierta') {
                  setCajaAbierta(true);
                  setDatosCaja(datos);
                  console.log('✅ Caja encontrada abierta en BD');
                } else {
                  // Caja cerrada en BD, limpiar localStorage
                  console.log('🔄 Caja cerrada en BD, limpiando estado local');
                  localStorage.removeItem('cajaEstado');
                  localStorage.removeItem('cajaDatos');
                  setCajaAbierta(false);
                  setDatosCaja(null);
                }
              } else {
                // Si no puede verificar con BD, usar estado local
                setCajaAbierta(true);
                setDatosCaja(datos);
                console.log('⚠️ Usando estado local de caja (sin verificación BD)');
              }
            } catch (error) {
              console.error('❌ Error verificando caja en BD:', error);
              // En caso de error, usar estado local
              setCajaAbierta(true);
              setDatosCaja(datos);
            }
          } else {
            // ❌ CAJA DE OTRO DÍA - LIMPIAR
            console.log('🗑️ Caja de día anterior, limpiando estado');
            localStorage.removeItem('cajaEstado');
            localStorage.removeItem('cajaDatos');
            setCajaAbierta(false);
            setDatosCaja(null);
          }
        } else {
          // No hay caja en localStorage o datos inválidos
          setCajaAbierta(false);
          setDatosCaja(null);
          console.log('❌ No hay caja abierta en localStorage');
        }
      } catch (error) {
        console.error('❌ Error cargando estado de caja:', error);
        setCajaAbierta(false);
        setDatosCaja(null);
        // Limpiar localStorage en caso de error
        localStorage.removeItem('cajaEstado');
        localStorage.removeItem('cajaDatos');
      } finally {
        setCargandoCaja(false);
      }
    };

    cargarEstadoCaja();
  }, []);

  // ✅ Persistir estado de la caja SOLO cuando realmente se abre
  useEffect(() => {
    if (cajaAbierta && datosCaja) {
      localStorage.setItem('cajaEstado', 'abierta');
      localStorage.setItem('cajaDatos', JSON.stringify(datosCaja));
      console.log('💾 Estado de caja guardado en localStorage');
    } else if (!cajaAbierta) {
      localStorage.removeItem('cajaEstado');
      localStorage.removeItem('cajaDatos');
      console.log('🗑️ Estado de caja removido de localStorage');
    }
  }, [cajaAbierta, datosCaja]);

  // Verificar si el usuario es jefa
  const esJefa = usuario?.tipo_usuario === 'jefa';
  const esEmpleada = usuario?.tipo_usuario === 'empleada';

  // Función para verificar si un módulo es editable
  const esModuloEditable = (modulo) => {
    if (esJefa) return true;
    
    // ✅ EMPLEADA: Solo puede usar caja y ventas
    if (esEmpleada) {
      const modulosPermitidosEmpleada = [
        'dashboard', 'ventas', 'caja'
      ];
      return modulosPermitidosEmpleada.includes(modulo);
    }
    
    return false;
  };

  const handleVolverAlDashboard = () => {
    setMostrarRegistro(false);
    navigate('/dashboard');
  };

  // ✅ FUNCIONES MEJORADAS DE NAVEGACIÓN
  const handleNavegarAFormulario = (modulo, modo, id = null) => {
    const rutas = {
      productos: {
        crear: '/dashboard/productos/nuevo',
        editar: `/dashboard/productos/editar/${id}`
      },
      proveedores: {
        crear: '/dashboard/proveedores/nuevo',
        editar: `/dashboard/proveedores/editar/${id}`
      },
      empleados: {
        crear: '/dashboard/empleados/nuevo',
        editar: `/dashboard/empleados/editar/${id}`
      },
      compras: {
        crear: '/dashboard/compras/nueva',
        editar: `/dashboard/compras/editar/${id}`
      }
    };

    const ruta = rutas[modulo]?.[modo];
    if (ruta) {
      console.log(`🔄 Navegando a: ${ruta}`);
      navigate(ruta);
    } else {
      console.error('❌ Ruta no encontrada:', { modulo, modo, id });
    }
  };

  // Función para manejar la apertura de caja confirmada
  const handleAperturaConfirmada = (datosApertura) => {
    console.log('✅ Caja abierta exitosamente:', datosApertura);
    
    setCajaAbierta(true);
    setDatosCaja({
      empleadoNombre: datosApertura.empleadoNombre,
      turnoNombre: datosApertura.turnoNombre,
      montoInicial: datosApertura.montoInicial,
      saldo_inicial: datosApertura.saldo_inicial,
      turno: datosApertura.turno,
      fecha_hs_apertura: datosApertura.fecha_hs_apertura,
      id: datosApertura.id,
      descripcion: datosApertura.descripcion,
      horaApertura: new Date().toLocaleTimeString('es-AR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    });
    
    navigate('/dashboard/ventas');
  };

  const handleCerrarCaja = () => {
    console.log('🔒 Cerrando caja...');
    setCajaAbierta(false);
    setDatosCaja(null);
    navigate('/dashboard');
  };

  const handleNavegarAVentas = () => {
    if (!cajaAbierta && esEmpleada) {
      // Si es empleada y la caja no está abierta, ir directamente a apertura de caja
      navigate('/dashboard/caja');
    } else if (!cajaAbierta) {
      navigate('/dashboard/caja');
    } else {
      navigate('/dashboard/ventas');
    }
  };

  // ✅ CORREGIDO: Mejorar el componente PaginaInicio
  const PaginaInicio = () => {
    console.log('📍 Renderizando PaginaInicio - Caja abierta:', cajaAbierta);
    
    // ✅ Mostrar loading mientras se carga el estado de la caja
    if (cargandoCaja) {
      return (
        <div className="modulo-contenido inicio-exacto">
          <div className="cargando-caja">
            <div className="spinner"></div>
            <p>Verificando estado de caja...</p>
          </div>
        </div>
      );
    }
    
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
      <div className="modulo-contenido inicio-exacto">
        <div className="header-bienvenida-exacto">
          <h1>Bienvenida, {usuario?.nombre || 'Usuario'}!</h1>
          <p className="fecha-exacta">{new Date().toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}</p>
        </div>

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
                onClick={() => navigate('/dashboard/productos')}
              >
                Nuevo producto
              </button>
            )}
            <button 
              className="btn-nueva-compra"
              onClick={() => navigate('/dashboard/compras')}
            >
              Nueva compra
            </button>
            <button 
              className="btn-reportes"
              onClick={() => navigate('/dashboard/reportes')}
            >
              Ver Reportes
            </button>
          </div>
        </div>

        <div className="grid-productos">
          <div className="columna-izquierda">
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
                  {renderCalendario()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Componente para módulos de solo lectura
  const ModuloSoloLectura = ({ titulo, children }) => (
    <div className="modulo-contenido modulo-solo-lectura">
      <div className="modulo-header-solo-lectura">
        <FaLock className="icono-bloqueo" />
        <h2>{titulo} - Vista de Solo Lectura</h2>
        <p>No tiene permisos para modificar {titulo.toLowerCase()}</p>
      </div>
      {children}
    </div>
  );

  if (mostrarRegistro) {
    return (
      <Registro 
        onVolverABienvenida={handleVolverAlDashboard}
        onVolverALogin={handleVolverAlDashboard}
      />
    );
  }

  return (
    <div className="dashboard-container">
      <BarraLateral 
        onCerrarSesion={onCerrarSesion}
        usuario={usuario}
        cajaAbierta={cajaAbierta}
        datosCaja={datosCaja}
        onNavegarAVentas={handleNavegarAVentas}
        esJefa={esJefa}
        esModuloEditable={esModuloEditable}
        cargandoCaja={cargandoCaja} // ✅ Pasar estado de carga
      />

      <div className="contenido-principal">
        <div className="dashboard-content">
          <Routes>
            <Route index element={<PaginaInicio />} />
            
            <Route path="ventas" element={
              !cajaAbierta ? (
                <AperturaCaja 
                  onAperturaConfirmada={handleAperturaConfirmada}
                  onCancelar={() => navigate('/dashboard')}
                  cajaAbierta={cajaAbierta}
                  datosCaja={datosCaja}
                  usuario={usuario}
                />
              ) : (
                <Ventas datosCaja={datosCaja} onCerrarCaja={handleCerrarCaja} />
              )
            } />

            <Route path="caja" element={
              <AperturaCaja 
                onAperturaConfirmada={handleAperturaConfirmada}
                onCancelar={() => navigate('/dashboard')}
                cajaAbierta={cajaAbierta}
                datosCaja={datosCaja}
                usuario={usuario}
              />
            } />
            
            {/* ✅ RUTAS SEPARADAS PARA COMPRAS - CON NAVEGACIÓN MEJORADA */}
            <Route path="compras" element={
              <Compras 
                esJefa={esJefa}
                modoLectura={!esModuloEditable('compras') && esEmpleada}
                onNavegarAFormulario={(modo, compra) => 
                  handleNavegarAFormulario('compras', modo, compra?.id)
                }
              />
            } />
            
            <Route path="compras/nueva" element={
              !esModuloEditable('compras') && esEmpleada ? (
                <ModuloSoloLectura titulo="Compras">
                  <div className="modulo-contenido">
                    <p>No tiene permisos para crear compras</p>
                  </div>
                </ModuloSoloLectura>
              ) : (
                <FormularioCompra 
                  modo="nueva"
                  onCancelar={() => navigate('/dashboard/compras')}
                  onGuardado={() => navigate('/dashboard/compras')}
                />
              )
            } />
            
            <Route path="compras/editar/:id" element={
              !esModuloEditable('compras') && esEmpleada ? (
                <ModuloSoloLectura titulo="Compras">
                  <div className="modulo-contenido">
                    <p>No tiene permisos para editar compras</p>
                  </div>
                </ModuloSoloLectura>
              ) : (
                <FormularioCompra 
                  modo="editar"
                  onCancelar={() => navigate('/dashboard/compras')}
                  onGuardado={() => navigate('/dashboard/compras')}
                />
              )
            } />
            
            {/* ✅ RUTAS SEPARADAS PARA PRODUCTOS - CON NAVEGACIÓN MEJORADA */}
            <Route path="productos" element={
              !esModuloEditable('productos') && esEmpleada ? (
                <ModuloSoloLectura titulo="Productos">
                  <Productos 
                    onNavegarAFormulario={null}
                    esJefa={false}
                    modoLectura={true}
                  />
                </ModuloSoloLectura>
              ) : (
                <Productos 
                  onNavegarAFormulario={(modo, producto) => 
                    handleNavegarAFormulario('productos', modo, producto?.id)
                  }
                  esJefa={esJefa}
                />
              )
            } />
            
            <Route path="productos/nuevo" element={
              !esModuloEditable('productos') && esEmpleada ? (
                <ModuloSoloLectura titulo="Productos">
                  <div className="modulo-contenido">
                    <p>No tiene permisos para crear productos</p>
                  </div>
                </ModuloSoloLectura>
              ) : (
                <FormularioProducto 
                  modo="crear"
                  onCancelar={() => navigate('/dashboard/productos')}
                  onGuardadoExitoso={() => navigate('/dashboard/productos')}
                />
              )
            } />
            
            <Route path="productos/editar/:id" element={
              !esModuloEditable('productos') && esEmpleada ? (
                <ModuloSoloLectura titulo="Productos">
                  <div className="modulo-contenido">
                    <p>No tiene permisos para editar productos</p>
                  </div>
                </ModuloSoloLectura>
              ) : (
                <FormularioProducto 
                  modo="editar"
                  onCancelar={() => navigate('/dashboard/productos')}
                  onGuardadoExitoso={() => navigate('/dashboard/productos')}
                />
              )
            } />
            
            {/* ✅ RUTAS SEPARADAS PARA PROVEEDORES - CON NAVEGACIÓN MEJORADA */}
            <Route path="proveedores" element={
              !esModuloEditable('proveedores') && esEmpleada ? (
                <ModuloSoloLectura titulo="Proveedores">
                  <Proveedores 
                    esJefa={false}
                    modoLectura={true}
                    onNavegarAFormulario={null}
                  />
                </ModuloSoloLectura>
              ) : (
                <Proveedores 
                  esJefa={esJefa}
                  onNavegarAFormulario={(modo, proveedor) => 
                    handleNavegarAFormulario('proveedores', modo, proveedor?.id)
                  }
                />
              )
            } />
            
            <Route path="proveedores/nuevo" element={
              !esModuloEditable('proveedores') && esEmpleada ? (
                <ModuloSoloLectura titulo="Proveedores">
                  <div className="modulo-contenido">
                    <p>No tiene permisos para crear proveedores</p>
                  </div>
                </ModuloSoloLectura>
              ) : (
                <FormularioProveedor 
                  modo="crear"
                  onCancelar={() => navigate('/dashboard/proveedores')}
                  onGuardado={() => navigate('/dashboard/proveedores')}
                />
              )
            } />
            
            <Route path="proveedores/editar/:id" element={
              !esModuloEditable('proveedores') && esEmpleada ? (
                <ModuloSoloLectura titulo="Proveedores">
                  <div className="modulo-contenido">
                    <p>No tiene permisos para editar proveedores</p>
                  </div>
                </ModuloSoloLectura>
              ) : (
                <FormularioProveedor 
                  modo="editar"
                  onCancelar={() => navigate('/dashboard/proveedores')}
                  onGuardado={() => navigate('/dashboard/proveedores')}
                />
              )
            } />
            
            {/* ✅ RUTAS SEPARADAS PARA EMPLEADOS - CON NAVEGACIÓN MEJORADA */}
            <Route path="empleados" element={
              !esModuloEditable('empleados') && esEmpleada ? (
                <ModuloSoloLectura titulo="Empleados">
                  <Empleados 
                    usuario={usuario}
                    modoLectura={true}
                    onNavegarAFormulario={null}
                  />
                </ModuloSoloLectura>
              ) : (
                <Empleados 
                  usuario={usuario}
                  onNavegarAFormulario={(modo, empleado) => 
                    handleNavegarAFormulario('empleados', modo, empleado?.id)
                  }
                />
              )
            } />
            
            <Route path="empleados/nuevo" element={
              !esModuloEditable('empleados') && esEmpleada ? (
                <ModuloSoloLectura titulo="Empleados">
                  <div className="modulo-contenido">
                    <p>No tiene permisos para crear empleados</p>
                  </div>
                </ModuloSoloLectura>
              ) : (
                <FormularioEmpleado 
                  modo="crear"
                  onCancelar={() => navigate('/dashboard/empleados')}
                  onGuardado={() => navigate('/dashboard/empleados')}
                />
              )
            } />
            
            <Route path="empleados/editar/:id" element={
              !esModuloEditable('empleados') && esEmpleada ? (
                <ModuloSoloLectura titulo="Empleados">
                  <div className="modulo-contenido">
                    <p>No tiene permisos para editar empleados</p>
                  </div>
                </ModuloSoloLectura>
              ) : (
                <FormularioEmpleado 
                  modo="editar"
                  onCancelar={() => navigate('/dashboard/empleados')}
                  onGuardado={() => navigate('/dashboard/empleados')}
                />
              )
            } />
            
            <Route path="reportes" element={<Reportes datosCaja={datosCaja} cajaAbierta={cajaAbierta} />} />
            
            {/* ✅ AGREGAR: Ruta de fallback para rutas no encontradas */}
            <Route path="*" element={<PaginaInicio />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;