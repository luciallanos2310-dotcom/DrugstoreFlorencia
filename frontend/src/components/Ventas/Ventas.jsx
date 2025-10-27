// src/components/Ventas/Ventas.js
import React, { useState } from 'react';
import './Ventas.css';

function Ventas() {
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');

  // Datos de ejemplo para productos
  const productos = [
    { codigo: '779525467890', nombre: 'Yerba Mate Taragui', precio: 4200.00 },
    { codigo: '779607964230', nombre: 'Azúcar Ledesma', precio: 950.00 },
    { codigo: '77920225334', nombre: 'Harina 000', precio: 820.00 },
    { codigo: '779555444332', nombre: 'Aceite Girasol', precio: 920.00 },
    { codigo: '779680777888', nombre: 'Desodorante Rexona', precio: 2100.00 },
    { codigo: '779999889776', nombre: 'Jabón en polvo Drive', precio: 3909.00 },
    { codigo: '779844032221', nombre: 'Leche entera', precio: 900.00 },
    { codigo: '77922210336', nombre: 'Coca Cola 2.25L', precio: 2700.00 },
    { codigo: '77921234485', nombre: 'Galletitas Oreo', precio: 2100.00 },
    { codigo: '7795586778888', nombre: 'Papel Higiénico x4', precio: 1900.00 }
  ];

  const agregarProducto = (producto) => {
    const existente = productosSeleccionados.find(p => p.codigo === producto.codigo);
    if (existente) {
      setProductosSeleccionados(prev =>
        prev.map(p =>
          p.codigo === producto.codigo
            ? { ...p, cantidad: p.cantidad + 1 }
            : p
        )
      );
    } else {
      setProductosSeleccionados(prev => [
        ...prev,
        { ...producto, cantidad: 1 }
      ]);
    }
  };

  const eliminarProducto = (codigo) => {
    setProductosSeleccionados(prev =>
      prev.filter(p => p.codigo !== codigo)
    );
  };

  const actualizarCantidad = (codigo, nuevaCantidad) => {
    if (nuevaCantidad < 1) {
      eliminarProducto(codigo);
      return;
    }
    setProductosSeleccionados(prev =>
      prev.map(p =>
        p.codigo === codigo
          ? { ...p, cantidad: nuevaCantidad }
          : p
      )
    );
  };

  const calcularTotal = () => {
    return productosSeleccionados.reduce((total, producto) => {
      return total + (producto.precio * producto.cantidad);
    }, 0);
  };

  const calcularVuelto = () => {
    const total = calcularTotal();
    const recibido = parseFloat(montoRecibido) || 0;
    return recibido - total;
  };

  const handleConfirmarCobro = () => {
    const total = calcularTotal();
    const vuelto = calcularVuelto();
    
    if (metodoPago === 'efectivo' && vuelto < 0) {
      alert('El monto recibido es insuficiente');
      return;
    }

    // Aquí iría la lógica para procesar la venta
    console.log('Venta procesada:', {
      productos: productosSeleccionados,
      total,
      metodoPago,
      montoRecibido,
      vuelto: metodoPago === 'efectivo' ? vuelto : 0
    });

    // Limpiar después de la venta
    setProductosSeleccionados([]);
    setMontoRecibido('');
  };

  return (
    <div className="ventas-container">
      <div className="ventas-header">
        <h1>Incrementa DEUDISTORE</h1>
        <div className="info-caja-ventas">
          <div className="estado-caja">Caja abierta</div>
          <div className="cajera-info">Lujan Ramírez - Turno mañana</div>
        </div>
      </div>

      <div className="ventas-content">
        {/* Sección izquierda - Lista de productos */}
        <div className="seccion-productos">
          <div className="buscar-productos">
            <input
              type="text"
              placeholder="Buscar productos..."
              className="buscar-input"
            />
          </div>

          <div className="lista-productos-ventas">
            <table className="tabla-productos">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {productos.map(producto => (
                  <tr key={producto.codigo}>
                    <td>{producto.codigo}</td>
                    <td>{producto.nombre}</td>
                    <td>${producto.precio.toFixed(2)}</td>
                    <td>
                      <button
                        className="btn-agregar"
                        onClick={() => agregarProducto(producto)}
                      >
                        Agregar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sección derecha - Resumen de venta */}
        <div className="seccion-resumen">
          <div className="resumen-venta">
            <h3>Productos Seleccionados</h3>
            
            <div className="lista-productos-seleccionados">
              {productosSeleccionados.map(producto => (
                <div key={producto.codigo} className="producto-seleccionado">
                  <div className="info-producto">
                    <span className="nombre-producto">{producto.nombre}</span>
                    <span className="precio-producto">${producto.precio.toFixed(2)}</span>
                  </div>
                  <div className="controles-cantidad">
                    <button
                      onClick={() => actualizarCantidad(producto.codigo, producto.cantidad - 1)}
                      className="btn-cantidad"
                    >
                      -
                    </button>
                    <span className="cantidad">{producto.cantidad}</span>
                    <button
                      onClick={() => actualizarCantidad(producto.codigo, producto.cantidad + 1)}
                      className="btn-cantidad"
                    >
                      +
                    </button>
                    <button
                      onClick={() => eliminarProducto(producto.codigo)}
                      className="btn-eliminar"
                    >
                      ×
                    </button>
                  </div>
                  <div className="subtotal">
                    ${(producto.precio * producto.cantidad).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="total-venta">
              <strong>Total: ${calcularTotal().toFixed(2)}</strong>
            </div>

            <div className="metodo-pago">
              <h4>Método de pago</h4>
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

            {metodoPago === 'efectivo' && (
              <div className="monto-recibido">
                <label>Monto Recibido:</label>
                <input
                  type="number"
                  value={montoRecibido}
                  onChange={(e) => setMontoRecibido(e.target.value)}
                  placeholder="0.00"
                  className="monto-input"
                />
                {montoRecibido && (
                  <div className="vuelto">
                    Vuelto: ${calcularVuelto().toFixed(2)}
                  </div>
                )}
              </div>
            )}

            <button
              className="btn-confirmar-cobro"
              onClick={handleConfirmarCobro}
              disabled={productosSeleccionados.length === 0}
            >
              Confirmar Cobro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Ventas;