// Ventas.js
import React, { useState, useEffect } from 'react';
import { FaSearch, FaReceipt } from 'react-icons/fa';
import DetalleVenta from './DetalleVenta';
import ModalConfirmacion from '../Ventas/ModalConfirmacion';
import VentasSaeta from './VentasSaeta';
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

  const fechaActual = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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
          precio_venta: parseFloat(producto.precio_venta) || 0
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

  const productosIniciales = productos.slice(0, 5);
  
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

          // Actualizar con PATCH
          const updateResponse = await fetch(`http://localhost:8000/api/productos/${producto.id}/`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Token ${token}`
            },
            body: JSON.stringify({ cantidad: nuevaCantidad })
          });

          if (updateResponse.ok) {
            console.log(`✅ Stock actualizado: ${producto.nombre} - ${nuevaCantidad} unidades`);
            actualizaciones.push({ success: true, producto: producto.nombre });
          } else {
            const errorText = await updateResponse.text();
            console.error(`❌ Error actualizando ${producto.nombre}:`, errorText);
            actualizaciones.push({ success: false, producto: producto.nombre, error: errorText });
          }
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
          cantidad: 1,
          nombre: nombre,
          precio: precio,
          subtotal: precio
        }
      ]);
    }
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
      alert('❌ No hay suficiente stock disponible');
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

    try {
      const token = localStorage.getItem('token');
      
      // ✅ 1. PRIMERO ACTUALIZAR STOCK (solo productos normales)
      console.log('🔄 Actualizando stock de productos...');
      const productosNormales = productosSeleccionados.filter(p => !p.esSaeta);
      const resultadosStock = await actualizarStockProductos(productosNormales);
      
      const erroresStock = resultadosStock.filter(r => !r.success);
      if (erroresStock.length > 0) {
        alert('Error al actualizar stock. Venta cancelada.');
        return;
      }

      // ✅ 2. LUEGO CREAR LA VENTA
      const ventaData = {
        caja: datosCaja?.id,
        total_venta: total,
        tipo_pago_venta: metodoPago,
        monto_recibido: metodoPago === 'efectivo' ? parseFloat(montoRecibido) : 0,
        vuelto: metodoPago === 'efectivo' ? vuelto : 0,
        estado_venta: 'completada'
      };

      console.log('📤 Creando venta:', ventaData);

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
      console.log('✅ Venta creada:', ventaCreada);
      
      // ✅ 3. FINALMENTE CREAR DETALLES (solo productos normales)
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
        }
      }
      
      // ✅ ÉXITO - LIMPIAR TODO
      setMostrarModalConfirmar(false);
      setMostrarModalExito(true);
      
      setTimeout(() => {
        setProductosSeleccionados([]);
        setMontoRecibido('');
        setMostrarModalExito(false);
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error completo al procesar venta:', error);
      alert('Error al procesar la venta: ' + error.message);
      setMostrarModalConfirmar(false);
    }
  };

  const handleCancelarCobro = () => {
    setProductosSeleccionados([]);
    setMontoRecibido('');
    setMostrarModalCancelar(false);
  };

  const datosParaModal = {
    total: calcularTotal(),
    metodoPago: metodoPago,
    montoRecibido: parseFloat(montoRecibido) || 0,
    vuelto: calcularVuelto(),
    cantidadProductos: productosSeleccionados.length
  };

  return (
    <div className="ventas-container">
      <div className="ventas-header">
        <div className="ventas-titulo">
          <h1>florencia DRUGSTORE</h1>
          <div className="ventas-fecha">{fechaActual}</div>
        </div>
        <div className="header-actions">
          <button className="btn-reportes">
            Reportes Diarios
          </button>
          <button 
            className="btn-saeta"
            onClick={() => setMostrarModalSaeta(true)}
          >
            Saeta
          </button>
        </div>
      </div>

      <div className="ventas-content">
        <div className="seccion-productos">
          <div className="buscar-productos">
            <h2>Buscar productos</h2>
            <div className="buscar-input-container">
              <FaSearch className="icono-buscar" />
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
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
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map(producto => {
                  const codigo = producto.codigo_prod || 'N/A';
                  const nombre = producto.nombre_prod || 'Producto sin nombre';
                  const precio = producto.precio_venta || 0;
                  const stock = producto.cantidad || 0;
                  
                  return (
                    <tr key={producto.id}>
                      <td className="codigo-producto">{codigo}</td>
                      <td className="nombre-producto">{nombre}</td>
                      <td className="precio-producto">${formatearPrecio(precio)}</td>
                      <td className={`stock-producto ${stock === 0 ? 'sin-stock' : stock < 5 ? 'stock-bajo' : ''}`}>
                        {stock} unidades
                      </td>
                      <td>
                        <button
                          className="btn-agregar"
                          onClick={() => agregarProducto(producto)}
                          disabled={stock === 0}
                        >
                          {stock === 0 ? 'Sin Stock' : 'Agregar'}
                        </button>
                      </td>
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
        </div>

        <DetalleVenta
          productosSeleccionados={productosSeleccionados}
          eliminarProducto={eliminarProducto}
          actualizarCantidad={actualizarCantidad}
          calcularTotal={calcularTotal}
          metodoPago={metodoPago}
          setMetodoPago={setMetodoPago}
          montoRecibido={montoRecibido}
          setMontoRecibido={setMontoRecibido}
          calcularVuelto={calcularVuelto}
          setMostrarModalConfirmar={setMostrarModalConfirmar}
          setMostrarModalCancelar={setMostrarModalCancelar}
          onCerrarCaja={onCerrarCaja}
        />
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