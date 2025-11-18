import React from 'react';
import '../Empleados/Empleados.css';

function ModalConfirmacion({ mostrar, tipo, mensaje, onConfirmar, onCancelar, datosApertura, datosVenta }) {
  if (!mostrar) return null;

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
      case 'cancelar': return 'Sí, Cancelar';
      default: return 'Confirmar';
    }
  };

  const getTextoBotonCancelar = () => {
    switch(tipo) {
      
      default: return 'Cancelar';
      case 'cancelar': return 'No, Continuar';
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
          
          {/* Resumen para cierre de caja */}
          {tipo === 'confirmar' && datosVenta && datosVenta.totalTeorico !== undefined && (
            <div className="resumen-cierre">
              <h4>Resumen del Cierre:</h4>
              <p><strong>Total Teórico:</strong> ${datosVenta.totalTeorico?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p><strong>Monto Contado:</strong> ${datosVenta.montoContado?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              <p><strong>Diferencia:</strong> 
                <span className={datosVenta.diferencia >= 0 ? 'diferencia-positiva' : 'diferencia-negativa'}>
                  ${datosVenta.diferencia?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </p>
              {datosVenta.observaciones && (
                <p><strong>Observaciones:</strong> {datosVenta.observaciones}</p>
              )}
            </div>
          )}
          
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
          
          {/* Resumen para ventas normales */}
          {tipo === 'confirmar' && datosVenta && datosVenta.total !== undefined && (
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
        </div>
        
        <div className="modal-footer">
          {!esAlerta && (
            <button className="boton-cancelar" onClick={onCancelar}>
              {getTextoBotonCancelar()}
            </button>
          )}
          <button 
            className={`boton-confirmar ${tipo === 'exito' ? 'btn-exito' : ''} ${tipo === 'cancelar' ? 'btn-cancelar-accion' : ''}`}
            onClick={onConfirmar}
          >
            {getTextoBoton()}
          </button>
        </div>
      </div>
    </div>
  ); 
}

export default ModalConfirmacion;