// src/components/Empleados/Empleados.js
import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaEye, FaEyeSlash } from 'react-icons/fa';
import FormularioEmpleado from '../Empleados/FormularioEmpleado';
import ModalConfirmacion from '../Empleados/ModalConfirmacion';
import './Empleados.css';

function Empleados({ usuario }) {
  const [empleados, setEmpleados] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoFormulario, setModoFormulario] = useState('crear');
  const [empleadoEditando, setEmpleadoEditando] = useState(null);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [empleadosExpandidos, setEmpleadosExpandidos] = useState({});
  const [modalConfirmacion, setModalConfirmacion] = useState({
    mostrar: false,
    tipo: '',
    empleado: null,
    mensaje: ''
  });

  // Cargar empleados desde la API
  const cargarEmpleados = async () => {
    try {
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
      }
    } catch (error) {
      console.error('Error cargando empleados:', error);
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

  // Función para expandir/contraer información de un empleado
  const toggleExpandirEmpleado = (empleadoId) => {
    setEmpleadosExpandidos(prev => ({
      ...prev,
      [empleadoId]: !prev[empleadoId]
    }));
  };

  // Obtener email del empleado - FIX para el problema del email
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
    setModalConfirmacion({
      mostrar: true,
      tipo: 'eliminar',
      empleado: empleado,
      mensaje: `¿Está seguro que desea eliminar al empleado ${empleado.nombre_emp} ${empleado.apellido_emp}? Esta acción no se puede deshacer.`
    });
  };

  const confirmarEliminacion = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/empleados/${modalConfirmacion.empleado.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await cargarEmpleados();
        setModalConfirmacion({
          mostrar: true,
          tipo: 'exito',
          empleado: null,
          mensaje: 'Empleado eliminado exitosamente'
        });
      } else {
        const errorData = await response.json();
        setModalConfirmacion({
          mostrar: true,
          tipo: 'error',
          empleado: null,
          mensaje: `Error al eliminar empleado: ${errorData.error}`
        });
      }
    } catch (error) {
      console.error('Error eliminando empleado:', error);
      setModalConfirmacion({
        mostrar: true,
        tipo: 'error',
        empleado: null,
        mensaje: 'Error de conexión al eliminar empleado'
      });
    }
  };

  const handleGuardarEmpleado = async (datosEmpleado) => {
    try {
      const token = localStorage.getItem('token');
      const url = modoFormulario === 'crear' 
        ? '/api/empleados/' 
        : `/api/empleados/${empleadoEditando.id}/`;
      
      const method = modoFormulario === 'crear' ? 'POST' : 'PUT';
      
      const datosParaEnviar = {
        nombre_emp: datosEmpleado.nombre_emp,
        apellido_emp: datosEmpleado.apellido_emp,
        dni_emp: parseInt(datosEmpleado.dni_emp),
        telefono_emp: datosEmpleado.telefono_emp,
        domicilio_emp: datosEmpleado.domicilio_emp,
        tipo_usuario: datosEmpleado.tipo_usuario,
        email: datosEmpleado.email,
        observaciones: datosEmpleado.observaciones,
        ...(modoFormulario === 'crear' && { password: datosEmpleado.password })
      };

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(datosParaEnviar)
      });

      const responseData = await response.json();

      if (response.ok) {
        setMostrarFormulario(false);
        await cargarEmpleados();
        setModalConfirmacion({
          mostrar: true,
          tipo: 'exito',
          empleado: null,
          mensaje: modoFormulario === 'crear' 
            ? 'Empleado creado exitosamente' 
            : 'Empleado actualizado exitosamente'
        });
      } else {
        const errorMsg = responseData.error || 'Error al guardar empleado';
        setModalConfirmacion({
          mostrar: true,
          tipo: 'error',
          empleado: null,
          mensaje: `Error: ${errorMsg}`
        });
      }
    } catch (error) {
      console.error('Error guardando empleado:', error);
      setModalConfirmacion({
        mostrar: true,
        tipo: 'error',
        empleado: null,
        mensaje: 'Error de conexión al guardar empleado'
      });
    }
  };

  const cerrarModal = () => {
    setModalConfirmacion({ 
      mostrar: false, 
      tipo: '', 
      empleado: null, 
      mensaje: '' 
    });
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
          >
            <FaPlus /> Agregar nuevo empleado
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="buscador-empleados">
        <div className="buscador-contenedor">
          <FaSearch className="icono-busqueda" />
          <input
            type="text"
            placeholder="Buscar empleados por nombre, apellido, DNI o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input-busqueda"
          />
          {busqueda && (
            <button 
              className="btn-limpiar-busqueda"
              onClick={limpiarBusqueda}
              title="Limpiar búsqueda"
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
            disabled={empleadosFiltrados.length === 0}
          >
            {mostrarTodos ? 'Mostrar menos' : `Mostrar todos los empleados (${empleadosFiltrados.length})`}
          </button>
        </div>
      )}

      {/* Lista de empleados - MEJORADO */}
      <div className="lista-empleados">
        {!mostrarEmpleados ? (
          <div className="sin-resultados">
            {!busqueda && "Presiona 'Mostrar todos los empleados' para ver la lista completa"}
          </div>
        ) : empleadosAMostrar.length === 0 ? (
          <div className="sin-resultados">
            {busqueda ? 'No se encontraron empleados que coincidan con la búsqueda.' : 'No hay empleados registrados.'}
          </div>
        ) : (
          empleadosAMostrar.map(empleado => {
            const estaExpandido = empleadosExpandidos[empleado.id];
            const email = obtenerEmail(empleado);
            const observaciones = obtenerObservaciones(empleado);
            
            return (
              <div key={empleado.id} className="tarjeta-empleado">
                <div className="empleado-header">
                  <h2>{empleado.nombre_emp} {empleado.apellido_emp}</h2>
                  <div className="empleado-acciones">
                    <button 
                      className="btn-expandir"
                      onClick={() => toggleExpandirEmpleado(empleado.id)}
                      title={estaExpandido ? 'Ver menos información' : 'Ver más información'}
                    >
                      {estaExpandido ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    <button 
                      className="btn-editar"
                      onClick={() => handleEditarEmpleado(empleado)}
                      title="Editar empleado"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="btn-eliminar"
                      onClick={() => handleEliminarEmpleado(empleado)}
                      title="Eliminar empleado"
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

                  {/* Información expandida - solo visible cuando se expande */}
                  {estaExpandido && (
                    <div className="info-expandida">
                      <div className="info-item">
                        <strong>DNI:</strong> {empleado.dni_emp}
                      </div>
                      <div className="info-item">
                        <strong>Dirección:</strong> {empleado.domicilio_emp || 'No especificado'}
                      </div>
                      <div className="info-item observaciones">
                        <strong>Observaciones:</strong> 
                        <div className="texto-observaciones">
                          {observaciones}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <ModalConfirmacion
        mostrar={modalConfirmacion.mostrar}
        tipo={modalConfirmacion.tipo}
        mensaje={modalConfirmacion.mensaje}
        onConfirmar={confirmarEliminacion}
        onCancelar={cerrarModal}
      />
    </div>
  );
}

export default Empleados;