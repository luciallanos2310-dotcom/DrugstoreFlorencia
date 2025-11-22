import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaEye, FaChevronLeft, FaChevronRight, FaStepBackward, FaStepForward } from 'react-icons/fa';
import ModalConfirmacionUniversal from '../ModalConfirmacionUniversal/ModalConfirmacionUniversal';
import './Empleados.css';
import { useNavigate } from 'react-router-dom'; // ✅ AGREGADO

function Empleados({ usuario, modoLectura = false, onNavegarAFormulario }) {
  const [empleados, setEmpleados] = useState([]);
  const [todosEmpleados, setTodosEmpleados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  
  // ✅ ESTADOS PARA PAGINACIÓN
  const [paginaActual, setPaginaActual] = useState(1);
  const [empleadosPorPagina, setEmpleadosPorPagina] = useState(6);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // Estados para modales
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [mostrarModalDetalles, setMostrarModalDetalles] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [empleadoAEliminar, setEmpleadoAEliminar] = useState(null);
  const [mensajeModal, setMensajeModal] = useState('');

  const navigate = useNavigate(); // ✅ AGREGADO

  // ✅ FUNCIÓN MEJORADA: Manejar nuevo empleado
  const handleCrearEmpleado = () => {
    console.log('➕ Nuevo empleado - navegando a formulario...');
    if (onNavegarAFormulario) {
      onNavegarAFormulario('crear', null);
    } else {
      // Fallback: navegar directamente
      navigate('/dashboard/empleados/nuevo');
    }
  };

  // ✅ FUNCIÓN MEJORADA: Manejar edición de empleado
  const handleEditarEmpleado = (empleado) => {
    console.log('✏️ Editar empleado - navegando a formulario...');
    if (onNavegarAFormulario) {
      onNavegarAFormulario('editar', empleado);
    } else {
      // Fallback: navegar directamente
      navigate(`/dashboard/empleados/editar/${empleado.id}`);
    }
  };

  // Cargar empleados desde la API
  const cargarEmpleados = async () => {
    try {
      setCargando(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/empleados/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTodosEmpleados(data);
        setEmpleados(data);
        
        // ✅ CALCULAR PAGINACIÓN INICIAL
        calcularPaginacion(data);
      } else {
        console.error('Error cargando empleados:', response.status);
        setMensajeModal('Error al cargar los empleados');
        setMostrarModalError(true);
      }
    } catch (error) {
      console.error('Error cargando empleados:', error);
      setMensajeModal('Error de conexión al cargar empleados');
      setMostrarModalError(true);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEmpleados();
  }, []);

  // ✅ FUNCIÓN PARA CALCULAR PAGINACIÓN
  const calcularPaginacion = (listaEmpleados) => {
    const total = listaEmpleados.length;
    const paginas = Math.ceil(total / empleadosPorPagina);
    setTotalPaginas(paginas);
    setPaginaActual(1);
  };

  // ✅ FUNCIÓN PARA OBTENER EMPLEADOS DE LA PÁGINA ACTUAL
  const obtenerEmpleadosPaginaActual = () => {
    const inicio = (paginaActual - 1) * empleadosPorPagina;
    const fin = inicio + empleadosPorPagina;
    return empleados.slice(inicio, fin);
  };

  // ✅ FUNCIONES DE PAGINACIÓN
  const irAPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const paginaAnterior = () => {
    if (paginaActual > 1) {
      setPaginaActual(paginaActual - 1);
    }
  };

  const paginaSiguiente = () => {
    if (paginaActual < totalPaginas) {
      setPaginaActual(paginaActual + 1);
    }
  };

  const irAPrimeraPagina = () => {
    setPaginaActual(1);
  };

  const irAUltimaPagina = () => {
    setPaginaActual(totalPaginas);
  };

  // ✅ FUNCIÓN PARA GENERAR RANGO DE PÁGINAS
  const obtenerRangoPaginas = () => {
    const paginasVisibles = 5;
    let inicio = Math.max(1, paginaActual - Math.floor(paginasVisibles / 2));
    let fin = Math.min(totalPaginas, inicio + paginasVisibles - 1);
    
    if (fin - inicio + 1 < paginasVisibles) {
      inicio = Math.max(1, fin - paginasVisibles + 1);
    }
    
    const paginas = [];
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    return paginas;
  };

  // Filtrar empleados basado en la búsqueda
  const filtrarEmpleados = () => {
    if (busqueda === '') {
      setEmpleados(todosEmpleados);
      calcularPaginacion(todosEmpleados);
      return;
    }

    let filtrados = todosEmpleados.filter(empleado => {
      const nombreCompleto = `${empleado.nombre_emp} ${empleado.apellido_emp}`.toLowerCase();
      const terminoBusqueda = busqueda.toLowerCase();
      return nombreCompleto.includes(terminoBusqueda) ||
             empleado.dni_emp?.toString().includes(busqueda) ||
             empleado.email?.toLowerCase().includes(terminoBusqueda) ||
             empleado.telefono_emp?.includes(busqueda);
    });

    setEmpleados(filtrados);
    calcularPaginacion(filtrados);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      filtrarEmpleados();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [busqueda, todosEmpleados]);

  // ✅ EFECTO PARA SCROLLAR AL TOP AL CAMBIAR DE PÁGINA
  useEffect(() => {
    const listaContainer = document.querySelector('.lista-empleados');
    if (listaContainer) {
      listaContainer.scrollTop = 0;
    }
  }, [paginaActual]);

  // Función para mostrar detalles del empleado en modal
  const mostrarDetallesEmpleado = (empleado) => {
    setEmpleadoSeleccionado(empleado);
    setMostrarModalDetalles(true);
  };

  // Obtener email del empleado
  const obtenerEmail = (empleado) => {
    return empleado.email || empleado.user?.email || 'No especificado';
  };

  // Obtener observaciones del empleado
  const obtenerObservaciones = (empleado) => {
    return empleado.descripcion || empleado.observaciones || empleado.info_adicional || 'No hay observaciones';
  };

  const handleEliminarEmpleado = (empleado) => {
    setEmpleadoAEliminar(empleado);
    setMensajeModal(`¿Está seguro que desea eliminar al empleado ${empleado.nombre_emp} ${empleado.apellido_emp}? Esta acción no se puede deshacer.`);
    setMostrarModalEliminar(true);
  };

  const confirmarEliminacion = async () => {
    try {
      setCargando(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/empleados/${empleadoAEliminar.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await cargarEmpleados();
        setMostrarModalEliminar(false);
        setMensajeModal('Empleado eliminado exitosamente');
        setMostrarModalExito(true);
      } else {
        const errorData = await response.json();
        setMostrarModalEliminar(false);
        setMensajeModal(`Error al eliminar empleado: ${errorData.error || 'Error desconocido'}`);
        setMostrarModalError(true);
      }
    } catch (error) {
      console.error('Error eliminando empleado:', error);
      setMostrarModalEliminar(false);
      setMensajeModal('Error de conexión al eliminar empleado');
      setMostrarModalError(true);
    } finally {
      setCargando(false);
    }
  };

  const limpiarBusqueda = () => {
    setBusqueda('');
  };

  const hayFiltrosActivos = busqueda !== '';
  const hayResultados = empleados.length > 0;
  const empleadosMostrar = obtenerEmpleadosPaginaActual();

  return (
    <div className="empleados-container">
      <div className="empleados-header">
        <h1>Empleados</h1>
        <div className="empleados-acciones">
          {!modoLectura && (
            <button 
              className="btn-nuevo-empleado"
              onClick={handleCrearEmpleado}
              disabled={cargando}
            >
              <FaPlus /> {cargando ? 'Cargando...' : 'Agregar nuevo empleado'}
            </button>
          )}
        </div>
      </div>

      {/* Buscador */}
      <div className="buscador-empleados">
        <div className="buscador-contenedor">
          <input
            type="text"
            placeholder="Buscar empleados por nombre, apellido, DNI o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input-busqueda"
            disabled={cargando}
          />
          {busqueda && (
            <button 
              className="btn-limpiar-busqueda"
              onClick={limpiarBusqueda}
              title="Limpiar búsqueda"
              disabled={cargando}
            >
              ×
            </button>
          )}
        </div>
        
        {hayFiltrosActivos && (
          <div className="mensaje-busqueda">
            {empleados.length === 0 ? 
              `No se encontraron empleados con "${busqueda}"` : 
              `Mostrando ${empleados.length} empleado(s) con "${busqueda}"`
            }
          </div>
        )}

        {!hayFiltrosActivos && (
          <div className="mensaje-busqueda">
            Mostrando {empleados.length} empleados en total
          </div>
        )}
      </div>

      {/* Lista de empleados */}
      <div className="lista-empleados">
        {cargando ? (
          <div className="cargando-empleados">
            <div className="loading-spinner"></div>
            Cargando empleados...
          </div>
        ) : hayFiltrosActivos && empleados.length === 0 ? (
          <div className="sin-resultados">
            <p>No se encontraron empleados con los criterios de búsqueda</p>
            <button className="btn-limpiar-busqueda" onClick={limpiarBusqueda}>
              Limpiar búsqueda
            </button>
          </div>
        ) : hayResultados ? (
          <>
            <div className="grid-empleados">
              {empleadosMostrar.map(empleado => {
                const email = obtenerEmail(empleado);
                
                return (
                  <div key={empleado.id} className="tarjeta-empleado">
                    <div className="empleado-header">
                      <h2>{empleado.nombre_emp} {empleado.apellido_emp}</h2>
                      <div className="empleado-acciones">
                        <button 
                          className="btn-ver-detalles"
                          onClick={() => mostrarDetallesEmpleado(empleado)}
                          title="Ver detalles completos"
                          disabled={cargando}
                        >
                          <FaEye />
                        </button>
                        {!modoLectura && (
                          <>
                            <button 
                              className="btn-editar"
                              onClick={() => handleEditarEmpleado(empleado)}
                              title="Editar empleado"
                              disabled={cargando}
                            >
                              <FaEdit />
                            </button>
                            <button 
                              className="btn-eliminar"
                              onClick={() => handleEliminarEmpleado(empleado)}
                              title="Eliminar empleado"
                              disabled={cargando}
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="empleado-info">
                      <div className="info-basica">
                        <div className="info-item">
                          <strong>Cargo:</strong> 
                          <span className={`badge-cargo ${empleado.tipo_usuario}`}>
                            {empleado.tipo_usuario === 'jefa' ? 'Jefa/Encargada' : 'Empleada'}
                          </span>
                        </div>
                        <div className="info-item">
                          <strong>Teléfono:</strong> {empleado.telefono_emp || 'No especificado'}
                        </div>
                        <div className="info-item">
                          <strong>Email:</strong> {email}
                        </div>
                        <div className="info-item">
                          <strong>DNI:</strong> {empleado.dni_emp || 'No especificado'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ✅ PAGINACIÓN */}
            {empleados.length > 0 && (
              <div className="paginacion-container">
                <div className="paginacion-info">
                  Mostrando {((paginaActual - 1) * empleadosPorPagina) + 1} - {Math.min(paginaActual * empleadosPorPagina, empleados.length)} de {empleados.length} empleados
                </div>
                
                <div className="paginacion-controles">
                  <button 
                    className="btn-paginacion" 
                    onClick={irAPrimeraPagina}
                    disabled={paginaActual === 1}
                    title="Primera página"
                  >
                    <FaStepBackward />
                  </button>
                  
                  <button 
                    className="btn-paginacion" 
                    onClick={paginaAnterior}
                    disabled={paginaActual === 1}
                    title="Página anterior"
                  >
                    <FaChevronLeft />
                  </button>

                  <div className="numeros-pagina">
                    {obtenerRangoPaginas().map(numero => (
                      <button
                        key={numero}
                        className={`numero-pagina ${numero === paginaActual ? 'activa' : ''}`}
                        onClick={() => irAPagina(numero)}
                      >
                        {numero}
                      </button>
                    ))}
                  </div>

                  <button 
                    className="btn-paginacion" 
                    onClick={paginaSiguiente}
                    disabled={paginaActual === totalPaginas}
                    title="Página siguiente"
                  >
                    <FaChevronRight />
                  </button>
                  
                  <button 
                    className="btn-paginacion" 
                    onClick={irAUltimaPagina}
                    disabled={paginaActual === totalPaginas}
                    title="Última página"
                  >
                    <FaStepForward />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="sin-resultados">
            <div className="mensaje-inicial">
              <h3>No hay empleados registrados</h3>
              <p>Comience agregando un nuevo empleado</p>
              {!modoLectura && (
                <button className="btn-nuevo-empleado" onClick={handleCrearEmpleado} style={{marginTop: '10px'}}>
                  <FaPlus /> Agregar primer empleado
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE DETALLES DEL EMPLEADO */}
      {mostrarModalDetalles && empleadoSeleccionado && (
        <div className="modal-overlay" onClick={() => setMostrarModalDetalles(false)}>
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalles del Empleado</h2>
              <button 
                className="btn-cerrar-modal"
                onClick={() => setMostrarModalDetalles(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detalles-empleado">
                <div className="detalle-item">
                  <strong>Nombre completo:</strong>
                  <span>{empleadoSeleccionado.nombre_emp} {empleadoSeleccionado.apellido_emp}</span>
                </div>
                
                <div className="detalle-item">
                  <strong>Cargo:</strong>
                  <span className={`badge-cargo ${empleadoSeleccionado.tipo_usuario}`}>
                    {empleadoSeleccionado.tipo_usuario === 'jefa' ? 'Jefa/Encargada' : 'Empleada'}
                  </span>
                </div>
                
                <div className="detalle-item">
                  <strong>DNI:</strong>
                  <span>{empleadoSeleccionado.dni_emp}</span>
                </div>
                
                <div className="detalle-item">
                  <strong>Teléfono:</strong>
                  <span>{empleadoSeleccionado.telefono_emp || 'No especificado'}</span>
                </div>
                
                <div className="detalle-item">
                  <strong>Email:</strong>
                  <span>{obtenerEmail(empleadoSeleccionado)}</span>
                </div>
                
                <div className="detalle-item">
                  <strong>Dirección:</strong>
                  <span>{empleadoSeleccionado.domicilio_emp || 'No especificado'}</span>
                </div>
                
                <div className="detalle-item observaciones">
                  <strong>Observaciones:</strong>
                  <div className="texto-observaciones">
                    {obtenerObservaciones(empleadoSeleccionado)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <ModalConfirmacionUniversal
        mostrar={mostrarModalEliminar}
        tipo="eliminar"
        mensaje={mensajeModal}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setMostrarModalEliminar(false)}
        modo="empleado"
      />

      {/* MODAL DE ÉXITO */}
      <ModalConfirmacionUniversal
        mostrar={mostrarModalExito}
        tipo="exito"
        mensaje={mensajeModal}
        onConfirmar={() => setMostrarModalExito(false)}
        onCancelar={() => setMostrarModalExito(false)}
        modo="empleado"
      />

      {/* MODAL DE ERROR */}
      <ModalConfirmacionUniversal
        mostrar={mostrarModalError}
        tipo="error"
        mensaje={mensajeModal}
        onConfirmar={() => setMostrarModalError(false)}
        onCancelar={() => setMostrarModalError(false)}
        modo="empleado"
      />
    </div>
  );
}

export default Empleados;