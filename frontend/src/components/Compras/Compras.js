import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Compras.css';
import ModalConfirmacionUniversal from '../ModalConfirmacionUniversal';
import FormularioCompra from './FormularioCompra';
import { FaEdit, FaEye, FaList, FaArrowLeft, FaTimes, FaCalendarAlt, FaBox, FaDollarSign, FaUserTie, FaStickyNote, FaHashtag, FaClipboardList, FaSyncAlt, FaExclamationTriangle, FaBan } from 'react-icons/fa';

function Compras({ esJefa = true, modoLectura = false, onNavegarAFormulario }) {
  const [compras, setCompras] = useState([]);
  const [todasCompras, setTodasCompras] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [vista, setVista] = useState('lista');
  const [compraEditar, setCompraEditar] = useState(null);
  const [compraAAnular, setCompraAAnular] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [loading, setLoading] = useState(false);
  const [haBuscado, setHaBuscado] = useState(false);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [compraDetalles, setCompraDetalles] = useState(null);

  // Estados para modal universal
  const [modalConfig, setModalConfig] = useState({});
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);

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
      setModalConfig({
        tipo: 'error',
        modo: 'compra',
        mensaje: '❌ Error al cargar los datos de compras'
      });
      setMostrarModalConfirmacion(true);
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

  // ✅ NUEVA FUNCIÓN: Anular compra
  // ✅ FUNCIÓN CORREGIDA: Anular compra
const handleAnularCompra = async () => {
  if (!compraAAnular) return;
  try {
    const token = localStorage.getItem('token');
    
    console.log('Anulando compra:', compraAAnular.id);
    
    // Usar PATCH y estado en minúsculas según el modelo Django
    const response = await axios.patch(`http://localhost:8000/api/compras/${compraAAnular.id}/`, {
      estado: 'anulada'  // ✅ Cambiado a minúsculas
    }, {
      headers: { 
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Respuesta anulación:', response.data);
    
    await cargarTodosDatos();
    
    setModalConfig({
      tipo: 'exito',
      modo: 'compra',
      mensaje: `✅ Compra "${compraAAnular.codigo_compra}" anulada correctamente. El stock ha sido restado.`
    });
    setMostrarModalConfirmacion(true);
    
  } catch (error) {
    console.error('Error completo al anular compra:', error);
    console.error('Detalles del error:', error.response?.data);
    
    setModalConfig({
      tipo: 'error',
      modo: 'compra',
      mensaje: error.response?.data 
        ? `❌ Error al anular: ${JSON.stringify(error.response.data)}`
        : '❌ Error de conexión al anular la compra'
    });
    setMostrarModalConfirmacion(true);
  } finally {
    setCompraAAnular(null);
  }
};

  const handleCerrarModal = () => {
    setMostrarModalConfirmacion(false);
    if (modalConfig.tipo === 'exito') {
      // Recargar datos después de éxito
      if (mostrarTodos) {
        const comprasEnriquecidas = enriquecerComprasConDatos(todasCompras);
        setCompras(comprasEnriquecidas);
      } else {
        filtrarCompras();
      }
    }
  };

  const handleGuardadoExitoso = (onGuardado) => {
  console.log('✅ Guardado exitoso, volviendo a lista...');
  setVista('lista');
  setCompraEditar(null);
  cargarTodosDatos(); // Recargar los datos
  
  // Mostrar mensaje de éxito
  setModalConfig({
    tipo: 'exito',
    modo: 'compra',
    mensaje: '✅ Compra registrada correctamente'
  });
  setMostrarModalConfirmacion(true);
  
  // ✅ LLAMAR AL CALLBACK SI EXISTE
  if (onGuardado) {
    onGuardado();
  }
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

  // ✅ NUEVA FUNCIÓN: Confirmar anulación
    const confirmarAnulacion = (compra) => {
      setCompraAAnular(compra);
      setModalConfig({
        tipo: 'eliminar',
        modo: 'compra',
        mensaje: `¿Está seguro que desea ANULAR la compra "${compra.codigo_compra}" del producto "${compra.producto?.nombre_prod || 'este producto'}"?\n\n⚠️ Esta acción restará ${compra.cantidad} unidades del stock del producto.`,
        textoConfirmar: 'Anular Compra',
        textoCancelar: 'Cancelar'
      });
      setMostrarModalConfirmacion(true);
    };


  // Verificar si hay filtros activos
  const hayFiltrosActivos = busqueda || filtroCategoria;
  const hayResultados = compras.length > 0;

  // Formatear fecha para mostrar
  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES');
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

 // ✅ FUNCIÓN CORREGIDA: Obtener clase CSS para estado de compra
const obtenerClaseEstado = (estado) => {
  switch(estado?.toLowerCase()) {  // ✅ Usar toLowerCase()
    case 'activa': return 'estado-activa';
    case 'anulada': return 'estado-anulada';
    default: return 'estado-desconocido';
  }
};

// ✅ FUNCIÓN CORREGIDA: Obtener texto para estado de compra
const obtenerTextoEstado = (estado) => {
  switch(estado?.toLowerCase()) {  // ✅ Usar toLowerCase()
    case 'activa': return 'Activa';
    case 'anulada': return 'Anulada';
    default: return estado;
  }
};

  // SI ESTAMOS EN MODO CREAR O EDITAR, MOSTRAR EL FORMULARIO
if (vista === 'crear' || vista === 'editar') {
  return (
    <FormularioCompra
      modo={vista}
      compraEditar={compraEditar}
      onCancelar={() => {
        console.log('❌ Cancelando, volviendo a lista...');
        setVista('lista');
        setCompraEditar(null);
      }}
      onGuardado={() => {
        console.log('✅ Guardado completado, volviendo a lista...');
        setVista('lista');
        setCompraEditar(null);
        cargarTodosDatos(); // Recargar datos
      }}
    />
  );
}

  // SI ESTAMOS EN MODO LISTA, MOSTRAR LA TABLA
  return (
    <div className="compras-container">
      <div className="header-compras">
        <h2>Compras</h2>
        <div className="header-actions">
          {!modoLectura && (
            <button className="btn-agregar" onClick={handleNuevaCompra}>
              + Registrar Compra
            </button>
          )}
        </div>
      </div>

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
                <th className="columna-proveedor">Proveedor</th>
                <th className="columna-fecha">Fecha Compra</th>
                <th className="columna-cantidad">Cant.</th>
                <th className="columna-precio">Precio Total</th>
                <th className="columna-estado">Estado</th>
                {!modoLectura && <th className="columna-acciones">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {compras.map(compra => (
                <tr key={compra.id} className={compra.estado?.toLowerCase() === 'anulada' ? 'compra-anulada' : ''}>
                  <td className="codigo-compra centered">{compra.codigo_compra || 'N/A'}</td>
                  <td className="producto-compra">{obtenerNombreProducto(compra)}</td>
                  <td className="proveedor-compra centered">
                    {obtenerNombresProveedores(compra)}
                  </td>
                  <td className="fecha-compra centered">{formatearFecha(compra.fecha_compra)}</td>
                  <td className="cantidad-compra centered">{compra.cantidad || 0}</td>
                  <td className="precio-compra centered">{formatearPrecio(compra.precio_total)}</td>
                  <td className="estado-compra centered">
                    <span className={`badge-estado ${obtenerClaseEstado(compra.estado)}`}>
                      {obtenerTextoEstado(compra.estado)}
                    </span>
                  </td>
                  {!modoLectura && (
                    <td className="acciones-compra centered">
                      <button
                        className="btn-icon editar"
                        onClick={() => handleEditarCompra(compra)}
                        title="Editar compra"
                        disabled={compra.estado === 'ANULADA'}
                      >
                        <FaEdit />
                      </button>  
                    
                        <button
                          className="btn-icon anular"
                          onClick={() => confirmarAnulacion(compra)}
                          title="Anular compra (restará stock)"
                        >
                          <FaBan />
                        </button>
                                    
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

      {/* MODALES AL FINAL */}

      {/* Modal Universal para Confirmaciones */}
      <ModalConfirmacionUniversal
        mostrar={mostrarModalConfirmacion}
        tipo={modalConfig.tipo}
        modo={modalConfig.modo}
        mensaje={modalConfig.mensaje}
        textoConfirmar={modalConfig.textoConfirmar}
        textoCancelar={modalConfig.textoCancelar}
        onConfirmar={handleAnularCompra}
        onCancelar={handleCerrarModal}
      />

      {/* Modal de Detalles Completos */}
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
                  <span className={`badge-estado-grande ${obtenerClaseEstado(compraDetalles.estado)}`}>
                    {obtenerTextoEstado(compraDetalles.estado)}
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
                    <label>Fecha de Compra</label>
                    <span>{formatearFecha(compraDetalles.fecha_compra)}</span>
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
                    <FaHashtag />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>Estado</label>
                    <span className={`badge-estado-grande ${obtenerClaseEstado(compraDetalles.estado)}`}>
                      {obtenerTextoEstado(compraDetalles.estado)}
                    </span>
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