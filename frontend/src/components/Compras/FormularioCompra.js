import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModalConfirmacionUniversal from '../ModalConfirmacionUniversal';
import FormularioProducto from '../Productos/FormularioProducto';
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
  FaEdit,
  FaArrowLeft,
  FaLock
} from 'react-icons/fa';

function FormularioCompra({ modo, compraEditar, onCancelar, onGuardado }) {
  const [form, setForm] = useState({
    codigo_compra: '',
    proveedores: [],
    producto: '',
    fecha_compra: '',
    cantidad: '',
    precio_total: '',
    descripcion: ''
  });

  const [proveedores, setProveedores] = useState([]);
  const [proveedoresSeleccionados, setProveedoresSeleccionados] = useState([]);
  const [productos, setProductos] = useState([]);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  
  // Estados para búsquedas
  const [mostrarBuscadorProveedores, setMostrarBuscadorProveedores] = useState(false);
  const [mostrarBuscadorProductos, setMostrarBuscadorProductos] = useState(false);
  const [busquedaProveedor, setBusquedaProveedor] = useState('');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  
  // Estados para producto seleccionado
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  
  // Estados para modales
  const [modalConfig, setModalConfig] = useState({});
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);

  // Controlar si mostrar formulario de producto
  const [mostrarFormularioProducto, setMostrarFormularioProducto] = useState(false);

  // Generar código de compra
  const generarCodigoCompra = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `COMP-${timestamp}`;
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
        fecha_compra: compraEditar.fecha_compra || today,
        cantidad: compraEditar.cantidad || '',
        precio_total: compraEditar.precio_total || '',
        descripcion: compraEditar.descripcion || ''
      });
      
      if (compraEditar.producto) {
        setProductoSeleccionado(compraEditar.producto);
      }
      setProveedoresSeleccionados(compraEditar.proveedores || []);
    } else {
      // Modo creación
      setForm({
        codigo_compra: generarCodigoCompra(),
        proveedores: [],
        producto: '',
        fecha_compra: today,
        cantidad: '',
        precio_total: '',
        descripcion: ''
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
      
      const proveedoresActivos = res.data.filter(proveedor => 
        proveedor.estado === true || proveedor.estado === undefined
      );
      
      setProveedores(proveedoresActivos);
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
      console.log('📦 Productos cargados:', res.data.length);
    } catch (error) {
      console.error('Error al cargar productos', error);
    }
  };

  // Buscar y seleccionar producto recién creado
  const buscarYSeleccionarProducto = async (productoCreado) => {
    try {
      console.log('🔍 Buscando producto recién creado:', productoCreado);
      
      // Primero recargar la lista de productos
      await cargarProductos();
      
      // Buscar el producto en la lista actualizada
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/productos/', {
        headers: { Authorization: `Token ${token}` }
      });
      
      const productosActualizados = response.data;
      
      // Buscar por ID si está disponible, sino por nombre y código
      let productoEncontrado = null;
      
      if (productoCreado.id) {
        productoEncontrado = productosActualizados.find(p => p.id === productoCreado.id);
      }
      
      // Si no encuentra por ID, buscar por nombre y código
      if (!productoEncontrado) {
        productoEncontrado = productosActualizados.find(p => 
          p.nombre_prod === productoCreado.nombre_prod && 
          p.codigo_prod === productoCreado.codigo_prod
        );
      }
      
      if (productoEncontrado) {
        console.log('✅ Producto encontrado y seleccionado:', productoEncontrado);
        setProductoSeleccionado(productoEncontrado);
        setForm(prev => ({ ...prev, producto: productoEncontrado.id }));
        
        setModalConfig({
          tipo: 'exito',
          modo: 'compra',
          mensaje: `✅ Producto "${productoEncontrado.nombre_prod}" creado exitosamente y seleccionado. Complete los datos de la compra.`,
          onConfirmar: () => setMostrarModalConfirmacion(false),
          onCancelar: () => setMostrarModalConfirmacion(false)
        });
      } else {
        console.log('⚠️ Producto no encontrado en la lista actualizada');
        setModalConfig({
          tipo: 'error',
          modo: 'compra',
          mensaje: '⚠️ Producto creado pero no se pudo seleccionar automáticamente. Por favor, selecciónelo manualmente de la lista.',
          onConfirmar: () => setMostrarModalConfirmacion(false),
          onCancelar: () => setMostrarModalConfirmacion(false)
        });
      }
      
      setMostrarModalConfirmacion(true);
      
    } catch (error) {
      console.error('❌ Error al buscar producto:', error);
      setModalConfig({
        tipo: 'error',
        modo: 'compra',
        mensaje: '❌ Error al cargar el producto recién creado. Por favor, selecciónelo manualmente.',
        onConfirmar: () => setMostrarModalConfirmacion(false),
        onCancelar: () => setMostrarModalConfirmacion(false)
      });
      setMostrarModalConfirmacion(true);
    }
  };

  // Manejar éxito en creación de producto
  const handleProductoCreado = async (nuevoProducto) => {
    console.log('🎉 Producto creado desde compras, buscando en servidor...', nuevoProducto);
    setMostrarFormularioProducto(false);
    
    // Esperar un poco para que el backend procese la creación
    setTimeout(async () => {
      await buscarYSeleccionarProducto(nuevoProducto);
    }, 1000);
  };

  // Cancelar creación de producto
  const handleCancelarProducto = () => {
    setMostrarFormularioProducto(false);
  };

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Búsquedas y selecciones
  const productosFiltrados = productos.filter(producto =>
    producto.nombre_prod?.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
    producto.codigo_prod?.toLowerCase().includes(busquedaProducto.toLowerCase())
  );

  const proveedoresFiltrados = proveedores.filter(proveedor =>
    proveedor.nombre_prov?.toLowerCase().includes(busquedaProveedor.toLowerCase())
  );

  const seleccionarProducto = (producto) => {
    setProductoSeleccionado(producto);
    setForm(prev => ({ ...prev, producto: producto.id }));
    setMostrarBuscadorProductos(false);
    setBusquedaProducto('');
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

  // VALIDACIÓN MODIFICADA: Proveedor no obligatorio y precio puede ser 0
  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!form.codigo_compra.trim()) nuevosErrores.codigo_compra = 'Código de compra obligatorio';
    if (!form.producto) nuevosErrores.producto = 'Seleccione un producto';
    if (!form.fecha_compra) nuevosErrores.fecha_compra = 'Fecha de compra obligatoria';
    if (!form.cantidad || form.cantidad <= 0) nuevosErrores.cantidad = 'Cantidad debe ser mayor a 0';
    
    // MODIFICADO: Precio total puede ser 0 o mayor
    if (form.precio_total === '' || form.precio_total === null || form.precio_total === undefined) {
      nuevosErrores.precio_total = 'Precio total es obligatorio';
    } else if (parseFloat(form.precio_total) < 0) {
      nuevosErrores.precio_total = 'Precio total no puede ser negativo';
    }
    
    // MODIFICADO: Proveedores no son obligatorios
    // if (form.proveedores.length === 0) nuevosErrores.proveedores = 'Seleccione al menos un proveedor';

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Mostrar confirmación antes de guardar
  const handleConfirmarGuardado = () => {
    if (!validarFormulario()) return;

    // MENSAJE MEJORADO: Indicar cuando es una reposición sin proveedor/costo
    let mensajeConfirmacion = '';
    if (modo === 'editar') {
      mensajeConfirmacion = '¿Está seguro que desea actualizar esta compra?';
    } else {
      const esReposicionSinCosto = parseFloat(form.precio_total) === 0;
      const esReposicionSinProveedor = form.proveedores.length === 0;
      
      if (esReposicionSinCosto && esReposicionSinProveedor) {
        mensajeConfirmacion = `¿Registrar reposición de ${form.cantidad} unidades sin costo y sin proveedor?`;
      } else if (esReposicionSinCosto) {
        mensajeConfirmacion = `¿Registrar reposición de ${form.cantidad} unidades sin costo?`;
      } else if (esReposicionSinProveedor) {
        mensajeConfirmacion = `¿Registrar compra de ${form.cantidad} unidades sin proveedor?`;
      } else {
        mensajeConfirmacion = `¿Está seguro que desea registrar la compra ${form.codigo_compra}?`;
      }
    }

    setModalConfig({
      tipo: 'confirmar',
      modo: 'compra',
      mensaje: mensajeConfirmacion,
      textoConfirmar: modo === 'editar' ? 'Actualizar' : 'Registrar',
      onConfirmar: handleGuardarReal,
      onCancelar: () => setMostrarModalConfirmacion(false)
    });
    setMostrarModalConfirmacion(true);
  };

  // Guardar sin duplicar cantidades
  const handleGuardarReal = async () => {
  setMostrarModalConfirmacion(false);
  setGuardando(true);
  
  try {
    const token = localStorage.getItem('token');

    const compraData = {
      codigo_compra: form.codigo_compra,
      proveedores: form.proveedores,
      producto: form.producto,
      fecha_compra: form.fecha_compra,
      cantidad: Number(form.cantidad),
      precio_total: Number(form.precio_total),
      descripcion: form.descripcion,
      estado: 'activa'
    };

    console.log('📦 Datos enviados al backend:', compraData);

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

    // ✅ CONFIGURACIÓN MEJORADA DEL MODAL DE ÉXITO
    setModalConfig({
      tipo: 'exito',
      modo: 'compra',
      mensaje: modo === 'editar' ? '✅ Compra actualizada exitosamente!' : '✅ Compra registrada exitosamente!',
      onConfirmar: () => {
        console.log('✅ Confirmando éxito, llamando onGuardado...');
        setMostrarModalConfirmacion(false);
        // Llamar onGuardado después de cerrar el modal
        setTimeout(() => {
          onGuardado?.();
        }, 100);
      },
      onCancelar: () => {
        console.log('✅ Cerrando modal de éxito, llamando onGuardado...');
        setMostrarModalConfirmacion(false);
        // También llamar onGuardado si cancelan el modal
        setTimeout(() => {
          onGuardado?.();
        }, 100);
      }
    });
    setMostrarModalConfirmacion(true);

  } catch (error) {
    console.error('Error al guardar compra:', error);
    setModalConfig({
      tipo: 'error',
      modo: 'compra',
      mensaje: error.response?.data ? JSON.stringify(error.response.data) : 'Error al procesar la compra',
      onConfirmar: () => setMostrarModalConfirmacion(false),
      onCancelar: () => setMostrarModalConfirmacion(false)
    });
    setMostrarModalConfirmacion(true);
  } finally {
    setGuardando(false);
  }
};

  const handleCerrarModalExito = () => {
    setMostrarModalConfirmacion(false);
    if (modalConfig.tipo === 'exito') {
      onGuardado?.();
    }
  };

  // SI estamos mostrando el formulario de producto, renderizarlo
  if (mostrarFormularioProducto) {
    return (
      <FormularioProducto
        modo="crear"
        onGuardadoExitoso={handleProductoCreado}
        onCancelar={handleCancelarProducto}
      />
    );
  }

  // Render del componente principal de compras
  return (
    <div className="formulario-compras-container">
      {/* Header */}
      <div className="formulario-header">
        <div className="header-content">
          <h2>
            {modo === 'editar' ? 'Editar Compra' : 'Compras'}
          </h2>
          <p className="header-description">
            {modo === 'editar' 
              ? 'Actualice los datos de la compra existente' 
              : 'Complete la información para registrar una nueva compra o reposición'}
          </p>
        </div>
      </div>

      <div className="formulario-content">
        <form className="formulario-compra" onSubmit={(e) => e.preventDefault()}>
          
          {/* Sección: Información Básica */}
          <div className="seccion-formulario">
            <div className="seccion-header">
              <h3>Información Básica</h3>
            </div>
            <div className="form-grid">
              <div className="campo-form">
                <label>Código de Compra</label>
                <div className="input-with-icon">
                  <input
                    type="text"
                    name="codigo_compra"
                    value={form.codigo_compra}
                    onChange={handleChange}
                    className={errores.codigo_compra ? 'error' : ''}
                    readOnly={true}
                  />
                </div>
                {errores.codigo_compra && <span className="mensaje-error">{errores.codigo_compra}</span>}
              </div>

              <div className="campo-form">
                <label>Fecha de Compra</label>
                <div className="input-with-icon">
                  <input 
                    type="date"
                    name="fecha_compra" 
                    value={form.fecha_compra} 
                    onChange={handleChange}
                    className={errores.fecha_compra ? 'error' : ''}
                    disabled={modo === 'editar'}
                  />
                  {modo === 'editar' && <FaLock className="input-icon-lock" />}
                </div>
                {errores.fecha_compra && <span className="mensaje-error">{errores.fecha_compra}</span>}
              </div>
            </div>
          </div>

          {/* Sección: Producto - CON BOTÓN NUEVO PRODUCTO */}
          <div className="seccion-formulario">
            <div className="seccion-header">
              <h3>Producto</h3>
            </div>
            
            {!productoSeleccionado ? (
              <div className="seleccion-producto">
                <div className="opciones-producto">
                  <button
                    type="button"
                    className="btn-opcion-producto btn-existente"
                    onClick={() => setMostrarBuscadorProductos(true)}
                    disabled={modo === 'editar'}
                  >
                    <FaSearch />
                    <div className="opcion-content">
                      <span className="opcion-titulo">
                        {modo === 'editar' ? 'Producto (Bloqueado)' : 'Seleccionar Producto Existente'}
                      </span>
                      <span className="opcion-descripcion">
                        Buscar en el inventario actual
                      </span>
                    </div>
                    {modo === 'editar' && <FaLock className="opcion-lock" />}
                  </button>
                  
                  {/* NUEVO BOTÓN: Crear Producto */}
                  <button
                    type="button"
                    className="btn-opcion-producto btn-nuevo"
                    onClick={() => setMostrarFormularioProducto(true)}
                    disabled={modo === 'editar'}
                  >
                    <div className="opcion-content">
                      <span className="opcion-titulo">
                        {modo === 'editar' ? 'Crear Producto (Bloqueado)' : 'Crear Nuevo Producto'}
                      </span>
                      <span className="opcion-descripcion">
                        Agregar nuevo producto al inventario
                      </span>
                    </div>
                    {modo === 'editar' && <FaLock className="opcion-lock" />}
                  </button>
                </div>
                {errores.producto && <span className="mensaje-error">{errores.producto}</span>}
              </div>
            ) : (
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
                    if (modo !== 'editar') {
                      setProductoSeleccionado(null);
                      setForm(prev => ({ ...prev, producto: '' }));
                    }
                  }}
                  disabled={modo === 'editar'}
                >
                </button>
              </div>
            )}
          </div>

          {/* Sección: Detalles de la Compra */}
          <div className="seccion-formulario">
            <div className="seccion-header">
              <h3>Detalles de la Compra</h3>
            </div>
            <div className="form-grid">
              <div className="campo-form">
                <label>Cantidad</label>
                <div className="input-with-icon">
                  <input 
                    type="number"
                    name="cantidad" 
                    placeholder="0"
                    value={form.cantidad} 
                    onChange={handleChange}
                    className={errores.cantidad ? 'error' : ''}
                    min="1"
                    disabled={modo === 'editar'}
                  />
                  {modo === 'editar' && <FaLock className="input-icon-lock" />}
                </div>
                {errores.cantidad && <span className="mensaje-error">{errores.cantidad}</span>}
              </div>

              <div className="campo-form">
                <label>Precio Total</label>
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
                    min="0"
                    disabled={modo === 'editar'}
                  />
                  {modo === 'editar' && <FaLock className="input-icon-lock" />}
                </div>
                {errores.precio_total && <span className="mensaje-error">{errores.precio_total}</span>}
               
              </div>
            </div>
          </div>

          {/* SECCIÓN MODIFICADA: Proveedores ahora opcionales */}
          <div className="seccion-formulario">
            <div className="seccion-header">
              <h3>Proveedores</h3>
              <span className="campo-opcional">Opcional</span>
            </div>
            <div className="campo-form">
              <div className="buscador-proveedores-multiple">
                <button
                  type="button"
                  className="btn-buscador"
                  onClick={() => setMostrarBuscadorProveedores(true)}
                >
                  {modo === 'editar' ? 'Modificar proveedores...' : 'Seleccionar proveedores...'}
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
            </div>
          </div>

          {/* Sección: Descripción */}
          <div className="seccion-formulario">
            <div className="seccion-header">
            
              <h3>Descripción Adicional</h3>
            </div>
            <div className="campo-form">
              <textarea 
                name="descripcion" 
                placeholder="Ingrese una descripción."
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
              onClick={handleConfirmarGuardado}
              disabled={guardando || !productoSeleccionado}
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
          titulo="Buscar Producto"
          placeholder="Buscar por nombre o código..."
          busqueda={busquedaProducto}
          setBusqueda={setBusquedaProducto}
          items={productosFiltrados}
          onSeleccionar={seleccionarProducto}
          onCerrar={() => setMostrarBuscadorProductos(false)}
          renderItem={(producto) => (
            <>
              <div className="producto-nombre">{producto.nombre_prod}</div>
              <div className="producto-info">
                Código: {producto.codigo_prod} | Stock: {producto.cantidad || 0}
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

      {/* Modal Universal */}
      <ModalConfirmacionUniversal
        mostrar={mostrarModalConfirmacion}
        tipo={modalConfig.tipo}
        modo={modalConfig.modo}
        mensaje={modalConfig.mensaje}
        textoConfirmar={modalConfig.textoConfirmar}
        textoCancelar={modalConfig.textoCancelar}
        onConfirmar={modalConfig.onConfirmar}
        onCancelar={modalConfig.onCancelar}
      />
    </div>
  );
}

// Componente ModalBuscador
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