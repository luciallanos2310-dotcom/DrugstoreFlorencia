import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModalConfirmacion from './ModalConfirmacion';
import './FormularioProducto.css';

function FormularioProducto({ modo, productoEditar, onCancelar, onGuardado }) {
  const [form, setForm] = useState({
    nombre_prod: '',
    categoria_prod: '',
    codigo_prod: '',
    cantidad: '0',
    stock_actual: '0',
    precio_total: '',
    precio_venta: '',
    descripcion_prod: '',
    fecha_entrada: '',
    fecha_vencimiento: ''
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);

  const categorias = [
    'Bebidas', 'Lácteos', 'Golosinas', 'Limpieza', 'Verduras', 
    'Carnes', 'Panificados', 'Fiambres', 'Perfumería', 
    'Electrodomésticos', 'Papelería', 'Otros'
  ];

  const generarCodigoAutomatico = () => {
    const random = Math.floor(Math.random() * 1000000);
    return `PROD-${String(random).padStart(6, '0')}`;
  };

  const obtenerFechaActual = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (modo === 'crear') {
      setForm({
        nombre_prod: '',
        categoria_prod: '',
        codigo_prod: generarCodigoAutomatico(),
        cantidad: '0',
        stock_actual: '0',
        precio_total: '',
        precio_venta: '',
        descripcion_prod: '',
        fecha_entrada: obtenerFechaActual(),
        fecha_vencimiento: ''
      });
    } else if (modo === 'editar' && productoEditar) {
      setForm({
        nombre_prod: productoEditar.nombre_prod || '',
        categoria_prod: productoEditar.categoria_prod || '',
        codigo_prod: productoEditar.codigo_prod || '',
        cantidad: productoEditar.cantidad?.toString() || '0',
        stock_actual: productoEditar.stock_actual?.toString() || '0',
        precio_total: productoEditar.precio_total || '',
        precio_venta: productoEditar.precio_venta || '',
        descripcion_prod: productoEditar.descripcion_prod || '',
        fecha_entrada: productoEditar.fecha_entrada || obtenerFechaActual(),
        fecha_vencimiento: productoEditar.fecha_vencimiento || ''
      });
    }
  }, [modo, productoEditar]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Sincronizar cantidad y stock_actual al crear
    if (name === 'cantidad' && modo === 'crear') {
      setForm({ 
        ...form, 
        [name]: value,
        stock_actual: value
      });
    } else if (name === 'stock_actual' && modo === 'editar') {
      setForm({ 
        ...form, 
        [name]: value
      });
    } else {
      setForm({ ...form, [name]: value });
    }
    
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!form.nombre_prod.trim()) {
      nuevosErrores.nombre_prod = 'El nombre es obligatorio';
    }

    if (!form.categoria_prod.trim()) {
      nuevosErrores.categoria_prod = 'La categoría es obligatoria';
    }

    if (!form.codigo_prod.trim()) {
      nuevosErrores.codigo_prod = 'El código es obligatorio';
    }

    if (form.cantidad === '' || form.cantidad < 0) {
      nuevosErrores.cantidad = 'La cantidad debe ser un número positivo';
    }

    if (form.stock_actual === '' || form.stock_actual < 0) {
      nuevosErrores.stock_actual = 'El stock actual debe ser un número positivo';
    }

    if (!form.precio_total || form.precio_total < 0) {
      nuevosErrores.precio_total = 'El precio total debe ser un número positivo';
    }

    if (!form.precio_venta || form.precio_venta < 0) {
      nuevosErrores.precio_venta = 'El precio de venta debe ser un número positivo';
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
      
      const datosEnviar = {
        nombre_prod: form.nombre_prod.trim(),
        categoria_prod: form.categoria_prod,
        codigo_prod: form.codigo_prod.trim(),
        cantidad: parseInt(form.cantidad) || 0,
        stock_actual: parseInt(form.stock_actual) || 0,
        precio_total: parseFloat(form.precio_total) || 0,
        precio_venta: parseFloat(form.precio_venta) || 0,
        descripcion_prod: form.descripcion_prod.trim() || '',
        fecha_entrada: form.fecha_entrada || obtenerFechaActual(),
        fecha_vencimiento: form.fecha_vencimiento || null
      };

      console.log('Enviando datos:', datosEnviar);

      let response;
      if (modo === 'crear') {
        response = await axios.post('http://localhost:8000/api/productos/', datosEnviar, {
          headers: { 
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        response = await axios.put(`http://localhost:8000/api/productos/${productoEditar.id}/`, datosEnviar, {
          headers: { 
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      console.log('Respuesta del servidor:', response.data);
      setMostrarModalExito(true);
      
    } catch (error) {
      console.error('Error al guardar producto:', error);
      console.error('Detalles del error:', error.response?.data);
      
      if (error.response?.data) {
        const erroresServidor = error.response.data;
        const erroresTraducidos = {};
        
        Object.keys(erroresServidor).forEach(key => {
          erroresTraducidos[key] = `Error en ${key}: ${erroresServidor[key]}`;
        });
        
        setErrores(erroresTraducidos);
        alert('Error al guardar: ' + Object.values(erroresTraducidos).join(', '));
      } else {
        alert('Error de conexión');
      }
    } finally {
      setGuardando(false);
      setMostrarModal(false);
    }
  };

  const handleConfirmarExito = () => {
    setMostrarModalExito(false);
    onGuardado();
  };

  return (
    <div className="formulario-container">
      <h2>{modo === 'crear' ? 'Agregar Producto' : 'Editar Producto'}</h2>
      <p>Complete los siguientes datos para {modo === 'crear' ? 'registrar un producto nuevo' : 'editar el producto seleccionado'}.</p>

      <form className="formulario-producto" onSubmit={(e) => e.preventDefault()}>
        <div className="form-grid">
          <div className="campo-form">
            <label>Producto *</label>
            <input 
              name="nombre_prod" 
              placeholder="Ej: Oreo, Leche Nido, Pepsi" 
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
            <label>Código *</label>
            <input 
              name="codigo_prod" 
              placeholder="Ej: PROD-055367" 
              value={form.codigo_prod} 
              onChange={handleChange}
              className={errores.codigo_prod ? 'error' : ''}
            />
            {errores.codigo_prod && <span className="mensaje-error">{errores.codigo_prod}</span>}
          </div>

          {/* CANTIDAD INICIAL (solo al crear) */}
          {modo === 'crear' && (
            <div className="campo-form">
              <label>Cantidad *</label>
              <input 
                name="cantidad" 
                type="number"
                min="0"
                step="1"
                placeholder="0" 
                value={form.cantidad} 
                onChange={handleChange}
                className={errores.cantidad ? 'error' : ''}
              />
              {errores.cantidad && <span className="mensaje-error">{errores.cantidad}</span>}
            </div>
          )}

          {/* STOCK ACTUAL (solo al editar) */}
          {modo === 'editar' && (
            <div className="campo-form">
              <label>Stock Actual *</label>
              <input 
                name="stock_actual" 
                type="number"
                min="0"
                step="1"
                placeholder="0" 
                value={form.stock_actual} 
                onChange={handleChange}
                className={errores.stock_actual ? 'error' : ''}
              />
              {errores.stock_actual && <span className="mensaje-error">{errores.stock_actual}</span>}
            </div>
          )}
        </div>

        <div className="form-grid">
          <div className="campo-form">
            <label>Precio Total *</label>
            <input 
              name="precio_total" 
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00" 
              value={form.precio_total} 
              onChange={handleChange}
              className={errores.precio_total ? 'error' : ''}
            />
            {errores.precio_total && <span className="mensaje-error">{errores.precio_total}</span>}
          </div>

          <div className="campo-form">
            <label>Precio Venta *</label>
            <input 
              name="precio_venta" 
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00" 
              value={form.precio_venta} 
              onChange={handleChange}
              className={errores.precio_venta ? 'error' : ''}
            />
            {errores.precio_venta && <span className="mensaje-error">{errores.precio_venta}</span>}
          </div>

          <div className="campo-form">
            <label>Fecha Entrada *</label>
            <input 
              name="fecha_entrada" 
              type="date"
              value={form.fecha_entrada} 
              onChange={handleChange}
            />
          </div>

          <div className="campo-form">
            <label>Fecha Vencimiento</label>
            <input 
              name="fecha_vencimiento" 
              type="date"
              value={form.fecha_vencimiento} 
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="campo-form campo-completo">
          <label>Descripción</label>
          <textarea 
            name="descripcion_prod" 
            placeholder="Descripción del producto..." 
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

      <ModalConfirmacion
        mostrar={mostrarModal}
        tipo="confirmar"
        mensaje={`¿Está seguro que desea ${modo === 'crear' ? 'agregar' : 'editar'} este producto?`}
        onCancelar={() => setMostrarModal(false)}
        onConfirmar={handleGuardar}
      />

      <ModalConfirmacion
        mostrar={mostrarModalExito}
        tipo="exito"
        mensaje={`Producto ${modo === 'crear' ? 'creado' : 'actualizado'} correctamente`}
        onCancelar={handleConfirmarExito}
        onConfirmar={handleConfirmarExito}
      />
    </div>
  );
}

export default FormularioProducto;