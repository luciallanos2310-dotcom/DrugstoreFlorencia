import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Proveedores.css';
import ModalConfirmacionUniversal from '../ModalConfirmacionUniversal/ModalConfirmacionUniversal';
import { FaEdit, FaEye, FaArrowLeft, FaTimes, FaPhone, FaEnvelope, FaStickyNote, FaMapMarkerAlt, FaIdCard, FaUser, FaCheck, FaChevronLeft, FaChevronRight, FaStepBackward, FaStepForward, FaPlus } from 'react-icons/fa';
import { BsBan } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom'; // ✅ AGREGADO

function Proveedores({ esJefa = true, modoLectura = false, onNavegarAFormulario }) {
  const [proveedores, setProveedores] = useState([]);
  const [todosProveedores, setTodosProveedores] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRubro, setFiltroRubro] = useState('');
  const [loading, setLoading] = useState(false);
  const [haBuscado, setHaBuscado] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [proveedorDetalles, setProveedorDetalles] = useState(null);

  // ✅ ESTADOS PARA PAGINACIÓN
  const [paginaActual, setPaginaActual] = useState(1);
  const [proveedoresPorPagina, setProveedoresPorPagina] = useState(5);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // ✅ ESTADO PARA MODAL UNIVERSAL
  const [modalConfig, setModalConfig] = useState({
    mostrar: false,
    tipo: '',
    mensaje: '',
    proveedor: null,
    onConfirmar: null
  });

  const navigate = useNavigate(); // ✅ AGREGADO

  const rubros = [
    'Bebidas',
    'Lácteos', 
    'Golosinas',
    'Limpieza',
    'Verduras',
    'Carnes',
    'Panificados',
    'Fiambres',
    'Perfumería',
    'Electrodomésticos',
    'Papelería',
    'Distribuidora',
    'Otros'
  ];

  // ✅ FUNCIÓN MEJORADA: Manejar nuevo proveedor
  const handleNuevoProveedor = () => {
    console.log('➕ Nuevo proveedor - navegando a formulario...');
    if (onNavegarAFormulario) {
      onNavegarAFormulario('crear', null);
    } else {
      // Fallback: navegar directamente
      navigate('/dashboard/proveedores/nuevo');
    }
  };

  // ✅ FUNCIÓN MEJORADA: Manejar edición de proveedor
  const handleEditarProveedor = (proveedor) => {
    console.log('✏️ Editar proveedor - navegando a formulario...');
    if (onNavegarAFormulario) {
      onNavegarAFormulario('editar', proveedor);
    } else {
      // Fallback: navegar directamente
      navigate(`/dashboard/proveedores/editar/${proveedor.id}`);
    }
  };

  useEffect(() => {
    cargarTodosProveedores();
  }, []);

  const cargarTodosProveedores = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8000/api/proveedores/', {
        headers: { Authorization: `Token ${token}` }
      });
      
      console.log('Proveedores cargados:', res.data);
      setTodosProveedores(res.data);
      setProveedores(res.data);
      
      // ✅ CALCULAR PAGINACIÓN INICIAL
      calcularPaginacion(res.data);
    } catch (error) {
      console.error('Error al cargar todos los proveedores', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIÓN PARA CALCULAR PAGINACIÓN
  const calcularPaginacion = (listaProveedores) => {
    const total = listaProveedores.length;
    const paginas = Math.ceil(total / proveedoresPorPagina);
    setTotalPaginas(paginas);
    setPaginaActual(1);
  };

  // ✅ FUNCIÓN PARA OBTENER PROVEEDORES DE LA PÁGINA ACTUAL
  const obtenerProveedoresPaginaActual = () => {
    const inicio = (paginaActual - 1) * proveedoresPorPagina;
    const fin = inicio + proveedoresPorPagina;
    return proveedores.slice(inicio, fin);
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

  // ✅ FUNCIÓN PARA GENERAR RANGO DE PÁGINAS
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

  // ✅ FUNCIÓN PARA ABRIR MODAL UNIVERSAL
  const abrirModalConfirmacion = (proveedor, accion) => {
    const mensajes = {
      inhabilitar: `¿Está seguro que desea INHABILITAR el proveedor "${proveedor.nombre_prov}"? El proveedor aparecerá como "Inactivo" pero no se eliminará del sistema.`,
      habilitar: `¿Está seguro que desea HABILITAR el proveedor "${proveedor.nombre_prov}"?`
    };

    setModalConfig({
      mostrar: true,
      tipo: accion,
      mensaje: mensajes[accion],
      proveedor: proveedor,
      onConfirmar: () => handleInhabilitarHabilitar(proveedor, accion)
    });
  };

  // ✅ FUNCIÓN PARA CERRAR MODAL
  const cerrarModal = () => {
    setModalConfig({
      mostrar: false,
      tipo: '',
      mensaje: '',
      proveedor: null,
      onConfirmar: null
    });
  };

  const handleInhabilitarHabilitar = async (proveedor, accion) => {
    if (!proveedor) return;
    
    try {
      const token = localStorage.getItem('token');
      const nuevoEstado = accion === 'inhabilitar' ? false : true;
      
      console.log(`Cambiando estado del proveedor ${proveedor.id} a:`, nuevoEstado);
      
      const datosActualizar = {
        nombre_prov: proveedor.nombre_prov,
        tipo_prov: proveedor.tipo_prov,
        telefono_prov: proveedor.telefono_prov || '',
        correo_prov: proveedor.correo_prov || '',
        direccion_prov: proveedor.direccion_prov || '',
        descripcion: proveedor.descripcion || '',
        codigo_proveedor: proveedor.codigo_proveedor || '',
        estado: nuevoEstado
      };
      
      await axios.put(`http://localhost:8000/api/proveedores/${proveedor.id}/`, datosActualizar, {
        headers: { 
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      await cargarTodosProveedores();
      
      const accionTexto = accion === 'inhabilitar' ? 'inhabilitado' : 'habilitado';
      setMensajeExito(`Proveedor ${accionTexto} correctamente`);
      setTimeout(() => setMensajeExito(''), 3000);
      
      cerrarModal();
    } catch (error) {
      console.error(`Error al ${accion} proveedor:`, error);
      console.error('Detalles del error:', error.response?.data);
      
      setModalConfig({
        mostrar: true,
        tipo: 'error',
        mensaje: `Error al ${accion} el proveedor. Por favor, intente nuevamente.`,
        proveedor: null,
        onConfirmar: cerrarModal
      });
    }
  };

  const filtrarProveedores = () => {
    if (busqueda === '' && filtroRubro === '') {
      setProveedores(todosProveedores);
      setHaBuscado(true);
      calcularPaginacion(todosProveedores);
      return;
    }

    let filtrados = [...todosProveedores];

    if (filtroRubro.trim()) {
      filtrados = filtrados.filter(proveedor => 
        proveedor.tipo_prov && 
        proveedor.tipo_prov.toLowerCase() === filtroRubro.toLowerCase()
      );
    }

    if (busqueda.trim()) {
      filtrados = filtrados.filter(proveedor =>
        proveedor.nombre_prov && 
        proveedor.nombre_prov.toLowerCase().startsWith(busqueda.toLowerCase())
      );
    }

    setProveedores(filtrados);
    setHaBuscado(true);
    
    calcularPaginacion(filtrados);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      filtrarProveedores();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [busqueda, filtroRubro, todosProveedores]);

  // ✅ EFECTO PARA SCROLLAR AL TOP AL CAMBIAR DE PÁGINA
  useEffect(() => {
    const tablaContainer = document.querySelector('.tabla-contenedor-con-scroll');
    if (tablaContainer) {
      tablaContainer.scrollTop = 0;
    }
  }, [paginaActual]);

  const handleFiltroRubroChange = (e) => {
    const rubro = e.target.value;
    setFiltroRubro(rubro);
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroRubro('');
    setProveedores(todosProveedores);
    setHaBuscado(true);
    setProveedorDetalles(null);
    setPaginaActual(1);
    calcularPaginacion(todosProveedores);
  };

  const hayFiltrosActivos = busqueda || filtroRubro;
  const hayResultados = proveedores.length > 0;
  const proveedoresMostrar = obtenerProveedoresPaginaActual();

  const estaActivo = (proveedor) => {
    return proveedor.estado !== false;
  };

  return (
    <div className="proveedores-container">
      <div className="header-proveedores">
        <h2>Proveedores</h2>
        {!modoLectura && (
          <button className="btn-agregar" onClick={handleNuevoProveedor}>
            <FaPlus style={{marginRight: '8px'}} />
            Agregar proveedor
          </button>
        )}
      </div>

      {mensajeExito && (
        <div className="mensaje-exito">
          {mensajeExito}
        </div>
      )}

      <div className="filtros-container">
        <div className="buscador-proveedores">
          <div className="input-busqueda-container">
            <input
              type="text"
              placeholder="Busque el proveedor que desee ver"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="input-busqueda"
            />
          </div>
        </div>

        <div className="filtro-rubro">
          <label>Filtrar por rubro:</label>
          <select 
            value={filtroRubro} 
            onChange={handleFiltroRubroChange}
            className="select-filtro"
          >
            <option value="">Todos los rubros</option>
            {rubros.map(rubro => (
              <option key={rubro} value={rubro}>{rubro}</option>
            ))}
          </select>
        </div>

        {hayFiltrosActivos && (
          <button className="btn-limpiar" onClick={limpiarFiltros}>
            <FaArrowLeft className="icono-btn" />
            Limpiar filtros
          </button>
        )}
      </div>

      {hayFiltrosActivos && (
        <div className="mensaje-busqueda">
          {proveedores.length === 0 ? 
             `No se encontraron proveedores${
               busqueda ? ` que empiecen con "${busqueda}"` : ''
             }${
               filtroRubro ? ` del rubro "${filtroRubro}"` : ''
             }` : 
             `Mostrando ${proveedores.length} proveedor(es)${
               busqueda ? ` que empiezan con "${busqueda}"` : ''
             }${
               filtroRubro ? ` del rubro "${filtroRubro}"` : ''
             }`
          }
        </div>
      )}

      {!hayFiltrosActivos && (
        <div className="mensaje-busqueda">
          Mostrando {proveedores.length} proveedores en total
        </div>
      )}

      {loading ? (
        <div className="sin-busqueda">
          <div className="mensaje-inicial">
            <p>Cargando proveedores...</p>
          </div>
        </div>
      ) : hayFiltrosActivos && proveedores.length === 0 ? (
        <div className="sin-resultados">
          <p>No se encontraron proveedores con los criterios de búsqueda</p>
          <button className="btn-limpiar" onClick={limpiarFiltros}>
            <FaArrowLeft className="icono-btn" />
            Limpiar filtros
          </button>
        </div>
      ) : hayResultados ? (
        <>
          <div className="tabla-contenedor-con-scroll">
            <table className="tabla-proveedores">
              <thead>
                <tr>
                  <th className="columna-codigo">CÓDIGO</th>
                  <th className="columna-nombre">Nombre</th>
                  <th className="columna-rubro">Rubro</th>
                  <th className="columna-estado">Estado</th>
                  <th className="columna-telefono">Teléfono</th>
                  <th className="columna-email">Email</th>
                  {!modoLectura && <th className="columna-acciones">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {proveedoresMostrar.map(p => (
                  <tr key={p.id} className={!estaActivo(p) ? 'proveedor-inactivo' : ''}>
                    <td className="codigo-proveedor centered">
                      {p.codigo_proveedor || 'No especificado'}
                    </td>
                    <td className="nombre-proveedor centered">{p.nombre_prov}</td>
                    <td className="rubro-proveedor centered">{p.tipo_prov}</td>
                    <td className="estado-proveedor centered">
                      <span className={`badge-estado ${estaActivo(p) ? 'activo' : 'inactivo'}`}>
                        {estaActivo(p) ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="telefono-proveedor centered">{p.telefono_prov || '-'}</td>
                    <td className="email-proveedor centered">{p.correo_prov || '-'}</td>
                    {!modoLectura && (
                      <td className="acciones-proveedor centered">
                        <button
                          className="btn-icon editar"
                          onClick={() => handleEditarProveedor(p)}
                          title="Editar proveedor"
                        >
                          <FaEdit />
                        </button>
                        {esJefa && (
                          <>
                            {estaActivo(p) ? (
                              <button
                                className="btn-icon inhabilitar"
                                onClick={() => abrirModalConfirmacion(p, 'inhabilitar')}
                                title="Inhabilitar proveedor"
                              >
                                <BsBan />
                              </button>
                            ) : (
                              <button
                                className="btn-icon habilitar"
                                onClick={() => abrirModalConfirmacion(p, 'habilitar')}
                                title="Habilitar proveedor"
                              >
                                <FaCheck />
                              </button>
                            )}
                          </>
                        )}
                        <button
                          className="btn-icon detalles"
                          onClick={() => setProveedorDetalles(p)}
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

          {/* ✅ PAGINACIÓN */}
          {proveedores.length > 0 && (
            <div className="paginacion-container">
              <div className="paginacion-info">
                Mostrando {((paginaActual - 1) * proveedoresPorPagina) + 1} - {Math.min(paginaActual * proveedoresPorPagina, proveedores.length)} de {proveedores.length} proveedores
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
            <h3>No hay proveedores registrados</h3>
            <p>Comience agregando un nuevo proveedor</p>
            {!modoLectura && (
              <button className="btn-agregar" onClick={handleNuevoProveedor} style={{marginTop: '10px'}}>
                <FaPlus style={{marginRight: '8px'}} />
                Agregar primer proveedor
              </button>
            )}
          </div>
        </div>
      )}

      {/* ✅ MODAL UNIVERSAL */}
      <ModalConfirmacionUniversal
        mostrar={modalConfig.mostrar}
        tipo={modalConfig.tipo}
        mensaje={modalConfig.mensaje}
        onConfirmar={modalConfig.onConfirmar}
        onCancelar={cerrarModal}
        modo="proveedor"
      />

      {proveedorDetalles && (
        <div className="modal-overlay-detalles" onClick={() => setProveedorDetalles(null)}>
          <div className="modal-detalles-grande" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-detalles">
              <h3>Información del Proveedor</h3>
              <button 
                className="btn-cerrar-modal"
                onClick={() => setProveedorDetalles(null)}
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body-detalles-grande">
              <div className="detalle-principal-grande">
                <div className="info-principal-grande">
                  <h2>{proveedorDetalles.nombre_prov}</h2>
                  <span className="badge-rubro-grande">
                    {proveedorDetalles.tipo_prov}
                  </span>
                  <span className={`badge-estado-grande ${estaActivo(proveedorDetalles) ? 'activo' : 'inactivo'}`}>
                    {estaActivo(proveedorDetalles) ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              <div className="detalles-lista-grande">
                <div className="detalle-item-grande">
                  <div className="icono-detalle-grande">
                    <FaIdCard />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>CÓDIGO</label>
                    <span>{proveedorDetalles.codigo_proveedor || 'No especificado'}</span>
                  </div>
                </div>

                <div className="detalle-item-grande">
                  <div className="icono-detalle-grande">
                    <FaUser />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>Nombre</label>
                    <span>{proveedorDetalles.nombre_prov}</span>
                  </div>
                </div>

                <div className="detalle-item-grande">
                  <div className="icono-detalle-grande">
                    <FaIdCard />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>Rubro</label>
                    <span>{proveedorDetalles.tipo_prov}</span>
                  </div>
                </div>

                <div className="detalle-item-grande">
                  <div className="icono-detalle-grande">
                    <FaPhone />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>Teléfono</label>
                    <span>{proveedorDetalles.telefono_prov || 'No especificado'}</span>
                  </div>
                </div>

                <div className="detalle-item-grande">
                  <div className="icono-detalle-grande">
                    <FaEnvelope />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>Email</label>
                    <span>{proveedorDetalles.correo_prov || 'No especificado'}</span>
                  </div>
                </div>

                <div className="detalle-item-grande">
                  <div className="icono-detalle-grande">
                    <FaMapMarkerAlt />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>Dirección</label>
                    <span>{proveedorDetalles.direccion_prov || 'No especificada'}</span>
                  </div>
                </div>

                <div className="detalle-item-grande completo">
                  <div className="icono-detalle-grande">
                    <FaStickyNote />
                  </div>
                  <div className="contenido-detalle-grande">
                    <label>Descripcion</label>
                    <div className="observaciones-detalle-grande">
                      {proveedorDetalles.descripcion || 'No hay observaciones'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-detalles">
              <button 
                className="btn-cerrar"
                onClick={() => setProveedorDetalles(null)}
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

export default Proveedores;