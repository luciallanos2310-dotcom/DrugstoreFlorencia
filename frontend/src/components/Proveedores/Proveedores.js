import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Proveedores.css';
import ModalConfirmacion from './ModalConfirmacion';
import FormularioProveedor from './FormularioProveedor';
import { FaEdit, FaEye, FaList, FaArrowLeft, FaTimes, FaPhone, FaEnvelope, FaStickyNote, FaMapMarkerAlt, FaIdCard, FaUser, FaCheck } from 'react-icons/fa';
import { BsBan } from 'react-icons/bs';

function Proveedores({ esJefa = true, modoLectura = false }) {
  const [proveedores, setProveedores] = useState([]);
  const [todosProveedores, setTodosProveedores] = useState([]);
  const [vista, setVista] = useState('lista');
  const [proveedorEditar, setProveedorEditar] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [proveedorAInhabilitar, setProveedorAInhabilitar] = useState(null);
  const [accionModal, setAccionModal] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroRubro, setFiltroRubro] = useState('');
  const [loading, setLoading] = useState(false);
  const [haBuscado, setHaBuscado] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [proveedorDetalles, setProveedorDetalles] = useState(null);

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

  useEffect(() => {
    cargarTodosProveedores();
  }, []);

  const cargarTodosProveedores = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8000/api/proveedores/', {
        headers: { Authorization: `Token ${token}` }
      });
      
      console.log('Proveedores cargados:', res.data);
      setTodosProveedores(res.data);
      setProveedores([]);
    } catch (error) {
      console.error('Error al cargar todos los proveedores', error);
    }
  };

  const filtrarProveedores = () => {
    if (busqueda === '' && filtroRubro === '') {
      setProveedores([]);
      setHaBuscado(false);
      setMostrarTodos(false);
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
    setMostrarTodos(false);
  };

  const mostrarTodosProveedores = () => {
    setProveedores(todosProveedores);
    setHaBuscado(true);
    setMostrarTodos(true);
    setBusqueda('');
    setFiltroRubro('');
  };

  const ocultarProveedores = () => {
    setProveedores([]);
    setHaBuscado(false);
    setMostrarTodos(false);
    setProveedorDetalles(null);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      filtrarProveedores();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [busqueda, filtroRubro, todosProveedores]);

  const handleFiltroRubroChange = (e) => {
    const rubro = e.target.value;
    setFiltroRubro(rubro);
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroRubro('');
    setProveedores([]);
    setHaBuscado(false);
    setMostrarTodos(false);
    setProveedorDetalles(null);
  };

  const handleInhabilitarHabilitar = async () => {
    if (!proveedorAInhabilitar) return;
    
    try {
      const token = localStorage.getItem('token');
      const nuevoEstado = accionModal === 'inhabilitar' ? false : true;
      
      console.log(`Cambiando estado del proveedor ${proveedorAInhabilitar.id} a:`, nuevoEstado);
      
      const datosActualizar = {
        nombre_prov: proveedorAInhabilitar.nombre_prov,
        tipo_prov: proveedorAInhabilitar.tipo_prov,
        telefono_prov: proveedorAInhabilitar.telefono_prov || '',
        correo_prov: proveedorAInhabilitar.correo_prov || '',
        direccion_prov: proveedorAInhabilitar.direccion_prov || '',
        descripcion: proveedorAInhabilitar.descripcion || '',
        dni_proveedor: proveedorAInhabilitar.dni_proveedor || '',
        estado: nuevoEstado
      };
      
      await axios.put(`http://localhost:8000/api/proveedores/${proveedorAInhabilitar.id}/`, datosActualizar, {
        headers: { 
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      await cargarTodosProveedores();
      
      if (mostrarTodos) {
        setProveedores(todosProveedores);
      } else if (busqueda || filtroRubro) {
        filtrarProveedores();
      }
      
      const accionTexto = accionModal === 'inhabilitar' ? 'inhabilitado' : 'habilitado';
      setMensajeExito(`Proveedor ${accionTexto} correctamente`);
      setTimeout(() => setMensajeExito(''), 3000);
    } catch (error) {
      console.error(`Error al ${accionModal} proveedor:`, error);
      console.error('Detalles del error:', error.response?.data);
    } finally {
      setMostrarModal(false);
      setProveedorAInhabilitar(null);
      setAccionModal('');
    }
  };

  const handleGuardadoExitoso = () => {
    setVista('lista');
    setProveedorEditar(null);
    cargarTodosProveedores();
    setMensajeExito(vista === 'crear' ? 'Proveedor creado correctamente' : 'Proveedor actualizado correctamente');
    setTimeout(() => setMensajeExito(''), 3000);
  };

  const hayFiltrosActivos = busqueda || filtroRubro;
  const hayResultados = proveedores.length > 0;

  const estaActivo = (proveedor) => {
    return proveedor.estado !== false;
  };

  if (vista === 'crear' || vista === 'editar') {
    return (
      <FormularioProveedor
        modo={vista}
        proveedorEditar={proveedorEditar}
        onCancelar={() => {
          setVista('lista');
          setProveedorEditar(null);
        }}
        onGuardado={handleGuardadoExitoso}
      />
    );
  }

  return (
    <div className="proveedores-container">
      <div className="header-proveedores">
        <h2>Proveedores</h2>
        {!modoLectura && (
          <button className="btn-agregar" onClick={() => setVista('crear')}>
            + Agregar proveedor
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

        {!mostrarTodos && !hayFiltrosActivos && (
          <button className="btn-mostrar-todos" onClick={mostrarTodosProveedores}>
            <FaList className="icono-btn" />
            Mostrar todos
          </button>
        )}

        {(hayFiltrosActivos || mostrarTodos) && (
          <button className="btn-limpiar" onClick={limpiarFiltros}>
            <FaArrowLeft className="icono-btn" />
            Ocultar lista
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

      {mostrarTodos && (
        <div className="mensaje-busqueda">
          Mostrando todos los proveedores ({proveedores.length})
        </div>
      )}

      {hayFiltrosActivos && proveedores.length === 0 ? (
        <div className="sin-resultados">
          <p>No se encontraron proveedores con los criterios de búsqueda</p>
          <button className="btn-limpiar" onClick={limpiarFiltros}>
            <FaArrowLeft className="icono-btn" />
            Ocultar lista
          </button>
        </div>
      ) : !hayFiltrosActivos && !haBuscado && !mostrarTodos ? (
        <div className="sin-busqueda">
          <div className="mensaje-inicial">
            <p>Utilice el buscador, los filtros o el botón "Mostrar todos" para encontrar proveedores específicos</p>
          </div>
        </div>
      ) : hayResultados ? (
        <div className="tabla-contenedor-con-scroll">
          <table className="tabla-proveedores">
            <thead>
              <tr>
                {mostrarTodos ? (
                  <th className="columna-dni">DNI</th>
                ) : (
                  <th className="columna-id">ID</th>
                )}
                <th className="columna-nombre">Nombre</th>
                <th className="columna-rubro">Rubro</th>
                <th className="columna-estado">Estado</th>
                <th className="columna-telefono">Teléfono</th>
                <th className="columna-email">Email</th>
                {!modoLectura && <th className="columna-acciones">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {proveedores.map(p => (
                <tr key={p.id} className={!estaActivo(p) ? 'proveedor-inactivo' : ''}>
                  {mostrarTodos ? (
                    <td className="dni-proveedor centered">
                      {p.dni_proveedor || 'No especificado'}
                    </td>
                  ) : (
                    <td className="id-proveedor centered">{p.id.toString().padStart(2, '0')}</td>
                  )}
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
                        onClick={() => {
                          setProveedorEditar(p);
                          setVista('editar');
                        }}
                        title="Editar proveedor"
                      >
                        <FaEdit />
                      </button>
                      {esJefa && (
                        <>
                          {estaActivo(p) ? (
                            <button
                              className="btn-icon inhabilitar"
                              onClick={() => {
                                setProveedorAInhabilitar(p);
                                setAccionModal('inhabilitar');
                                setMostrarModal(true);
                              }}
                              title="Inhabilitar proveedor"
                            >
                              <BsBan />
                            </button>
                          ) : (
                            <button
                              className="btn-icon habilitar"
                              onClick={() => {
                                setProveedorAInhabilitar(p);
                                setAccionModal('habilitar');
                                setMostrarModal(true);
                              }}
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
      ) : (
        <div className="sin-busqueda">
          <div className="mensaje-inicial">
            <h3>No hay resultados</h3>
            <p>Intente con otros términos de búsqueda o filtros</p>
          </div>
        </div>
      )}

      <ModalConfirmacion
        mostrar={mostrarModal}
        tipo={accionModal}
        mensaje={
          accionModal === 'inhabilitar' 
            ? `¿Está seguro que desea INHABILITAR el proveedor "${proveedorAInhabilitar?.nombre_prov}"? El proveedor aparecerá como "Inactivo" pero no se eliminará del sistema.`
            : `¿Está seguro que desea HABILITAR el proveedor "${proveedorAInhabilitar?.nombre_prov}"?`
        }
        onCancelar={() => {
          setMostrarModal(false);
          setProveedorAInhabilitar(null);
          setAccionModal('');
        }}
        onConfirmar={handleInhabilitarHabilitar}
      />

      {proveedorDetalles && (
        console.log('Datos del proveedor en detalles:', proveedorDetalles), 
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
                    <label>DNI</label>
                    <span>{proveedorDetalles.dni_proveedor || 'No especificado'}</span>
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