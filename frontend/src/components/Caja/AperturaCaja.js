import React, { useState, useEffect } from 'react';
import { FaCashRegister, FaCalendarAlt, FaUser, FaCheck, FaTimes, FaClock, FaMoneyBillWave, FaStickyNote } from 'react-icons/fa';
import './AperturaCaja.css';
import ModalConfirmacion from './ModalConfirmacion';

function AperturaCaja({ onAperturaConfirmada, onCancelar, cajaAbierta, datosCaja }) {
  const [datosApertura, setDatosApertura] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora: '08:00',
    empleado: '',
    turno: '',
    montoInicial: '',
    descripcion: ''
  });

  const [empleados, setEmpleados] = useState([]);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);
  const [errores, setErrores] = useState({});
  const [cajaLocalAbierta, setCajaLocalAbierta] = useState(null);

  // Solo turnos mañana y tarde
  const turnos = [
    { id: 'mañana', nombre: 'Turno Mañana' },
    { id: 'tarde', nombre: 'Turno Tarde' }
  ];

  // Cargar empleados desde la API
  const cargarEmpleados = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/empleados/', {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatosApertura(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errores[name]) {
      setErrores(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!datosApertura.fecha) nuevosErrores.fecha = 'La fecha de apertura es requerida';
    if (!datosApertura.hora) nuevosErrores.hora = 'La hora de apertura es requerida';
    if (!datosApertura.empleado) nuevosErrores.empleado = 'Debe seleccionar un empleado';
    if (!datosApertura.turno) nuevosErrores.turno = 'Debe seleccionar un turno';
    if (!datosApertura.montoInicial) nuevosErrores.montoInicial = 'El monto inicial es requerido';
    else if (parseFloat(datosApertura.montoInicial) <= 0) nuevosErrores.montoInicial = 'El monto debe ser mayor a 0';

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleConfirmarApertura = () => {
    if (validarFormulario()) {
      setMostrarConfirmacion(true);
    }
  };

  const handleConfirmacionFinal = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Preparar datos para enviar a la API
      const datosParaEnviar = {
        empleado: parseInt(datosApertura.empleado),
        fecha_hs_apertura: `${datosApertura.fecha}T${datosApertura.hora}:00`,
        saldo_inicial: parseFloat(datosApertura.montoInicial),
        turno: datosApertura.turno,
        descripcion: datosApertura.descripcion,
        estado: 'abierta'
      };

      console.log('Enviando datos de apertura:', datosParaEnviar);

      const response = await fetch('http://localhost:8000/api/cajas/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(datosParaEnviar)
      });

      if (response.ok) {
        const cajaCreada = await response.json();
        console.log('Caja abierta exitosamente:', cajaCreada);
        
        // Preparar datos para mostrar en el estado de caja
        const datosCajaParaMostrar = {
          empleadoNombre: empleadoSeleccionado ? 
            `${empleadoSeleccionado.nombre_emp} ${empleadoSeleccionado.apellido_emp}` : '',
          turnoNombre: turnoSeleccionado ? turnoSeleccionado.nombre : '',
          montoInicial: datosApertura.montoInicial,
          saldo_inicial: parseFloat(datosApertura.montoInicial),
          turno: datosApertura.turno,
          fecha_hs_apertura: `${datosApertura.fecha}T${datosApertura.hora}:00`,
          id: cajaCreada.id,
          descripcion: datosApertura.descripcion
        };

        // Guardar datos de caja abierta en el estado local
        setCajaLocalAbierta(datosCajaParaMostrar);
        
        // Mostrar modal de éxito
        setMostrarExito(true);
        setMostrarConfirmacion(false);
        
        // Llamar a la función del padre para actualizar el estado global
        if (onAperturaConfirmada) {
          onAperturaConfirmada(datosCajaParaMostrar);
        }
        
      } else {
        const errorData = await response.json();
        console.error('Error al abrir caja:', errorData);
        alert('Error al abrir caja: ' + JSON.stringify(errorData));
        setMostrarConfirmacion(false);
      }
    } catch (error) {
      console.error('Error al abrir caja:', error);
      alert('Error de conexión al abrir caja');
      setMostrarConfirmacion(false);
    }
  };

  const empleadoSeleccionado = empleados.find(emp => emp.id === parseInt(datosApertura.empleado));
  const turnoSeleccionado = turnos.find(t => t.id === datosApertura.turno);

  // Preparar datos para el modal
  const datosModal = {
    empleadoNombre: empleadoSeleccionado ? `${empleadoSeleccionado.nombre_emp} ${empleadoSeleccionado.apellido_emp}` : '',
    fecha: datosApertura.fecha,
    hora: datosApertura.hora,
    turnoNombre: turnoSeleccionado ? turnoSeleccionado.nombre : '',
    montoInicial: datosApertura.montoInicial
  };

  // Si hay una caja abierta (ya sea local o del padre), mostrar el estado
  const cajaActual = cajaLocalAbierta || datosCaja;
  
  if (cajaAbierta && cajaActual) {
    return (
      <div className="estado-caja-abierta-container">
        <div className="estado-caja-card">
          <div className="estado-header">
            <div className="estado-badge abierta">
              <FaCashRegister /> Caja Actualmente Abierta
            </div>
            <div className="info-fecha">
              <FaCalendarAlt /> {new Date(cajaActual.fecha_hs_apertura).toLocaleDateString('es-AR')}
            </div>
          </div>

          <div className="info-caja-detalle">
            <div className="info-item">
              <p><FaUser /></p> 
              <span className="label">Empleada:</span>
              <span className="value">{cajaActual.empleadoNombre}</span>
            </div>
            
            <div className="info-item">
              <p><FaClock /></p>
              <span className="label">Turno:</span>
              <span className="value">{cajaActual.turnoNombre}</span>
            </div>
            
            <div className="info-item"> 
              <p><FaMoneyBillWave /></p>  
              <span className="label">Monto Inicial:</span>
              <span className="value">${parseFloat(cajaActual.saldo_inicial).toLocaleString('es-AR', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}</span>
            </div>

            {cajaActual.descripcion && (
              <div className="info-item">
                <FaStickyNote />
                <span className="label">Descripción:</span>
                <span className="value">{cajaActual.descripcion}</span>
              </div>
            )}
          </div>   

          <div className="acciones-caja-abierta">
            <button 
              className="btn-ir-ventas"
              onClick={() => {
                if (onAperturaConfirmada) {
                  onAperturaConfirmada(cajaActual);
                }
              }}
            >
              Ir a Ventas
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Estado normal - formulario de apertura de caja
  return (
    <div className="apertura-caja-container">
      <div className="apertura-caja-card">
        <div className="apertura-header">
          <h1>Apertura de caja</h1>
          <p className="subtitulo">Complete los siguientes datos para registrar la apertura de caja.</p>
        </div>

        <form className="formulario-apertura" onSubmit={(e) => e.preventDefault()}>
          {/* Fecha de apertura */}
          <div className="campo-grupo">
            <label htmlFor="fecha">
              Fecha de apertura:
            </label>
            <div className="input-with-icon">
              <input
                type="date"
                id="fecha"
                name="fecha"
                value={datosApertura.fecha}
                onChange={handleChange}
                className={`campo-input ${errores.fecha ? 'error' : ''}`}
              />
            </div>
            {errores.fecha && <span className="mensaje-error">{errores.fecha}</span>}
          </div>

          {/* Hora de apertura */}
          <div className="campo-grupo">
            <label htmlFor="hora">
              Hora de apertura:
            </label>
            <div className="input-with-icon">
              <input
                type="time"
                id="hora"
                name="hora"
                value={datosApertura.hora}
                onChange={handleChange}
                className={`campo-input ${errores.hora ? 'error' : ''}`}
              />
            </div>
            {errores.hora && <span className="mensaje-error">{errores.hora}</span>}
          </div>

          {/* Empleado */}
          <div className="campo-grupo">
            <label htmlFor="empleado">
              Empleada/o:
            </label>
            <div className="input-with-icon">
              <select
                id="empleado"
                name="empleado"
                value={datosApertura.empleado}
                onChange={handleChange}
                className={`campo-input ${errores.empleado ? 'error' : ''}`}
              >
                <option value="">Seleccionar empleada/o</option>
                {empleados.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre_emp} {emp.apellido_emp}
                  </option>
                ))}
              </select>
            </div>
            {errores.empleado && <span className="mensaje-error">{errores.empleado}</span>}
          </div>

          {/* Turno */}
          <div className="campo-grupo">
            <label htmlFor="turno">
              Turno:
            </label>
            <div className="input-with-icon">
              <select
                id="turno"
                name="turno"
                value={datosApertura.turno}
                onChange={handleChange}
                className={`campo-input ${errores.turno ? 'error' : ''}`}
              >
                <option value="">Seleccionar turno</option>
                {turnos.map(turno => (
                  <option key={turno.id} value={turno.id}>
                    {turno.nombre}
                  </option>
                ))}
              </select>
            </div>
            {errores.turno && <span className="mensaje-error">{errores.turno}</span>}
          </div>

          {/* Monto inicial */}
          <div className="campo-grupo">
            <label htmlFor="montoInicial">
              Monto inicial:
            </label>
            <div className="input-with-icon">
              <input
                type="number"
                id="montoInicial"
                name="montoInicial"
                value={datosApertura.montoInicial}
                onChange={handleChange}
                placeholder="$"
                step="0.01"
                min="0"
                className={`campo-input ${errores.montoInicial ? 'error' : ''}`}
              />
            </div>
            {errores.montoInicial && <span className="mensaje-error">{errores.montoInicial}</span>}
          </div>

          {/* Descripción */}
          <div className="campo-grupo">
            <label htmlFor="descripcion">
              Descripción:
            </label>
            <div className="input-with-icon">
              <textarea
                id="descripcion"
                name="descripcion"
                value={datosApertura.descripcion}
                onChange={handleChange}
                placeholder="Escribe aquí"
                className="campo-textarea"
                rows="3"
              />
            </div>
          </div>

          <div className="acciones-apertura">
            <button type="button" className="btn-cancelar-caja" onClick={onCancelar}>
              Cancelar
            </button>
            <button 
              type="button"
              className="btn-confirmar-caja"
              onClick={handleConfirmarApertura}
            >
              Confirmar apertura
            </button>
          </div>
        </form>
      </div>

      {/* Modal de confirmación */}
      <ModalConfirmacion
        mostrar={mostrarConfirmacion}
        tipo="confirmar"
        mensaje="¿Está seguro que desea confirmar la apertura de caja?"
        onCancelar={() => setMostrarConfirmacion(false)}
        onConfirmar={handleConfirmacionFinal}
        datosApertura={datosModal}
      />

      {/* Modal de éxito */}
      <ModalConfirmacion
        mostrar={mostrarExito}
        tipo="exito"
        mensaje="¡Caja abierta correctamente!"
        onCancelar={() => setMostrarExito(false)}
        onConfirmar={() => setMostrarExito(false)}
        datosApertura={datosModal}
      />
    </div>
  );
}

export default AperturaCaja;