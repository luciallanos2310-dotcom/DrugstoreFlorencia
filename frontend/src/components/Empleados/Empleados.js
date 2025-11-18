import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaEye, FaEyeSlash } from 'react-icons/fa';
import FormularioEmpleado from './FormularioEmpleado';
import ModalConfirmacionUniversal from '../ModalConfirmacionUniversal';
import './Empleados.css';

function Empleados({ usuario }) {
  const [empleados, setEmpleados] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoFormulario, setModoFormulario] = useState('crear');
  const [empleadoEditando, setEmpleadoEditando] = useState(null);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  
  // Estados para modales
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [mostrarModalDetalles, setMostrarModalDetalles] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
  const [empleadoAEliminar, setEmpleadoAEliminar] = useState(null);
  const [mensajeModal, setMensajeModal] = useState('');

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
        setEmpleados(data);
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

  // Filtrar empleados basado en la búsqueda
  const empleadosFiltrados = empleados.filter(empleado => {
    const nombreCompleto = `${empleado.nombre_emp} ${empleado.apellido_emp}`.toLowerCase();
    const terminoBusqueda = busqueda.toLowerCase();
    return nombreCompleto.includes(terminoBusqueda) ||
           empleado.dni_emp.toString().includes(busqueda) ||
           empleado.email?.toLowerCase().includes(terminoBusqueda);
  });

  // Determinar qué empleados mostrar
  const mostrarEmpleados = busqueda || mostrarTodos;
  const empleadosAMostrar = mostrarEmpleados ? empleadosFiltrados : [];

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
    return empleado.observaciones || empleado.info_adicional || 'No hay observaciones';
  };

  const handleCrearEmpleado = () => {
    setModoFormulario('crear');
    setEmpleadoEditando(null);
    setMostrarFormulario(true);
  };

  const handleEditarEmpleado = (empleado) => {
    setModoFormulario('editar');
    setEmpleadoEditando(empleado);
    setMostrarFormulario(true);
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

  const handleGuardarEmpleado = async (datosEmpleado) => {
    try {
      setCargando(true);
      const token = localStorage.getItem('token');
      const url = modoFormulario === 'crear' 
        ? '/api/empleados/' 
        : `/api/empleados/${empleadoEditando.id}/`;
      
      const method = modoFormulario === 'crear' ? 'POST' : 'PUT';
      
      // Preparar datos para enviar
      const datosParaEnviar = {
        nombre_emp: datosEmpleado.nombre_emp.trim(),
        apellido_emp: datosEmpleado.apellido_emp.trim(),
        dni_emp: parseInt(datosEmpleado.dni_emp),
        telefono_emp: datosEmpleado.telefono_emp.trim(),
        domicilio_emp: datosEmpleado.domicilio_emp.trim(),
        tipo_usuario: datosEmpleado.tipo_usuario,
        email: datosEmpleado.email.trim(),
        observaciones: datosEmpleado.observaciones?.trim() || '',
        ...(modoFormulario === 'crear' && { 
          password: datosEmpleado.password 
        })
      };

      console.log('📤 Enviando datos al servidor:', datosParaEnviar);
      console.log('🔗 URL:', url);
      console.log('🔧 Método:', method);

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(datosParaEnviar)
      });

      console.log('📥 Respuesta del servidor - Status:', response.status);

      if (!response.ok) {
        // Obtener el error detallado del servidor
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: 'Error desconocido del servidor' };
        }
        console.error('❌ Error del servidor:', errorData);
        throw new Error(`Error ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const responseData = await response.json();
      console.log('✅ Respuesta exitosa:', responseData);

      setMostrarFormulario(false);
      await cargarEmpleados();
      setMensajeModal(modoFormulario === 'crear' 
        ? 'Empleado creado exitosamente' 
        : 'Empleado actualizado exitosamente');
      setMostrarModalExito(true);

    } catch (error) {
      console.error('❌ Error guardando empleado:', error);
      setMensajeModal(`Error: ${error.message}`);
      setMostrarModalError(true);
    } finally {
      setCargando(false);
    }
  };

  const limpiarBusqueda = () => {
    setBusqueda('');
  };

  // Efecto para resetear mostrarTodos cuando se realiza una búsqueda
  useEffect(() => {
    if (busqueda) {
      setMostrarTodos(false);
    }
  }, [busqueda]);

  if (mostrarFormulario) {
    return (
      <FormularioEmpleado
        modo={modoFormulario}
        empleado={empleadoEditando}
        onGuardar={handleGuardarEmpleado}
        onCancelar={() => setMostrarFormulario(false)}
      />
    );
  }

  return (
    <div className="empleados-container">
      <div className="empleados-header">
        <h1>Empleados</h1>
        <div className="empleados-acciones">
          <button 
            className="btn-nuevo-empleado"
            onClick={handleCrearEmpleado}
            disabled={cargando}
          >
            <FaPlus /> {cargando ? 'Cargando...' : 'Agregar nuevo empleado'}
          </button>
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
        <div className="estado-busqueda">
          {busqueda && (
            <span>
              {empleadosFiltrados.length} resultado{empleadosFiltrados.length !== 1 ? 's' : ''} encontrado{empleadosFiltrados.length !== 1 ? 's' : ''}
              {empleadosFiltrados.length === 0 && ' - No se encontraron empleados'}
            </span>
          )}
        </div>
      </div>

      {/* Controles de visualización */}
      {!busqueda && (
        <div className="controles-visualizacion">
          <button 
            className="btn-mostrar-todos"
            onClick={() => setMostrarTodos(!mostrarTodos)}
            disabled={empleadosFiltrados.length === 0 || cargando}
          >
            {mostrarTodos ? 'Mostrar menos' : `Mostrar todos los empleados (${empleadosFiltrados.length})`}
          </button>
        </div>
      )}

      {/* Lista de empleados */}
      <div className="lista-empleados">
        {cargando && !mostrarFormulario ? (
          <div className="cargando-empleados">
            <div className="loading-spinner"></div>
            Cargando empleados...
          </div>
        ) : !mostrarEmpleados ? (
          <div className="sin-resultados">
            {!busqueda && "Presiona 'Mostrar todos los empleados' para ver la lista completa"}
          </div>
        ) : empleadosAMostrar.length === 0 ? (
          <div className="sin-resultados">
            {busqueda ? 'No se encontraron empleados que coincidan con la búsqueda.' : 'No hay empleados registrados.'}
          </div>
        ) : (
          empleadosAMostrar.map(empleado => {
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
                  </div>
                </div>
                
                <div className="empleado-info">
                  {/* Información básica - siempre visible */}
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
                  </div>
                </div>
              </div>
            );
          })
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