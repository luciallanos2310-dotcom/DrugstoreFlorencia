import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Productos.css';
import ModalConfirmacion from '../Productos/ModalConfirmacion'; // ✅ CORREGIDO
import FormularioProducto from './FormularioProducto';

function Productos() {
  const [productos, setProductos] = useState([]);
  const [todosProductos, setTodosProductos] = useState([]);
  const [vista, setVista] = useState('lista');
  const [productoEditar, setProductoEditar] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [loading, setLoading] = useState(true);
  const [haBuscado, setHaBuscado] = useState(false);

  // DEBUG - Agrega esto para ver qué está pasando
  console.log('Vista actual:', vista);
  console.log('Productos cargados:', todosProductos.length);

  // Lista de categorías para el filtro
  const categorias = [
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
    'Otros'
  ];

  // Cargar todos los productos al inicio
  useEffect(() => {
    cargarTodosProductos();
  }, []);

  const cargarTodosProductos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8000/api/productos/', {
        headers: { Authorization: `Token ${token}` }
      });
      setTodosProductos(res.data);
      setProductos([]); // Inicialmente vacío hasta que se busque
    } catch (error) {
      console.error('Error al cargar todos los productos', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar productos en el frontend
  const filtrarProductos = () => {
    if (busqueda === '' && filtroCategoria === '') {
      setProductos([]);
      setHaBuscado(false);
      return;
    }

    let filtrados = [...todosProductos];

    // FILTRO POR CATEGORÍA (EXACTO)
    if (filtroCategoria.trim()) {
      filtrados = filtrados.filter(producto => 
        producto.categoria_prod && 
        producto.categoria_prod.toLowerCase() === filtroCategoria.toLowerCase()
      );
    }

    // BÚSQUEDA POR INICIO DEL NOMBRE (SOLO INICIO)
    if (busqueda.trim()) {
      filtrados = filtrados.filter(producto =>
        producto.nombre_prod && 
        producto.nombre_prod.toLowerCase().startsWith(busqueda.toLowerCase())
      );
    }

    setProductos(filtrados);
    setHaBuscado(true);
  };

  // Efecto para filtrar cuando cambian los criterios
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      filtrarProductos();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [busqueda, filtroCategoria, todosProductos]);

  // Manejar cambio en el filtro de categoría
  const handleFiltroCategoriaChange = (e) => {
    const categoria = e.target.value;
    setFiltroCategoria(categoria);
  };

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroCategoria('');
    setProductos([]);
    setHaBuscado(false);
  };

  const handleEliminar = async () => {
    if (!productoAEliminar) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/productos/${productoAEliminar.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      await cargarTodosProductos();
      filtrarProductos();
    } catch (error) {
      console.error('Error al eliminar producto:', error);
    } finally {
      setMostrarModal(false);
      setProductoAEliminar(null);
    }
  };

  // Verificar si hay filtros activos
  const hayFiltrosActivos = busqueda || filtroCategoria;

  // ✅ SI ESTAMOS EN MODO CREAR O EDITAR, MOSTRAR EL FORMULARIO
  if (vista === 'crear' || vista === 'editar') {
    console.log('Renderizando FormularioProducto en modo:', vista);
    return (
      <FormularioProducto
        modo={vista}
        productoEditar={productoEditar}
        onCancelar={() => {
          console.log('Cancelando formulario...');
          setVista('lista');
          setProductoEditar(null);
        }}
        onGuardado={() => {
          console.log('Producto guardado exitosamente');
          setVista('lista');
          setProductoEditar(null);
          cargarTodosProductos();
        }}
      />
    );
  }

  // ✅ SI ESTAMOS EN MODO LISTA, MOSTRAR LA TABLA
  return (
    <div className="productos-container">
      <div className="header-productos">
        <h2>Productos</h2>
        <button 
          className="btn-agregar" 
          onClick={() => {
            console.log('Click en Agregar producto');
            setVista('crear');
            setProductoEditar(null);
          }}
        >
          + Agregar producto
        </button>
      </div>

      {/* FILTROS Y BUSCADOR */}
      <div className="filtros-container">
        {/* BUSCADOR POR NOMBRE */}
        <div className="buscador-productos">
          <div className="input-busqueda-container">
            <input
              type="text"
              placeholder="Busque el producto que desea ver..."
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
          {productos.length === 0 ? 
             `No se encontraron productos${
               busqueda ? ` que empiecen con "${busqueda}"` : ''
             }${
               filtroCategoria ? ` de la categoría "${filtroCategoria}"` : ''
             }` : 
             `Mostrando ${productos.length} producto(s)${
               busqueda ? ` que empiezan con "${busqueda}"` : ''
             }${
               filtroCategoria ? ` de la categoría "${filtroCategoria}"` : ''
             }`
          }
        </p>
      )}

      {/* CONTENIDO PRINCIPAL */}
      {loading ? (
        <div className="estado-carga">Cargando productos...</div>
      ) : hayFiltrosActivos && productos.length === 0 ? (
        <div className="sin-resultados">
          <p>No se encontraron productos con los criterios de búsqueda</p>
          <button className="btn-limpiar" onClick={limpiarFiltros}>
            ✕ Limpiar filtros
          </button>
        </div>
      ) : !hayFiltrosActivos && !haBuscado ? (
        <div className="sin-busqueda">
          <div className="mensaje-inicial">
            <p>Utilice el buscador o los filtros para encontrar productos específicos</p>
          </div>
        </div>
      ) : productos.length > 0 ? (
        <div className="tabla-contenedor">
          <table className="tabla-productos">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Stock</th>
                <th>Stock min.</th>
                <th>Precio</th>
                <th>Vencimiento</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map(p => (
                <tr key={p.id}>
                  <td className="id-producto">{p.id.toString().padStart(2, '0')}</td>
                  <td className="nombre-producto">{p.nombre_prod}</td>
                  <td className="categoria-producto">{p.categoria_prod}</td>
                  <td className="stock-producto">{p.stock_actual}</td>
                  <td className="stock-min-producto">{p.stock_minimo}</td>
                  <td className="precio-producto">${p.precio_prod}</td>
                  <td className="vencimiento-producto">
                    {p.fecha_vencimiento ? new Date(p.fecha_vencimiento).toLocaleDateString() : '-'}
                  </td>
                  <td className="acciones-producto">
                    <button
                      className="btn-icon editar"
                      onClick={() => {
                        console.log('Editando producto:', p.id);
                        setProductoEditar(p);
                        setVista('editar');
                      }}
                      title="Editar producto"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon eliminar"
                      onClick={() => {
                        setProductoAEliminar(p);
                        setMostrarModal(true);
                      }}
                      title="Eliminar producto"
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
          titulo="Eliminar producto"
          mensaje={`¿Está seguro que desea eliminar el producto "${productoAEliminar?.nombre_prod}"?`}
          onCancelar={() => setMostrarModal(false)}
          onConfirmar={handleEliminar}
        />
      )}
    </div>
  );
}

export default Productos;