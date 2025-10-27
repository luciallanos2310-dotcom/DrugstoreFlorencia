// src/components/Comunes/ConfirmacionModal.js
import React from 'react';
import './Empleados.css';

function ConfirmacionModal({ mostrar, tipo, mensaje, onConfirmar, onCancelar }) {
  if (!mostrar) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-confirmacion">
        <div className="modal-header">
          <h3>
            {tipo === 'eliminar' ? 'Eliminar Empleado' : 'Confirmar Acción'}
          </h3>
        </div>
        
        <div className="modal-body">
          <p>{mensaje}</p>
        </div>
        
        <div className="modal-acciones">
          <button className="btn-cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button 
            className={`btn-confirmar ${tipo === 'eliminar' ? 'btn-eliminar' : ''}`}
            onClick={onConfirmar}
          >
            {tipo === 'eliminar' ? 'Eliminar' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmacionModal;