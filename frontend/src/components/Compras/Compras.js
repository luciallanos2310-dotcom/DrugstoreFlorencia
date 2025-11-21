import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Compras.css';
import ModalConfirmacionUniversal from '../ModalConfirmacion.Universal/ModalConfirmacionUniversal';
import FormularioCompra from './FormularioCompra';
import { FaEye, FaArrowLeft, FaTimes, FaCalendarAlt, FaBox, FaDollarSign, FaUserTie, FaStickyNote, FaHashtag, FaClipboardList, FaExclamationTriangle, FaBan, FaChevronLeft, FaChevronRight, FaStepBackward, FaStepForward } from 'react-icons/fa';

function Compras({ esJefa = true, modoLectura = false, onNavegarAFormulario }) {
  const [compras, setCompras] = useState([]);
  const [todasCompras, setTodasCompras] = useState([]);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [vista, setVista] = useState('lista');
  const [compraAAnular, setCompraAAnular] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [loading, setLoading] = useState(false);
  const [haBuscado, setHaBuscado] = useState(false);
  const [compraDetalles, setCompraDetalles] = useState(null);

  // ✅ ESTADOS PARA PAGINACIÓN
  const [paginaActual, setPaginaActual] = useState(1);
  const [comprasPorPagina, setComprasPorPagina] = useState(6);
  const [totalPaginas, setTotalPaginas] = useState(1);

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

      // ✅ ENRIQUECER LAS COMPRAS CON DATOS RELACIONADOS ANTES DE GUARDARLAS
      const comprasEnriquecidas = enriquecerComprasConDatos(comprasRes.data, productosRes.data, proveedoresRes.data);
      
      setTodasCompras(comprasEnriquecidas);
      setProductos(productosRes.data);
      setProveedores(proveedoresRes.data);
      setCompras(comprasEnriquecidas);
      
      // ✅ CALCULAR PAGINACIÓN INICIAL
      calcularPaginacion(comprasEnriquecidas);
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

  // ✅ FUNCIÓN CORREGIDA: Enriquecer compras con datos relacionados
  const enriquecerComprasConDatos = (comprasList, productosList, proveedoresList) => {
    console.log('Enriqueciendo compras con datos relacionados...');
    
    return comprasList.map(compra => {
      // ✅ OBTENER PRODUCTO
      let productoEncontrado = null;
      if (compra.producto) {
        // Buscar por ID (puede ser número o string)
        productoEncontrado = productosList.find(p => 
          p.id === compra.producto || 
          p.id === parseInt(compra.producto) ||
          p.id?.toString() === compra.producto?.toString()
        );
      }
      
      // ✅ OBTENER PROVEEDORES
      let proveedoresEncontrados = [];
      if (compra.proveedores && Array.isArray(compra.proveedores)) {
        proveedoresEncontrados = compra.proveedores.map(provId => 
          proveedoresList.find(p => 
            p.id === provId || 
            p.id === parseInt(provId) ||
            p.id?.toString() === provId?.toString()
          )
        ).filter(prov => prov != null); // Filtrar nulls
      } else if (compra.proveedor) {
        // Si viene como proveedor individual
        const proveedor = proveedoresList.find(p => 
          p.id === compra.proveedor || 
          p.id === parseInt(compra.proveedor) ||
          p.id?.toString() === compra.proveedor?.toString()
        );
        if (proveedor) proveedoresEncontrados = [proveedor];
      }
      
      console.log(`Compra ${compra.codigo_compra}:`, {
        productoOriginal: compra.producto,
        productoEncontrado: productoEncontrado,
        proveedoresOriginal: compra.proveedores || compra.proveedor,
        proveedoresEncontrados: proveedoresEncontrados
      });
      
      return {
        ...compra,
        producto: productoEncontrado,
        proveedores: proveedoresEncontrados
      };
    });
  };

  // ✅ FUNCIÓN PARA CALCULAR PAGINACIÓN
  const calcularPaginacion = (listaCompras) => {
    const total = listaCompras.length;
    const paginas = Math.ceil(total / comprasPorPagina);
    setTotalPaginas(paginas);
    setPaginaActual(1); // Resetear a primera página
  };

  // ✅ FUNCIÓN PARA OBTENER COMPRAS DE LA PÁGINA ACTUAL
  const obtenerComprasPaginaActual = () => {
    const inicio = (paginaActual - 1) * comprasPorPagina;
    const fin = inicio + comprasPorPagina;
    return compras.slice(inicio, fin);
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

  // ✅ FUNCIÓN PARA VERIFICAR SI UN PROVEEDOR ESTÁ ACTIVO
  const estaActivo = (proveedor) => {
    return proveedor.estado !== false && proveedor.estado !== 'inactivo';
  };

  // ✅ FUNCIÓN PARA VERIFICAR SI UNA COMPRA TIENE ALGÚN PROVEEDOR INACTIVO
  const tieneProveedorInactivo = (compra) => {
    if (!compra.proveedores || compra.proveedores.length === 0) return false;
    
    return compra.proveedores.some(proveedor => !estaActivo(proveedor));
  };

  // Filtrar compras en el frontend
  const filtrarCompras = () => {
    if (busqueda === '' && filtroCategoria === '') {
      // ✅ SI NO HAY FILTROS, MOSTRAMOS TODAS LAS COMPRAS CON PAGINACIÓN
      setCompras(todasCompras);
      setHaBuscado(true);
      calcularPaginacion(todasCompras);
      return;
    }

    let filtradas = [...todasCompras];

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
    
    // ✅ CALCULAR PAGINACIÓN PARA LOS RESULTADOS FILTRADOS
    calcularPaginacion(filtradas);
  };

  const ocultarCompras = () => {
    setCompras(todasCompras); // ✅ VOLVEMOS A MOSTRAR TODAS CON PAGINACIÓN
    setHaBuscado(true);
    setCompraDetalles(null);
    setPaginaActual(1);
    calcularPaginacion(todasCompras);
  };

  // Efecto para filtrar cuando cambian los criterios
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      filtrarCompras();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [busqueda, filtroCategoria, todasCompras]);

  // ✅ EFECTO PARA SCROLLAR AL TOP AL CAMBIAR DE PÁGINA
  useEffect(() => {
    const tablaContainer = document.querySelector('.tabla-contenedor-con-scroll-compacta');
    if (tablaContainer) {
      tablaContainer.scrollTop = 0;
    }
  }, [paginaActual]);

  // Manejar cambio en el filtro de categoría
  const handleFiltroCategoriaChange = (e) => {
    const categoria = e.target.value;
    setFiltroCategoria(categoria);
  };

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroCategoria('');
    setCompras(todasCompras); // ✅ VOLVEMOS A MOSTRAR TODAS CON PAGINACIÓN
    setHaBuscado(true);
    setCompraDetalles(null);
    setPaginaActual(1);
    calcularPaginacion(todasCompras);
  };

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
      cargarTodosDatos();
    }
  };

  const handleGuardadoExitoso = () => {
    console.log('✅ Guardado exitoso, volviendo a lista...');
    setVista('lista');
    cargarTodosDatos(); // Recargar los datos
    
    // Mostrar mensaje de éxito
    setModalConfig({
      tipo: 'exito',
      modo: 'compra',
      mensaje: '✅ Compra registrada correctamente'
    });
    setMostrarModalConfirmacion(true);
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
  const comprasMostrar = obtenerComprasPaginaActual();

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

  // ✅ FUNCIÓN CORREGIDA: Obtener nombre seguro del producto
  const obtenerNombreProducto = (compra) => {
    return compra.producto?.nombre_prod || 'Producto no disponible';
  };

  // ✅ FUNCIÓN CORREGIDA: Obtener categoría segura del producto
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
      const primerProveedor = compra.proveedores[0]?.nombre_prov || 'Proveedor';
      return (
        <span className={tieneInactivos ? 'proveedor-inactivo-tachado' : ''}>
          {primerProveedor} +{compra.proveedores.length - 1} más
        </span>
      );
    }
    
    // Si solo hay un proveedor
    const proveedor = compra.proveedores[0];
    if (!proveedor?.nombre_prov) return 'Proveedor no disponible';
    
    return (
      <span className={!estaActivo(proveedor) ? 'proveedor-inactivo-tachado' : ''}>
        {proveedor.nombre_prov}
      </span>
    );
  };

  // ✅ FUNCIÓN CORREGIDA: Obtener clase CSS para estado de compra
  const obtenerClaseEstado = (estado) => {
    switch(estado?.toLowerCase()) {
      case 'activa': return 'estado-activa';
      case 'anulada': return 'estado-anulada';
      default: return 'estado-desconocido';
    }
  };

  // ✅ FUNCIÓN CORREGIDA: Obtener texto para estado de compra
  const obtenerTextoEstado = (estado) => {
    switch(estado?.toLowerCase()) {
      case 'activa': return 'Activa';
      case 'anulada': return 'Anulada';
      default: return estado;
    }
  };

  // SI ESTAMOS EN MODO CREAR, MOSTRAR EL FORMULARIO
  if (vista === 'crear') {
    return (
      <FormularioCompra
        modo="nueva"
        onCancelar={() => {
          console.log('❌ Cancelando, volviendo a lista...');
          setVista('lista');
        }}
        onGuardado={() => {
          console.log('✅ Guardado completado, volviendo a lista...');
          setVista('lista');
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

        {hayFiltrosActivos && (
          <button className="btn-limpiar-grande" onClick={limpiarFiltros}>
            <FaArrowLeft className="icono-btn" />
            Limpiar filtros
          </button>
        )}
      </div>

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

      {!hayFiltrosActivos && (
        <div className="mensaje-busqueda">
          Mostrando {compras.length} compras en total
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
            Limpiar filtros
          </button>
        </div>
      ) : hayResultados ? (
        <>
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
                {comprasMostrar.map(compra => (
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
                        {compra.estado?.toLowerCase() === 'activa' && (
                          <button
                            className="btn-icon anular"
                            onClick={() => confirmarAnulacion(compra)}
                            title="Anular compra (restará stock)"
                          >
                            <FaBan />
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

          {/* ✅ PAGINACIÓN - SIEMPRE VISIBLE (a menos que no haya compras) */}
          {compras.length > 0 && (
            <div className="paginacion-container">
              <div className="paginacion-info">
                Mostrando {((paginaActual - 1) * comprasPorPagina) + 1} - {Math.min(paginaActual * comprasPorPagina, compras.length)} de {compras.length} compras
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

              {/* ✅ SELECTOR DE COMPRAS POR PÁGINA */}
              {/*<div className="paginacion-selector">
                <label>Compras por página:</label>
                <select 
                  value={comprasPorPagina} 
                  onChange={(e) => {
                    const nuevoValor = Number(e.target.value);
                    setComprasPorPagina(nuevoValor);
                    setPaginaActual(1);
                    calcularPaginacion(compras);
                  }}
                  className="select-compras-pagina"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              */}
            </div>
          )}
        </>
      ) : (
        <div className="sin-busqueda">
          <div className="mensaje-inicial">
            <h3>No hay compras registradas</h3>
            <p>Comience registrando una nueva compra</p>
            {!modoLectura && (
              <button className="btn-agregar" onClick={handleNuevaCompra} style={{marginTop: '10px'}}>
                + Registrar primera compra
              </button>
            )}
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
                            key={proveedor?.id || index} 
                            className={`proveedor-item ${!estaActivo(proveedor) ? 'proveedor-inactivo-detalle' : ''}`}
                          >
                            <span className="nombre-proveedor">
                              {proveedor?.nombre_prov || 'Proveedor no disponible'}
                              {proveedor && !estaActivo(proveedor) && (
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