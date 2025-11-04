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
    observaciones: ''
  });

  const [mostrarModal, setMostrarModal] = useState(false);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);

  // Lista de rubros predefinidos
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

  useEffect(() => {
    if (modo === 'editar' && proveedorEditar) {
      setForm({
        nombre_prov: proveedorEditar.nombre_prov || '',
        tipo_prov: proveedorEditar.tipo_prov || '',
        telefono_prov: proveedorEditar.telefono_prov || '',
        correo_prov: proveedorEditar.correo_prov || '',
        direccion_prov: proveedorEditar.direccion_prov || '',
        observaciones: proveedorEditar.observaciones || ''
      });
    }
  }, [modo, proveedorEditar]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!form.nombre_prov.trim()) {
      nuevosErrores.nombre_prov = 'El nombre es obligatorio';
    }

    if (!form.tipo_prov.trim()) {
      nuevosErrores.tipo_prov = 'El rubro es obligatorio';
    }

    // Validar teléfono (solo números y espacios)
    if (form.telefono_prov && !/^[\d\s\+\(\)\-]*$/.test(form.telefono_prov)) {
      nuevosErrores.telefono_prov = 'El teléfono solo puede contener números, espacios y los caracteres + - ( )';
    }

    // Validar email
    if (form.correo_prov && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo_prov)) {
      nuevosErrores.correo_prov = 'El email no es válido';
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
        nombre_prov: form.nombre_prov.trim(),
        tipo_prov: form.tipo_prov,
        telefono_prov: form.telefono_prov.trim() || null,
        correo_prov: form.correo_prov.trim() || null,
        direccion_prov: form.direccion_prov.trim() || null,
        observaciones: form.observaciones.trim() || null
      };

      console.log('Enviando datos:', datosEnviar); // Para debug

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
      
      // Manejar errores del servidor
      if (error.response?.data) {
        const erroresServidor = error.response.data;
        const erroresTraducidos = {};
        
        if (erroresServidor.nombre_prov) {
          if (erroresServidor.nombre_prov.includes('already exists')) {
            erroresTraducidos.nombre_prov = 'Ya existe un proveedor con este nombre';
          } else {
            erroresTraducidos.nombre_prov = 'Error en el nombre del proveedor';
          }
        }
        
        if (erroresServidor.telefono_prov) {
          erroresTraducidos.telefono_prov = 'Error en el formato del teléfono';
        }
        
        if (erroresServidor.correo_prov) {
          if (erroresServidor.correo_prov.includes('already exists')) {
            erroresTraducidos.correo_prov = 'Ya existe un proveedor con este email';
          } else {
            erroresTraducidos.correo_prov = 'Error en el formato del email';
          }
        }
        
        setErrores(erroresTraducidos);
        
        // Mostrar alerta con el error
        if (Object.keys(erroresTraducidos).length > 0) {
          alert('Error al guardar: ' + Object.values(erroresTraducidos).join(', '));
        } else {
          alert('Error al guardar el proveedor: ' + JSON.stringify(erroresServidor));
        }
      } else {
        alert('Error de conexión al guardar el proveedor');
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
      <h2>{modo === 'crear' ? 'Agregar Proveedor' : 'Editar Proveedor'}</h2>
      <p>Complete los siguientes datos para {modo === 'crear' ? 'registrar un proveedor nuevo' : 'editar el proveedor seleccionado'}.</p>

      <form className="formulario-proveedor" onSubmit={(e) => e.preventDefault()}>
        <div className="form-grid">
          <div className="campo-form">
            <label>Nombre del proveedor o empresa *</label>
            <input 
              name="nombre_prov" 
              placeholder="Ej: Distribuidora La Esperanza" 
              value={form.nombre_prov} 
              onChange={handleChange}
              className={errores.nombre_prov ? 'error' : ''}
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
          />
        </div>

        <div className="campo-form campo-completo">
          <label>Observaciones</label>
          <textarea 
            name="observaciones" 
            placeholder="Información adicional sobre el proveedor..." 
            value={form.observaciones} 
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