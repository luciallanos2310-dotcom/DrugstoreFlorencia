import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import '../Empleados/FormularioEmpleado.css';

// El componente padre (Empleados.js) ya se encarga de que solo la Jefa acceda.
// Asumimos que si estamos aquí, tenemos permiso para editar/crear.
function FormularioEmpleado({ modo, empleado, onGuardar, onCancelar }) { 
  const [formData, setFormData] = useState({
    nombre_emp: '',
    apellido_emp: '',
    dni_emp: '',
    telefono_emp: '',
    domicilio_emp: '',
    tipo_usuario: 'empleada',
    email: '',
    password: '',
    confirmarPassword: ''
  });

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [errores, setErrores] = useState({});
  
  // Ya que solo la Jefa accede a este formulario, permitimos editar el puesto.
  const puedeEditarPuesto = true; 

  useEffect(() => {
    if (empleado && modo === 'editar') {
      setFormData({
        nombre_emp: empleado.nombre_emp || '',
        apellido_emp: empleado.apellido_emp || '',
        dni_emp: empleado.dni_emp || '',
        telefono_emp: empleado.telefono_emp || '',
        domicilio_emp: empleado.domicilio_emp || '',
        tipo_usuario: empleado.tipo_usuario || 'empleada',
        email: empleado.user?.email || '',
        password: '',
        confirmarPassword: ''
      });
    }
  }, [empleado, modo]);

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

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.nombre_emp.trim()) nuevosErrores.nombre_emp = 'El nombre es requerido';
    if (!formData.apellido_emp.trim()) nuevosErrores.apellido_emp = 'El apellido es requerido';
    if (!formData.dni_emp) nuevosErrores.dni_emp = 'El DNI es requerido';
    if (!formData.telefono_emp.trim()) nuevosErrores.telefono_emp = 'El teléfono es requerido';
    if (!formData.domicilio_emp.trim()) nuevosErrores.domicilio_emp = 'La dirección es requerida';
    if (!formData.email.trim()) nuevosErrores.email = 'El email es requerido';
    
    // Validación de contraseña solo si estamos creando O si el campo password tiene un valor
    if (modo === 'crear' && !formData.password) {
      nuevosErrores.password = 'La contraseña es requerida';
    }
    
    // Validación de confirmación de contraseña
    if ((modo === 'crear' || (modo === 'editar' && formData.password)) && 
        formData.password !== formData.confirmarPassword) {
      nuevosErrores.confirmarPassword = 'Las contraseñas no coinciden';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validarFormulario()) {
      onGuardar(formData);
    }
  };

  const titulo = modo === 'crear' ? 'Agregar Empleado' : 'Editar Empleado';
  const textoBoton = modo === 'crear' ? 'Crear Empleado' : 'Guardar Cambios';

  return (
    <div className="formulario-empleado-container">
      <div className="formulario-empleado-card">
        <div className="formulario-header">
          <h1>{titulo}</h1>
          <p>Complete los siguientes campos para {modo === 'crear' ? 'registrar' : 'editar'} un empleado en el sistema.</p>
        </div>

        <form onSubmit={handleSubmit} className="formulario-empleado">
          <div className="form-columnas">
            {/* Columna izquierda */}
            <div className="columna-izquierda">
              <div className="campo-grupo">
                <label htmlFor="nombre_emp">Nombre del empleado:</label>
                <input
                  type="text"
                  id="nombre_emp"
                  name="nombre_emp"
                  value={formData.nombre_emp}
                  onChange={handleChange}
                  placeholder="Nombre completo"
                  className={errores.nombre_emp ? 'error' : ''}
                />
                {errores.nombre_emp && <span className="mensaje-error">{errores.nombre_emp}</span>}
              </div>

              <div className="campo-grupo">
                <label htmlFor="dni_emp">DNI:</label>
                <input
                  type="number"
                  id="dni_emp"
                  name="dni_emp"
                  value={formData.dni_emp}
                  onChange={handleChange}
                  placeholder="Documento Nacional de Identidad"
                  className={errores.dni_emp ? 'error' : ''}
                />
                {errores.dni_emp && <span className="mensaje-error">{errores.dni_emp}</span>}
              </div>

              <div className="campo-grupo">
                <label htmlFor="tipo_usuario">Puesto:</label>
                <select
                  id="tipo_usuario"
                  name="tipo_usuario"
                  value={formData.tipo_usuario}
                  onChange={handleChange}
                  disabled={!puedeEditarPuesto}
                >
                  <option value="empleada">Empleada</option>
                  <option value="jefa">Jefa/Encargada</option>
                </select>
                {!puedeEditarPuesto && (
                    <span className="mensaje-error">Solo la Jefa puede modificar el puesto.</span>
                )}
              </div>

              <div className="campo-grupo">
                <label htmlFor="domicilio_emp">Dirección:</label>
                <input
                  type="text"
                  id="domicilio_emp"
                  name="domicilio_emp"
                  value={formData.domicilio_emp}
                  onChange={handleChange}
                  placeholder="Calle, número"
                  className={errores.domicilio_emp ? 'error' : ''}
                />
                {errores.domicilio_emp && <span className="mensaje-error">{errores.domicilio_emp}</span>}
              </div>

              {/* Campo Contraseña (Visible si Creando O si hay valor en la contraseña) */}
              {(modo === 'crear' || formData.password || modo === 'editar') && (
                <div className="campo-grupo">
                  <label htmlFor="password">Contraseña:</label>
                  <div className="password-input-container">
                    <input
                      type={mostrarPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={modo === 'crear' ? "Ingrese la contraseña" : "Dejar vacío para no cambiar"}
                      className={errores.password ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="btn-mostrar-password"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                    >
                      {mostrarPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errores.password && <span className="mensaje-error">{errores.password}</span>}
                </div>
              )}
            </div>

            {/* Columna derecha */}
            <div className="columna-derecha">
              <div className="campo-grupo">
                <label htmlFor="apellido_emp">Apellido del empleado:</label>
                <input
                  type="text"
                  id="apellido_emp"
                  name="apellido_emp"
                  value={formData.apellido_emp}
                  onChange={handleChange}
                  placeholder="Apellido completo"
                  className={errores.apellido_emp ? 'error' : ''}
                />
                {errores.apellido_emp && <span className="mensaje-error">{errores.apellido_emp}</span>}
              </div>

              <div className="campo-grupo">
                <label htmlFor="telefono_emp">Teléfono:</label>
                <input
                  type="text"
                  id="telefono_emp"
                  name="telefono_emp"
                  value={formData.telefono_emp}
                  onChange={handleChange}
                  placeholder="Ej: +54 9 11 1234 5678"
                  className={errores.telefono_emp ? 'error' : ''}
                />
                {errores.telefono_emp && <span className="mensaje-error">{errores.telefono_emp}</span>}
              </div>

              <div className="campo-grupo">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="usuario@email.com"
                  className={errores.email ? 'error' : ''}
                />
                {errores.email && <span className="mensaje-error">{errores.email}</span>}
              </div>

              {/* Campo Confirmar Contraseña (Visible si Creando O si hay valor en la contraseña) */}
              {(modo === 'crear' || formData.password) && (
                <div className="campo-grupo">
                  <label htmlFor="confirmarPassword">Confirmar Contraseña:</label>
                  <input
                    type={mostrarPassword ? "text" : "password"}
                    id="confirmarPassword"
                    name="confirmarPassword"
                    value={formData.confirmarPassword}
                    onChange={handleChange}
                    placeholder="Confirme la contraseña"
                    className={errores.confirmarPassword ? 'error' : ''}
                  />
                  {errores.confirmarPassword && <span className="mensaje-error">{errores.confirmarPassword}</span>}
                </div>
              )}
            </div>
          </div>

          <div className="campo-grupo-full">
            <label htmlFor="informacion_adicional">Información Adicional:</label>
            <textarea
              id="informacion_adicional"
              name="informacion_adicional"
              rows="3"
              placeholder="Escribe aquí"
            />
          </div>

          <div className="formulario-acciones">
            <button type="button" className="btn-cancelar" onClick={onCancelar}>
              <FaTimes /> Cancelar
            </button>
            <button type="submit" className="btn-guardar">
              <FaSave /> {textoBoton}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FormularioEmpleado;
