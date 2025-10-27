import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Proveedores.css';
import ModalConfirmacion from './ModalConfirmacion';
import FormularioProveedor from './FormularioProveedor';

function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [todosProveedores, setTodosProveedores] = useState([]);
  const [vista, setVista] = useState('lista');
  const [proveedorEditar, setProveedorEditar] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [proveedorAEliminar, setProveedorAEliminar] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRubro, setFiltroRubro] = useState('');
  const [loading, setLoading] = useState(true);
  const [haBuscado, setHaBuscado] = useState(false);

  // Lista de rubros para el filtro
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

  // Cargar todos los proveedores al inicio
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
      setTodosProveedores(res.data);
      setProveedores([]); // Inicialmente vacío hasta que se busque
    } catch (error) {
      console.error('Error al cargar todos los proveedores', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar proveedores en el frontend
  const filtrarProveedores = () => {
    if (busqueda === '' && filtroRubro === '') {
      setProveedores([]);
      setHaBuscado(false);
      return;
    }

    let filtrados = [...todosProveedores];

    // FILTRO POR RUBRO (EXACTO)
    if (filtroRubro.trim()) {
      filtrados = filtrados.filter(proveedor => 
        proveedor.tipo_prov && 
        proveedor.tipo_prov.toLowerCase() === filtroRubro.toLowerCase()
      );
    }

    // BÚSQUEDA POR INICIO DEL NOMBRE (SOLO INICIO)
    if (busqueda.trim()) {
      filtrados = filtrados.filter(proveedor =>
        proveedor.nombre_prov && 
        proveedor.nombre_prov.toLowerCase().startsWith(busqueda.toLowerCase())
      );
    }

    setProveedores(filtrados);
    setHaBuscado(true);
  };

  // Efecto para filtrar cuando cambian los criterios
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      filtrarProveedores();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [busqueda, filtroRubro, todosProveedores]);

  // Manejar cambio en el filtro de rubro
  const handleFiltroRubroChange = (e) => {
    const rubro = e.target.value;
    setFiltroRubro(rubro);
  };

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroRubro('');
    setProveedores([]);
    setHaBuscado(false);
  };

  const handleEliminar = async () => {
    if (!proveedorAEliminar) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/proveedores/${proveedorAEliminar.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      await cargarTodosProveedores();
      filtrarProveedores();
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
    } finally {
      setMostrarModal(false);
      setProveedorAEliminar(null);
    }
  };

  // Verificar si hay filtros activos
  const hayFiltrosActivos = busqueda || filtroRubro;

  // SI ESTAMOS EN MODO CREAR O EDITAR, MOSTRAR EL FORMULARIO
  if (vista === 'crear' || vista === 'editar') {
    return (
      <FormularioProveedor
        modo={vista}
        proveedorEditar={proveedorEditar}
        onCancelar={() => {
          setVista('lista');
          setProveedorEditar(null);
        }}
        onGuardado={() => {
          setVista('lista');
          setProveedorEditar(null);
          cargarTodosProveedores();
        }}
      />
    );
  }

  // SI ESTAMOS EN MODO LISTA, MOSTRAR LA TABLA
  return (
    <div className="proveedores-container">
      <div className="header-proveedores">
        <h2>Proveedores</h2>
        <button className="btn-agregar" onClick={() => setVista('crear')}>
          + Agregar proveedor
        </button>
      </div>

      {/* FILTROS Y BUSCADOR */}
      <div className="filtros-container">
        {/* BUSCADOR POR NOMBRE */}
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

        {/* FILTRO POR RUBRO */}
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

        {/* BOTÓN LIMPIAR FILTROS */}
        {hayFiltrosActivos && (
          <button className="btn-limpiar" onClick={limpiarFiltros}>
            ✕ Limpiar filtros
          </button>
        )}
      </div>

      {/* MENSAJES DE BÚSQUEDA */}
      {hayFiltrosActivos && (
        <p className="mensaje-busqueda">
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
        </p>
      )}

      {/* CONTENIDO PRINCIPAL */}
      {loading ? (
        <div className="estado-carga">Cargando proveedores...</div>
      ) : hayFiltrosActivos && proveedores.length === 0 ? (
        <div className="sin-resultados">
          <p>No se encontraron proveedores con los criterios de búsqueda</p>
          <button className="btn-limpiar" onClick={limpiarFiltros}>
            ✕ Limpiar filtros
          </button>
        </div>
      ) : !hayFiltrosActivos && !haBuscado ? (
        <div className="sin-busqueda">
          <div className="mensaje-inicial">
            <p>Utilice el buscador o los filtros para encontrar proveedores específicos</p>
          </div>
        </div>
      ) : proveedores.length > 0 ? (
        <div className="tabla-contenedor">
          <table className="tabla-proveedores">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Rubro</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.map(p => (
                <tr key={p.id}>
                  <td className="id-proveedor">{p.id.toString().padStart(2, '0')}</td>
                  <td className="nombre-proveedor">{p.nombre_prov}</td>
                  <td className="rubro-proveedor">{p.tipo_prov}</td>
                  <td className="telefono-proveedor">{p.telefono_prov || '-'}</td>
                  <td className="email-proveedor">{p.correo_prov || '-'}</td>
                  <td className="acciones-proveedor">
                    <button
                      className="btn-icon editar"
                      onClick={() => {
                        setProveedorEditar(p);
                        setVista('editar');
                      }}
                      title="Editar proveedor"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon eliminar"
                      onClick={() => {
                        setProveedorAEliminar(p);
                        setMostrarModal(true);
                      }}
                      title="Eliminar proveedor"
                    >
                      🗑️
                    </button>
                  </td>
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

      {mostrarModal && (
        <ModalConfirmacion
          titulo="Eliminar proveedor"
          mensaje={`¿Está seguro que desea eliminar el proveedor "${proveedorAEliminar?.nombre_prov}"?`}
          onCancelar={() => setMostrarModal(false)}
          onConfirmar={handleEliminar}
        />
      )}
    </div>
  );
}

export default Proveedores;