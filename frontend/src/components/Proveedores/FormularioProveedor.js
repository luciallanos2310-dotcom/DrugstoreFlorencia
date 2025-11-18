import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModalConfirmacion from './ModalConfirmacion';
import './FormularioProveedor.css';

function FormularioProveedor({ modo, proveedorEditar, onCancelar, onGuardado }) {
  const [form, setForm] = useState({
    nombre_prov: '',
    tipo_prov: '',
    telefono_prov: '',
    correo_prov: '',
    direccion_prov: '',
    descripcion: '', // ✅ CAMBIAR de 'descripcion' a 'observaciones'
    dni_proveedor: ''
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
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
        direccion_prov: proveedorEditar.direccion_prov || '', // ✅ Esto debería cargar la dirección
        descripcion: proveedorEditar.descripcion || '', // ✅ CAMBIAR a 'observaciones'
        dni_proveedor: proveedorEditar.dni_proveedor || ''
      });
    } else {
      // ✅ LIMPIAR FORMULARIO EN MODO CREAR
      setForm({
        nombre_prov: '',
        tipo_prov: '',
        telefono_prov: '',
        correo_prov: '',
        direccion_prov: '',
        descripcion: '', // ✅ CAMBIAR a 'observaciones'
        dni_proveedor: ''
      });
    }
  }, [modo, proveedorEditar]);

  const cargarProveedoresExistentes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8000/api/proveedores/', {
        headers: { Authorization: `Token ${token}` }
      });
      console.log('Proveedores existentes cargados:', res.data);
      setProveedoresExistentes(res.data);
    } catch (error) {
      console.error('Error al cargar proveedores existentes', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
  };

  // ✅ FUNCIÓN MEJORADA: Validar duplicados en tiempo real
  const validarDuplicadosEnTiempoReal = (campo, valor) => {
    if (!valor.trim()) return null;

    const otrosProveedores = proveedoresExistentes.filter(p => 
      modo === 'editar' ? p.id !== proveedorEditar?.id : true
    );

    const campoMap = {
      nombre_prov: { campo: 'nombre_prov', mensaje: 'nombre' },
      dni_proveedor: { campo: 'dni_proveedor', mensaje: 'DNI' },
      telefono_prov: { campo: 'telefono_prov', mensaje: 'teléfono' },
      correo_prov: { campo: 'correo_prov', mensaje: 'email' },
      direccion_prov: { campo: 'direccion_prov', mensaje: 'dirección' }
    };

    const config = campoMap[campo];
    if (!config) return null;

    const existente = otrosProveedores.find(p => {
      const valorExistente = p[config.campo];
      if (!valorExistente) return false;
      
      // Comparación case-insensitive para texto
      if (typeof valorExistente === 'string' && typeof valor === 'string') {
        return valorExistente.toLowerCase().trim() === valor.toLowerCase().trim();
      }
      // Comparación exacta para números
      return valorExistente.trim() === valor.trim();
    });

    return existente ? `Ya existe un proveedor con este ${config.mensaje}` : null;
  };

  // ✅ VALIDACIÓN COMPLETA DEL FORMULARIO
  const validarFormulario = () => {
    const nuevosErrores = {};

    // Validaciones básicas de requeridos
    if (!form.nombre_prov.trim()) {
      nuevosErrores.nombre_prov = 'El nombre es obligatorio';
    }

    if (!form.tipo_prov.trim()) {
      nuevosErrores.tipo_prov = 'El rubro es obligatorio';
    }

    // Validaciones de formato
    if (form.telefono_prov && !/^[\d\s\+\(\)\-]*$/.test(form.telefono_prov)) {
      nuevosErrores.telefono_prov = 'El teléfono solo puede contener números, espacios y los caracteres + - ( )';
    }

    if (form.correo_prov && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo_prov)) {
      nuevosErrores.correo_prov = 'El email no es válido';
    }

    if (form.dni_proveedor && !/^\d*$/.test(form.dni_proveedor)) {
      nuevosErrores.dni_proveedor = 'El DNI solo puede contener números';
    }

    // ✅ VALIDACIONES DE DUPLICADOS MEJORADAS
    const camposParaValidar = [
      'nombre_prov', 
      'dni_proveedor', 
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
      descripcion: proveedorEditar.descripcion || '', // ✅ CAMBIAR a 'observaciones'
      dni_proveedor: proveedorEditar.dni_proveedor || ''
    };

    return JSON.stringify(original) !== JSON.stringify(form);
  };

  const handleGuardar = async () => {
    // Verificar si hay cambios en modo edición
    if (modo === 'editar' && !hayCambios()) {
      alert('No se detectaron cambios para guardar');
      return;
    }

    if (!validarFormulario()) {
      const mensajeError = Object.values(errores).join('\n• ');
      alert(`❌ Errores en el formulario:\n\n• ${mensajeError}`);
      return;
    }

    setGuardando(true);
    try {
      const token = localStorage.getItem('token');
      
      // Preparar datos para enviar
      const datosEnviar = {
        nombre_prov: form.nombre_prov.trim(),
        tipo_prov: form.tipo_prov,
        telefono_prov: form.telefono_prov.trim() || null,
        correo_prov: form.correo_prov.trim() || null,
        direccion_prov: form.direccion_prov.trim() || null,
        descripcion: form.descripcion.trim() || null, // ✅ CAMBIAR a 'observaciones'
        dni_proveedor: form.dni_proveedor.trim() || null
      };

      console.log('Enviando datos:', datosEnviar);

      if (modo === 'crear') {
        await axios.post('http://localhost:8000/api/proveedores/', datosEnviar, {
          headers: { 
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        await axios.put(`http://localhost:8000/api/proveedores/${proveedorEditar.id}/`, datosEnviar, {
          headers: { 
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Mostrar modal de éxito
      setMostrarModalExito(true);
      
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
      
      // Manejar errores del servidor de forma más robusta
      if (error.response?.data) {
        const erroresServidor = error.response.data;
        console.log('Errores del servidor:', erroresServidor);
        
        const erroresTraducidos = {};
        
        // Mapeo completo de errores del servidor
        const mapeoErrores = {
          'nombre_prov': 'nombre del proveedor',
          'telefono_prov': 'teléfono',
          'correo_prov': 'email', 
          'dni_proveedor': 'DNI',
          'direccion_prov': 'dirección',
          'descripcion': 'descripcion' // ✅ AGREGAR observaciones
        };

        for (const [campo, mensaje] of Object.entries(mapeoErrores)) {
          if (erroresServidor[campo]) {
            const errorArray = Array.isArray(erroresServidor[campo]) 
              ? erroresServidor[campo] 
              : [erroresServidor[campo]];
            
            for (const errorMsg of errorArray) {
              if (typeof errorMsg === 'string') {
                if (errorMsg.includes('already exists') || errorMsg.includes('unique')) {
                  erroresTraducidos[campo] = `Ya existe un proveedor con este ${mensaje}`;
                  break;
                } else if (errorMsg.includes('invalid') || errorMsg.includes('Enter a valid')) {
                  erroresTraducidos[campo] = `Formato inválido para el ${mensaje}`;
                  break;
                }
              }
            }
            
            if (!erroresTraducidos[campo]) {
              erroresTraducidos[campo] = `Error en el ${mensaje}: ${errorArray[0]}`;
            }
          }
        }
        
        setErrores(erroresTraducidos);
        
        // Mostrar alerta con el error
        if (Object.keys(erroresTraducidos).length > 0) {
          const mensajeError = Object.values(erroresTraducidos).join('\n• ');
          alert(`❌ Error del servidor:\n\n• ${mensajeError}`);
        } else {
          alert('❌ Error al guardar el proveedor. Por favor, verifique los datos.');
        }
      } else {
        alert('❌ Error de conexión al guardar el proveedor');
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

  // ✅ VERIFICACIÓN MEJORADA: Solo verificar errores de campos con valor
  const hayErroresVisibles = () => {
    return Object.keys(errores).some(key => {
      // Solo considerar errores que realmente existen en el objeto de errores
      return errores[key] && errores[key].trim() !== '';
    });
  };

  const camposRequeridosLlenos = form.nombre_prov.trim() && form.tipo_prov.trim();
  const puedeGuardar = camposRequeridosLlenos && !hayErroresVisibles() && (modo === 'crear' || hayCambios());

  return (
    <div className="formulario-container">
      <h2>{modo === 'crear' ? 'Agregar Proveedor' : 'Editar Proveedor'}</h2>
      <p>Complete los siguientes datos para {modo === 'crear' ? 'registrar un proveedor nuevo' : 'editar el proveedor seleccionado'}.</p>

      <form className="formulario-proveedor" onSubmit={(e) => e.preventDefault()}>
        <div className="form-grid">
          {/* Campo DNI */}
          <div className="campo-form">
            <label>DNI Proveedor</label>
            <input 
              name="dni_proveedor" 
              placeholder="Ej: 12345678" 
              value={form.dni_proveedor} 
              onChange={handleChange}
              className={errores.dni_proveedor ? 'error' : ''}
              maxLength="20"
              onBlur={() => {
                if (form.dni_proveedor.trim()) {
                  const error = validarDuplicadosEnTiempoReal('dni_proveedor', form.dni_proveedor);
                  if (error) setErrores(prev => ({ ...prev, dni_proveedor: error }));
                }
              }}
            />
            {errores.dni_proveedor && <span className="mensaje-error">{errores.dni_proveedor}</span>}
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
            name="descripcion" // ✅ CAMBIAR de 'descripcion' a 'observaciones'
            placeholder="Información adicional sobre el proveedor..." 
            value={form.descripcion} // ✅ CAMBIAR de 'descripcion' a 'observaciones'
            onChange={handleChange}
            rows="3"
          ></textarea>
        </div>

        <div className="botones-form">
          <button 
            type="button" 
            className="btn-guardar" 
            onClick={() => setMostrarModal(true)}
            disabled={guardando || !puedeGuardar}
          >
            {guardando ? 'Guardando...' : (modo === 'crear' ? 'Agregar Proveedor' : 'Guardar Cambios')}
          </button>
          <button type="button" className="btn-cancelar" onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </form>

      {/* Modal de confirmación */}
      <ModalConfirmacion
        mostrar={mostrarModal}
        tipo="confirmar"
        mensaje={`¿Está seguro que desea ${modo === 'crear' ? 'agregar' : 'editar'} este proveedor?`}
        onCancelar={() => setMostrarModal(false)}
        onConfirmar={handleGuardar}
      />

      {/* Modal de éxito */}
      <ModalConfirmacion
        mostrar={mostrarModalExito}
        tipo="exito"
        mensaje={`Proveedor ${modo === 'crear' ? 'creado' : 'actualizado'} correctamente`}
        onCancelar={handleConfirmarExito}
        onConfirmar={handleConfirmarExito}
      />
    </div>
  );
}

export default FormularioProveedor;