import React, { useState, useEffect } from 'react';
import { FaSearch, FaReceipt, FaPlus, FaMinus, FaTimes } from 'react-icons/fa';
import ModalConfirmacion from '../Ventas/ModalConfirmacion';
import VentasSaeta from './VentasSaeta';
import IngresosEgresos from '../Caja/IngresosEgresos';
import CierreCaja from '../Caja/CierreCaja';
import './Ventas.css';

function Ventas({ datosCaja, onCerrarCaja }) {
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModalConfirmar, setMostrarModalConfirmar] = useState(false);
  const [mostrarModalCancelar, setMostrarModalCancelar] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mostrarModalSaeta, setMostrarModalSaeta] = useState(false);
  const [mostrarModalCerrarCaja, setMostrarModalCerrarCaja] = useState(false);
  const [mostrarCierreCaja, setMostrarCierreCaja] = useState(false);

  const fechaActual = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleRegistroAgregado = () => {
    console.log('✅ Ingreso/Egreso registrado exitosamente');
  };

  const cargarProductos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/productos/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Productos cargados desde API:', data);
        
        const productosFormateados = data.map(producto => ({
          ...producto,
          precio_venta: parseFloat(producto.precio_venta) || 0,
          cantidad: parseInt(producto.cantidad) || 0
        }));
        setProductos(productosFormateados);
      } else {
        console.error('❌ Error cargando productos:', response.status);
        const errorText = await response.text();
        console.error('Detalles del error:', errorText);
      }
    } catch (error) {
      console.error('❌ Error cargando productos:', error);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // Función para agregar venta Saeta a productos seleccionados
  const handleVentaSaetaCreada = (ventaSaeta) => {
    const productoSaeta = {
      id: `saeta-${ventaSaeta.id}`,
      nombre: `Recarga Saeta - $${ventaSaeta.monto_saeta}`,
      precio: parseFloat(ventaSaeta.monto_saeta),
      cantidad: 1,
      subtotal: parseFloat(ventaSaeta.monto_saeta),
      esSaeta: true,
      datosSaeta: ventaSaeta
    };
    
    setProductosSeleccionados(prev => [...prev, productoSaeta]);
    console.log('✅ Venta Saeta agregada a productos seleccionados:', productoSaeta);
  };

  const eliminarProducto = (id) => {
    setProductosSeleccionados(prev =>
      prev.filter(p => p.id !== id)
    );
  };

  const actualizarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad < 1) {
      eliminarProducto(id);
      return;
    }

    // Para productos Saeta, no permitir cambiar cantidad
    const productoSeleccionado = productosSeleccionados.find(p => p.id === id);
    if (productoSeleccionado?.esSaeta) {
      alert('❌ No se puede modificar la cantidad de recargas Saeta');
      return;
    }

    const productoOriginal = productos.find(p => p.id === id);
    
    if (productoOriginal && nuevaCantidad > productoOriginal.cantidad) {
      alert(`❌ No hay suficiente stock disponible. Stock: ${productoOriginal.cantidad}`);
      return;
    }

    setProductosSeleccionados(prev =>
      prev.map(p =>
        p.id === id
          ? { 
              ...p, 
              cantidad: nuevaCantidad, 
              subtotal: nuevaCantidad * p.precio 
            }
          : p
      )
    );
  };

  const agregarProducto = (producto) => {
    if (producto.cantidad <= 0) {
      alert('❌ Este producto no tiene stock disponible');
      return;
    }

    const existente = productosSeleccionados.find(p => p.id === producto.id);
    const cantidadEnCarrito = existente ? existente.cantidad : 0;
    
    if (cantidadEnCarrito >= producto.cantidad) {
      alert(`❌ No hay suficiente stock disponible. Stock: ${producto.cantidad}, En carrito: ${cantidadEnCarrito}`);
      return;
    }

    const precio = parseFloat(producto.precio_venta) || 0;
    const nombre = producto.nombre_prod || 'Producto sin nombre';
    
    console.log('➕ Agregando producto:', { 
      id: producto.id, 
      nombre, 
      precio, 
      stock_disponible: producto.cantidad,
      en_carrito: cantidadEnCarrito 
    });
    
    if (existente) {
      setProductosSeleccionados(prev =>
        prev.map(p =>
          p.id === producto.id
            ? { 
                ...p, 
                cantidad: p.cantidad + 1, 
                subtotal: (p.cantidad + 1) * precio 
              }
            : p
        )
      );
    } else {
      setProductosSeleccionados(prev => [
        ...prev,
        { 
          ...producto, 
          id: producto.id,
          cantidad: 1,
          nombre: nombre,
          precio: precio,
          subtotal: precio
        }
      ]);
    }
  };

  // ✅ Función para manejar el cierre de caja - CORREGIDA
  const handleCerrarCaja = () => {
    console.log('🔄 Iniciando proceso de cierre de caja...');
    setMostrarModalCerrarCaja(true);
  };

  // ✅ Función para confirmar el cierre de caja - CORREGIDA
  const handleConfirmarCierreCaja = () => {
    console.log('✅ Confirmando cierre de caja, mostrando componente...');
    setMostrarModalCerrarCaja(false);
    setMostrarCierreCaja(true);
  };

  // ✅ Función cuando se completa el cierre de caja - MODIFICADA PARA REDIRIGIR A CAJA
  const handleCierreCompletado = () => {
    console.log('🏁 Cierre de caja completado, redirigiendo a módulo caja...');
    setMostrarCierreCaja(false);
    
    // 🔥 REDIRIGIR AL MÓDULO DE CAJA
    if (window.setModuloActivo) {
      window.setModuloActivo('caja');
    }
    
    if (onCerrarCaja) {
      onCerrarCaja();
    }
  };

  const productosIniciales = productos.slice(0, 8);
  
  const productosFiltrados = busqueda 
    ? productos.filter(producto => {
        const nombre = producto.nombre_prod || '';
        const codigo = producto.codigo_prod || '';
        
        return (
          nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
          codigo.toLowerCase().includes(busqueda.toLowerCase())
        );
      })
    : productosIniciales;

  const formatearPrecio = (precio) => {
    const precioNumero = parseFloat(precio) || 0;
    return precioNumero.toFixed(2);
  };

  // ✅ FUNCIÓN MEJORADA: Actualizar stock de productos (solo productos normales, no Saeta)
  const actualizarStockProductos = async (productosVendidos) => {
    try {
      const token = localStorage.getItem('token');
      const actualizaciones = [];

      for (const producto of productosVendidos) {
        // Saltar productos Saeta (no tienen stock)
        if (producto.esSaeta) {
          console.log('⏭️ Saltando actualización de stock para producto Saeta');
          continue;
        }

        console.log(`🔄 Actualizando stock producto ${producto.id}: ${producto.cantidad} unidades vendidas`);

        // Obtener producto actual
        const response = await fetch(`http://localhost:8000/api/productos/${producto.id}/`, {
          headers: { 'Authorization': `Token ${token}` }
        });

        if (response.ok) {
          const productoActual = await response.json();
          const nuevaCantidad = Math.max(productoActual.cantidad - producto.cantidad, 0);

          // Actualizar con PATCH - CORREGIDO: enviar solo los campos necesarios
          const updateResponse = await fetch(`http://localhost:8000/api/productos/${producto.id}/`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Token ${token}`
            },
            body: JSON.stringify({ 
              cantidad: nuevaCantidad,
              nombre_prod: productoActual.nombre_prod,
              precio_venta: productoActual.precio_venta,
              categoria_prod: productoActual.categoria_prod,
              precio_total: productoActual.precio_total
            })
          });

          if (updateResponse.ok) {
            console.log(`✅ Stock actualizado: ${producto.nombre} - ${nuevaCantidad} unidades`);
            actualizaciones.push({ success: true, producto: producto.nombre });
          } else {
            const errorText = await updateResponse.text();
            console.error(`❌ Error actualizando ${producto.nombre}:`, errorText);
            actualizaciones.push({ success: false, producto: producto.nombre, error: errorText });
          }
        } else {
          console.error(`❌ Error obteniendo producto ${producto.id}`);
          actualizaciones.push({ success: false, producto: producto.nombre, error: 'No se pudo obtener el producto' });
        }
      }

      // Actualizar lista de productos en el estado
      await cargarProductos();
      return actualizaciones;

    } catch (error) {
      console.error('❌ Error en actualizarStockProductos:', error);
      throw error;
    }
  };

  const calcularTotal = () => {
    return productosSeleccionados.reduce((total, producto) => {
      return total + (producto.precio * producto.cantidad);
    }, 0);
  };

  const calcularVuelto = () => {
    const total = calcularTotal();
    const recibido = parseFloat(montoRecibido) || 0;
    return Math.max(recibido - total, 0);
  };

  const handleConfirmarCobro = async () => {
    const total = calcularTotal();
    const vuelto = calcularVuelto();
    
    if (metodoPago === 'efectivo' && (!montoRecibido || parseFloat(montoRecibido) < total)) {
      alert('El monto recibido es insuficiente');
      return;
    }

    // Validar que haya productos seleccionados
    if (productosSeleccionados.length === 0) {
      alert('❌ No hay productos seleccionados para vender');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // ✅ 1. PRIMERO ACTUALIZAR STOCK (solo productos normales)
      console.log('🔄 Actualizando stock de productos...');
      const productosNormales = productosSeleccionados.filter(p => !p.esSaeta);
      
      if (productosNormales.length > 0) {
        const resultadosStock = await actualizarStockProductos(productosNormales);
        const erroresStock = resultadosStock.filter(r => !r.success);
        if (erroresStock.length > 0) {
          alert('❌ Error al actualizar stock. Venta cancelada.');
          return;
        }
        console.log('✅ Stock actualizado correctamente');
      }

      // ✅ 2. CREAR VENTA PRINCIPAL (para todos los productos)
      const ventaData = {
        caja: datosCaja?.id,
        total_venta: total,
        tipo_pago_venta: metodoPago,
        monto_recibido: metodoPago === 'efectivo' ? parseFloat(montoRecibido) : 0,
        vuelto: metodoPago === 'efectivo' ? vuelto : 0,
        estado_venta: 'completada',
        descripcion: `Venta con ${productosSeleccionados.length} productos`
      };

      console.log('📤 Creando venta principal:', ventaData);

      const responseVenta = await fetch('http://localhost:8000/api/ventas/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(ventaData)
      });

      if (!responseVenta.ok) {
        const errorData = await responseVenta.json();
        throw new Error(`Error creando venta: ${JSON.stringify(errorData)}`);
      }

      const ventaCreada = await responseVenta.json();
      console.log('✅ Venta principal creada:', ventaCreada);
      
      // ✅ 3. CREAR DETALLES PARA PRODUCTOS NORMALES
      for (const producto of productosNormales) {
        const detalleData = {
          venta: ventaCreada.id,
          producto: producto.id,
          cantidad: producto.cantidad,
          precio_unitario: producto.precio,
          subtotal: producto.subtotal
        };

        const responseDetalle = await fetch('http://localhost:8000/api/detalle_ventas/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          },
          body: JSON.stringify(detalleData)
        });

        if (!responseDetalle.ok) {
          console.error(`❌ Error creando detalle para ${producto.nombre}`);
          const errorDetalle = await responseDetalle.text();
          console.error('Error detalle:', errorDetalle);
        } else {
          console.log(`✅ Detalle creado para ${producto.nombre}`);
        }
      }

      // ✅ 4. ACTUALIZAR VENTAS SAETA CON LA VENTA CREADA
      const productosSaeta = productosSeleccionados.filter(p => p.esSaeta);
      for (const productoSaeta of productosSaeta) {
        if (productoSaeta.datosSaeta) {
          const saetaUpdateData = {
            venta: ventaCreada.id
          };

          const responseSaeta = await fetch(`http://localhost:8000/api/ventas_saeta/${productoSaeta.datosSaeta.id}/`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Token ${token}`
            },
            body: JSON.stringify(saetaUpdateData)
          });

          if (responseSaeta.ok) {
            console.log('✅ Venta Saeta actualizada con venta principal');
          } else {
            console.error('❌ Error actualizando venta Saeta');
          }
        }
      }
      
      // ✅ ÉXITO - LIMPIAR TODO
      setMostrarModalConfirmar(false);
      setMostrarModalExito(true);
      
      setTimeout(() => {
        setProductosSeleccionados([]);
        setMontoRecibido('');
        setMetodoPago('efectivo');
        setMostrarModalExito(false);
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error completo al procesar venta:', error);
      alert('❌ Error al procesar la venta: ' + error.message);
      setMostrarModalConfirmar(false);
    }
  };

  const handleCancelarCobro = () => {
    setProductosSeleccionados([]);
    setMontoRecibido('');
    setMetodoPago('efectivo');
    setMostrarModalCancelar(false);
  };

  const datosParaModal = {
    total: calcularTotal(),
    metodoPago: metodoPago,
    montoRecibido: parseFloat(montoRecibido) || 0,
    vuelto: calcularVuelto(),
    cantidadProductos: productosSeleccionados.length
  };
  

  // ✅ Componente DetalleVenta integrado
  const DetalleVenta = () => {
    return (
      <div className="seccion-resumen">
        <div className="resumen-venta">
          <h2>Productos Seleccionados</h2>
          <div className="lista-productos-seleccionados">
            <table className="tabla-seleccionados">
              <thead>
                <tr>
                  <th>Producto</th>
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
                    <button 
                          className="btn-eliminar-producto"
                          onClick={() => eliminarProducto(producto.id)}
                          title="Eliminar producto"
                        >
                          <FaTimes />
                        </button>
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

         
        </div>
        <div className="acciones-venta">
          <button 
              className="boton-cancelar-cobro"
              onClick={() => setMostrarModalCancelar(true)}
              disabled={productosSeleccionados.length === 0}
            >
              Cancelar Cobro
            </button>
            <button
              className="boton-confirmar-cobro"
              onClick={() => setMostrarModalConfirmar(true)}
              disabled={productosSeleccionados.length === 0 || (metodoPago === 'efectivo' && (!montoRecibido || parseFloat(montoRecibido) < calcularTotal()))}
            >
            Confirmar Cobro
          </button>
         </div>  
      </div>
    );
  };

  // ✅ Si estamos mostrando el cierre de caja, mostrar ese componente
  if (mostrarCierreCaja) {
    console.log('📊 Mostrando componente CierreCaja con datos:', datosCaja);
    return (
      <CierreCaja 
        cajaId={datosCaja?.id}
        datosCaja={datosCaja}
        onCierreConfirmado={handleCierreCompletado}
        onCancelar={() => setMostrarCierreCaja(false)}
      />
    );
  }

  return (
    <div className="ventas-container">
      <div className="ventas-header">
        <div className="ventas-titulo">
          <h1>Ventas Drugstore</h1>
          <div className="ventas-fecha">{fechaActual}</div>
        </div>
        <div className="header-actions">
          <button 
            className="btn-saeta"
            onClick={() => setMostrarModalSaeta(true)}
          >
            SAETA
          </button>
          
          <IngresosEgresos 
            cajaId={datosCaja?.id}
            onRegistroAgregado={handleRegistroAgregado}
          />
        </div>
      </div>

      <div className="ventas-content">
        <div className="seccion-productos">
          <div className="buscar-productos">
            <div className="buscar-input-container">
              <FaSearch className="icono-buscar" />
              <input
                type="text"
                placeholder="Buscar productos"
                className="buscar-input"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          <div className="lista-productos-ventas">
            <table className="tabla-productos">
              <thead>
                <tr>
                  <th className="columna-checkbox"></th>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map(producto => {
                  const codigo = producto.codigo_prod || 'N/A';
                  const nombre = producto.nombre_prod || 'Producto sin nombre';
                  const precio = producto.precio_venta || 0;
                  const stock = producto.cantidad || 0;
                  const estaSeleccionado = productosSeleccionados.some(p => p.id === producto.id);
                  
                  return (
                    <tr 
                      key={producto.id} 
                      className={`fila-producto ${estaSeleccionado ? 'seleccionado' : ''} ${stock === 0 ? 'sin-stock' : ''}`}
                    >
                      <td className="columna-checkbox">
                        <input
                          type="checkbox"
                          checked={estaSeleccionado}
                          onChange={(e) => {
                            if (e.target.checked) {
                              agregarProducto(producto);
                            } else {
                              eliminarProducto(producto.id);
                            }
                          }}
                          disabled={stock === 0}
                          className="checkbox-producto"
                        />
                      </td>
                      <td className="codigo-producto">{codigo}</td>
                      <td className="nombre-producto">{nombre}</td>
                      <td className="precio-producto">${formatearPrecio(precio)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {productosFiltrados.length === 0 && (
              <div className="sin-productos">
                {busqueda ? `No se encontraron productos con "${busqueda}"` : 'No hay productos disponibles'}
              </div>
            )}
          </div>

          {/* SECCIÓN MONTO RECIBIDO - AHORA DENTRO DE .seccion-productos */}
          {metodoPago === 'efectivo' && (
            <div className="monto-recibido-section">
              <div className="monto-recibido-horizontal">
                <div className="monto-input-container">
                  <label>Monto Recibido</label>
                  <div className="input-wrapper">
                   {/* <span className="simbolo-peso">$</span> */}
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
                </div>
                
                <div className="vuelto-display">
                  <label>Vuelto</label>
                  <div className="vuelto-monto">
                    {montoRecibido && calcularVuelto() >= 0 ? (
                      <strong>${calcularVuelto().toFixed(2)}</strong>
                    ) : (
                      <span style={{color: '#666b6fff'}}>$ 0.00</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
           <button 
            className="btn-cerrar-caja"
            onClick={handleCerrarCaja}
          >
            Ir a cierre de caja
          </button>
        </div>

        <DetalleVenta />
      </div>

      {/* Modales de venta normal */}
      <ModalConfirmacion
        mostrar={mostrarModalConfirmar}
        tipo="confirmar"
        mensaje="¿Está seguro que desea confirmar el cobro?"
        onConfirmar={handleConfirmarCobro}
        onCancelar={() => setMostrarModalConfirmar(false)}
        datosVenta={datosParaModal}
      />

      <ModalConfirmacion
        mostrar={mostrarModalCancelar}
        tipo="cancelar"
        mensaje="¿Está seguro que desea cancelar el cobro? Se perderán todos los productos seleccionados."
        onConfirmar={handleCancelarCobro}
        onCancelar={() => setMostrarModalCancelar(false)}
      />

      <ModalConfirmacion
        mostrar={mostrarModalExito}
        tipo="exito"
        mensaje="¡Venta procesada exitosamente!"
        onConfirmar={() => setMostrarModalExito(false)}
        onCancelar={() => setMostrarModalExito(false)}
      />

      {/* ✅ Modal de confirmación para cerrar caja */}
      <ModalConfirmacion
        mostrar={mostrarModalCerrarCaja}
        tipo="cierre_caja"
        mensaje="¿Está seguro que desea cerrar la caja?"
        onConfirmar={handleConfirmarCierreCaja}
        onCancelar={() => {
          console.log('❌ Cierre de caja cancelado');
          setMostrarModalCerrarCaja(false);
        }}
        datosApertura={{
          empleadoNombre: datosCaja?.empleadoNombre,
          turnoNombre: datosCaja?.turnoNombre,
          montoInicial: datosCaja?.montoInicial || datosCaja?.saldo_inicial
        }}
      />

      {/* Modal de Ventas Saeta */}
      <VentasSaeta
        mostrar={mostrarModalSaeta}
        onCerrar={() => setMostrarModalSaeta(false)}
        cajaId={datosCaja?.id}
        onVentaSaetaCreada={handleVentaSaetaCreada}
      />
    </div>
  );
}

export default Ventas;