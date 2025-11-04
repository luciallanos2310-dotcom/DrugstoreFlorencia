import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModalConfirmacion from '../Compras/ModalConfirmacion';
import './FormularioCompra.css';

function FormularioCompra({ modo, compraEditar, onCancelar, onGuardado }) {
  const [form, setForm] = useState({
    codigo_compra: '',
    proveedores: [],
    producto: '',
    categoria_prod: '',
    fecha_entrada: '',
    fecha_vencimiento: '',
    cantidad: '',
    precio_total: '',
    precio_venta: '',
    descripcion: ''
  });

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre_prod: '',
    categoria_prod: '',
    codigo_prod: '',
    precio_total: '',
    precio_venta: '',
    stock_minimo: '',
    cantidad: '',
    fecha_entrada: '',
    fecha_vencimiento: '',
    estado: true
  });

  const [proveedores, setProveedores] = useState([]);
  const [proveedoresSeleccionados, setProveedoresSeleccionados] = useState([]);
  const [productos, setProductos] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mostrarBuscadorProveedores, setMostrarBuscadorProveedores] = useState(false);
  const [busquedaProveedor, setBusquedaProveedor] = useState('');
  
  // Estados para mensajes
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [mensajeError, setMensajeError] = useState('');

  // Generar código de producto único
  const generarCodigoProducto = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `PROD-${timestamp}`;
  };

  // Generar código de compra único
  const generarCodigoCompra = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `COMP-${timestamp}`;
  };

  // Cargar datos iniciales
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    
    if (modo === 'editar' && compraEditar) {
      console.log('Editando compra:', compraEditar);
      
      // ✅ CORREGIDO: Inicializar correctamente con los datos de la compra
      setForm({
        codigo_compra: compraEditar.codigo_compra, // ✅ Mantener el código original
        proveedores: compraEditar.proveedores?.map(p => p.id) || [],
        producto: compraEditar.producto?.id || '',
        categoria_prod: compraEditar.categoria_prod || compraEditar.producto?.categoria_prod || '',
        fecha_entrada: compraEditar.fecha_entrada || '',
        fecha_vencimiento: compraEditar.fecha_vencimiento || '',
        cantidad: compraEditar.cantidad || '',
        precio_total: compraEditar.precio_total || '',
        precio_venta: compraEditar.precio_venta || '',
        descripcion: compraEditar.descripcion || ''
      });
      
      // ✅ Para modo editar, cargar los datos del producto existente
      if (compraEditar.producto) {
        setNuevoProducto({
          nombre_prod: compraEditar.producto.nombre_prod || '',
          categoria_prod: compraEditar.producto.categoria_prod || '',
          codigo_prod: compraEditar.producto.codigo_prod || '',
          precio_total: compraEditar.precio_total || '',
          precio_venta: compraEditar.precio_venta || '',
          stock_minimo: compraEditar.producto.stock_minimo || compraEditar.cantidad || '',
          cantidad: compraEditar.cantidad || '',
          fecha_entrada: compraEditar.fecha_entrada || today,
          fecha_vencimiento: compraEditar.fecha_vencimiento || '',
          estado: true
        });
      }
      
      if (compraEditar.proveedores) {
        setProveedoresSeleccionados(compraEditar.proveedores);
      }
    } else {
      // ✅ CORREGIDO: Solo generar nuevo código para compras nuevas
      const codigoCompra = generarCodigoCompra();
      
      setForm({
        codigo_compra: codigoCompra,
        proveedores: [],
        producto: '',
        categoria_prod: '',
        fecha_entrada: today,
        fecha_vencimiento: '',
        cantidad: '',
        precio_total: '',
        precio_venta: '',
        descripcion: ''
      });
      
      setNuevoProducto({
        nombre_prod: '',
        categoria_prod: '',
        codigo_prod: generarCodigoProducto(),
        precio_total: '',
        precio_venta: '',
        stock_minimo: '',
        cantidad: '',
        fecha_entrada: today,
        fecha_vencimiento: '',
        estado: true
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // ✅ ACTUALIZACIÓN EN TIEMPO REAL: Si cambia la cantidad, actualizar stock mínimo
    if (name === 'cantidad') {
      setNuevoProducto(prev => ({ 
        ...prev, 
        stock_minimo: value // Stock mínimo igual a la cantidad
      }));
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

  // Filtrar proveedores para el buscador
  const proveedoresFiltrados = proveedores.filter(proveedor =>
    proveedor.nombre_prov.toLowerCase().includes(busquedaProveedor.toLowerCase())
  );

  // Seleccionar proveedor (múltiple)
  const seleccionarProveedor = (proveedor) => {
    console.log('Seleccionando proveedor:', proveedor);
    
    if (!proveedoresSeleccionados.find(p => p.id === proveedor.id)) {
      const nuevosProveedores = [...proveedoresSeleccionados, proveedor];
      setProveedoresSeleccionados(nuevosProveedores);
      
      setForm(prev => ({
        ...prev,
        proveedores: nuevosProveedores.map(p => p.id)
      }));
    }
    
    setMostrarBuscadorProveedores(false);
    setBusquedaProveedor('');
  };

  // Remover proveedor seleccionado
  const removerProveedor = (proveedorId) => {
    const nuevosProveedores = proveedoresSeleccionados.filter(p => p.id !== proveedorId);
    setProveedoresSeleccionados(nuevosProveedores);
    setForm(prev => ({
      ...prev,
      proveedores: nuevosProveedores.map(p => p.id)
    }));
  };

  const categorias = [
    'Bebidas', 'Lácteos', 'Golosinas', 'Limpieza', 'Verduras', 
    'Carnes', 'Panificados', 'Fiambres', 'Perfumería', 
    'Electrodomésticos', 'Papelería', 'Otros'
  ];

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!form.codigo_compra.trim()) {
      nuevosErrores.codigo_compra = 'El código de compra es obligatorio';
    }

    if (form.proveedores.length === 0) {
      nuevosErrores.proveedores = 'Debe seleccionar al menos un proveedor';
    }

    // ✅ VALIDACIONES SOLO PARA NUEVO PRODUCTO
    if (!nuevoProducto.nombre_prod.trim()) {
      nuevosErrores.nombre_prod = 'El nombre del producto es obligatorio';
    }
    if (!nuevoProducto.categoria_prod.trim()) {
      nuevosErrores.categoria_prod = 'La categoría es obligatoria';
    }
    if (!nuevoProducto.codigo_prod.trim()) {
      nuevosErrores.codigo_prod = 'El código del producto es obligatorio';
    }

    if (!form.fecha_entrada) {
      nuevosErrores.fecha_entrada = 'La fecha de entrada es obligatoria';
    }

    if (!form.cantidad || form.cantidad <= 0) {
      nuevosErrores.cantidad = 'La cantidad debe ser mayor a 0';
    }

    if (!form.precio_total || form.precio_total <= 0) {
      nuevosErrores.precio_total = 'El precio total debe ser mayor a 0';
    }

    if (!form.precio_venta || form.precio_venta <= 0) {
      nuevosErrores.precio_venta = 'El precio de venta debe ser mayor a 0';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // ✅ CORREGIDO: Función handleGuardar mejorada - SOLO CREA NUEVOS PRODUCTOS
  const handleGuardar = async () => {
    if (!validarFormulario()) {
      console.log('Errores de validación:', errores);
      return;
    }

    setGuardando(true);
    try {
      const token = localStorage.getItem('token');
      
      let productoId;
      let categoriaProducto;
      
      // ✅ SOLO CREAR NUEVO PRODUCTO (no hay opción de producto existente)
      const productoData = {
        nombre_prod: nuevoProducto.nombre_prod,
        categoria_prod: nuevoProducto.categoria_prod,
        codigo_prod: nuevoProducto.codigo_prod,
        precio_total: parseFloat(form.precio_total) || 0,
        precio_venta: parseFloat(form.precio_venta) || 0,
        stock_minimo: parseInt(nuevoProducto.stock_minimo) || parseInt(form.cantidad) || 0,
        cantidad: parseInt(form.cantidad) || 0,
        fecha_entrada: form.fecha_entrada, 
        fecha_vencimiento: form.fecha_vencimiento || null, 
        estado: true
      };

      console.log('➕ Creando nuevo producto:', productoData);
      
      const productoRes = await axios.post('http://localhost:8000/api/productos/', productoData, {
        headers: { Authorization: `Token ${token}` }
      });
      
      productoId = productoRes.data.id;
      categoriaProducto = nuevoProducto.categoria_prod;

      // Crear/Actualizar la Compra
      const compraData = {
        codigo_compra: form.codigo_compra, // ✅ Usar SIEMPRE el código de compra actual
        proveedores: form.proveedores,
        producto: productoId,
        categoria_prod: categoriaProducto,
        fecha_entrada: form.fecha_entrada,
        fecha_vencimiento: form.fecha_vencimiento || null,
        cantidad: parseInt(form.cantidad),
        precio_total: parseFloat(form.precio_total),
        precio_venta: parseFloat(form.precio_venta),
        descripcion: form.descripcion || ''
      };

      console.log('📦 DATOS COMPRA A ENVIAR:', compraData);

      let response;
      if (modo === 'editar' && compraEditar && compraEditar.id) {
        console.log('🔄 ACTUALIZANDO compra existente con ID:', compraEditar.id);
        response = await axios.put(`http://localhost:8000/api/compras/${compraEditar.id}/`, compraData, {
          headers: { Authorization: `Token ${token}` }
        });
      } else {
        console.log('➕ CREANDO nueva compra');
        response = await axios.post('http://localhost:8000/api/compras/', compraData, {
          headers: { Authorization: `Token ${token}` }
        });
      }
      
      console.log('✅ RESPUESTA DEL SERVIDOR:', response.data);
      
      // ✅ CORREGIDO: Cerrar modal de confirmación y mostrar éxito
      setMostrarModal(false);
      setMensajeExito(modo === 'editar' ? '¡Compra actualizada exitosamente!' : '¡Compra registrada exitosamente!');
      setMostrarModalExito(true);
      
    } catch (error) {
      console.error('Error completo al guardar compra:', error);
      console.error('Respuesta del error:', error.response?.data);
      
      // ✅ CORREGIDO: Cerrar modal de confirmación y mostrar error
      setMostrarModal(false);
      const errorMessage = error.response?.data 
        ? JSON.stringify(error.response.data)
        : `Error al ${modo === 'editar' ? 'actualizar' : 'registrar'} la compra. Por favor, intente nuevamente.`;
      
      setMensajeError(errorMessage);
      setMostrarModalError(true);
      
      if (error.response?.data) {
        const erroresServidor = error.response.data;
        setErrores(erroresServidor);
      }
    } finally {
      setGuardando(false);
    }
  };

  const handleRegistrarCompra = () => {
    if (!validarFormulario()) {
      return;
    }
    setMostrarModal(true);
  };

  // ✅ CORREGIDO: Función para cerrar modal de éxito
  const handleCerrarModalExito = () => {
    setMostrarModalExito(false);
    if (onGuardado) {
      onGuardado(); // ✅ Esto debería redirigir a la lista de compras
    }
  };

  return (
    <div className="formulario-compras-container">
      <div className="formulario-header">
        <h2>{modo === 'editar' ? 'Editar Compra' : 'Registrar Nueva Compra'}</h2>
        <p>
          {modo === 'editar' 
            ? 'Actualice los datos de la compra existente.' 
            : 'Complete los datos para registrar un NUEVO producto en el inventario.'}
        </p>
      </div>

      <div className="formulario-content">
        <form className="formulario-compra" onSubmit={(e) => e.preventDefault()}>
          
          {/* CÓDIGO DE COMPRA - ✅ SIEMPRE mantiene el mismo código */}
          <div className="campo-form campo-completo">
            <label>Código de Compra *</label>
            <input
              type="text"
              name="codigo_compra"
              placeholder="Ej: COMP-001"
              value={form.codigo_compra}
              onChange={handleChange}
              className={errores.codigo_compra ? 'error' : ''}
              readOnly={modo === 'editar'} // ✅ Hacer solo lectura en modo edición
            />
            {errores.codigo_compra && <span className="mensaje-error">{errores.codigo_compra}</span>}
          </div>
          
          {/* SECCIÓN DE NUEVO PRODUCTO - OBLIGATORIO */}
          <div className="seccion-producto">
            <h3>Información del Producto *</h3>
            <div className="info-seccion">
              <p className="texto-ayuda">
                {modo === 'editar' 
                  ? 'Está editando un producto existente. Los cambios se aplicarán a este producto.'
                  : 'Complete la información del NUEVO producto que desea agregar al inventario.'}
              </p>
            </div>

            <div className="nuevo-producto-campos">
              <div className="form-grid">
                <div className="campo-form">
                  <label>Nombre del Producto *</label>
                  <input
                    type="text"
                    name="nombre_prod"
                    placeholder="Nombre del producto"
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
                    placeholder="Se genera automáticamente"
                    value={nuevoProducto.codigo_prod}
                    onChange={handleChangeNuevoProducto}
                    className={errores.codigo_prod ? 'error' : ''}
                    readOnly={modo === 'editar'} // Solo lectura en edición
                  />
                  {errores.codigo_prod && <span className="mensaje-error">{errores.codigo_prod}</span>}
                  <small className="texto-ayuda">
                    {modo === 'editar' 
                      ? 'Código del producto existente' 
                      : 'Código generado automáticamente'}
                  </small>
                </div>

                <div className="campo-form">
                  <label>Stock Mínimo</label>
                  <input
                    type="number"
                    name="stock_minimo"
                    placeholder="Se actualiza automáticamente"
                    value={nuevoProducto.stock_minimo}
                    onChange={handleChangeNuevoProducto}
                    className="campo-solo-lectura"
                    readOnly
                  />
                  <small className="texto-ayuda">Se actualiza automáticamente según la cantidad</small>
                </div>
              </div>
            </div>
          </div>

          {/* DETALLES DE LA COMPRA */}
          <div className="seccion-compra">
            <h3>Detalles de la Compra</h3>
            <div className="form-grid">
              <div className="campo-form">
                <label>Fecha de Entrada *</label>
                <input 
                  type="date"
                  name="fecha_entrada" 
                  value={form.fecha_entrada} 
                  onChange={handleChange}
                  className={errores.fecha_entrada ? 'error' : ''}
                />
                {errores.fecha_entrada && <span className="mensaje-error">{errores.fecha_entrada}</span>}
              </div>

              <div className="campo-form">
                <label>Fecha de Vencimiento</label>
                <input 
                  type="date"
                  name="fecha_vencimiento" 
                  value={form.fecha_vencimiento} 
                  onChange={handleChange}
                />
              </div>

              <div className="campo-form">
                <label>Cantidad *</label>
                <input 
                  type="number"
                  name="cantidad" 
                  placeholder="Ej: 100" 
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
                    Seleccionar proveedores...
                  </button>
                  
                  {proveedoresSeleccionados.length > 0 && (
                    <div className="proveedores-seleccionados">
                      <h4>Proveedores seleccionados:</h4>
                      <div className="lista-proveedores">
                        {proveedoresSeleccionados.map(proveedor => (
                          <div key={proveedor.id} className="proveedor-seleccionado">
                            <span>{proveedor.nombre_prov}</span>
                            <button
                              type="button"
                              className="btn-remover"
                              onClick={() => removerProveedor(proveedor.id)}
                            >
                              ✕
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

          {/* DESCRIPCIÓN */}
          <div className="campo-form campo-completo">
            <label>Descripcion</label>
            <textarea 
              name="descripcion" 
              placeholder="Descripción adicional sobre la compra..." 
              value={form.descripcion} 
              onChange={handleChange}
              rows="3"
            ></textarea>
          </div>

          <div className="botones-form">
            <button 
              type="button" 
              className="btn-guardar" 
              onClick={handleRegistrarCompra}
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

      {/* MODAL DE BÚSQUEDA PROVEEDORES */}
      {mostrarBuscadorProveedores && (
        <div className="modal-overlay">
          <div className="modal-contenedor modal-buscador">
            <div className="modal-header">
              <h3>Seleccionar Proveedores</h3>
              <button 
                className="btn-cerrar"
                onClick={() => setMostrarBuscadorProveedores(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                placeholder="Buscar proveedor..."
                value={busquedaProveedor}
                onChange={(e) => setBusquedaProveedor(e.target.value)}
                className="input-busqueda"
                autoFocus
              />
              <div className="lista-resultados">
                {proveedoresFiltrados.map(proveedor => (
                  <div
                    key={proveedor.id}
                    className={`item-resultado ${proveedoresSeleccionados.find(p => p.id === proveedor.id) ? 'seleccionado' : ''}`}
                    onClick={() => seleccionarProveedor(proveedor)}
                  >
                    <div className="producto-nombre">{proveedor.nombre_prov}</div>
                    <div className="producto-info">
                      {proveedor.tipo_prov} • {proveedor.telefono_prov || 'Sin teléfono'}
                    </div>
                  </div>
                ))}
                {proveedoresFiltrados.length === 0 && busquedaProveedor && (
                  <div className="sin-resultados">No se encontraron proveedores</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      {mostrarModal && (
        <ModalConfirmacion
          mostrar={mostrarModal}
          tipo="confirmar"
          mensaje={modo === 'editar' 
            ? "¿Está seguro que desea actualizar esta compra?" 
            : "¿Está seguro que desea registrar esta compra?"}
          onConfirmar={handleGuardar}
          onCancelar={() => setMostrarModal(false)}
          modo={modo} // ✅ Pasar el modo al modal
        />
      )}

      {/* MODAL DE ÉXITO */}
      {mostrarModalExito && (
        <ModalConfirmacion
          mostrar={mostrarModalExito}
          tipo="exito"
          mensaje={mensajeExito}
          onCancelar={handleCerrarModalExito}
          onConfirmar={handleCerrarModalExito}
        />
      )}

      {/* MODAL DE ERROR */}
      {mostrarModalError && (
        <ModalConfirmacion
          mostrar={mostrarModalError}
          tipo="error"
          mensaje={mensajeError}
          onCancelar={() => setMostrarModalError(false)}
          onConfirmar={() => setMostrarModalError(false)}
        />
      )}
    </div>
  );
}

export default FormularioCompra;