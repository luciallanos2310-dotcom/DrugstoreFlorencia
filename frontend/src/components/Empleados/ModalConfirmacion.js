// src/components/Empleados/ModalConfirmacion.js
import React from 'react';
import './Empleados.css';

function ModalConfirmacion({ mostrar, tipo, mensaje, onConfirmar, onCancelar }) {
  if (!mostrar) return null;

  // Determinar el título y texto del botón según el tipo
  const getTitulo = () => {
    switch(tipo) {
      case 'eliminar': return 'Eliminar Empleado';
      case 'exito': return 'Éxito';
      case 'error': return 'Error';
      default: return 'Confirmar Acción';
    }
  };

  const getTextoBoton = () => {
    switch(tipo) {
      case 'eliminar': return 'Eliminar';
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
        </div>
        
        <div className="modal-footer">
          {!esAlerta && (
            <button className="btn-cancelar" onClick={onCancelar}>
              Cancelar
            </button>
          )}
          <button 
            className={`btn-confirmar ${tipo === 'eliminar' ? 'btn-eliminar' : ''} ${tipo === 'exito' ? 'btn-exito' : ''}`}
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