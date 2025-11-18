import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModalConfirmacion from '../Compras/ModalConfirmacion';
import './FormularioCompra.css';
import { 
  FaBox, 
  FaTag, 
  FaCalendarAlt, 
  FaDollarSign, 
  FaUsers, 
  FaFileAlt,
  FaSearch,
  FaTimes,
  FaPlus,
  FaEdit
} from 'react-icons/fa';

function FormularioCompra({ modo, compraEditar, onCancelar, onGuardado }) {
  const [form, setForm] = useState({
    codigo_compra: '',
    proveedores: [],
    producto: '',
    fecha_entrada: '',
    fecha_vencimiento: '',
    cantidad: '',
    precio_total: '',
    precio_venta: '',
    descripcion: '',
    lote: ''
  });

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre_prod: '',
    categoria_prod: '',
    codigo_prod: '',
    stock_minimo: ''
  });

  const [proveedores, setProveedores] = useState([]);
  const [proveedoresSeleccionados, setProveedoresSeleccionados] = useState([]);
  const [productos, setProductos] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  
  // Estados para búsquedas
  const [mostrarBuscadorProveedores, setMostrarBuscadorProveedores] = useState(false);
  const [mostrarBuscadorProductos, setMostrarBuscadorProductos] = useState(false);
  const [busquedaProveedor, setBusquedaProveedor] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  
  // Estados para tipo de producto
  const [tipoProducto, setTipoProducto] = useState('nuevo');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  
  // Estados para mensajes
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [mensajeError, setMensajeError] = useState('');

  // Categorías disponibles
  const categorias = [
    'Bebidas', 'Lácteos', 'Golosinas', 'Limpieza', 'Verduras', 
    'Carnes', 'Panificados', 'Fiambres', 'Perfumería', 
    'Electrodomésticos', 'Papelería', 'Otros'
  ];

  // Generadores de códigos
  const generarCodigo = (prefijo) => {
    const timestamp = Date.now().toString().slice(-6);
    return `${prefijo}-${timestamp}`;
  };

  // Cargar datos iniciales
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    if (modo === 'editar' && compraEditar) {
      // Modo edición
      setForm({
        codigo_compra: compraEditar.codigo_compra,
        proveedores: compraEditar.proveedores?.map(p => p.id) || [],
        producto: compraEditar.producto?.id || '',
        fecha_entrada: compraEditar.fecha_entrada || today,
        fecha_vencimiento: compraEditar.fecha_vencimiento || '',
        cantidad: compraEditar.cantidad || '',
        precio_total: compraEditar.precio_total || '',
        precio_venta: compraEditar.precio_venta || '',
        descripcion: compraEditar.descripcion || '',
        lote: compraEditar.lote || generarCodigo('LOTE')
      });
      
      if (compraEditar.producto) {
        setTipoProducto('existente');
        setProductoSeleccionado(compraEditar.producto);
        setNuevoProducto({
          nombre_prod: compraEditar.producto.nombre_prod || '',
          categoria_prod: compraEditar.producto.categoria_prod || '',
          codigo_prod: compraEditar.producto.codigo_prod || '',
          stock_minimo: compraEditar.producto.stock_minimo || compraEditar.cantidad || ''
        });
        setProveedoresSeleccionados(compraEditar.proveedores || []);
      }
    } else {
      // Modo creación
      setForm({
        codigo_compra: generarCodigo('COMP'),
        proveedores: [],
        producto: '',
        fecha_entrada: today,
        fecha_vencimiento: '',
        cantidad: '',
        precio_total: '',
        precio_venta: '',
        descripcion: '',
        lote: generarCodigo('LOTE')
      });
      
      setNuevoProducto({
        nombre_prod: '',
        categoria_prod: '',
        codigo_prod: generarCodigo('PROD'),
        stock_minimo: ''
      });
    }

    cargarProveedores();
    cargarProductos();
  }, [modo, compraEditar]);

  const cargarProveedores = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8000/api/proveedores/', {
        headers: { Authorization: `Token ${token}` }
      });
      setProveedores(res.data);
    } catch (error) {
      console.error('Error al cargar proveedores', error);
    }
  };

  const cargarProductos = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8000/api/productos/', {
        headers: { Authorization: `Token ${token}` }
      });
      setProductos(res.data);
    } catch (error) {
      console.error('Error al cargar productos', error);
    }
  };

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    if (name === 'cantidad') {
      setNuevoProducto(prev => ({ ...prev, stock_minimo: value }));
    }
    
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleChangeNuevoProducto = (e) => {
    const { name, value } = e.target;
    setNuevoProducto(prev => ({ ...prev, [name]: value }));
    
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Búsquedas y selecciones
  const productosFiltrados = productos.filter(producto =>
    producto.nombre_prod.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
    producto.codigo_prod.toLowerCase().includes(busquedaProducto.toLowerCase())
  );

  const proveedoresFiltrados = proveedores.filter(proveedor =>
    proveedor.nombre_prov.toLowerCase().includes(busquedaProveedor.toLowerCase())
  );

  const seleccionarProductoExistente = (producto) => {
    setProductoSeleccionado(producto);
    setForm(prev => ({ ...prev, producto: producto.id }));
    setNuevoProducto(prev => ({
      ...prev,
      nombre_prod: producto.nombre_prod,
      categoria_prod: producto.categoria_prod,
      codigo_prod: producto.codigo_prod,
      stock_minimo: producto.stock_minimo || ''
    }));
    setMostrarBuscadorProductos(false);
    setBusquedaProducto('');
  };

  const cambiarTipoProducto = (tipo) => {
    setTipoProducto(tipo);
    if (tipo === 'nuevo') {
      setProductoSeleccionado(null);
      setForm(prev => ({ ...prev, producto: '' }));
      setNuevoProducto(prev => ({
        ...prev,
        codigo_prod: generarCodigo('PROD')
      }));
    }
  };

  const seleccionarProveedor = (proveedor) => {
    if (!proveedoresSeleccionados.find(p => p.id === proveedor.id)) {
      const nuevosProveedores = [...proveedoresSeleccionados, proveedor];
      setProveedoresSeleccionados(nuevosProveedores);
      setForm(prev => ({ ...prev, proveedores: nuevosProveedores.map(p => p.id) }));
    }
    setMostrarBuscadorProveedores(false);
    setBusquedaProveedor('');
  };

  const removerProveedor = (proveedorId) => {
    const nuevosProveedores = proveedoresSeleccionados.filter(p => p.id !== proveedorId);
    setProveedoresSeleccionados(nuevosProveedores);
    setForm(prev => ({ ...prev, proveedores: nuevosProveedores.map(p => p.id) }));
  };

  // Validación
  const validarFormulario = () => {
    const nuevosErrores = {};

    // Validaciones generales
    if (!form.codigo_compra.trim()) nuevosErrores.codigo_compra = 'Código de compra obligatorio';
    if (!form.lote.trim()) nuevosErrores.lote = 'Lote obligatorio';
    if (!form.fecha_entrada) nuevosErrores.fecha_entrada = 'Fecha de entrada obligatoria';
    if (!form.cantidad || form.cantidad <= 0) nuevosErrores.cantidad = 'Cantidad debe ser mayor a 0';
    if (!form.precio_total || form.precio_total <= 0) nuevosErrores.precio_total = 'Precio total debe ser mayor a 0';
    if (!form.precio_venta || form.precio_venta <= 0) nuevosErrores.precio_venta = 'Precio de venta debe ser mayor a 0';
    if (form.proveedores.length === 0) nuevosErrores.proveedores = 'Seleccione al menos un proveedor';

    // Validaciones por tipo de producto
    if (tipoProducto === 'nuevo') {
      if (!nuevoProducto.nombre_prod.trim()) nuevosErrores.nombre_prod = 'Nombre del producto obligatorio';
      if (!nuevoProducto.categoria_prod.trim()) nuevosErrores.categoria_prod = 'Categoría obligatoria';
    } else {
      if (!productoSeleccionado) nuevosErrores.producto_existente = 'Seleccione un producto existente';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Guardar compra
  const handleGuardar = async () => {
    if (!validarFormulario()) return;

    setGuardando(true);
    try {
      const token = localStorage.getItem('token');
      let productoId;

      if (tipoProducto === 'nuevo') {
        // Crear nuevo producto
        const productoData = {
          nombre_prod: nuevoProducto.nombre_prod,
          categoria_prod: nuevoProducto.categoria_prod,
          codigo_prod: nuevoProducto.codigo_prod,
          precio_total: parseFloat(form.precio_total),
          precio_venta: parseFloat(form.precio_venta),
          stock_minimo: parseInt(nuevoProducto.stock_minimo) || parseInt(form.cantidad),
          cantidad: parseInt(form.cantidad),
          fecha_entrada: form.fecha_entrada,
          fecha_vencimiento: form.fecha_vencimiento || null,
          estado: true
        };

        const productoRes = await axios.post('http://localhost:8000/api/productos/', productoData, {
          headers: { Authorization: `Token ${token}` }
        });
        productoId = productoRes.data.id;
      } else {
        // Actualizar producto existente
        productoId = productoSeleccionado.id;
        const nuevoStock = (productoSeleccionado.cantidad || 0) + parseInt(form.cantidad);
        
        await axios.put(`http://localhost:8000/api/productos/${productoId}/`, {
          ...productoSeleccionado,
          cantidad: nuevoStock,
          precio_total: parseFloat(form.precio_total),
          precio_venta: parseFloat(form.precio_venta),
          fecha_actualizacion: new Date().toISOString()
        }, {
          headers: { Authorization: `Token ${token}` }
        });
      }

      // Crear/actualizar compra
      const compraData = {
        codigo_compra: form.codigo_compra,
        proveedores: form.proveedores,
        producto: productoId,
        fecha_entrada: form.fecha_entrada,
        fecha_vencimiento: form.fecha_vencimiento || null,
        cantidad: parseInt(form.cantidad),
        precio_total: parseFloat(form.precio_total),
        precio_venta: parseFloat(form.precio_venta),
        descripcion: form.descripcion,
        lote: form.lote
      };

      let response;
      if (modo === 'editar' && compraEditar?.id) {
        response = await axios.put(`http://localhost:8000/api/compras/${compraEditar.id}/`, compraData, {
          headers: { Authorization: `Token ${token}` }
        });
      } else {
        response = await axios.post('http://localhost:8000/api/compras/', compraData, {
          headers: { Authorization: `Token ${token}` }
        });
      }

      setMostrarModal(false);
      setMensajeExito(modo === 'editar' ? '¡Compra actualizada exitosamente!' : '¡Compra registrada exitosamente!');
      setMostrarModalExito(true);

    } catch (error) {
      console.error('Error al guardar compra:', error);
      setMensajeError(error.response?.data ? JSON.stringify(error.response.data) : 'Error al procesar la compra');
      setMostrarModalError(true);
    } finally {
      setGuardando(false);
    }
  };

  const handleCerrarModalExito = () => {
    setMostrarModalExito(false);
    onGuardado?.();
  };

  return (
    <div className="formulario-compras-container">
      {/* Header */}
      <div className="formulario-header">
        <div className="header-content">
          <h2>
            {modo === 'editar' ? <FaEdit /> : <FaPlus />}
            {modo === 'editar' ? 'Editar Compra' : 'Nueva Compra'}
          </h2>
          <p className="header-description">
            {modo === 'editar' 
              ? 'Actualice los datos de la compra existente' 
              : 'Complete la información para registrar una nueva compra'}
          </p>
        </div>
      </div>

      <div className="formulario-content">
        <form className="formulario-compra" onSubmit={(e) => e.preventDefault()}>
          
          {/* Sección: Información Básica */}
          <div className="seccion-formulario">
            <div className="seccion-header">
              <FaTag className="seccion-icon" />
              <h3>Información Básica</h3>
            </div>
            <div className="form-grid compacto">
              <div className="campo-form">
                <label>Código de Compra *</label>
                <div className="input-with-icon">
                  <FaTag className="input-icon" />
                  <input
                    type="text"
                    name="codigo_compra"
                    value={form.codigo_compra}
                    onChange={handleChange}
                    className={errores.codigo_compra ? 'error' : ''}
                    readOnly={modo === 'editar'}
                  />
                </div>
                {errores.codigo_compra && <span className="mensaje-error">{errores.codigo_compra}</span>}
              </div>

              <div className="campo-form">
                <label>Lote *</label>
                <div className="input-with-icon">
                  <FaBox className="input-icon" />
                  <input
                    type="text"
                    name="lote"
                    value={form.lote}
                    onChange={handleChange}
                    className={errores.lote ? 'error' : ''}
                    placeholder="LOTE-001"
                  />
                </div>
                {errores.lote && <span className="mensaje-error">{errores.lote}</span>}
              </div>
            </div>
          </div>

          {/* Sección: Tipo de Producto */}
          <div className="seccion-formulario">
            <div className="seccion-header">
              <FaBox className="seccion-icon" />
              <h3>Tipo de Producto *</h3>
            </div>
            <div className="opciones-tipo-producto">
              <label className={`opcion-tipo ${tipoProducto === 'nuevo' ? 'activa' : ''}`}>
                <input
                  type="radio"
                  name="tipoProducto"
                  value="nuevo"
                  checked={tipoProducto === 'nuevo'}
                  onChange={() => cambiarTipoProducto('nuevo')}
                />
                <div className="opcion-content">
                  <span className="opcion-titulo">Producto Nuevo</span>
                  <span className="opcion-descripcion">Crear un nuevo producto en el inventario</span>
                </div>
              </label>
              
              <label className={`opcion-tipo ${tipoProducto === 'existente' ? 'activa' : ''}`}>
                <input
                  type="radio"
                  name="tipoProducto"
                  value="existente"
                  checked={tipoProducto === 'existente'}
                  onChange={() => cambiarTipoProducto('existente')}
                />
                <div className="opcion-content">
                  <span className="opcion-titulo">Producto Existente</span>
                  <span className="opcion-descripcion">Agregar stock a producto existente</span>
                </div>
              </label>
            </div>
            {errores.producto_existente && <span className="mensaje-error">{errores.producto_existente}</span>}
          </div>

          {/* Sección: Información del Producto */}
          {tipoProducto === 'nuevo' ? (
            <div className="seccion-formulario">
              <div className="seccion-header">
                <FaPlus className="seccion-icon" />
                <h3>Información del Nuevo Producto *</h3>
              </div>
              <div className="form-grid">
                <div className="campo-form">
                  <label>Nombre del Producto *</label>
                  <input
                    type="text"
                    name="nombre_prod"
                    placeholder="Ingrese el nombre del producto"
                    value={nuevoProducto.nombre_prod}
                    onChange={handleChangeNuevoProducto}
                    className={errores.nombre_prod ? 'error' : ''}
                  />
                  {errores.nombre_prod && <span className="mensaje-error">{errores.nombre_prod}</span>}
                </div>

                <div className="campo-form">
                  <label>Categoría *</label>
                  <select
                    name="categoria_prod"
                    value={nuevoProducto.categoria_prod}
                    onChange={handleChangeNuevoProducto}
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
                  <label>Código del Producto *</label>
                  <input
                    type="text"
                    name="codigo_prod"
                    value={nuevoProducto.codigo_prod}
                    onChange={handleChangeNuevoProducto}
                    className={errores.codigo_prod ? 'error' : ''}
                    readOnly
                  />
                </div>

                <div className="campo-form">
                  <label>Stock Mínimo</label>
                  <input
                    type="number"
                    name="stock_minimo"
                    value={nuevoProducto.stock_minimo}
                    onChange={handleChangeNuevoProducto}
                    className="campo-solo-lectura"
                    readOnly
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="seccion-formulario">
              <div className="seccion-header">
                <FaSearch className="seccion-icon" />
                <h3>Seleccionar Producto Existente *</h3>
              </div>
              <div className="buscador-producto-existente">
                <button
                  type="button"
                  className="btn-buscador"
                  onClick={() => setMostrarBuscadorProductos(true)}
                >
                  <FaSearch />
                  {productoSeleccionado ? productoSeleccionado.nombre_prod : 'Buscar producto existente...'}
                </button>
                
                {productoSeleccionado && (
                  <div className="producto-seleccionado-info">
                    <div className="info-producto">
                      <strong>{productoSeleccionado.nombre_prod}</strong>
                      <div className="producto-detalles">
                        <span>Código: {productoSeleccionado.codigo_prod}</span>
                        <span>Categoría: {productoSeleccionado.categoria_prod}</span>
                        <span>Stock actual: {productoSeleccionado.cantidad || 0}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-cambiar-producto"
                      onClick={() => {
                        setProductoSeleccionado(null);
                        setForm(prev => ({ ...prev, producto: '' }));
                      }}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sección: Detalles de la Compra */}
          <div className="seccion-formulario">
            <div className="seccion-header">
              <FaDollarSign className="seccion-icon" />
              <h3>Detalles de la Compra</h3>
            </div>
            <div className="form-grid">
              <div className="campo-form">
                <label>Fecha de Entrada *</label>
                <div className="input-with-icon">
                  <FaCalendarAlt className="input-icon" />
                  <input 
                    type="date"
                    name="fecha_entrada" 
                    value={form.fecha_entrada} 
                    onChange={handleChange}
                    className={errores.fecha_entrada ? 'error' : ''}
                  />
                </div>
                {errores.fecha_entrada && <span className="mensaje-error">{errores.fecha_entrada}</span>}
              </div>

              <div className="campo-form">
                <label>Fecha de Vencimiento</label>
                <div className="input-with-icon">
                  <FaCalendarAlt className="input-icon" />
                  <input 
                    type="date"
                    name="fecha_vencimiento" 
                    value={form.fecha_vencimiento} 
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="campo-form">
                <label>Cantidad *</label>
                <input 
                  type="number"
                  name="cantidad" 
                  placeholder="0"
                  value={form.cantidad} 
                  onChange={handleChange}
                  className={errores.cantidad ? 'error' : ''}
                />
                {errores.cantidad && <span className="mensaje-error">{errores.cantidad}</span>}
              </div>

              <div className="campo-form">
                <label>Precio Total *</label>
                <div className="input-precio">
                  <span className="simbolo-peso">$</span>
                  <input 
                    type="number"
                    name="precio_total" 
                    step="0.01"
                    placeholder="0.00"
                    value={form.precio_total} 
                    onChange={handleChange}
                    className={errores.precio_total ? 'error' : ''}
                  />
                </div>
                {errores.precio_total && <span className="mensaje-error">{errores.precio_total}</span>}
              </div>

              <div className="campo-form">
                <label>Precio de Venta *</label>
                <div className="input-precio">
                  <span className="simbolo-peso">$</span>
                  <input 
                    type="number"
                    name="precio_venta" 
                    step="0.01"
                    placeholder="0.00"
                    value={form.precio_venta} 
                    onChange={handleChange}
                    className={errores.precio_venta ? 'error' : ''}
                  />
                </div>
                {errores.precio_venta && <span className="mensaje-error">{errores.precio_venta}</span>}
              </div>

              <div className="campo-form campo-completo">
                <label>Proveedores *</label>
                <div className="buscador-proveedores-multiple">
                  <button
                    type="button"
                    className="btn-buscador"
                    onClick={() => setMostrarBuscadorProveedores(true)}
                  >
                    <FaUsers />
                    Seleccionar proveedores...
                  </button>
                  
                  {proveedoresSeleccionados.length > 0 && (
                    <div className="proveedores-seleccionados">
                      <div className="lista-proveedores">
                        {proveedoresSeleccionados.map(proveedor => (
                          <div key={proveedor.id} className="proveedor-seleccionado">
                            <span>{proveedor.nombre_prov}</span>
                            <button
                              type="button"
                              className="btn-remover"
                              onClick={() => removerProveedor(proveedor.id)}
                            >
                              <FaTimes />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {errores.proveedores && <span className="mensaje-error">{errores.proveedores}</span>}
              </div>
            </div>
          </div>

          {/* Sección: Descripción */}
          <div className="seccion-formulario">
            <div className="seccion-header">
              <FaFileAlt className="seccion-icon" />
              <h3>Descripción Adicional</h3>
            </div>
            <div className="campo-form campo-completo">
              <textarea 
                name="descripcion" 
                placeholder="Ingrese una descripción adicional sobre la compra (opcional)"
                value={form.descripcion} 
                onChange={handleChange}
                rows="3"
              ></textarea>
            </div>
          </div>

          {/* Botones */}
          <div className="botones-form">
            <button 
              type="button" 
              className="btn-guardar" 
              onClick={() => setMostrarModal(true)}
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : (modo === 'editar' ? 'Actualizar Compra' : 'Registrar Compra')}
            </button>
            <button type="button" className="btn-cancelar" onClick={onCancelar}>
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* Modales de búsqueda */}
      {mostrarBuscadorProductos && (
        <ModalBuscador
          titulo="Buscar Producto Existente"
          placeholder="Buscar por nombre o código..."
          busqueda={busquedaProducto}
          setBusqueda={setBusquedaProducto}
          items={productosFiltrados}
          onSeleccionar={seleccionarProductoExistente}
          onCerrar={() => setMostrarBuscadorProductos(false)}
          renderItem={(producto) => (
            <>
              <div className="producto-nombre">{producto.nombre_prod}</div>
              <div className="producto-info">
                Código: {producto.codigo_prod} | Categoría: {producto.categoria_prod} | Stock: {producto.cantidad || 0}
              </div>
            </>
          )}
        />
      )}

      {mostrarBuscadorProveedores && (
        <ModalBuscador
          titulo="Seleccionar Proveedores"
          placeholder="Buscar proveedor..."
          busqueda={busquedaProveedor}
          setBusqueda={setBusquedaProveedor}
          items={proveedoresFiltrados}
          onSeleccionar={seleccionarProveedor}
          onCerrar={() => setMostrarBuscadorProveedores(false)}
          renderItem={(proveedor) => (
            <>
              <div className="producto-nombre">{proveedor.nombre_prov}</div>
              <div className="producto-info">
                {proveedor.tipo_prov} • {proveedor.telefono_prov || 'Sin teléfono'}
              </div>
            </>
          )}
        />
      )}

      {/* Modales del sistema */}
      <ModalConfirmacion
        mostrar={mostrarModal}
        tipo="confirmar"
        mensaje={modo === 'editar' 
          ? "¿Está seguro que desea actualizar esta compra?" 
          : "¿Está seguro que desea registrar esta compra?"}
        onConfirmar={handleGuardar}
        onCancelar={() => setMostrarModal(false)}
      />

      <ModalConfirmacion
        mostrar={mostrarModalExito}
        tipo="exito"
        mensaje={mensajeExito}
        onConfirmar={handleCerrarModalExito}
        onCancelar={handleCerrarModalExito}
      />

      <ModalConfirmacion
        mostrar={mostrarModalError}
        tipo="error"
        mensaje={mensajeError}
        onCancelar={() => setMostrarModalError(false)}
        onConfirmar={() => setMostrarModalError(false)}
      />
    </div>
  );
}

// Componente ModalBuscador reutilizable
const ModalBuscador = ({ titulo, placeholder, busqueda, setBusqueda, items, onSeleccionar, onCerrar, renderItem }) => (
  <div className="modal-overlay" onClick={onCerrar}>
    <div className="modal-contenedor modal-buscador" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{titulo}</h3>
        <button className="btn-cerrar" onClick={onCerrar}>
          <FaTimes />
        </button>
      </div>
      <div className="modal-body">
        <div className="input-busqueda-container">
          <FaSearch className="icono-busqueda" />
          <input
            type="text"
            placeholder={placeholder}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input-busqueda"
            autoFocus
          />
        </div>
        <div className="lista-resultados">
          {items.map(item => (
            <div
              key={item.id}
              className="item-resultado"
              onClick={() => onSeleccionar(item)}
            >
              {renderItem(item)}
            </div>
          ))}
          {items.length === 0 && busqueda && (
            <div className="sin-resultados">No se encontraron resultados</div>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default FormularioCompra;