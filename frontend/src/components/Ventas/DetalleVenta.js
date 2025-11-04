// DetalleVenta.js
import React from 'react';
import { FaPlus, FaMinus, FaTimes, FaReceipt } from 'react-icons/fa';
import './Ventas.css';

function DetalleVenta({
  productosSeleccionados,
  eliminarProducto,
  actualizarCantidad,
  calcularTotal,
  metodoPago,
  setMetodoPago,
  montoRecibido,
  setMontoRecibido,
  calcularVuelto,
  setMostrarModalConfirmar,
  setMostrarModalCancelar,
  onCerrarCaja
}) {
  return (
    <div className="seccion-resumen">
      <div className="resumen-venta">
        <h2>Productos Seleccionados</h2>
        
        <div className="lista-productos-seleccionados">
          <table className="tabla-seleccionados">
            <thead>
              <tr>
                <th>Seleccionado</th>
                <th>Precio Unit.</th>
                <th>Cantidad</th>
                <th>Sub total</th>
              </tr>
            </thead>
            <tbody>
              {productosSeleccionados.map(producto => (
                <tr key={producto.id}>
                  <td>
                    <div className="producto-info">
                      <span className="nombre-producto">{producto.nombre}</span>
                      <button 
                        className="btn-eliminar-producto"
                        onClick={() => eliminarProducto(producto.id)}
                        title="Eliminar producto"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </td>
                  <td className="precio-unitario">${producto.precio.toFixed(2)}</td>
                  <td>
                    <div className="controles-cantidad">
                      <button
                        onClick={() => actualizarCantidad(producto.id, producto.cantidad - 1)}
                        className="btn-cantidad"
                      >
                        <FaMinus />
                      </button>
                      <span className="cantidad">{producto.cantidad}</span>
                      <button
                        onClick={() => actualizarCantidad(producto.id, producto.cantidad + 1)}
                        className="btn-cantidad"
                      >
                        <FaPlus />
                      </button>
                    </div>
                  </td>
                  <td className="subtotal">${producto.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {productosSeleccionados.length === 0 && (
            <div className="sin-seleccionados">
              No hay productos seleccionados
            </div>
          )}
        </div>

        {metodoPago === 'efectivo' && (
          <div className="monto-recibido-section">
            <h3>Monto Recibido</h3>
            <div className="monto-input-container">
              <span className="simbolo-peso">$</span>
              <input
                type="number"
                value={montoRecibido}
                onChange={(e) => setMontoRecibido(e.target.value)}
                placeholder="0.00"
                className="monto-input"
                min="0"
                step="0.01"
              />
            </div>
            {montoRecibido && calcularVuelto() >= 0 && (
              <div className="vuelto-display">
                <strong>Vuelto: ${calcularVuelto().toFixed(2)}</strong>
              </div>
            )}
          </div>
        )}

        <div className="total-venta">
          <div className="total-linea"></div>
          <div className="total-monto">
            <strong>TOTAL:</strong>
            <strong>${calcularTotal().toFixed(2)}</strong>
          </div>
        </div>

        <div className="metodo-pago">
          <h3>Método de pago</h3>
          <div className="opciones-pago">
            <label className="opcion-pago">
              <input
                type="radio"
                value="efectivo"
                checked={metodoPago === 'efectivo'}
                onChange={(e) => setMetodoPago(e.target.value)}
              />
              Efectivo
            </label>
            <label className="opcion-pago">
              <input
                type="radio"
                value="transferencia"
                checked={metodoPago === 'transferencia'}
                onChange={(e) => setMetodoPago(e.target.value)}
              />
              Transferencia
            </label>
          </div>
        </div>

        <div className="acciones-venta">
          <button 
            className="btn-cancelar"
            onClick={() => setMostrarModalCancelar(true)}
            disabled={productosSeleccionados.length === 0}
          >
            Cancelar Cobro
          </button>
          <button
            className="btn-confirmar-cobro"
            onClick={() => setMostrarModalConfirmar(true)}
            disabled={productosSeleccionados.length === 0 || (metodoPago === 'efectivo' && (!montoRecibido || parseFloat(montoRecibido) < calcularTotal()))}
          >
            <FaReceipt /> Confirmar Cobro
          </button>
        </div>

        <button 
          className="btn-cerrar-caja"
          onClick={onCerrarCaja}
        >
          Cerrar Caja
        </button>
      </div>
    </div>
  );
}

export default DetalleVenta;