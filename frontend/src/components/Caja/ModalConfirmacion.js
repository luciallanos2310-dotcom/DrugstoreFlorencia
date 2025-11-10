import React from 'react';
import '../Empleados/Empleados.css';

function ModalConfirmacion({ mostrar, tipo, mensaje, onConfirmar, onCancelar, datosApertura, datosVenta }) {
  if (!mostrar) return null;

  // Determinar el título y texto del botón según el tipo
  const getTitulo = () => {
    switch(tipo) {
      case 'confirmar': return 'Confirmar Acción';
      case 'exito': return '¡Éxito!';
      case 'error': return 'Error';
      case 'cancelar': return 'Confirmar Cancelación';
      default: return 'Confirmar Acción';
    }
  };

  const getTextoBoton = () => {
    switch(tipo) {
      case 'confirmar': return 'Confirmar';
      case 'exito': return 'Aceptar';
      case 'error': return 'Aceptar';
      case 'cancelar': return 'Confirmar';
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
          
          {/* Resumen para apertura de caja */}
          {tipo === 'confirmar' && datosApertura && (
            <div className="resumen-apertura">
              <p><strong>Empleado:</strong> {datosApertura.empleadoNombre}</p>
              <p><strong>Fecha:</strong> {datosApertura.fecha}</p>
              <p><strong>Hora:</strong> {datosApertura.hora}</p>
              <p><strong>Turno:</strong> {datosApertura.turnoNombre}</p>
              <p><strong>Monto Inicial:</strong> ${parseFloat(datosApertura.montoInicial || 0).toFixed(2)}</p>
            </div>
          )}
          
          {/* Resumen para ventas */}
          {tipo === 'confirmar' && datosVenta && (
            <div className="resumen-venta">
              <p><strong>Total:</strong> ${datosVenta.total?.toFixed(2) || '0.00'}</p>
              <p><strong>Método de pago:</strong> {datosVenta.metodoPago}</p>
              <p><strong>Productos:</strong> {datosVenta.cantidadProductos}</p>
              {datosVenta.metodoPago === 'efectivo' && (
                <>
                  <p><strong>Monto recibido:</strong> ${datosVenta.montoRecibido?.toFixed(2) || '0.00'}</p>
                  <p><strong>Vuelto:</strong> ${datosVenta.vuelto?.toFixed(2) || '0.00'}</p>
                </>
              )}
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
            <button className="boton-cancelar" onClick={onCancelar}>
              Cancelar
            </button>
          )}
          <button 
            className={`boton-confirmar ${tipo === 'exito' ? 'btn-exito' : ''} ${tipo === 'cancelar' ? 'btn-cancelar-accion' : ''}`}
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