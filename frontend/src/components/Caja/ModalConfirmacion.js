// src/components/AperturaCaja/ModalAperturaCaja.js
import React from 'react';
import '../Empleados/Empleados.css';

function ModalConfirmacion({ mostrar, tipo, mensaje, onConfirmar, onCancelar, datosApertura }) {
  if (!mostrar) return null;

  // Determinar el título y texto del botón según el tipo
  const getTitulo = () => {
    switch(tipo) {
      case 'confirmar': return 'Confirmar Apertura de Caja';
      case 'exito': return '¡Caja Abierta!';
      case 'error': return 'Error';
      default: return 'Confirmar Acción';
    }
  };

  const getTextoBoton = () => {
    switch(tipo) {
      case 'confirmar': return 'Confirmar';
      case 'exito': return 'Aceptar';
      case 'error': return 'Aceptar';
      default: return 'Confirmar';
    }
  };

  const esAlerta = tipo === 'exito' || tipo === 'error';

  return (
    <div className="modal-overlay">
      <div className="modal-contenedor">
        <div className="modal-header">
          <h3>{getTitulo()}</h3>
        </div>
        
        <div className="modal-body">
          <p>{mensaje}</p>
          
          {tipo === 'confirmar' && datosApertura && (
            <div className="resumen-apertura">
              <p><strong>Empleado:</strong> {datosApertura.empleadoNombre}</p>
              <p><strong>Fecha:</strong> {datosApertura.fecha}</p>
              <p><strong>Hora:</strong> {datosApertura.hora}</p>
              <p><strong>Turno:</strong> {datosApertura.turnoNombre}</p>
              <p><strong>Monto Inicial:</strong> ${parseFloat(datosApertura.montoInicial).toFixed(2)}</p>
            </div>
          )}
          
          {tipo === 'exito' && datosApertura && (
            <div className="resumen-apertura">
              <p><strong>Empleado:</strong> {datosApertura.empleadoNombre}</p>
              <p><strong>Turno:</strong> {datosApertura.turnoNombre}</p>
              <p>Redirigiendo a ventas...</p>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          {!esAlerta && (
            <button className="btn-cancelar" onClick={onCancelar}>
              Cancelar
            </button>
          )}
          <button 
            className={`btn-confirmar ${tipo === 'exito' ? 'btn-exito' : ''}`}
            onClick={esAlerta ? onCancelar : onConfirmar}
          >
            {getTextoBoton()}
          </button>
        </div>
      </div>
    </div>
  ); 
}

export default ModalConfirmacion;