import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Productos.css';
import ModalConfirmacionUniversal from '../ModalConfirmacionUniversal';
import { FaEdit, FaTrash, FaEye, FaArrowLeft, FaTimes, FaBox, FaDollarSign, FaHashtag, FaClipboardList, FaExclamationTriangle, FaChevronLeft, FaChevronRight, FaStepBackward, FaStepForward } from 'react-icons/fa';

function Productos({ esJefa = true, modoLectura = false, onNavegarAFormulario }) {
  const [productos, setProductos] = useState([]);
  const [todosProductos, setTodosProductos] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [loading, setLoading] = useState(false);
  const [haBuscado, setHaBuscado] = useState(false);
  const [productoDetalles, setProductoDetalles] = useState(null);

  // ✅ ESTADOS PARA PAGINACIÓN
  const [paginaActual, setPaginaActual] = useState(1);
  const [productosPorPagina, setProductosPorPagina] = useState(10);
  const [totalPaginas, setTotalPaginas] = useState(1);

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
      setProductos(productosRes.data); // ✅ AHORA SIEMPRE MOSTRAMOS PRODUCTOS CON PAGINACIÓN
      
      // ✅ CALCULAR PAGINACIÓN INICIAL
      calcularPaginacion(productosRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIÓN PARA CALCULAR PAGINACIÓN
  const calcularPaginacion = (listaProductos) => {
    const total = listaProductos.length;
    const paginas = Math.ceil(total / productosPorPagina);
    setTotalPaginas(paginas);
    setPaginaActual(1); // Resetear a primera página
  };

  // ✅ FUNCIÓN PARA OBTENER PRODUCTOS DE LA PÁGINA ACTUAL
  const obtenerProductosPaginaActual = () => {
    const inicio = (paginaActual - 1) * productosPorPagina;
    const fin = inicio + productosPorPagina;
    return productos.slice(inicio, fin);
  };

  // ✅ FUNCIONES DE PAGINACIÓN
  const irAPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const paginaAnterior = () => {
    if (paginaActual > 1) {
      setPaginaActual(paginaActual - 1);
    }
  };

  const paginaSiguiente = () => {
    if (paginaActual < totalPaginas) {
      setPaginaActual(paginaActual + 1);
    }
  };

  const irAPrimeraPagina = () => {
    setPaginaActual(1);
  };

  const irAUltimaPagina = () => {
    setPaginaActual(totalPaginas);
  };

  // ✅ FUNCIÓN PARA GENERAR RANGO DE PÁGINAS (máximo 5 páginas visibles)
  const obtenerRangoPaginas = () => {
    const paginasVisibles = 5;
    let inicio = Math.max(1, paginaActual - Math.floor(paginasVisibles / 2));
    let fin = Math.min(totalPaginas, inicio + paginasVisibles - 1);
    
    // Ajustar si estamos cerca del final
    if (fin - inicio + 1 < paginasVisibles) {
      inicio = Math.max(1, fin - paginasVisibles + 1);
    }
    
    const paginas = [];
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    return paginas;
  };

  const filtrarProductos = () => {
    if (busqueda === '' && filtroCategoria === '') {
      // ✅ SI NO HAY FILTROS, MOSTRAMOS TODOS LOS PRODUCTOS CON PAGINACIÓN
      setProductos(todosProductos);
      setHaBuscado(true);
      calcularPaginacion(todosProductos);
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
    
    // ✅ CALCULAR PAGINACIÓN PARA LOS RESULTADOS FILTRADOS
    calcularPaginacion(filtrados);
  };

  const ocultarProductos = () => {
    setProductos(todosProductos); // ✅ VOLVEMOS A MOSTRAR TODOS CON PAGINACIÓN
    setHaBuscado(true);
    setProductoDetalles(null);
    setPaginaActual(1);
    calcularPaginacion(todosProductos);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      filtrarProductos();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [busqueda, filtroCategoria, todosProductos]);

  // ✅ EFECTO PARA SCROLLAR AL TOP AL CAMBIAR DE PÁGINA
  useEffect(() => {
    const tablaContainer = document.querySelector('.tabla-contenedor-con-scroll-compacta');
    if (tablaContainer) {
      tablaContainer.scrollTop = 0;
    }
  }, [paginaActual]);

  const handleFiltroCategoriaChange = (e) => {
    const categoria = e.target.value;
    setFiltroCategoria(categoria);
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroCategoria('');
    setProductos(todosProductos); // ✅ VOLVEMOS A MOSTRAR TODOS CON PAGINACIÓN
    setHaBuscado(true);
    setProductoDetalles(null);
    setPaginaActual(1);
    calcularPaginacion(todosProductos);
  };

  const handleEliminar = async () => {
    if (!productoAEliminar) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/productos/${productoAEliminar.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      await cargarTodosDatos(); // ✅ RECARGAMOS TODOS LOS DATOS
      
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
  const productosMostrar = obtenerProductosPaginaActual();

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
    console.log('Nuevo producto');
    if (onNavegarAFormulario) {
      onNavegarAFormulario('crear', null);
    }
  };

  // Función para manejar editar producto
  const handleEditarProducto = (producto) => {
    console.log('Editando producto:', producto);
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

        {/* ❌ ELIMINADO EL BOTÓN "MOSTRAR TODOS" */}

        {hayFiltrosActivos && (
          <button className="btn-limpiar-grande" onClick={limpiarFiltros}>
            <FaArrowLeft className="icono-btn" />
            Limpiar filtros
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

      {!hayFiltrosActivos && (
        <div className="mensaje-busqueda">
          Mostrando {productos.length} productos en total
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
            Limpiar filtros
          </button>
        </div>
      ) : hayResultados ? (
        <>
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
                {productosMostrar.map(producto => (
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

          {/* ✅ PAGINACIÓN - SIEMPRE VISIBLE (a menos que no haya productos) */}
          {productos.length > 0 && (
            <div className="paginacion-container">
              <div className="paginacion-info">
                Mostrando {((paginaActual - 1) * productosPorPagina) + 1} - {Math.min(paginaActual * productosPorPagina, productos.length)} de {productos.length} productos
              </div>
              
              <div className="paginacion-controles">
                <button 
                  className="btn-paginacion" 
                  onClick={irAPrimeraPagina}
                  disabled={paginaActual === 1}
                  title="Primera página"
                >
                  <FaStepBackward />
                </button>
                
                <button 
                  className="btn-paginacion" 
                  onClick={paginaAnterior}
                  disabled={paginaActual === 1}
                  title="Página anterior"
                >
                  <FaChevronLeft />
                </button>

                <div className="numeros-pagina">
                  {obtenerRangoPaginas().map(numero => (
                    <button
                      key={numero}
                      className={`numero-pagina ${numero === paginaActual ? 'activa' : ''}`}
                      onClick={() => irAPagina(numero)}
                    >
                      {numero}
                    </button>
                  ))}
                </div>

                <button 
                  className="btn-paginacion" 
                  onClick={paginaSiguiente}
                  disabled={paginaActual === totalPaginas}
                  title="Página siguiente"
                >
                  <FaChevronRight />
                </button>
                
                <button 
                  className="btn-paginacion" 
                  onClick={irAUltimaPagina}
                  disabled={paginaActual === totalPaginas}
                  title="Última página"
                >
                  <FaStepForward />
                </button>
              </div>

              {/* ✅ SELECTOR DE PRODUCTOS POR PÁGINA - AQUÍ ELIGES CUÁNTOS MOSTRAR */}
              <div className="paginacion-selector">
                <label>Productos por página:</label>
                <select 
                  value={productosPorPagina} 
                  onChange={(e) => {
                    const nuevoValor = Number(e.target.value);
                    setProductosPorPagina(nuevoValor);
                    setPaginaActual(1); // Resetear a primera página
                    calcularPaginacion(productos); // Recalcular paginación
                  }}
                  className="select-productos-pagina"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="sin-busqueda">
          <div className="mensaje-inicial">
            <h3>No hay productos registrados</h3>
            <p>Comience agregando un nuevo producto</p>
            {!modoLectura && (
              <button className="btn-agregar" onClick={handleNuevoProducto} style={{marginTop: '10px'}}>
                + Agregar primer producto
              </button>
            )}
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