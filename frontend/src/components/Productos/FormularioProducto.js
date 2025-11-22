import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FormularioProducto.css';
import 
ModalConfirmacionUniversal from '../ModalConfirmacionUniversal/ModalConfirmacionUniversal';import { FaSave, FaTimes, FaBox, FaDollarSign, FaHashtag, FaClipboardList, FaCube } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom'; // ✅ AGREGADO

function FormularioProducto({ modo = 'crear', producto = null, onGuardadoExitoso, onCancelar }) {
  const [formData, setFormData] = useState({
    nombre_prod: '',
    categoria_prod: '',
    precio_venta: '',
    descripcion_prod: '',
    codigo_prod: '',
    cantidad: '0'
  });
  
  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState({});
  const [modalConfig, setModalConfig] = useState({
    mostrar: false,
    tipo: '',
    mensaje: '',
    onConfirmar: null,
    onCancelar: null
  });

  const navigate = useNavigate(); // ✅ AGREGADO

  const categorias = [
    'Bebidas', 'Lácteos', 'Golosinas', 'Limpieza', 'Verduras', 
    'Carnes', 'Panificados', 'Fiambres', 'Perfumería', 
    'Electrodomésticos', 'Papelería', 'Otros'
  ];

  useEffect(() => {
    if (modo === 'editar' && producto) {
      console.log('📝 Cargando datos del producto para edición:', producto);
      
      setFormData({
        nombre_prod: producto.nombre_prod || '',
        categoria_prod: producto.categoria_prod || '',
        precio_venta: producto.precio_venta?.toString() || '',
        descripcion_prod: producto.descripcion_prod || '',
        codigo_prod: producto.codigo_prod || '',
        cantidad: producto.cantidad?.toString() || '0'
      });
    } else if (modo === 'crear') {
      generarCodigoAutomatico();
    }
  }, [modo, producto]);

  const generarCodigoAutomatico = () => {
    const prefijo = 'PROD';
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const codigo = `${prefijo}-${timestamp}${random}`;
    
    setFormData(prev => ({
      ...prev,
      codigo_prod: codigo,
      cantidad: '0'
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errores[name]) {
      setErrores(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // ✅ FUNCIÓN MEJORADA: Manejar cancelación
  const handleCancelar = () => {
    if (onCancelar) {
      onCancelar();
    } else {
      // Fallback: navegar a productos
      navigate('/dashboard/productos');
    }
  };

  const cerrarModal = () => {
    setModalConfig({
      mostrar: false,
      tipo: '',
      mensaje: '',
      onConfirmar: null,
      onCancelar: null
    });
  };

  const validarProductoExistente = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/productos/', {
        headers: { Authorization: `Token ${token}` }
      });
      
      const productos = response.data;
      const productoExistente = productos.find(prod => 
        prod.nombre_prod.toLowerCase().trim() === formData.nombre_prod.toLowerCase().trim() &&
        prod.id !== (producto?.id || null)
      );
      
      return productoExistente;
    } catch (error) {
      console.error('Error al validar producto existente:', error);
      return null;
    }
  };

  const validarFormulario = async () => {
    const nuevosErrores = {};

    if (!formData.nombre_prod.trim()) {
      nuevosErrores.nombre_prod = 'El nombre del producto es obligatorio';
    } else if (formData.nombre_prod.length < 2) {
      nuevosErrores.nombre_prod = 'El nombre debe tener al menos 2 caracteres';
    } else if (modo === 'crear') {
      const productoExistente = await validarProductoExistente();
      if (productoExistente) {
        nuevosErrores.nombre_prod = 'Ya existe un producto con este nombre';
      }
    }

    if (!formData.categoria_prod) {
      nuevosErrores.categoria_prod = 'La categoría es obligatoria';
    }

    if (!formData.precio_venta) {
      nuevosErrores.precio_venta = 'El precio de venta es obligatorio';
    } else if (parseFloat(formData.precio_venta) <= 0) {
      nuevosErrores.precio_venta = 'El precio debe ser mayor a 0';
    }

    if (!formData.codigo_prod.trim()) {
      nuevosErrores.codigo_prod = 'El código del producto es obligatorio';
    }

    if (modo === 'crear') {
      if (!formData.cantidad && formData.cantidad !== '0') {
        nuevosErrores.cantidad = 'La cantidad inicial es obligatoria';
      } else if (parseInt(formData.cantidad) < 0) {
        nuevosErrores.cantidad = 'La cantidad no puede ser negativa';
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const esValido = await validarFormulario();
    if (!esValido) return;

    setModalConfig({
      mostrar: true,
      tipo: 'confirmar',
      modo: 'producto',
      mensaje: modo === 'crear' 
        ? `¿Está seguro que desea crear el producto "${formData.nombre_prod}"?` 
        : `¿Está seguro que desea actualizar el producto "${formData.nombre_prod}"?`,
      onConfirmar: handleGuardarConfirmado,
      onCancelar: cerrarModal
    });
  };

  const handleGuardarConfirmado = async () => {
    cerrarModal();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const dataEnvio = {
        nombre_prod: formData.nombre_prod.trim(),
        categoria_prod: formData.categoria_prod,
        precio_venta: parseFloat(formData.precio_venta),
        descripcion_prod: formData.descripcion_prod.trim() || null,
        codigo_prod: formData.codigo_prod.trim(),
        stock_minimo: 5
      };

      if (modo === 'crear') {
        dataEnvio.cantidad = parseInt(formData.cantidad) || 0;
      }

      console.log('📤 Enviando datos:', dataEnvio);

      let response;
      if (modo === 'crear') {
        response = await axios.post('http://localhost:8000/api/productos/', dataEnvio, {
          headers: { Authorization: `Token ${token}` }
        });
      } else {
        response = await axios.put(`http://localhost:8000/api/productos/${producto.id}/`, dataEnvio, {
          headers: { Authorization: `Token ${token}` }
        });
      }

      const productoCompleto = response.data;
      
      setModalConfig({
        mostrar: true,
        tipo: 'exito',
        modo: 'producto',
        mensaje: `✅ Producto ${modo === 'crear' ? 'creado' : 'actualizado'} correctamente`,
        onConfirmar: () => {
          cerrarModal();
          if (onGuardadoExitoso) {
            onGuardadoExitoso(productoCompleto);
          }
        },
        onCancelar: () => {
          cerrarModal();
          if (onGuardadoExitoso) {
            onGuardadoExitoso(productoCompleto);
          }
        }
      });
      
    } catch (error) {
      console.error('Error al guardar producto:', error);
      
      let mensajeError = 'Error de conexión. Intente nuevamente.';
      
      if (error.response && error.response.data) {
        const erroresServidor = error.response.data;
        
        if (erroresServidor.codigo_prod) {
          mensajeError = 'El código del producto ya existe. Por favor, use otro código.';
        } else if (erroresServidor.nombre_prod) {
          mensajeError = 'Ya existe un producto con este nombre.';
        } else {
          const primerError = Object.values(erroresServidor)[0];
          mensajeError = Array.isArray(primerError) ? primerError[0] : 'Error al guardar el producto.';
        }
      }

      setModalConfig({
        mostrar: true,
        tipo: 'error',
        mensaje: `❌ ${mensajeError}`,
        onConfirmar: cerrarModal,
        onCancelar: cerrarModal
      });
    } finally {
      setLoading(false);
    }
  };

  const renderResumenProducto = () => {
    return (
      <div className="resumen-producto-modal">
        <h4>Resumen del Producto:</h4>
        <div className="detalle-resumen">
          <p><strong>Nombre:</strong> {formData.nombre_prod}</p>
          <p><strong>Código:</strong> {formData.codigo_prod}</p>
          <p><strong>Categoría:</strong> {formData.categoria_prod}</p>
          <p><strong>Precio de Venta:</strong> ${parseFloat(formData.precio_venta || 0).toFixed(2)}</p>
          {modo === 'crear' && (
            <p><strong>Cantidad Inicial:</strong> {formData.cantidad} unidades</p>
          )}
          {formData.descripcion_prod && (
            <p><strong>Descripción:</strong> {formData.descripcion_prod}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="formulario-producto-container">
      <div className="formulario-producto-header">
        <h2>
          {modo === 'crear' ? 'Crear Producto' : 'Editar Producto'}
        </h2>
        <button 
          className="btn-cerrar-formulario"
          onClick={handleCancelar} // ✅ CAMBIADO A handleCancelar
          disabled={loading}
        >
          <FaTimes />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="formulario-producto">
        <div className="seccion-formulario">
          <h3 className="titulo-seccion">
            Información del Producto
          </h3>
          
          <div className="campos-grid">
            <div className={`campo-formulario ${errores.codigo_prod ? 'campo-error' : ''}`}>
              <label htmlFor="codigo_prod">
                <FaHashtag /> Código del Producto *
              </label>
              <div className="campo-codigo-automatico">
                <input
                  type="text"
                  id="codigo_prod"
                  name="codigo_prod"
                  value={formData.codigo_prod}
                  onChange={handleChange}
                  placeholder="Se generará automáticamente"
                  disabled={loading || modo === 'editar'}
                  className="input-codigo"
                />
              </div>
              {errores.codigo_prod && <span className="mensaje-error">{errores.codigo_prod}</span>}
            </div>

            <div className={`campo-formulario ${errores.categoria_prod ? 'campo-error' : ''}`}>
              <label htmlFor="categoria_prod">
                <FaClipboardList /> Categoría *
              </label>
              <select
                id="categoria_prod"
                name="categoria_prod"
                value={formData.categoria_prod}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>
              {errores.categoria_prod && <span className="mensaje-error">{errores.categoria_prod}</span>}
            </div>
          </div>

          <div className="campos-grid">
            <div className={`campo-formulario ${errores.nombre_prod ? 'campo-error' : ''}`}>
              <label htmlFor="nombre_prod">
                <FaBox /> Nombre del Producto *
              </label>
              <input
                type="text"
                id="nombre_prod"
                name="nombre_prod"
                value={formData.nombre_prod}
                onChange={handleChange}
                placeholder="Ej: Leche Entera 1L"
                disabled={loading}
              />
              {errores.nombre_prod && <span className="mensaje-error">{errores.nombre_prod}</span>}
            </div>

            <div className={`campo-formulario ${errores.precio_venta ? 'campo-error' : ''}`}>
              <label htmlFor="precio_venta">
                <FaDollarSign /> Precio de Venta *
              </label>
              <input
                type="number"
                id="precio_venta"
                name="precio_venta"
                value={formData.precio_venta}
                onChange={handleChange}
                step="0.01"
                min="0.01"
                placeholder="0.00"
                disabled={loading}
              />
              {errores.precio_venta && <span className="mensaje-error">{errores.precio_venta}</span>}
            </div>
          </div>

          {modo === 'crear' && (
            <div className="campos-grid">
              <div className={`campo-formulario ${errores.cantidad ? 'campo-error' : ''}`}>
                <label htmlFor="cantidad">
                  <FaCube /> Cantidad Inicial *
                </label>
                <input
                  type="number"
                  id="cantidad"
                  name="cantidad"
                  value={formData.cantidad}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  placeholder="0"
                  disabled={loading}
                />
                {errores.cantidad && <span className="mensaje-error">{errores.cantidad}</span>}
                <small className="texto-ayuda">
                  La cantidad solo se puede modificar desde el módulo de Compras
                </small>
              </div>
              <div className="campo-formulario">
                {/* Espacio para mantener el grid balanceado */}
              </div>
            </div>
          )}

          <div className={`campo-formulario ${errores.descripcion_prod ? 'campo-error' : ''}`}>
            <label htmlFor="descripcion_prod">
              <FaClipboardList /> Descripción (Opcional)
            </label>
            <textarea
              id="descripcion_prod"
              name="descripcion_prod"
              value={formData.descripcion_prod}
              onChange={handleChange}
              placeholder="Descripción detallada del producto..."
              rows="3"
              disabled={loading}
            />
            {errores.descripcion_prod && <span className="mensaje-error">{errores.descripcion_prod}</span>}
          </div>
        </div>

        <div className="formulario-acciones">
          <button type="button" className="btn-cancelar" onClick={handleCancelar} disabled={loading}>
            <FaTimes /> Cancelar
          </button>
          <button type="submit" className="btn-guardar" disabled={loading}>
            <FaSave />
            {loading ? 'Guardando...' : (modo === 'crear' ? 'Crear Producto' : 'Actualizar Producto')}
          </button>
        </div>
      </form>

      <ModalConfirmacionUniversal
        mostrar={modalConfig.mostrar}
        tipo={modalConfig.tipo}
        modo={modalConfig.modo}
        mensaje={modalConfig.mensaje}
        datosAdicionales={modo === 'confirmar' ? {
          modo: modo,
          ...formData
        } : null}
        mostrarResumen={modalConfig.tipo === 'confirmar'}
        onConfirmar={modalConfig.onConfirmar}
        onCancelar={modalConfig.onCancelar}
      />
    </div>
  );
}

export default FormularioProducto;