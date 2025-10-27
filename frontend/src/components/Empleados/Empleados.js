import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import FormularioEmpleado from './FormularioEmpleado';
import ConfirmacionModal from '../Empleados/ModalConfirmacion';
import './Empleados.css';

function Empleados({ usuario }) {
  const [empleados, setEmpleados] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [modoFormulario, setModoFormulario] = useState('crear');
  const [empleadoEditando, setEmpleadoEditando] = useState(null);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [modalConfirmacion, setModalConfirmacion] = useState({
    mostrar: false,
    tipo: '',
    empleado: null,
    mensaje: ''
  });

  // CLAVE: Obtener el rol del usuario
  const esJefa = usuario?.tipo_usuario === 'jefa';

  // Cargar empleados desde la API
  const cargarEmpleados = async () => {
    // Si no es jefa, no intenta cargar la lista completa
    if (!esJefa) {
        setEmpleados([]); 
        return;
    }

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
        const errorData = await response.json();
        console.error('Error cargando empleados:', errorData.error);
        // Si el backend devuelve 403 (Permiso Denegado), se muestra el error.
        if (response.status === 403) {
             // Esto puede suceder si el backend no pudo verificar el rol por un problema de la DB
             alert(`Error de permisos del backend: ${errorData.error}. Por favor, revise su perfil de usuario.`);
        }
      }
    } catch (error) {
      console.error('Error de conexión al cargar empleados:', error);
    }
  };

  useEffect(() => {
    // Cuando el rol de usuario cambia, intenta cargar
    cargarEmpleados();
  }, [esJefa]);

  // Las funciones de gestión solo deben ser llamadas si es Jefa (aunque el backend lo controla)
  const handleCrearEmpleado = () => {
    if (!esJefa) return; 
    setModoFormulario('crear');
    setEmpleadoEditando(null);
    setMostrarFormulario(true);
  };

  const handleEditarEmpleado = (empleado) => {
    if (!esJefa) return;
    setModoFormulario('editar');
    setEmpleadoEditando(empleado);
    setMostrarFormulario(true);
  };

  const handleEliminarEmpleado = (empleado) => {
    if (!esJefa) return;
    setModalConfirmacion({
      mostrar: true,
      tipo: 'eliminar',
      empleado: empleado,
      mensaje: `¿Está seguro que desea eliminar al empleado ${empleado.nombre_emp} ${empleado.apellido_emp}?`
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
        cargarEmpleados();
        setModalConfirmacion({ mostrar: false, tipo: '', empleado: null, mensaje: '' });
        alert('Empleado eliminado exitosamente');
      } else {
        const errorData = await response.json();
        alert(`Error al eliminar empleado: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error eliminando empleado:', error);
      alert('Error de conexión al eliminar empleado');
    }
  };

  const handleGuardarEmpleado = async (datosEmpleado) => {
     // Lógica de guardar (ya protegida por el backend)
     // ... (mantén tu lógica original aquí)
  };

  const empleadosAMostrar = mostrarTodos ? empleados : empleados.slice(0, 3);

  // CLAVE: Bloquea el renderizado principal si no es Jefa
  if (!esJefa) {
    return (
        <div className="empleados-container">
            <h1>Empleados</h1>
            <div className="acceso-denegado-banner">
                <p>⚠️ **ACCESO DENEGADO**. Solo la Jefa/Encargada puede gestionar el módulo de empleados.</p>
                <p>Si eres la Jefa, verifica que tu perfil esté configurado correctamente en el sistema (rol 'jefa').</p>
            </div>
        </div>
    );
  }

  // Muestra el formulario de edición/creación si está activo
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

  // Renderizado para la Jefa/Encargada
  return (
    <div className="empleados-container">
      <div className="empleados-header">
        <h1>Empleados</h1>
        <div className="empleados-acciones">
          <button 
            className="btn-mostrar-todos"
            onClick={() => setMostrarTodos(!mostrarTodos)}
          >
            {mostrarTodos ? 'Mostrar menos' : 'Mostrar todos los empleados'}
          </button>
          
          {/* Botón de Agregar visible para la Jefa */}
          <button 
            className="btn-nuevo-empleado"
            onClick={handleCrearEmpleado}
          >
            <FaPlus /> Agregar nuevo empleado
          </button>
        </div>
      </div>

      <div className="lista-empleados">
        {empleadosAMostrar.map(empleado => (
          <div key={empleado.id} className="tarjeta-empleado">
            <div className="empleado-header">
              <h2>{empleado.nombre_emp} {empleado.apellido_emp}</h2>
              <div className="empleado-acciones">
                
                {/* Botones de Editar y Eliminar visibles para la Jefa */}
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
                <strong>Email:</strong> {empleado.user?.email || 'No especificado'}
              </div>
              <div className="info-item">
                <strong>DNI:</strong> {empleado.dni_emp}
              </div>
              <div className="info-item">
                <strong>Dirección:</strong> {empleado.domicilio_emp || 'No especificado'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmacionModal
        mostrar={modalConfirmacion.mostrar}
        tipo={modalConfirmacion.tipo}
        mensaje={modalConfirmacion.mensaje}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setModalConfirmacion({ mostrar: false, tipo: '', empleado: null, mensaje: '' })}
      />
    </div>
  );
}

export default Empleados;
