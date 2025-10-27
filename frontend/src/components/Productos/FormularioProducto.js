import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ModalConfirmacion from '../Productos/ModalConfirmacion';
import './FormularioProducto.css';

function FormularioProducto({ modo, productoEditar, onCancelar, onGuardado }) {
  const [form, setForm] = useState({
    nombre_prod: '',
    categoria_prod: '',
    descripcion_prod: '',
    stock_actual: '',
    stock_minimo: '',
    precio_prod: '',
    fecha_vencimiento: '',
  });

  const [proveedoresSeleccionados, setProveedoresSeleccionados] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [busquedaProveedor, setBusquedaProveedor] = useState('');
  const [mostrarListaProveedores, setMostrarListaProveedores] = useState(false);
  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const buscadorRef = useRef(null);

  // Lista de categorías predefinidas
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

  useEffect(() => {
    if (modo === 'editar' && productoEditar) {
      setForm({
        nombre_prod: productoEditar.nombre_prod || '',
        categoria_prod: productoEditar.categoria_prod || '',
        descripcion_prod: productoEditar.descripcion_prod || '',
        stock_actual: productoEditar.stock_actual || '',
        stock_minimo: productoEditar.stock_minimo || '',
        precio_prod: productoEditar.precio_prod || '',
        fecha_vencimiento: productoEditar.fecha_vencimiento || '',
      });
      
      cargarProveedoresProducto(productoEditar.id);
    }

    cargarProveedores();
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [modo, productoEditar]);

  const handleClickOutside = (event) => {
    if (buscadorRef.current && !buscadorRef.current.contains(event.target)) {
      setMostrarListaProveedores(false);
    }
  };

  const cargarProveedores = async () => {
    setLoadingProveedores(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8000/api/proveedores/', {
        headers: { Authorization: `Token ${token}` }
      });
      setProveedores(res.data);
    } catch (error) {
      console.error('Error al cargar proveedores', error);
    } finally {
      setLoadingProveedores(false);
    }
  };

  const cargarProveedoresProducto = async (productoId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8000/api/productos/${productoId}/proveedores/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setProveedoresSeleccionados(res.data);
    } catch (error) {
      console.error('Error al cargar proveedores del producto', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBusquedaProveedorChange = (e) => {
    const value = e.target.value;
    setBusquedaProveedor(value);
    setMostrarListaProveedores(true);
  };

  const toggleProveedor = (proveedor) => {
    const existe = proveedoresSeleccionados.some(p => p.id === proveedor.id);
    let nuevosProveedores;

    if (existe) {
      nuevosProveedores = proveedoresSeleccionados.filter(p => p.id !== proveedor.id);
    } else {
      nuevosProveedores = [...proveedoresSeleccionados, proveedor];
    }

    setProveedoresSeleccionados(nuevosProveedores);
    setBusquedaProveedor('');
    setMostrarListaProveedores(false);
  };

  const quitarProveedor = (proveedorId) => {
    const nuevosProveedores = proveedoresSeleccionados.filter(p => p.id !== proveedorId);
    setProveedoresSeleccionados(nuevosProveedores);
  };

  // Filtrar proveedores por INICIO del nombre (no contiene)
  const proveedoresFiltrados = proveedores.filter(proveedor =>
    proveedor.nombre_prov.toLowerCase().startsWith(busquedaProveedor.toLowerCase()) ||
    (proveedor.tipo_prov && proveedor.tipo_prov.toLowerCase().startsWith(busquedaProveedor.toLowerCase()))
  );

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!form.nombre_prod.trim()) {
      nuevosErrores.nombre_prod = 'El nombre es obligatorio';
    }

    if (!form.categoria_prod.trim()) {
      nuevosErrores.categoria_prod = 'La categoría es obligatoria';
    }

    if (!form.stock_actual || form.stock_actual < 0) {
      nuevosErrores.stock_actual = 'El stock actual es obligatorio y debe ser mayor o igual a 0';
    }

    if (!form.stock_minimo || form.stock_minimo < 0) {
      nuevosErrores.stock_minimo = 'El stock mínimo es obligatorio y debe ser mayor o igual a 0';
    }

    if (!form.precio_prod || form.precio_prod <= 0) {
      nuevosErrores.precio_prod = 'El precio es obligatorio y debe ser mayor a 0';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleGuardar = async () => {
    if (!validarFormulario()) {
      return;
    }

    setGuardando(true);
    try {
      const token = localStorage.getItem('token');
      
      // Preparar datos para enviar
      const datosEnviar = {
        ...form,
        stock_actual: parseInt(form.stock_actual),
        stock_minimo: parseInt(form.stock_minimo),
        precio_prod: parseFloat(form.precio_prod),
        descripcion_prod: form.descripcion_prod.trim() || null
      };

      // Primero guardar el producto
      let productoGuardado;
      if (modo === 'crear') {
        const res = await axios.post('http://localhost:8000/api/productos/', datosEnviar, {
          headers: { Authorization: `Token ${token}` }
        });
        productoGuardado = res.data;
      } else {
        const res = await axios.put(`http://localhost:8000/api/productos/${productoEditar.id}/`, datosEnviar, {
          headers: { Authorization: `Token ${token}` }
        });
        productoGuardado = res.data;
      }

      // Luego guardar la relación con proveedores en la tabla intermedia
      if (productoGuardado) {
        const proveedoresData = {
          proveedores: proveedoresSeleccionados.map(p => p.id)
        };
        
        await axios.post(
          `http://localhost:8000/api/productos/${productoGuardado.id}/asignar_proveedores/`,
          proveedoresData,
          {
            headers: { Authorization: `Token ${token}` }
          }
        );
      }

      onGuardado();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      if (error.response?.data) {
        setErrores(error.response.data);
      }
    } finally {
      setGuardando(false);
      setMostrarModal(false);
    }
  };

  return (
    <div className="formulario-productos-container">
      <div className="formulario-header">
        <h2>{modo === 'crear' ? 'Agregar Producto' : 'Editar Producto'}</h2>
        <p>Complete los siguientes datos para {modo === 'crear' ? 'registrar un producto nuevo en el inventario' : 'editar el producto seleccionado'}.</p>
      </div>

      <div className="formulario-content">
        <form className="formulario-producto" onSubmit={(e) => e.preventDefault()}>
          <div className="form-grid">
            <div className="campo-form">
              <label>Nombre del producto *</label>
              <input 
                name="nombre_prod" 
                placeholder="Ej: Coca Cola 2L" 
                value={form.nombre_prod} 
                onChange={handleChange}
                className={errores.nombre_prod ? 'error' : ''}
              />
              {errores.nombre_prod && <span className="mensaje-error">{errores.nombre_prod}</span>}
            </div>

            <div className="campo-form">
              <label>Categoría *</label>
              <select 
                name="categoria_prod" 
                value={form.categoria_prod} 
                onChange={handleChange}
                className={errores.categoria_prod ? 'error' : ''}
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>
              {errores.categoria_prod && <span className="mensaje-error">{errores.categoria_prod}</span>}
            </div>

            <div className="campo-form">
              <label>Stock inicial *</label>
              <input 
                name="stock_actual" 
                type="number" 
                placeholder="Ej: 50" 
                value={form.stock_actual} 
                onChange={handleChange}
                className={errores.stock_actual ? 'error' : ''}
              />
              {errores.stock_actual && <span className="mensaje-error">{errores.stock_actual}</span>}
            </div>

            <div className="campo-form">
              <label>Stock mínimo *</label>
              <input 
                name="stock_minimo" 
                type="number" 
                placeholder="Ej: 10" 
                value={form.stock_minimo} 
                onChange={handleChange}
                className={errores.stock_minimo ? 'error' : ''}
              />
              {errores.stock_minimo && <span className="mensaje-error">{errores.stock_minimo}</span>}
            </div>

            <div className="campo-form">
              <label>Precio unitario *</label>
              <div className="input-precio">
                <span className="simbolo-peso">$</span>
                <input 
                  name="precio_prod" 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  value={form.precio_prod} 
                  onChange={handleChange}
                  className={errores.precio_prod ? 'error' : ''}
                />
              </div>
              {errores.precio_prod && <span className="mensaje-error">{errores.precio_prod}</span>}
            </div>

            <div className="campo-form">
              <label>Fecha de vencimiento</label>
              <input 
                name="fecha_vencimiento" 
                type="date" 
                value={form.fecha_vencimiento} 
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Buscador de proveedores */}
          <div className="campo-form campo-completo buscador-proveedores-container" ref={buscadorRef}>
            <label>Proveedores</label>
            
            <div className="input-busqueda-container">
              <input
                type="text"
                placeholder="Buscar proveedores..."
                value={busquedaProveedor}
                onChange={handleBusquedaProveedorChange}
                onFocus={() => setMostrarListaProveedores(true)}
                className="input-busqueda"
              />
            </div>

            {/* Dropdown compacto de resultados */}
            {mostrarListaProveedores && busquedaProveedor && (
              <div className="dropdown-proveedores">
                {loadingProveedores ? (
                  <div className="dropdown-item">Cargando...</div>
                ) : proveedoresFiltrados.length === 0 ? (
                  <div className="dropdown-item no-results">
                    No se encontraron proveedores
                  </div>
                ) : (
                  proveedoresFiltrados.slice(0, 5).map(proveedor => {
                    const estaSeleccionado = proveedoresSeleccionados.some(p => p.id === proveedor.id);
                    return (
                      <div 
                        key={proveedor.id} 
                        className={`dropdown-item ${estaSeleccionado ? 'selected' : ''}`}
                        onClick={() => toggleProveedor(proveedor)}
                      >
                        <input
                          type="checkbox"
                          checked={estaSeleccionado}
                          onChange={() => {}}
                          className="checkbox-dropdown"
                        />
                        <span className="proveedor-info">
                          <span className="proveedor-nombre">{proveedor.nombre_prov}</span>
                          <span className="proveedor-rubro">{proveedor.tipo_prov}</span>
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Proveedores seleccionados */}
            <div className="proveedores-seleccionados">
              {proveedoresSeleccionados.length > 0 ? (
                proveedoresSeleccionados.map(proveedor => (
                  <span key={proveedor.id} className="tag-proveedor">
                    {proveedor.nombre_prov}
                    <button 
                      type="button" 
                      onClick={() => quitarProveedor(proveedor.id)}
                      className="btn-quitar"
                    >
                      ×
                    </button>
                  </span>
                ))
              ) : (
                <div className="sin-proveedores">No hay proveedores seleccionados</div>
              )}
            </div>
          </div>

          <div className="campo-form campo-completo">
            <label>Descripción del producto</label>
            <textarea 
              name="descripcion_prod" 
              placeholder="Describe las características del producto..." 
              value={form.descripcion_prod} 
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>

          <div className="botones-form">
            <button 
              type="button" 
              className="btn-guardar" 
              onClick={() => setMostrarModal(true)}
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : (modo === 'crear' ? 'Agregar Producto' : 'Guardar Cambios')}
            </button>
            <button type="button" className="btn-cancelar" onClick={onCancelar}>
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {mostrarModal && (
        <ModalConfirmacion
          titulo={modo === 'crear' ? 'Agregar producto' : 'Editar producto'}
          mensaje={`¿Está seguro que desea ${modo === 'crear' ? 'agregar' : 'editar'} este producto?`}
          onCancelar={() => setMostrarModal(false)}
          onConfirmar={handleGuardar}
        />
      )}
    </div>
  );
}

export default FormularioProducto;