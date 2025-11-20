import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModalConfirmacionUniversal from '../ModalConfirmacionUniversal';
import './FormularioProveedor.css';

function FormularioProveedor({ modo, proveedorEditar, onCancelar, onGuardado }) {
  const [form, setForm] = useState({
    nombre_prov: '',
    tipo_prov: '',
    telefono_prov: '',
    correo_prov: '',
    direccion_prov: '',
    descripcion: '',
    codigo_proveedor: ''
  });

  const [modalConfig, setModalConfig] = useState({
    mostrar: false,
    tipo: '',
    mensaje: '',
    onConfirmar: null,
    onCancelar: null
  });
  
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [proveedoresExistentes, setProveedoresExistentes] = useState([]);

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

  // Cargar proveedores existentes para validaciones
  useEffect(() => {
    cargarProveedoresExistentes();
  }, []);

  useEffect(() => {
    if (modo === 'editar' && proveedorEditar) {
      console.log('Proveedor a editar:', proveedorEditar);
      setForm({
        nombre_prov: proveedorEditar.nombre_prov || '',
        tipo_prov: proveedorEditar.tipo_prov || '',
        telefono_prov: proveedorEditar.telefono_prov || '',
        correo_prov: proveedorEditar.correo_prov || '',
        direccion_prov: proveedorEditar.direccion_prov || '',
        descripcion: proveedorEditar.descripcion || '',
        codigo_proveedor: proveedorEditar.codigo_proveedor || ''
      });
    } else {
      // ✅ CORREGIDO: Generar código automático solo en creación
      generarCodigoAutomatico();
    }
  }, [modo, proveedorEditar]);

  // ✅ FUNCIÓN MEJORADA: Generar código automático
  const generarCodigoAutomatico = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8000/api/proveedores/', {
        headers: { Authorization: `Token ${token}` }
      });
      
      const proveedoresExistentes = res.data;
      
      // Buscar el número más alto de código PROV-XXX
      let ultimoNumero = 0;
      proveedoresExistentes.forEach(proveedor => {
        if (proveedor.codigo_proveedor && proveedor.codigo_proveedor.startsWith('PROV-')) {
          const numeroStr = proveedor.codigo_proveedor.split('-')[1];
          const numero = parseInt(numeroStr);
          if (!isNaN(numero) && numero > ultimoNumero) {
            ultimoNumero = numero;
          }
        }
      });

      const nuevoNumero = ultimoNumero + 1;
      const nuevoCodigo = `PROV-${nuevoNumero.toString().padStart(3, '0')}`;
      
      console.log(`🔢 Generando código automático: ${nuevoCodigo}`);
      
      setForm(prev => ({
        ...prev,
        codigo_proveedor: nuevoCodigo
      }));
      
    } catch (error) {
      console.error('Error al generar código automático:', error);
      // Código de respaldo
      const timestamp = Date.now().toString().slice(-4);
      const codigoRespaldo = `PROV-${timestamp}`;
      
      setForm(prev => ({
        ...prev,
        codigo_proveedor: codigoRespaldo
      }));
    }
  };

  const cargarProveedoresExistentes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8000/api/proveedores/', {
        headers: { Authorization: `Token ${token}` }
      });
      console.log('Proveedores existentes cargados:', res.data.length);
      setProveedoresExistentes(res.data);
    } catch (error) {
      console.error('Error al cargar proveedores existentes', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ✅ FUNCIÓN PARA CERRAR MODAL
  const cerrarModal = () => {
    setModalConfig({
      mostrar: false,
      tipo: '',
      mensaje: '',
      onConfirmar: null,
      onCancelar: null
    });
  };

  // ✅ FUNCIÓN MEJORADA: Validar duplicados
  const validarDuplicadosEnTiempoReal = (campo, valor) => {
    if (!valor.trim()) return null;

    const otrosProveedores = proveedoresExistentes.filter(p => 
      modo === 'editar' ? p.id !== proveedorEditar?.id : true
    );

    const campoMap = {
      nombre_prov: { campo: 'nombre_prov', mensaje: 'nombre' },
      codigo_proveedor: { campo: 'codigo_proveedor', mensaje: 'código' },
      telefono_prov: { campo: 'telefono_prov', mensaje: 'teléfono' },
      correo_prov: { campo: 'correo_prov', mensaje: 'email' },
      direccion_prov: { campo: 'direccion_prov', mensaje: 'dirección' }
    };

    const config = campoMap[campo];
    if (!config) return null;

    const existente = otrosProveedores.find(p => {
      const valorExistente = p[config.campo];
      if (!valorExistente) return false;
      
      // Comparación case-insensitive para strings
      return valorExistente.toString().toLowerCase().trim() === valor.toLowerCase().trim();
    });

    return existente ? `Ya existe un proveedor con este ${config.mensaje}` : null;
  };

  // ✅ VALIDACIÓN COMPLETA DEL FORMULARIO
  const validarFormulario = () => {
    const nuevosErrores = {};

    // Validar campos obligatorios
    if (!form.nombre_prov.trim()) {
      nuevosErrores.nombre_prov = 'El nombre es obligatorio';
    }

    if (!form.tipo_prov.trim()) {
      nuevosErrores.tipo_prov = 'El rubro es obligatorio';
    }

    if (!form.codigo_proveedor.trim()) {
      nuevosErrores.codigo_proveedor = 'El código es obligatorio';
    }

    // Validar formato de teléfono
    if (form.telefono_prov && !/^[\d\s\+\(\)\-]*$/.test(form.telefono_prov)) {
      nuevosErrores.telefono_prov = 'El teléfono solo puede contener números, espacios y los caracteres + - ( )';
    }

    // Validar formato de email
    if (form.correo_prov && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo_prov)) {
      nuevosErrores.correo_prov = 'El email no es válido';
    }

    // Validar duplicados
    const camposParaValidar = [
      'nombre_prov', 
      'codigo_proveedor',
      'telefono_prov', 
      'correo_prov', 
      'direccion_prov'
    ];

    camposParaValidar.forEach(campo => {
      if (form[campo] && form[campo].trim()) {
        const errorDuplicado = validarDuplicadosEnTiempoReal(campo, form[campo]);
        if (errorDuplicado) {
          nuevosErrores[campo] = errorDuplicado;
        }
      }
    });

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // ✅ FUNCIÓN PARA VERIFICAR SI HAY CAMBIOS
  const hayCambios = () => {
    if (modo === 'crear') return true;
    
    if (!proveedorEditar) return true;
    
    const original = {
      nombre_prov: proveedorEditar.nombre_prov || '',
      tipo_prov: proveedorEditar.tipo_prov || '',
      telefono_prov: proveedorEditar.telefono_prov || '',
      correo_prov: proveedorEditar.correo_prov || '',
      direccion_prov: proveedorEditar.direccion_prov || '',
      descripcion: proveedorEditar.descripcion || '',
      codigo_proveedor: proveedorEditar.codigo_proveedor || ''
    };

    return JSON.stringify(original) !== JSON.stringify(form);
  };

  // ✅ FUNCIÓN MEJORADA: Manejar guardado
  const handleGuardarConfirmado = async () => {
    cerrarModal();
    
    if (modo === 'editar' && !hayCambios()) {
      setModalConfig({
        mostrar: true,
        tipo: 'advertencia',
        mensaje: 'No se detectaron cambios para guardar',
        onConfirmar: cerrarModal,
        onCancelar: cerrarModal
      });
      return;
    }

    if (!validarFormulario()) {
      const mensajeError = Object.values(errores).join('\n• ');
      setModalConfig({
        mostrar: true,
        tipo: 'error',
        mensaje: `❌ Errores en el formulario:\n\n• ${mensajeError}`,
        onConfirmar: cerrarModal,
        onCancelar: cerrarModal
      });
      return;
    }

    setGuardando(true);
    try {
      const token = localStorage.getItem('token');
      
      // ✅ PREPARAR DATOS CORRECTAMENTE
      const datosEnviar = {
        nombre_prov: form.nombre_prov.trim(),
        tipo_prov: form.tipo_prov,
        codigo_proveedor: form.codigo_proveedor.trim(),
        // Campos opcionales - enviar null si están vacíos
        telefono_prov: form.telefono_prov.trim() || null,
        correo_prov: form.correo_prov.trim() || null,
        direccion_prov: form.direccion_prov.trim() || null,
        descripcion: form.descripcion.trim() || null,
        estado: true // Siempre crear como activo
      };

      console.log('📤 Enviando datos del proveedor:', datosEnviar);

      let response;
      if (modo === 'crear') {
        response = await axios.post('http://localhost:8000/api/proveedores/', datosEnviar, {
          headers: { 
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Proveedor creado:', response.data);
      } else {
        response = await axios.put(`http://localhost:8000/api/proveedores/${proveedorEditar.id}/`, datosEnviar, {
          headers: { 
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Proveedor actualizado:', response.data);
      }
      
      // ✅ ÉXITO - Mostrar mensaje y redirigir
      setModalConfig({
        mostrar: true,
        tipo: 'exito',
        modo: 'proveedor',
        mensaje: `✅ Proveedor ${modo === 'crear' ? 'creado' : 'actualizado'} correctamente`,
        onConfirmar: () => {
          cerrarModal();
          if (onGuardado) {
            onGuardado(response.data);
          }
        },
        onCancelar: () => {
          cerrarModal();
          if (onGuardado) {
            onGuardado(response.data);
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Error al guardar proveedor:', error);
      
      let mensajeError = 'Error de conexión. Intente nuevamente.';
      let erroresServidor = {};
      
      if (error.response?.data) {
        console.log('📊 Error del servidor:', error.response.data);
        erroresServidor = error.response.data;
        
        // Procesar errores del servidor
        if (typeof erroresServidor === 'object') {
          const erroresTraducidos = {};
          
          for (const [campo, erroresCampo] of Object.entries(erroresServidor)) {
            if (Array.isArray(erroresCampo)) {
              erroresTraducidos[campo] = erroresCampo[0];
            } else if (typeof erroresCampo === 'string') {
              erroresTraducidos[campo] = erroresCampo;
            }
          }
          
          setErrores(erroresTraducidos);
          
          if (Object.keys(erroresTraducidos).length > 0) {
            mensajeError = `❌ Errores del servidor:\n\n• ${Object.values(erroresTraducidos).join('\n• ')}`;
          }
        }
      }

      setModalConfig({
        mostrar: true,
        tipo: 'error',
        mensaje: mensajeError,
        onConfirmar: cerrarModal,
        onCancelar: cerrarModal
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardar = () => {
    // Validar antes de mostrar el modal de confirmación
    if (!validarFormulario()) {
      const mensajeError = Object.values(errores).join('\n• ');
      setModalConfig({
        mostrar: true,
        tipo: 'error',
        mensaje: `❌ Errores en el formulario:\n\n• ${mensajeError}`,
        onConfirmar: cerrarModal,
        onCancelar: cerrarModal
      });
      return;
    }

    setModalConfig({
      mostrar: true,
      tipo: 'confirmar',
      modo: 'proveedor',
      mensaje: `¿Está seguro que desea ${modo === 'crear' ? 'agregar' : 'editar'} este proveedor?`,
      onConfirmar: handleGuardarConfirmado,
      onCancelar: cerrarModal
    });
  };

  // ✅ VERIFICACIÓN MEJORADA: Solo verificar errores de campos con valor
  const hayErroresVisibles = () => {
    return Object.keys(errores).some(key => {
      return errores[key] && errores[key].trim() !== '';
    });
  };

  const camposRequeridosLlenos = form.nombre_prov.trim() && form.tipo_prov.trim() && form.codigo_proveedor.trim();
  const puedeGuardar = camposRequeridosLlenos && !hayErroresVisibles() && (modo === 'crear' || hayCambios());

  return (
    <div className="formulario-container">
      <h2>{modo === 'crear' ? 'Agregar Proveedor' : 'Editar Proveedor'}</h2>
      <p>Complete los siguientes datos para {modo === 'crear' ? 'registrar un proveedor nuevo' : 'editar el proveedor seleccionado'}.</p>

      <form className="formulario-proveedor" onSubmit={(e) => e.preventDefault()}>
        <div className="form-grid">
          {/* Campo CÓDIGO - SOLO LECTURA EN CREACIÓN, EDITABLE EN EDICIÓN */}
          <div className="campo-form">
            <label>Código Proveedor *</label>
            <input 
              name="codigo_proveedor"
              placeholder="Ej: PROV-001"
              value={form.codigo_proveedor}
              onChange={handleChange}
              className={errores.codigo_proveedor ? 'error' : ''}
              maxLength="20"
              readOnly={modo === 'crear'} // ✅ CAMBIADO: readOnly en lugar de disabled
              onBlur={() => {
                if (form.codigo_proveedor.trim()) {
                  const error = validarDuplicadosEnTiempoReal('codigo_proveedor', form.codigo_proveedor);
                  if (error) setErrores(prev => ({ ...prev, codigo_proveedor: error }));
                }
              }}
            />
            {errores.codigo_proveedor && <span className="mensaje-error">{errores.codigo_proveedor}</span>}
            {modo === 'crear' && (
              <small className="texto-ayuda">Código generado automáticamente</small>
            )}
          </div>

          <div className="campo-form">
            <label>Nombre del proveedor o empresa *</label>
            <input 
              name="nombre_prov" 
              placeholder="Ej: Distribuidora La Esperanza" 
              value={form.nombre_prov} 
              onChange={handleChange}
              className={errores.nombre_prov ? 'error' : ''}
              onBlur={() => {
                if (form.nombre_prov.trim()) {
                  const error = validarDuplicadosEnTiempoReal('nombre_prov', form.nombre_prov);
                  if (error) setErrores(prev => ({ ...prev, nombre_prov: error }));
                }
              }}
            />
            {errores.nombre_prov && <span className="mensaje-error">{errores.nombre_prov}</span>}
          </div>

          <div className="campo-form">
            <label>Rubro o tipo *</label>
            <select 
              name="tipo_prov" 
              value={form.tipo_prov} 
              onChange={handleChange}
              className={errores.tipo_prov ? 'error' : ''}
            >
              <option value="">Seleccionar rubro</option>
              {rubros.map(rubro => (
                <option key={rubro} value={rubro}>{rubro}</option>
              ))}
            </select>
            {errores.tipo_prov && <span className="mensaje-error">{errores.tipo_prov}</span>}
          </div>

          <div className="campo-form">
            <label>Teléfono</label>
            <input 
              name="telefono_prov" 
              type="text"
              placeholder="Ej: +54 9 11 1234-5678" 
              value={form.telefono_prov} 
              onChange={handleChange}
              className={errores.telefono_prov ? 'error' : ''}
              onBlur={() => {
                if (form.telefono_prov.trim()) {
                  const error = validarDuplicadosEnTiempoReal('telefono_prov', form.telefono_prov);
                  if (error) setErrores(prev => ({ ...prev, telefono_prov: error }));
                }
              }}
            />
            {errores.telefono_prov && <span className="mensaje-error">{errores.telefono_prov}</span>}
          </div>

          <div className="campo-form">
            <label>Email</label>
            <input 
              name="correo_prov" 
              type="email"
              placeholder="ejemplo@empresa.com" 
              value={form.correo_prov} 
              onChange={handleChange}
              className={errores.correo_prov ? 'error' : ''}
              onBlur={() => {
                if (form.correo_prov.trim()) {
                  const error = validarDuplicadosEnTiempoReal('correo_prov', form.correo_prov);
                  if (error) setErrores(prev => ({ ...prev, correo_prov: error }));
                }
              }}
            />
            {errores.correo_prov && <span className="mensaje-error">{errores.correo_prov}</span>}
          </div>
        </div>

        <div className="campo-form campo-completo">
          <label>Dirección</label>
          <input 
            name="direccion_prov" 
            placeholder="Calle, número, ciudad" 
            value={form.direccion_prov} 
            onChange={handleChange}
            className={errores.direccion_prov ? 'error' : ''}
            onBlur={() => {
              if (form.direccion_prov.trim()) {
                const error = validarDuplicadosEnTiempoReal('direccion_prov', form.direccion_prov);
                if (error) setErrores(prev => ({ ...prev, direccion_prov: error }));
              }
            }}
          />
          {errores.direccion_prov && <span className="mensaje-error">{errores.direccion_prov}</span>}
        </div>

        <div className="campo-form campo-completo">
          <label>Descripcion</label>
          <textarea 
            name="descripcion"
            placeholder="Información adicional sobre el proveedor..." 
            value={form.descripcion}
            onChange={handleChange}
            rows="3"
          ></textarea>
        </div>

        <div className="botones-form">
          <button 
            type="button" 
            className="btn-guardar" 
            onClick={handleGuardar}
            disabled={guardando || !puedeGuardar}
          >
            {guardando ? 'Guardando...' : (modo === 'crear' ? 'Agregar Proveedor' : 'Guardar Cambios')}
          </button>
          <button type="button" className="btn-cancelar" onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </form>

      {/* ✅ MODAL UNIVERSAL */}
      <ModalConfirmacionUniversal
        mostrar={modalConfig.mostrar}
        tipo={modalConfig.tipo}
        modo={modalConfig.modo}
        mensaje={modalConfig.mensaje}
        onConfirmar={modalConfig.onConfirmar}
        onCancelar={modalConfig.onCancelar}
      />
    </div>
  );
}

export default FormularioProveedor;