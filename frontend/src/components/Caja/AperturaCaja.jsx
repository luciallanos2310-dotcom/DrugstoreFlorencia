// src/components/Caja/AperturaCaja.js
import React, { useState } from 'react';
import './AperturaCaja.css';

function AperturaCaja({ onAperturaConfirmada, empleados, turnos }) {
  const [datosApertura, setDatosApertura] = useState({
    fecha: new Date().toLocaleDateString('en-US'),
    hora: '00:00',
    empleado: '',
    turno: '',
    montoInicial: '',
    observaciones: ''
  });

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatosApertura(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConfirmarApertura = () => {
    setMostrarConfirmacion(true);
  };

  const handleConfirmacionFinal = () => {
    // Aquí iría la lógica para guardar la apertura en la base de datos
    console.log('Datos de apertura:', datosApertura);
    onAperturaConfirmada(datosApertura);
    setMostrarConfirmacion(false);
  };

  const handleCancelarConfirmacion = () => {
    setMostrarConfirmacion(false);
  };

  return (
    <div className="apertura-caja-container">
      <div className="apertura-caja-card">
        <h1>Apertura de caja</h1>
        <p className="subtitulo">Completo los siguientes datos para registrar la apertura de caja.</p>

        <div className="formulario-apertura">
          <div className="campo-grupo">
            <label>Fecha de apertura:</label>
            <input
              type="date"
              name="fecha"
              value={datosApertura.fecha}
              onChange={handleChange}
              className="campo-input"
            />
          </div>

          <div className="campo-grupo">
            <label>Hora de apertura:</label>
            <div className="hora-opciones">
              {['00:00', '08:00', '14:00', '16:00'].map(hora => (
                <button
                  key={hora}
                  type="button"
                  className={`hora-btn ${datosApertura.hora === hora ? 'seleccionada' : ''}`}
                  onClick={() => setDatosApertura(prev => ({ ...prev, hora }))}
                >
                  {hora}
                </button>
              ))}
            </div>
          </div>

          <div className="campo-grupo">
            <label>Empleado/a:</label>
            <select
              name="empleado"
              value={datosApertura.empleado}
              onChange={handleChange}
              className="campo-input"
            >
              <option value="">Seleccionar empleado/a</option>
              {empleados.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="campo-grupo">
            <label>Turno:</label>
            <select
              name="turno"
              value={datosApertura.turno}
              onChange={handleChange}
              className="campo-input"
            >
              <option value="">Seleccionar turno</option>
              {turnos.map(turno => (
                <option key={turno.id} value={turno.id}>
                  {turno.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="campo-grupo">
            <label>Monto inicial:</label>
            <input
              type="number"
              name="montoInicial"
              value={datosApertura.montoInicial}
              onChange={handleChange}
              placeholder="0.00"
              className="campo-input"
            />
          </div>

          <div className="campo-grupo">
            <label>Notas / Observaciones:</label>
            <textarea
              name="observaciones"
              value={datosApertura.observaciones}
              onChange={handleChange}
              placeholder="Escrito aquí"
              className="campo-textarea"
              rows="3"
            />
          </div>
        </div>

        <div className="acciones-apertura">
          <button className="btn-cancelar">Cancelar</button>
          <button 
            className="btn-confirmar"
            onClick={handleConfirmarApertura}
            disabled={!datosApertura.empleado || !datosApertura.turno || !datosApertura.montoInicial}
          >
            Confirmar apertura
          </button>
        </div>
      </div>

      {/* Modal de confirmación */}
      {mostrarConfirmacion && (
        <div className="modal-confirmacion">
          <div className="modal-contenido">
            <h3>Confirmar apertura</h3>
            <p>¿Está seguro que desea confirmar la apertura?</p>
            <div className="modal-acciones">
              <button 
                className="btn-cancelar"
                onClick={handleCancelarConfirmacion}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirmar"
                onClick={handleConfirmacionFinal}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AperturaCaja;