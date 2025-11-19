import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Productos.css';
import ModalConfirmacionUniversal from '../ModalConfirmacionUniversal';
import { FaEdit, FaTrash, FaEye, FaList, FaArrowLeft, FaTimes, FaBox, FaDollarSign, FaHashtag, FaClipboardList, FaExclamationTriangle } from 'react-icons/fa';

function Productos({ esJefa = true, modoLectura = false, onNavegarAFormulario }) {
  const [productos, setProductos] = useState([]);
  const [todosProductos, setTodosProductos] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [loading, setLoading] = useState(false);
  const [haBuscado, setHaBuscado] = useState(false);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [productoDetalles, setProductoDetalles] = useState(null);

  const categorias = [
    'Bebidas', 'Lácteos', 'Golosinas', 'Limpieza', 'Verduras', 
    'Carnes', 'Panificados', 'Fiambres', 'Perfumería', 
    'Electrodomésticos', 'Papelería', 'Otros'
  ];

  useEffect(() => {
    cargarTodosDatos();
  }, []);

  const cargarTodosDatos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const productosRes = await axios.get('http://localhost:8000/api/productos/', {
        headers: { Authorization: `Token ${token}` }
      });

      console.log('✅ Productos cargados:', productosRes.data);
      setTodosProductos(productosRes.data);
      setProductos([]);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarProductos = () => {
    if (busqueda === '' && filtroCategoria === '') {
      setProductos([]);
      setHaBuscado(false);
      setMostrarTodos(false);
      return;
    }

    let filtrados = [...todosProductos];

    if (filtroCategoria.trim()) {
      filtrados = filtrados.filter(producto => 
        producto.categoria_prod && 
        producto.categoria_prod.toLowerCase() === filtroCategoria.toLowerCase()
      );
    }

    if (busqueda.trim()) {
      filtrados = filtrados.filter(producto =>
        (producto.nombre_prod && 
         producto.nombre_prod.toLowerCase().includes(busqueda.toLowerCase())) ||
        (producto.codigo_prod && 
         producto.codigo_prod.toLowerCase().includes(busqueda.toLowerCase()))
      );
    }

    setProductos(filtrados);
    setHaBuscado(true);
    setMostrarTodos(false);
  };

  const mostrarTodosProductos = () => {
    setProductos(todosProductos);
    setHaBuscado(true);
    setMostrarTodos(true);
    setBusqueda('');
    setFiltroCategoria('');
  };

  const ocultarProductos = () => {
    setProductos([]);
    setHaBuscado(false);
    setMostrarTodos(false);
    setProductoDetalles(null);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      filtrarProductos();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [busqueda, filtroCategoria, todosProductos]);

  const handleFiltroCategoriaChange = (e) => {
    const categoria = e.target.value;
    setFiltroCategoria(categoria);
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroCategoria('');
    setProductos([]);
    setHaBuscado(false);
    setMostrarTodos(false);
    setProductoDetalles(null);
  };

  const handleEliminar = async () => {
    if (!productoAEliminar) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/productos/${productoAEliminar.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      await cargarTodosDatos();
      if (mostrarTodos) {
        setProductos(todosProductos);
      } else {
        filtrarProductos();
      }
      
      // Mostrar modal de éxito
      setMostrarModal(true);
      
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      // Mostrar modal de error
      setMostrarModal(true);
    } finally {
      setProductoAEliminar(null);
    }
  };

  const handleGuardadoExitoso = () => {
    cargarTodosDatos();
  };

  const hayFiltrosActivos = busqueda || filtroCategoria;
  const hayResultados = productos.length > 0;

  const formatearPrecio = (precio) => {
    if (!precio) return '$ 0,00';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(precio);
  };

  // ✅ Función para obtener el estado del stock (usando stock_minimo del backend)
  const obtenerEstadoStock = (producto) => {
    const cantidad = producto.cantidad || 0;
    const stockMinimo = producto.stock_minimo || 5;
    
    if (cantidad === 0) return 'sin-stock';
    if (cantidad <= stockMinimo) return 'stock-bajo';
    if (cantidad <= stockMinimo * 2) return 'stock-medio';
    return 'stock-normal';
  };

  // ✅ Función para obtener texto del estado del stock
  const obtenerTextoStock = (producto) => {
    const cantidad = producto.cantidad || 0;
    const stockMinimo = producto.stock_minimo || 5;
    
    if (cantidad === 0) return 'Sin Stock';
    if (cantidad <= stockMinimo) return 'Stock Bajo';
    if (cantidad <= stockMinimo * 2) return 'Stock Medio';
    return 'Stock Normal';
  };

  // ✅ Función para verificar si está en bajo stock
  const estaEnBajoStock = (producto) => {
    const cantidad = producto.cantidad || 0;
    const stockMinimo = producto.stock_minimo || 5;
    return cantidad <= stockMinimo;
  };

  // Función para manejar nuevo producto
  const handleNuevoProducto = () => {
    console.log('➕ Nuevo producto');
    if (onNavegarAFormulario) {
      onNavegarAFormulario('crear', null);
    }
  };

  // Función para manejar editar producto
  const handleEditarProducto = (producto) => {
  console.log('🔄 Editando producto:', producto);
  if (onNavegarAFormulario) {
    onNavegarAFormulario('editar', producto);
  }
};

  return (
    <div className="productos-container">
      <div className="header-productos">
        <h2>Productos</h2>
        <div className="header-actions">
          {!modoLectura && (
            <button className="btn-agregar" onClick={handleNuevoProducto}>
              + Nuevo Producto
            </button>
          )}
        </div>
      </div>

      <div className="filtros-container">
        <div className="buscador-productos">
          <div className="input-busqueda-container">
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="input-busqueda"
            />
          </div>
        </div>

        <div className="filtro-categoria">
          <label>Filtrar por categoría:</label>
          <select 
            value={filtroCategoria} 
            onChange={handleFiltroCategoriaChange}
            className="select-filtro"
          >
            <option value="">Todas las categorías</option>
            {categorias.map(categoria => (
              <option key={categoria} value={categoria}>{categoria}</option>
            ))}
          </select>
        </div>

        {!mostrarTodos && !hayFiltrosActivos && (
          <button className="btn-mostrar-todos" onClick={mostrarTodosProductos}>
            <FaList className="icono-btn" />
            Mostrar todos
          </button>
        )}

        {(hayFiltrosActivos || mostrarTodos) && (
          <button className="btn-limpiar-grande" onClick={limpiarFiltros}>
            <FaArrowLeft className="icono-btn" />
            Ocultar lista
          </button>
        )}
      </div>

      {hayFiltrosActivos && (
        <div className="mensaje-busqueda">
          {productos.length === 0 ? 
             `No se encontraron productos${
               busqueda ? ` con "${busqueda}"` : ''
             }${
               filtroCategoria ? ` de la categoría "${filtroCategoria}"` : ''
             }` : 
             `Mostrando ${productos.length} producto(s)${
               busqueda ? ` con "${busqueda}"` : ''
             }${
               filtroCategoria ? ` de la categoría "${filtroCategoria}"` : ''
             }`
          }
        </div>
      )}

      {mostrarTodos && (
        <div className="mensaje-busqueda">
          Mostrando todos los productos ({productos.length})
        </div>
      )}

      {loading ? (
        <div className="sin-busqueda">
          <div className="mensaje-inicial">
            <p>Cargando productos...</p>
          </div>
        </div>
      ) : hayFiltrosActivos && productos.length === 0 ? (
        <div className="sin-resultados">
          <p>No se encontraron productos con los criterios de búsqueda</p>
          <button className="btn-limpiar-grande" onClick={limpiarFiltros}>
            <FaArrowLeft className="icono-btn" />
            Ocultar lista
          </button>
        </div>
      ) : !hayFiltrosActivos && !haBuscado && !mostrarTodos ? (
        <div className="sin-busqueda">
          <div className="mensaje-inicial">
            <p>Utilice el buscador, los filtros o el botón "Mostrar todos" para encontrar productos específicos</p>
          </div>
        </div>
      ) : hayResultados ? (
        <div className="tabla-contenedor-con-scroll-compacta">
          <table className="tabla-productos-compacta">
            <thead>
              <tr>
                <th className="columna-codigo">CÓDIGO</th>
                <th className="columna-nombre">NOMBRE</th>
                <th className="columna-categoria">CATEGORÍA</th>
                <th className="columna-cantidad">STOCK</th>
                <th className="columna-estado">ESTADO</th>
                <th className="columna-precio">PRECIO VENTA</th>
                {!modoLectura && <th className="columna-acciones">ACCIONES</th>}
              </tr>
            </thead>
            <tbody>
              {productos.map(producto => (
                <tr key={producto.id} className={estaEnBajoStock(producto) ? 'fila-bajo-stock' : ''}>
                  <td className="codigo-producto centered">{producto.codigo_prod || 'N/A'}</td>
                  <td className="nombre-producto">{producto.nombre_prod}</td>
                  <td className="categoria-producto centered">{producto.categoria_prod}</td>
                  <td className="cantidad-producto centered">
                    <span className={`badge-cantidad ${obtenerEstadoStock(producto)}`}>
                      {producto.cantidad !== undefined && producto.cantidad !== null ? producto.cantidad : 0}
                    </span>
                  </td>
                  <td className="estado-producto centered">
                    <span className={`estado-stock ${obtenerEstadoStock(producto)}`}>
                      {obtenerTextoStock(producto)}
                      {estaEnBajoStock(producto) && <FaExclamationTriangle className="icono-alerta" />}
                    </span>
                  </td>
                  <td className="precio-producto centered">{formatearPrecio(producto.precio_venta)}</td>
                  {!modoLectura && (
                    <td className="acciones-producto centered">
                      <button
                        className="btn-icon editar"
                        onClick={() => handleEditarProducto(producto)}
                        title="Editar producto"
                      >
                        <FaEdit />
                      </button>
                      {esJefa && (
                        <button
                          className="btn-icon eliminar"
                          onClick={() => {
                            setProductoAEliminar(producto);
                            setMostrarModal(true);
                          }}
                          title="Eliminar producto"
                        >
                          <FaTrash />
                        </button>
                      )}
                      <button
                        className="btn-icon detalles"
                        onClick={() => setProductoDetalles(producto)}
                        title="Ver detalles completos"
                      >
                        <FaEye />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="sin-busqueda">
          <div className="mensaje-inicial">
            <h3>No hay resultados</h3>
            <p>Intente con otros términos de búsqueda o filtros</p>
          </div>
        </div>
      )}

      {/* Modal para eliminar producto */}
      <ModalConfirmacionUniversal
        mostrar={mostrarModal && productoAEliminar}
        tipo="eliminar"
        modo="producto"
        mensaje={`¿Está seguro que desea eliminar el producto "${productoAEliminar?.nombre_prod}"?`}
        onConfirmar={handleEliminar}
        onCancelar={() => {
          setMostrarModal(false);
          setProductoAEliminar(null);
        }}
      />

      {/* Modal de éxito después de eliminar */}
      <ModalConfirmacionUniversal
        mostrar={mostrarModal && !productoAEliminar}
        tipo="exito"
        modo="producto"
        mensaje="✅ Producto eliminado correctamente"
        onConfirmar={() => setMostrarModal(false)}
        onCancelar={() => setMostrarModal(false)}
      />

      {productoDetalles && (
        <div className="modal-overlay-detalles" onClick={() => setProductoDetalles(null)}>
          <div className="modal-detalles-grande" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-detalles">
              <h3>Detalles del Producto</h3>
              <button 
                className="btn-cerrar-modal"
                onClick={() => setProductoDetalles(null)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body-detalles-grande">
              <div className="detalle-principal-grande">
                <div className="info-principal-grande">
                  <h2>{productoDetalles.nombre_prod}</h2>
                  <span className="badge-categoria-grande">
                    {productoDetalles.categoria_prod}
                  </span>
                  <span className={`estado-stock-grande ${obtenerEstadoStock(productoDetalles)}`}>
                    {obtenerTextoStock(productoDetalles)}
                    {estaEnBajoStock(productoDetalles) && <FaExclamationTriangle className="icono-alerta" />}
                  </span>
                </div>
                <div className="codigo-principal-grande">
                  Código: {productoDetalles.codigo_prod || 'N/A'}
                </div>
              </div>

              <div className="detalles-lista-grande">
                <div className="detalle-item-grande">
                  <div className="icono-detalle-grande">
                    <FaHashtag />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>Código</label>
                    <span>{productoDetalles.codigo_prod || 'N/A'}</span>
                  </div>
                </div>

                <div className="detalle-item-grande">
                  <div className="icono-detalle-grande">
                    <FaBox />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>Nombre</label>
                    <span>{productoDetalles.nombre_prod}</span>
                  </div>
                </div>

                <div className="detalle-item-grande">
                  <div className="icono-detalle-grande">
                    <FaClipboardList />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>Categoría</label>
                    <span>{productoDetalles.categoria_prod}</span>
                  </div>
                </div>

                <div className="detalle-item-grande">
                  <div className="icono-detalle-grande">
                    <FaHashtag />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>Stock Disponible</label>
                    <span className={`total-destacado ${obtenerEstadoStock(productoDetalles)}`}>
                      {productoDetalles.cantidad || 0} unidades
                    </span>
                  </div>
                </div>

                <div className="detalle-item-grande">
                  <div className="icono-detalle-grande">
                    <FaDollarSign />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>Precio de Venta</label>
                    <span className="total-destacado">{formatearPrecio(productoDetalles.precio_venta)}</span>
                  </div>
                </div>

                <div className="detalle-item-grande completo">
                  <div className="icono-detalle-grande">
                    <FaClipboardList />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>Descripción</label>
                    <div className="observaciones-detalle-grande">
                      {productoDetalles.descripcion_prod || 'No hay descripción'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-detalles">
              <button 
                className="btn-cerrar"
                onClick={() => setProductoDetalles(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Productos;