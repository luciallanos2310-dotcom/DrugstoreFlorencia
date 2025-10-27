import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ModalConfirmacion from '../Proveedores/ModalConfirmacion';
import './Proveedores.css';

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
    'Otros'
  ];

  useEffect(() => {
    if (modo === 'editar' && proveedorEditar) {
      setForm({
        nombre_prov: proveedorEditar.nombre_prov || '',
        tipo_prov: proveedorEditar.tipo_prov || '',
        // Asegurar que telefono_prov sea siempre string, incluso si es null/undefined
        telefono_prov: proveedorEditar.telefono_prov?.toString() || '',
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

    // CORRECCIÓN: Verificar que telefono_prov sea string antes de usar replace
    if (form.telefono_prov && typeof form.telefono_prov === 'string') {
      const telefonoLimpio = form.telefono_prov.replace(/\s/g, '');
      if (!/^\d+$/.test(telefonoLimpio)) {
        nuevosErrores.telefono_prov = 'El teléfono debe contener solo números';
      }
    } else if (form.telefono_prov) {
      // Si telefono_prov existe pero no es string, convertirlo a string
      const telefonoString = String(form.telefono_prov).replace(/\s/g, '');
      if (!/^\d+$/.test(telefonoString)) {
        nuevosErrores.telefono_prov = 'El teléfono debe contener solo números';
      }
    }

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

    try {
      const token = localStorage.getItem('token');
      
      // Preparar datos para enviar - convertir teléfono vacío a null
      const datosEnviar = {
        ...form,
        telefono_prov: form.telefono_prov.trim() ? form.telefono_prov : null,
        correo_prov: form.correo_prov.trim() || null,
        direccion_prov: form.direccion_prov.trim() || null,
        observaciones: form.observaciones.trim() || null
      };

      if (modo === 'crear') {
        await axios.post('http://localhost:8000/api/proveedores/', datosEnviar, {
          headers: { Authorization: `Token ${token}` }
        });
      } else {
        await axios.put(`http://localhost:8000/api/proveedores/${proveedorEditar.id}/`, datosEnviar, {
          headers: { Authorization: `Token ${token}` }
        });
      }
      onGuardado();
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
      if (error.response?.data) {
        // Manejar errores del servidor
        const erroresServidor = error.response.data;
        const erroresTraducidos = {};
        
        if (erroresServidor.nombre_prov) {
          erroresTraducidos.nombre_prov = 'Este nombre ya existe o es inválido';
        }
        if (erroresServidor.telefono_prov) {
          erroresTraducidos.telefono_prov = 'El teléfono no es válido';
        }
        if (erroresServidor.correo_prov) {
          erroresTraducidos.correo_prov = 'El email no es válido o ya existe';
        }
        
        setErrores(erroresTraducidos);
      }
    } finally {
      setMostrarModal(false);
    }
  };

  return (
    <div className="formulario-container">
      <h2>{modo === 'crear' ? 'Agregar Proveedor' : 'Editar Proveedor'}</h2>
      <p>Complete los siguientes datos para {modo === 'crear' ? 'registrar un proveedor nuevo en el inventario' : 'editar el proveedor seleccionado'}.</p>

      <form className="formulario-proveedor" onSubmit={(e) => e.preventDefault()}>
        <div className="form-grid">
          <div className="campo-form">
            <label>Nombre del proveedor o empresa *</label>
            <input 
              name="nombre_prov" 
              placeholder="Nombre completo" 
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
              type='text'
              placeholder="Ej: +54 9 11 1234 5678" 
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
              placeholder="usuario@email.com" 
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
            placeholder="Calle, número" 
            value={form.direccion_prov} 
            onChange={handleChange}
          />
        </div>

        <div className="campo-form campo-completo">
          <label>Observaciones</label>
          <textarea 
            name="observaciones" 
            placeholder="Escribe aquí" 
            value={form.observaciones} 
            onChange={handleChange}
            rows="3"
          ></textarea>
        </div>

        <div className="botones-form">
          <button type="button" className="btn-guardar" onClick={() => setMostrarModal(true)}>
            {modo === 'crear' ? 'Agregar Proveedor' : 'Guardar Cambios'}
          </button>
          <button type="button" className="btn-cancelar" onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </form>

      {mostrarModal && (
        <ModalConfirmacion
          titulo={modo === 'crear' ? 'Agregar proveedor' : 'Editar proveedor'}
          mensaje={`¿Está seguro que desea ${modo === 'crear' ? 'agregar' : 'editar'} este proveedor?`}
          onCancelar={() => setMostrarModal(false)}
          onConfirmar={handleGuardar}
        />
      )}
    </div>
  );
}

export default FormularioProveedor;