import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Compras.css';
import ModalConfirmacion from './ModalConfirmacion';
import FormularioCompra from './FormularioCompra';
import { FaEdit, FaTrash, FaEye, FaList, FaArrowLeft, FaTimes, FaCalendarAlt, FaBox, FaDollarSign, FaUserTie, FaStickyNote, FaHashtag, FaClipboardList, FaSyncAlt, FaExclamationTriangle } from 'react-icons/fa';

function Compras({ esJefa = true, modoLectura = false, onNavegarAFormulario }) {
  const [compras, setCompras] = useState([]);
  const [todasCompras, setTodasCompras] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [vista, setVista] = useState('lista');
  const [compraEditar, setCompraEditar] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [compraAEliminar, setCompraAEliminar] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [loading, setLoading] = useState(false);
  const [haBuscado, setHaBuscado] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [compraDetalles, setCompraDetalles] = useState(null);

  // Lista de categorías para el filtro
  const categorias = [
    'Bebidas', 'Lácteos', 'Golosinas', 'Limpieza', 'Verduras', 
    'Carnes', 'Panificados', 'Fiambres', 'Perfumería', 
    'Electrodomésticos', 'Papelería', 'Otros'
  ];

  // Cargar todos los datos al inicio
  useEffect(() => {
    cargarTodosDatos();
  }, []);

  const cargarTodosDatos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Cargar compras, productos y proveedores en paralelo
      const [comprasRes, productosRes, proveedoresRes] = await Promise.all([
        axios.get('http://localhost:8000/api/compras/', {
          headers: { Authorization: `Token ${token}` }
        }),
        axios.get('http://localhost:8000/api/productos/', {
          headers: { Authorization: `Token ${token}` }
        }),
        axios.get('http://localhost:8000/api/proveedores/', {
          headers: { Authorization: `Token ${token}` }
        })
      ]);

      console.log('Compras:', comprasRes.data);
      console.log('Productos:', productosRes.data);
      console.log('Proveedores:', proveedoresRes.data);

      setTodasCompras(comprasRes.data);
      setProductos(productosRes.data);
      setProveedores(proveedoresRes.data);
      setCompras([]);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIÓN PARA VERIFICAR SI UN PROVEEDOR ESTÁ ACTIVO
  const estaActivo = (proveedor) => {
    return proveedor.estado !== false;
  };

  // ✅ FUNCIÓN PARA VERIFICAR SI UNA COMPRA TIENE ALGÚN PROVEEDOR INACTIVO
  const tieneProveedorInactivo = (compra) => {
    if (!compra.proveedores || compra.proveedores.length === 0) return false;
    
    return compra.proveedores.some(proveedor => !estaActivo(proveedor));
  };

  // ✅ FUNCIÓN PARA OBTENER PROVEEDORES INACTIVOS DE UNA COMPRA
  const obtenerProveedoresInactivos = (compra) => {
    if (!compra.proveedores || compra.proveedores.length === 0) return [];
    
    return compra.proveedores.filter(proveedor => !estaActivo(proveedor));
  };

  // Función para obtener producto por ID
  const obtenerProductoPorId = (productoId) => {
    return productos.find(p => p.id === productoId) || null;
  };

  // Función para obtener proveedor por ID (maneja tanto array como ID individual)
  const obtenerProveedores = (proveedorData) => {
    if (!proveedorData) return [];
    
    // Si es un array de IDs
    if (Array.isArray(proveedorData)) {
      return proveedores.filter(p => proveedorData.includes(p.id));
    }
    
    // Si es un solo ID
    const proveedor = proveedores.find(p => p.id === proveedorData);
    return proveedor ? [proveedor] : [];
  };

  // Función para enriquecer compras con datos relacionados
  const enriquecerComprasConDatos = (comprasList) => {
    return comprasList.map(compra => ({
      ...compra,
      producto: obtenerProductoPorId(compra.producto),
      proveedores: obtenerProveedores(compra.proveedores || compra.proveedor) // Maneja ambos casos
    }));
  };

  // Filtrar compras en el frontend
  const filtrarCompras = () => {
    if (busqueda === '' && filtroCategoria === '') {
      setCompras([]);
      setHaBuscado(false);
      setMostrarTodos(false);
      return;
    }

    let filtradas = [...todasCompras];

    // Enriquecer con datos relacionados antes de filtrar
    filtradas = enriquecerComprasConDatos(filtradas);

    // FILTRO POR CATEGORÍA (EXACTO)
    if (filtroCategoria.trim()) {
      filtradas = filtradas.filter(compra => 
        compra.producto?.categoria_prod && 
        compra.producto.categoria_prod.toLowerCase() === filtroCategoria.toLowerCase()
      );
    }

    // BÚSQUEDA POR NOMBRE DE PRODUCTO O PROVEEDOR
    if (busqueda.trim()) {
      filtradas = filtradas.filter(compra =>
        (compra.producto?.nombre_prod && 
         compra.producto.nombre_prod.toLowerCase().includes(busqueda.toLowerCase())) ||
        (compra.proveedores?.some(prov => 
          prov.nombre_prov && 
          prov.nombre_prov.toLowerCase().includes(busqueda.toLowerCase()))) ||
        (compra.codigo_compra && 
         compra.codigo_compra.toLowerCase().includes(busqueda.toLowerCase()))
      );
    }

    setCompras(filtradas);
    setHaBuscado(true);
    setMostrarTodos(false);
  };

  // Mostrar todas las compras
  const mostrarTodasCompras = () => {
    const comprasEnriquecidas = enriquecerComprasConDatos(todasCompras);
    setCompras(comprasEnriquecidas);
    setHaBuscado(true);
    setMostrarTodos(true);
    setBusqueda('');
    setFiltroCategoria('');
  };

  // Ocultar lista y volver al estado inicial
  const ocultarCompras = () => {
    setCompras([]);
    setHaBuscado(false);
    setMostrarTodos(false);
    setCompraDetalles(null);
  };

  // Efecto para filtrar cuando cambian los criterios
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      filtrarCompras();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [busqueda, filtroCategoria, todasCompras, productos, proveedores]);

  // Manejar cambio en el filtro de categoría
  const handleFiltroCategoriaChange = (e) => {
    const categoria = e.target.value;
    setFiltroCategoria(categoria);
  };

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroCategoria('');
    setCompras([]);
    setHaBuscado(false);
    setMostrarTodos(false);
    setCompraDetalles(null);
  };

  const handleEliminar = async () => {
    if (!compraAEliminar) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/compras/${compraAEliminar.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      await cargarTodosDatos();
      if (mostrarTodos) {
        const comprasEnriquecidas = enriquecerComprasConDatos(todasCompras);
        setCompras(comprasEnriquecidas);
      } else {
        filtrarCompras();
      }
      setMensajeExito('Compra eliminada correctamente');
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (error) {
      console.error('Error al eliminar compra:', error);
    } finally {
      setMostrarModal(false);
      setCompraAEliminar(null);
    }
  };

  const handleGuardadoExitoso = () => {
    setVista('lista');
    setCompraEditar(null);
    cargarTodosDatos();
    setMensajeExito(vista === 'crear' ? 'Compra registrada correctamente' : 'Compra actualizada correctamente');
    setTimeout(() => setMensajeExito(''), 3000);
  };

  // Función para manejar nueva compra
  const handleNuevaCompra = () => {
    console.log('➕ Nueva compra');
    if (onNavegarAFormulario) {
      onNavegarAFormulario('nueva', null);
    } else {
      // Fallback si no se pasa la prop
      setVista('crear');
    }
  };

  // Función para manejar editar compra
  const handleEditarCompra = (compra) => {
    console.log('🔄 Editando compra:', compra);
    if (onNavegarAFormulario) {
      onNavegarAFormulario('editar', compra);
    } else {
      // Fallback si no se pasa la prop
      setCompraEditar(compra);
      setVista('editar');
    }
  };

  // Verificar si hay filtros activos
  const hayFiltrosActivos = busqueda || filtroCategoria;
  const hayResultados = compras.length > 0;

  // Formatear fecha para mostrar
  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  // Formatear fecha y hora para fecha_actualizacion
  const formatearFechaHora = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleString('es-ES');
  };

  // Formatear precio
  const formatearPrecio = (precio) => {
    if (!precio) return '$ 0,00';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(precio);
  };

  // Obtener nombre seguro del producto
  const obtenerNombreProducto = (compra) => {
    return compra.producto?.nombre_prod || 'Producto no disponible';
  };

  // Obtener categoría segura del producto
  const obtenerCategoriaProducto = (compra) => {
    return compra.producto?.categoria_prod || 'Sin categoría';
  };

// ✅ FUNCIÓN MEJORADA: Obtener nombres de proveedores con estilo tachado para inactivos
const obtenerNombresProveedores = (compra) => {
  if (!compra.proveedores || compra.proveedores.length === 0) {
    return 'Proveedor no disponible';
  }
  
  const tieneInactivos = tieneProveedorInactivo(compra);
  
  // Si hay múltiples proveedores, mostrar el primero + "..."
  if (compra.proveedores.length > 1) {
    const primerProveedor = compra.proveedores[0].nombre_prov;
    return (
      <span className={tieneInactivos ? 'proveedor-inactivo-tachado' : ''}>
        {primerProveedor} +{compra.proveedores.length - 1} más
      </span>
    );
  }
  
  // Si solo hay un proveedor
  const proveedor = compra.proveedores[0];
  return (
    <span className={!estaActivo(proveedor) ? 'proveedor-inactivo-tachado' : ''}>
      {proveedor.nombre_prov}
    </span>
  );
};

  // SI ESTAMOS EN MODO CREAR O EDITAR, MOSTRAR EL FORMULARIO
  if (vista === 'crear' || vista === 'editar') {
    return (
      <FormularioCompra
        modo={vista}
        compraEditar={compraEditar}
        onCancelar={() => {
          setVista('lista');
          setCompraEditar(null);
        }}
        onGuardado={handleGuardadoExitoso}
      />
    );
  }

  // SI ESTAMOS EN MODO LISTA, MOSTRAR LA TABLA
  return (
    <div className="compras-container">
      <div className="header-compras">
        <h2>Compras</h2>
        <div className="header-actions">
          <button 
            className="btn-refrescar" 
            onClick={cargarTodosDatos}
            title="Actualizar lista"
          >
            <FaSyncAlt />
          </button>
          {!modoLectura && (
            <button className="btn-agregar" onClick={handleNuevaCompra}>
              + Registrar Compra
            </button>
          )}
        </div>
      </div>

      {/* MENSAJE DE ÉXITO */}
      {mensajeExito && (
        <div className="mensaje-exito">
          {mensajeExito}
        </div>
      )}

      {/* FILTROS Y BUSCADOR */}
      <div className="filtros-container">
        {/* BUSCADOR */}
        <div className="buscador-compras">
          <div className="input-busqueda-container">
            <input
              type="text"
              placeholder="Buscar por código, producto o proveedor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="input-busqueda"
            />
          </div>
        </div>

        {/* FILTRO POR CATEGORÍA */}
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

        {/* BOTÓN MOSTRAR TODOS */}
        {!mostrarTodos && !hayFiltrosActivos && (
          <button className="btn-mostrar-todos" onClick={mostrarTodasCompras}>
            <FaList className="icono-btn" />
            Mostrar todos
          </button>
        )}

        {/* BOTÓN LIMPIAR FILTROS */}
        {(hayFiltrosActivos || mostrarTodos) && (
          <button className="btn-limpiar-grande" onClick={limpiarFiltros}>
            <FaArrowLeft className="icono-btn" />
            Ocultar lista
          </button>
        )}
      </div>

      {/* MENSAJES DE BÚSQUEDA */}
      {hayFiltrosActivos && (
        <div className="mensaje-busqueda">
          {compras.length === 0 ? 
             `No se encontraron compras${
               busqueda ? ` con "${busqueda}"` : ''
             }${
               filtroCategoria ? ` de la categoría "${filtroCategoria}"` : ''
             }` : 
             `Mostrando ${compras.length} compra(s)${
               busqueda ? ` con "${busqueda}"` : ''
             }${
               filtroCategoria ? ` de la categoría "${filtroCategoria}"` : ''
             }`
          }
        </div>
      )}

      {mostrarTodos && (
        <div className="mensaje-busqueda">
          Mostrando todas las compras ({compras.length})
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      {loading ? (
        <div className="sin-busqueda">
          <div className="mensaje-inicial">
            <p>Cargando compras...</p>
          </div>
        </div>
      ) : hayFiltrosActivos && compras.length === 0 ? (
        <div className="sin-resultados">
          <p>No se encontraron compras con los criterios de búsqueda</p>
          <button className="btn-limpiar-grande" onClick={limpiarFiltros}>
            <FaArrowLeft className="icono-btn" />
            Ocultar lista
          </button>
        </div>
      ) : !hayFiltrosActivos && !haBuscado && !mostrarTodos ? (
        <div className="sin-busqueda">
          <div className="mensaje-inicial">
            <p>Utilice el buscador, los filtros o el botón "Mostrar todos" para encontrar compras específicas</p>
          </div>
        </div>
      ) : hayResultados ? (
        <div className="tabla-contenedor-con-scroll-compacta">
          <table className="tabla-compras-compacta">
            <thead>
              <tr>
                <th className="columna-codigo">Código</th>
                <th className="columna-producto">Producto</th>
                <th className="columna-categoria">Categoría</th>
                <th className="columna-proveedor">Proveedor</th>
                <th className="columna-fecha">Fecha Entrada</th>
                <th className="columna-cantidad">Cant.</th>
                <th className="columna-precio">Precio Total</th>
                <th className="columna-precio-venta">Precio Venta</th>
                {!modoLectura && <th className="columna-acciones">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {compras.map(compra => (
                <tr key={compra.id}>
                  <td className="codigo-compra centered">{compra.codigo_compra || 'N/A'}</td>
                  <td className="producto-compra">{obtenerNombreProducto(compra)}</td>
                  <td className="categoria-compra centered">{obtenerCategoriaProducto(compra)}</td>
                  <td className="proveedor-compra centered">
                    {obtenerNombresProveedores(compra)}
                  </td>
                  <td className="fecha-compra centered">{formatearFecha(compra.fecha_entrada)}</td>
                  <td className="cantidad-compra centered">{compra.cantidad || 0}</td>
                  <td className="precio-compra centered">{formatearPrecio(compra.precio_total)}</td>
                  <td className="precio-venta-compra centered">{formatearPrecio(compra.precio_venta)}</td>
                  {!modoLectura && (
                    <td className="acciones-compra centered">
                      <button
                        className="btn-icon editar"
                        onClick={() => handleEditarCompra(compra)}
                        title="Editar compra"
                      >
                        <FaEdit />
                      </button>
                      {esJefa && (
                        <button
                          className="btn-icon eliminar"
                          onClick={() => {
                            setCompraAEliminar(compra);
                            setMostrarModal(true);
                          }}
                          title="Eliminar compra"
                        >
                          <FaTrash />
                        </button>
                      )}
                      <button
                        className="btn-icon detalles"
                        onClick={() => setCompraDetalles(compra)}
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

      {/* MODAL DE CONFIRMACIÓN ELIMINAR */}
      <ModalConfirmacion
        mostrar={mostrarModal}
        tipo="eliminar"
        mensaje={`¿Está seguro que desea eliminar la compra "${compraAEliminar?.codigo_compra || compraAEliminar?.id}" del producto "${compraAEliminar?.producto?.nombre_prod || 'este producto'}"?`}
        onCancelar={() => setMostrarModal(false)}
        onConfirmar={handleEliminar}
      />

      {/* ✅ MODAL DE DETALLES COMPLETOS MEJORADO */}
      {compraDetalles && (
        <div className="modal-overlay-detalles" onClick={() => setCompraDetalles(null)}>
          <div className="modal-detalles-grande" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-detalles">
              <h3>Detalles de la Compra</h3>
              <button 
                className="btn-cerrar-modal"
                onClick={() => setCompraDetalles(null)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body-detalles-grande">
              <div className="detalle-principal-grande">
                <div className="info-principal-grande">
                  <h2>{obtenerNombreProducto(compraDetalles)}</h2>
                  <span className="badge-categoria-grande">
                    {obtenerCategoriaProducto(compraDetalles)}
                  </span>
                  {/* ✅ ALERTA DE PROVEEDOR INACTIVO */}
                  {tieneProveedorInactivo(compraDetalles) && (
                    <div className="alerta-proveedor-inactivo">
                      <FaExclamationTriangle className="icono-alerta" />
                      <span>Esta compra tiene proveedores inactivos</span>
                    </div>
                  )}
                </div>
                <div className="codigo-principal-grande">
                  Código: {compraDetalles.codigo_compra || 'N/A'}
                </div>
              </div>

              <div className="detalles-lista-grande">
                <div className="detalle-item-grande">
                  <div className="icono-detalle-grande">
                    <FaHashtag />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>Código de Compra</label>
                    <span>{compraDetalles.codigo_compra || 'N/A'}</span>
                  </div>
                </div>

                <div className="detalle-item-grande">
                  <div className="icono-detalle-grande">
                    <FaBox />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>Producto</label>
                    <span>{obtenerNombreProducto(compraDetalles)}</span>
                  </div>
                </div>

                <div className="detalle-item-grande">
                  <div className="icono-detalle-grande">
                    <FaClipboardList />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>Categoría</label>
                    <span>{obtenerCategoriaProducto(compraDetalles)}</span>
                  </div>
                </div>

                {/* ✅ PROVEEDORES MEJORADO - CON INDICADOR DE ESTADO */}
                {compraDetalles.proveedores && compraDetalles.proveedores.length > 0 && (
                  <div className="detalle-item-grande">
                    <div className="icono-detalle-grande">
                      <FaUserTie />
                    </div>
                    <div className="contenido-detalle-grande">
                      <label>Proveedor{compraDetalles.proveedores.length > 1 ? 'es' : ''}</label>
                      <div className="lista-proveedores-detalle">
                        {compraDetalles.proveedores.map((proveedor, index) => (
                          <div 
                            key={proveedor.id} 
                            className={`proveedor-item ${!estaActivo(proveedor) ? 'proveedor-inactivo-detalle' : ''}`}
                          >
                            <span className="nombre-proveedor">
                              {proveedor.nombre_prov}
                              {!estaActivo(proveedor) && (
                                <span className="estado-proveedor inactivo"> (Inactivo)</span>
                              )}
                            </span>
                            {index < compraDetalles.proveedores.length - 1 && <br />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="detalle-item-grande">
                  <div className="icono-detalle-grande">
                    <FaCalendarAlt />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>Fecha de Entrada</label>
                    <span>{formatearFecha(compraDetalles.fecha_entrada)}</span>
                  </div>
                </div>

                {compraDetalles.fecha_vencimiento && (
                  <div className="detalle-item-grande">
                    <div className="icono-detalle-grande">
                      <FaCalendarAlt />
                    </div>
                    <div className="contenido-detalle-grande">
                      <label>Fecha de Vencimiento</label>
                      <span>{formatearFecha(compraDetalles.fecha_vencimiento)}</span>
                    </div>
                  </div>
                )}

                <div className="detalle-item-grande">
                  <div className="icono-detalle-grande">
                    <FaCalendarAlt />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>Última Actualización</label>
                    <span>{formatearFechaHora(compraDetalles.fecha_actualizacion)}</span>
                  </div>
                </div>

                <div className="detalle-item-grande">
                  <div className="icono-detalle-grande">
                    <FaHashtag />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>Cantidad</label>
                    <span>{compraDetalles.cantidad || 0} unidades</span>
                  </div>
                </div>

                <div className="detalle-item-grande">
                  <div className="icono-detalle-grande">
                    <FaDollarSign />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>Precio Total</label>
                    <span>{formatearPrecio(compraDetalles.precio_total)}</span>
                  </div>
                </div>

                <div className="detalle-item-grande">
                  <div className="icono-detalle-grande">
                    <FaDollarSign />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>Precio de Venta</label>
                    <span>{formatearPrecio(compraDetalles.precio_venta)}</span>
                  </div>
                </div>

                <div className="detalle-item-grande">
                  <div className="icono-detalle-grande">
                    <FaDollarSign />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>Total Compra</label>
                    <span className="total-destacado">{formatearPrecio(compraDetalles.precio_total)}</span>
                  </div>
                </div>

                <div className="detalle-item-grande completo">
                  <div className="icono-detalle-grande">
                    <FaStickyNote />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>Descripción</label>
                    <div className="observaciones-detalle-grande">
                      {compraDetalles.descripcion || 'No hay descripción'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-detalles">
              <button 
                className="btn-cerrar"
                onClick={() => setCompraDetalles(null)}
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

export default Compras;