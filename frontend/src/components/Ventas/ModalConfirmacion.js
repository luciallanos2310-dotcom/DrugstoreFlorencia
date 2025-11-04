// ModalConfirmacion.js
import React from 'react';
import '../Ventas/Ventas.css';

function ModalConfirmacion({ 
  mostrar, 
  tipo, 
  mensaje, 
  onConfirmar, 
  onCancelar,
  datosVenta 
}) {
  if (!mostrar) return null;

  const getTitulo = () => {
    switch(tipo) {
      case 'confirmar': return 'Confirmar Venta Saeta';
      case 'cancelar': return 'Cancelar Venta';
      case 'exito': return '¡Venta Exitosa!';
      case 'error': return 'Error en Venta';
      default: return 'Confirmar Acción';
    }
  };

  const getTextoBoton = () => {
    switch(tipo) {
      case 'confirmar': return 'Confirmar Venta';
      case 'cancelar': return 'Sí, Cancelar';
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
          
          {/* SOLO MOSTRAR RESUMEN PARA VENTAS NORMALES, NO PARA SAETA */}
          {tipo === 'confirmar' && datosVenta && datosVenta.metodoPago && (
            <div className="resumen-venta-modal">
              <h4>Resumen de la Venta:</h4>
              <p><strong>Total:</strong> ${datosVenta.total?.toFixed(2)}</p>
              <p><strong>Método de pago:</strong> {datosVenta.metodoPago === 'efectivo' ? 'Efectivo' : 'Transferencia'}</p>
              {datosVenta.metodoPago === 'efectivo' && (
                <>
                  <p><strong>Monto recibido:</strong> ${datosVenta.montoRecibido?.toFixed(2)}</p>
                  <p><strong>Vuelto:</strong> ${datosVenta.vuelto?.toFixed(2)}</p>
                </>
              )}
              <p><strong>Productos:</strong> {datosVenta.cantidadProductos} items</p>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          {!esAlerta && (
            <button className="btn-cancelar" onClick={onCancelar}>
              {tipo === 'cancelar' ? 'No, Continuar' : 'Cancelar'}
            </button>
          )}
          <button 
            className={`btn-confirmar ${tipo === 'exito' ? 'btn-exito' : ''} ${tipo === 'cancelar' ? 'btn-eliminar' : ''}`}
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