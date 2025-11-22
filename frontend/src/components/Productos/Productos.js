import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Productos.css';
import ModalConfirmacionUniversal from '../ModalConfirmacionUniversal/ModalConfirmacionUniversal';
import { FaEdit, FaTrash, FaEye, FaArrowLeft, FaTimes, FaBox, FaDollarSign, FaHashtag, FaClipboardList, FaExclamationTriangle, FaChevronLeft, FaChevronRight, FaStepBackward, FaStepForward, FaUserTie, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom'; // ✅ AGREGADO

function Productos({ esJefa = true, modoLectura = false, onNavegarAFormulario }) {
  const [productos, setProductos] = useState([]);
  const [todosProductos, setTodosProductos] = useState([]);
  const [compras, setCompras] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [loading, setLoading] = useState(false);
  const [productoDetalles, setProductoDetalles] = useState(null);
  const [proveedoresProducto, setProveedoresProducto] = useState([]);
  const [modalTipo, setModalTipo] = useState('eliminar');
  const [modalMensaje, setModalMensaje] = useState('');

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [productosPorPagina] = useState(6);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const navigate = useNavigate(); // ✅ AGREGADO

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
      
      const [productosRes, comprasRes, proveedoresRes] = await Promise.all([
        axios.get('http://localhost:8000/api/productos/', {
          headers: { Authorization: `Token ${token}` }
        }),
        axios.get('http://localhost:8000/api/compras/', {
          headers: { Authorization: `Token ${token}` }
        }),
        axios.get('http://localhost:8000/api/proveedores/', {
          headers: { Authorization: `Token ${token}` }
        })
      ]);

      setTodosProductos(productosRes.data);
      setProductos(productosRes.data);
      setCompras(comprasRes.data);
      setProveedores(proveedoresRes.data);
      
      calcularPaginacion(productosRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIÓN MEJORADA: Manejar nuevo producto
  const handleNuevoProducto = () => {
    console.log('➕ Nuevo producto - navegando a formulario...');
    if (onNavegarAFormulario) {
      onNavegarAFormulario('crear', null);
    } else {
      // Fallback: navegar directamente
      navigate('/dashboard/productos/nuevo');
    }
  };

  // ✅ FUNCIÓN MEJORADA: Manejar edición de producto
  const handleEditarProducto = (producto) => {
    console.log('✏️ Editar producto - navegando a formulario...');
    if (onNavegarAFormulario) {
      onNavegarAFormulario('editar', producto);
    } else {
      // Fallback: navegar directamente
      navigate(`/dashboard/productos/editar/${producto.id}`);
    }
  };

  // ✅ FUNCIÓN CORREGIDA: Manejar eliminación de producto
  const handleEliminarProducto = (producto) => {
    // Mostrar modal de confirmación directamente
    // La verificación de ventas se hará en el backend
    setModalTipo('eliminar');
    setModalMensaje(`¿Está seguro que desea eliminar el producto "${producto.nombre_prod}"?`);
    setProductoAEliminar(producto);
    setMostrarModal(true);
  };

  // ✅ FUNCIÓN CORREGIDA: Ejecutar eliminación después de confirmación
  const handleEliminarConfirmado = async () => {
    if (!productoAEliminar) return;
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.delete(`http://localhost:8000/api/productos/${productoAEliminar.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      
      // ✅ ÉXITO: Producto eliminado (no tenía ventas)
      await cargarTodosDatos();
      
      setModalTipo('exito');
      setModalMensaje('Producto y sus compras asociadas eliminados correctamente');
      setProductoAEliminar(null);
      
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      
      // ✅ VERIFICAR SI EL ERROR ES POR VENTAS ASOCIADAS
      if (error.response && error.response.data && error.response.data.error) {
        const mensajeError = error.response.data.error;
        
        if (mensajeError.includes('ventas asociadas')) {
          // ❌ ERROR: Tiene ventas asociadas - ENVIAR MENSAJE ESPECÍFICO
          setModalTipo('error');
          setModalMensaje(mensajeError); // El backend ya envía el mensaje específico
        } else {
          // ❌ OTRO ERROR
          setModalTipo('error');
          setModalMensaje('Error al eliminar el producto. Por favor, intente nuevamente.');
        }
      } else {
        setModalTipo('error');
        setModalMensaje('Error al eliminar el producto. Por favor, intente nuevamente.');
      }
      
      setProductoAEliminar(null);
    }
  };

  // Obtener proveedores de un producto
  const obtenerProveedoresDelProducto = (productoId) => {
    if (!productoId || !compras.length || !proveedores.length) return [];

    const comprasDelProducto = compras.filter(compra => 
      compra.producto === productoId || 
      compra.producto?.id === productoId
    );

    const proveedoresEncontrados = [];
    
    comprasDelProducto.forEach(compra => {
      if (compra.proveedores && Array.isArray(compra.proveedores)) {
        compra.proveedores.forEach(provId => {
          const proveedor = proveedores.find(p => 
            p.id === provId || 
            p.id === parseInt(provId)
          );
          if (proveedor && !proveedoresEncontrados.some(p => p.id === proveedor.id)) {
            proveedoresEncontrados.push(proveedor);
          }
        });
      }
    });

    return proveedoresEncontrados;
  };

  // Abrir detalles con proveedores
  const abrirDetallesConProveedores = (producto) => {
    const proveedoresDelProducto = obtenerProveedoresDelProducto(producto.id);
    setProveedoresProducto(proveedoresDelProducto);
    setProductoDetalles(producto);
  };

  // Verificar si un proveedor está activo
  const estaActivo = (proveedor) => {
    return proveedor.estado !== false && proveedor.estado !== 'inactivo';
  };

  // Calcular paginación
  const calcularPaginacion = (listaProductos) => {
    const total = listaProductos.length;
    const paginas = Math.ceil(total / productosPorPagina);
    setTotalPaginas(paginas);
    setPaginaActual(1);
  };

  // Obtener productos de la página actual
  const obtenerProductosPaginaActual = () => {
    const inicio = (paginaActual - 1) * productosPorPagina;
    const fin = inicio + productosPorPagina;
    return productos.slice(inicio, fin);
  };

  // Funciones de paginación
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

  // Generar rango de páginas
  const obtenerRangoPaginas = () => {
    const paginasVisibles = 5;
    let inicio = Math.max(1, paginaActual - Math.floor(paginasVisibles / 2));
    let fin = Math.min(totalPaginas, inicio + paginasVisibles - 1);
    
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
      setProductos(todosProductos);
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
    calcularPaginacion(filtrados);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      filtrarProductos();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [busqueda, filtroCategoria, todosProductos]);

  // Scrollear al top al cambiar de página
  useEffect(() => {
    const tablaContainer = document.querySelector('.tabla-contenedor-con-scroll-compacta');
    if (tablaContainer) {
      tablaContainer.scrollTop = 0;
    }
  }, [paginaActual]);

  const handleFiltroCategoriaChange = (e) => {
    setFiltroCategoria(e.target.value);
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroCategoria('');
    setProductos(todosProductos);
    setProductoDetalles(null);
    setPaginaActual(1);
    calcularPaginacion(todosProductos);
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

  // Función para obtener el estado del stock
  const obtenerEstadoStock = (producto) => {
    const cantidad = producto.cantidad || 0;
    const stockMinimo = producto.stock_minimo || 5;
    
    if (cantidad === 0) return 'sin-stock';
    if (cantidad <= stockMinimo) return 'stock-bajo';
    if (cantidad <= stockMinimo * 2) return 'stock-medio';
    return 'stock-normal';
  };

  // Función para obtener texto del estado del stock
  const obtenerTextoStock = (producto) => {
    const cantidad = producto.cantidad || 0;
    const stockMinimo = producto.stock_minimo || 5;
    
    if (cantidad === 0) return 'Sin Stock';
    if (cantidad <= stockMinimo) return 'Stock Bajo';
    if (cantidad <= stockMinimo * 2) return 'Stock Medio';
    return 'Stock Normal';
  };

  // Función para verificar si está en bajo stock
  const estaEnBajoStock = (producto) => {
    const cantidad = producto.cantidad || 0;
    const stockMinimo = producto.stock_minimo || 5;
    return cantidad <= stockMinimo;
  };

  return (
    <div className="productos-container">
      <div className="header-productos">
        <h2>Productos</h2>
        <div className="header-actions">
          {!modoLectura && (
            <button className="btn-agregar" onClick={handleNuevoProducto}>
              <FaPlus style={{marginRight: '8px'}} />
              Nuevo Producto
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
                        {producto.cantidad || 0}
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
                            onClick={() => handleEliminarProducto(producto)}
                            title="Eliminar producto"
                          >
                            <FaTrash />
                          </button>
                        )}
                        <button
                          className="btn-icon detalles"
                          onClick={() => abrirDetallesConProveedores(producto)}
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

          {/* PAGINACIÓN */}
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
                <FaPlus style={{marginRight: '8px'}} />
                Agregar primer producto
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal para eliminar producto o mostrar resultados */}
      <ModalConfirmacionUniversal
        mostrar={mostrarModal}
        tipo={modalTipo}
        modo="producto"
        mensaje={modalMensaje}
        datosAdicionales={productoAEliminar}
        onConfirmar={modalTipo === 'eliminar' ? handleEliminarConfirmado : () => setMostrarModal(false)}
        onCancelar={() => {
          setMostrarModal(false);
          setProductoAEliminar(null);
        }}
        textoConfirmar={modalTipo === 'eliminar' ? 'Eliminar' : 'Aceptar'}
        mostrarResumen={modalTipo === 'eliminar'}
      />

      {/* Modal de detalles del producto */}
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

                {/* SECCIÓN: PROVEEDORES DEL PRODUCTO */}
                {proveedoresProducto.length > 0 && (
                  <div className="detalle-item-grande">
                    <div className="icono-detalle-grande">
                      <FaUserTie />
                    </div>
                    <div className="contenido-detalle-grande">
                      <label>Proveedor{proveedoresProducto.length > 1 ? 'es' : ''}</label>
                      <div className="lista-proveedores-detalle">
                        {proveedoresProducto.map((proveedor, index) => (
                          <div 
                            key={proveedor?.id || index} 
                            className={`proveedor-item ${!estaActivo(proveedor) ? 'proveedor-inactivo-detalle' : ''}`}
                          >
                            <span className="nombre-proveedor">
                              {proveedor?.nombre_prov || 'Proveedor no disponible'}
                              {proveedor && !estaActivo(proveedor) && (
                                <span className="estado-proveedor inactivo"> (Inactivo)</span>
                              )}
                            </span>
                            {index < proveedoresProducto.length - 1 && <br />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

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