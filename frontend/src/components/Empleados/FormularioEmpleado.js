// src/components/Empleados/FormularioEmpleado.js
import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaLock, FaCheck, FaTimes as FaClose, FaEye, FaEyeSlash } from 'react-icons/fa';
import ModalConfirmacion from './ModalConfirmacion';
import '../Empleados/FormularioEmpleado.css';

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
    confirmarPassword: '',
    observaciones: ''
  });

  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarModalPassword, setMostrarModalPassword] = useState(false);
  const [passwordModalData, setPasswordModalData] = useState({
    passwordActual: '',
    nuevaPassword: '',
    confirmarNuevaPassword: ''
  });
  const [mostrarPasswordModal, setMostrarPasswordModal] = useState({
    passwordActual: false,
    nuevaPassword: false,
    confirmarNuevaPassword: false
  });
  const [errores, setErrores] = useState({});
  const [erroresModal, setErroresModal] = useState({});
  const [mensajeExito, setMensajeExito] = useState('');
  const [validacionPassword, setValidacionPassword] = useState({
    longitud: false,
    mayuscula: false,
    minuscula: false,
    numero: false,
    especial: false
  });
  const [coincidePassword, setCoincidePassword] = useState(null);
  const [passwordActualCorrecta, setPasswordActualCorrecta] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [verificandoPassword, setVerificandoPassword] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);

  useEffect(() => {
    if (empleado && modo === 'editar') {
      setFormData({
        nombre_emp: empleado.nombre_emp || '',
        apellido_emp: empleado.apellido_emp || '',
        dni_emp: empleado.dni_emp || '',
        telefono_emp: empleado.telefono_emp || '',
        domicilio_emp: empleado.domicilio_emp || '',
        tipo_usuario: empleado.tipo_usuario || 'empleada',
        email: empleado.email || empleado.user?.email || '',
        password: '',
        confirmarPassword: '',
        observaciones: empleado.observaciones || ''
      });
    }
  }, [empleado, modo]);

  // Efecto para validar la nueva contraseña en tiempo real
  useEffect(() => {
    if (passwordModalData.nuevaPassword) {
      setValidacionPassword({
        longitud: passwordModalData.nuevaPassword.length >= 8,
        mayuscula: /[A-Z]/.test(passwordModalData.nuevaPassword),
        minuscula: /[a-z]/.test(passwordModalData.nuevaPassword),
        numero: /[0-9]/.test(passwordModalData.nuevaPassword),
        especial: /[!@#$%^&*(),.?":{}|<>]/.test(passwordModalData.nuevaPassword)
      });
    } else {
      setValidacionPassword({
        longitud: false,
        mayuscula: false,
        minuscula: false,
        numero: false,
        especial: false
      });
    }
  }, [passwordModalData.nuevaPassword]);

  // Efecto para verificar coincidencia de contraseñas
  useEffect(() => {
    if (passwordModalData.confirmarNuevaPassword) {
      setCoincidePassword(passwordModalData.nuevaPassword === passwordModalData.confirmarNuevaPassword);
    } else {
      setCoincidePassword(null);
    }
  }, [passwordModalData.nuevaPassword, passwordModalData.confirmarNuevaPassword]);

  // Efecto para verificar contraseña actual contra la API
  useEffect(() => {
    const verificarPasswordActual = async () => {
      if (passwordModalData.passwordActual && empleado) {
        setVerificandoPassword(true);
        try {
          const token = localStorage.getItem('token');
          
          const response = await fetch('/api/verificar-password/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Token ${token}`
            },
            body: JSON.stringify({
              empleado_id: empleado.id,
              password_actual: passwordModalData.passwordActual
            })
          });

          if (response.ok) {
            const data = await response.json();
            setPasswordActualCorrecta(data.es_correcta);
          } else {
            setPasswordActualCorrecta(false);
          }
        } catch (error) {
          console.error('Error verificando contraseña:', error);
          setPasswordActualCorrecta(false);
        } finally {
          setVerificandoPassword(false);
        }
      } else {
        setPasswordActualCorrecta(null);
      }
    };

    // Debounce para evitar muchas llamadas a la API
    const timeoutId = setTimeout(() => {
      verificarPasswordActual();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [passwordModalData.passwordActual, empleado]);

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

  const handleChangeModal = (e) => {
    const { name, value } = e.target;
    setPasswordModalData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (erroresModal[name]) {
      setErroresModal(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const toggleMostrarPasswordModal = (campo) => {
    setMostrarPasswordModal(prev => ({
      ...prev,
      [campo]: !prev[campo]
    }));
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.nombre_emp.trim()) nuevosErrores.nombre_emp = 'El nombre es requerido';
    if (!formData.apellido_emp.trim()) nuevosErrores.apellido_emp = 'El apellido es requerido';
    if (!formData.dni_emp) nuevosErrores.dni_emp = 'El DNI es requerido';
    if (!formData.telefono_emp.trim()) nuevosErrores.telefono_emp = 'El teléfono es requerido';
    if (!formData.domicilio_emp.trim()) nuevosErrores.domicilio_emp = 'La dirección es requerida';
    if (!formData.email.trim()) nuevosErrores.email = 'El email es requerido';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) nuevosErrores.email = 'El email no es válido';
    
    if (modo === 'crear' && !formData.password) {
      nuevosErrores.password = 'La contraseña es requerida';
    }
    
    if (modo === 'crear' && formData.password !== formData.confirmarPassword) {
      nuevosErrores.confirmarPassword = 'Las contraseñas no coinciden';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const validarModalPassword = () => {
    const nuevosErrores = {};

    if (!passwordModalData.passwordActual) {
      nuevosErrores.passwordActual = 'La contraseña actual es requerida';
    } else if (!passwordActualCorrecta) {
      nuevosErrores.passwordActual = 'La contraseña actual es incorrecta';
    }

    if (!passwordModalData.nuevaPassword) {
      nuevosErrores.nuevaPassword = 'La nueva contraseña es requerida';
    } else {
      const todasCumplidas = Object.values(validacionPassword).every(v => v);
      if (!todasCumplidas) {
        nuevosErrores.nuevaPassword = 'La contraseña no cumple con todos los requisitos de seguridad';
      }
    }
    
    if (!passwordModalData.confirmarNuevaPassword) {
      nuevosErrores.confirmarNuevaPassword = 'Debe confirmar la nueva contraseña';
    } else if (!coincidePassword) {
      nuevosErrores.confirmarNuevaPassword = 'Las contraseñas no coinciden';
    }

    setErroresModal(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validarFormulario()) {
      // Enviar datos sin la contraseña en modo edición
      const datosParaEnviar = { ...formData };
      if (modo === 'editar') {
        delete datosParaEnviar.password;
        delete datosParaEnviar.confirmarPassword;
      }
      onGuardar(datosParaEnviar);
    }
  };

  const handleCambiarPassword = () => {
    setMostrarModalPassword(true);
    setPasswordModalData({
      passwordActual: '',
      nuevaPassword: '',
      confirmarNuevaPassword: ''
    });
    setErroresModal({});
    setPasswordActualCorrecta(null);
    setCoincidePassword(null);
    setValidacionPassword({
      longitud: false,
      mayuscula: false,
      minuscula: false,
      numero: false,
      especial: false
    });
    setMostrarPasswordModal({
      passwordActual: false,
      nuevaPassword: false,
      confirmarNuevaPassword: false
    });
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    
    if (validarModalPassword()) {
      setMostrarConfirmacion(true);
    }
  };

  const confirmarCambioPassword = async () => {
    setCargando(true);
    setMostrarConfirmacion(false);
    
    try {
      const token = localStorage.getItem('token');
      
      // Llamar a la API para cambiar la contraseña
      const response = await fetch('/api/cambiar-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          empleado_id: empleado.id,
          password_actual: passwordModalData.passwordActual,
          nueva_password: passwordModalData.nuevaPassword
        })
      });

      if (response.ok) {
        // Mostrar modal de éxito en lugar del mensaje inline
        setMostrarModalExito(true);
        setTimeout(() => {
          setMostrarModalPassword(false);
          setPasswordModalData({
            passwordActual: '',
            nuevaPassword: '',
            confirmarNuevaPassword: ''
          });
          setMostrarModalExito(false);
        }, 2000);
      } else {
        const errorData = await response.json();
        setErroresModal({
          general: errorData.error || 'Error al cambiar la contraseña'
        });
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setErroresModal({
        general: 'Error de conexión al cambiar contraseña'
      });
    } finally {
      setCargando(false);
    }
  };

  const getTitulo = () => {
    if (modo === 'crear') return 'Agregar Empleado';
    return formData.tipo_usuario === 'jefa' ? 'Editar Jefa/Encargada' : 'Editar Empleada';
  };

  const titulo = getTitulo();
  const textoBoton = modo === 'crear' ? 'Crear Empleado' : 'Guardar Cambios';

  return (
    <div className="formulario-empleado-container">
      <div className="formulario-empleado-card">
        <div className="formulario-header">
          <h1>{titulo}</h1>
          <p>Complete los siguientes campos para {modo === 'crear' ? 'registrar' : 'editar'} un {formData.tipo_usuario === 'jefa' ? 'jefa/encargada' : 'empleada'} en el sistema.</p>
        </div>

        {mensajeExito && (
          <div className="mensaje-exito">
            {mensajeExito}
          </div>
        )}

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
                >
                  <option value="empleada">Empleada</option>
                  <option value="jefa">Jefa/Encargada</option>
                </select>
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

              {modo === 'crear' && (
                <div className="campo-grupo">
                  <label htmlFor="password">Contraseña:</label>
                  <div className="password-input-container">
                    <input
                      type={mostrarPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Ingrese la contraseña"
                      className={errores.password ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="btn-mostrar-password"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                    >
                      {mostrarPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errores.password && <span className="mensaje-error">{errores.password}</span>}
                </div>
              )}
              {modo === 'crear' && (
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

              {modo === 'editar' && (
                <div className="campo-grupo">
                  <button
                    type="button"
                    className="btn-cambiar-password"
                    onClick={handleCambiarPassword}
                  >
                    <FaLock /> Cambiar Contraseña
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="campo-grupo-full">
            <label htmlFor="observaciones">Observaciones:</label>
            <textarea
              id="observaciones"
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows="3"
              placeholder="Información adicional sobre el empleado..."
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

      {/* Modal para cambiar contraseña */}
      {mostrarModalPassword && (
        <div className="modal-overlay">
          <div className="modal-contenedor modal-password">
            <div className="modal-header">
              <h3>Cambiar Contraseña</h3>
            </div>

            {erroresModal.general && (
              <div className="mensaje-error-general">
                {erroresModal.general}
              </div>
            )}

            <form onSubmit={handleSubmitPassword} className="modal-form">
              {/* Contraseña Actual */}
              <div className="campo-grupo">
                <label htmlFor="passwordActual">Contraseña Actual:</label>
                <div className="password-input-container">
                  <input
                    type={mostrarPasswordModal.passwordActual ? "text" : "password"}
                    id="passwordActual"
                    name="passwordActual"
                    value={passwordModalData.passwordActual}
                    onChange={handleChangeModal}
                    placeholder="Ingrese su contraseña actual"
                    className={`campo-input ${erroresModal.passwordActual ? 'error' : ''} ${
                      passwordActualCorrecta ? 'valido' : ''
                    }`}
                  />
                  <button
                    type="button"
                    className="btn-mostrar-password"
                    onClick={() => toggleMostrarPasswordModal('passwordActual')}
                  >
                    {mostrarPasswordModal.passwordActual ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {verificandoPassword && (
                  <div className="mensaje-validacion verificando">
                    Verificando contraseña...
                  </div>
                )}
                {passwordActualCorrecta !== null && !verificandoPassword && (
                  <div className={`mensaje-validacion ${passwordActualCorrecta ? 'valido' : 'error'}`}>
                    {passwordActualCorrecta ? (
                      <><FaCheck /> Contraseña correcta</>
                    ) : (
                      <><FaClose /> Contraseña incorrecta</>
                    )}
                  </div>
                )}
                {erroresModal.passwordActual && <span className="mensaje-error">{erroresModal.passwordActual}</span>}
              </div>

              {/* Nueva Contraseña */}
              <div className="campo-grupo">
                <label htmlFor="nuevaPassword">Nueva Contraseña:</label>
                <div className="password-input-container">
                  <input
                    type={mostrarPasswordModal.nuevaPassword ? "text" : "password"}
                    id="nuevaPassword"
                    name="nuevaPassword"
                    value={passwordModalData.nuevaPassword}
                    onChange={handleChangeModal}
                    placeholder="Ingrese la nueva contraseña"
                    className={`campo-input ${erroresModal.nuevaPassword ? 'error' : ''}`}
                  />
                  <button
                    type="button"
                    className="btn-mostrar-password"
                    onClick={() => toggleMostrarPasswordModal('nuevaPassword')}
                  >
                    {mostrarPasswordModal.nuevaPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                
                {/* Indicadores de seguridad de contraseña */}
                {passwordModalData.nuevaPassword && (
                  <div className="indicadores-seguridad">
                    <div className="indicadores-columnas">
                      <div className="columna-indicadores">
                        <div className="requisito-contraseña">
                          <span className={`indicador ${validacionPassword.longitud ? 'cumplido' : 'incumplido'}`}>
                            {validacionPassword.longitud ? <FaCheck /> : <FaClose />}
                          </span>
                          Mínimo 8 caracteres
                        </div>
                        <div className="requisito-contraseña">
                          <span className={`indicador ${validacionPassword.mayuscula ? 'cumplido' : 'incumplido'}`}>
                            {validacionPassword.mayuscula ? <FaCheck /> : <FaClose />}
                          </span>
                          1 letra mayúscula
                        </div>
                        <div className="requisito-contraseña">
                          <span className={`indicador ${validacionPassword.minuscula ? 'cumplido' : 'incumplido'}`}>
                            {validacionPassword.minuscula ? <FaCheck /> : <FaClose />}
                          </span>
                          1 letra minúscula
                        </div>
                      </div>
                      <div className="columna-indicadores">
                        <div className="requisito-contraseña">
                          <span className={`indicador ${validacionPassword.numero ? 'cumplido' : 'incumplido'}`}>
                            {validacionPassword.numero ? <FaCheck /> : <FaClose />}
                          </span>
                          1 número
                        </div>
                        <div className="requisito-contraseña">
                          <span className={`indicador ${validacionPassword.especial ? 'cumplido' : 'incumplido'}`}>
                            {validacionPassword.especial ? <FaCheck /> : <FaClose />}
                          </span>
                          1 carácter especial
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {erroresModal.nuevaPassword && <span className="mensaje-error">{erroresModal.nuevaPassword}</span>}
              </div>

              {/* Confirmar Nueva Contraseña */}
              <div className="campo-grupo">
                <label htmlFor="confirmarNuevaPassword">Confirmar Nueva Contraseña:</label>
                <div className="password-input-container">
                  <input
                    type={mostrarPasswordModal.confirmarNuevaPassword ? "text" : "password"}
                    id="confirmarNuevaPassword"
                    name="confirmarNuevaPassword"
                    value={passwordModalData.confirmarNuevaPassword}
                    onChange={handleChangeModal}
                    placeholder="Confirme la nueva contraseña"
                    className={`campo-input ${erroresModal.confirmarNuevaPassword ? 'error' : ''} ${
                      coincidePassword ? 'valido' : ''
                    }`}
                  />
                  <button
                    type="button"
                    className="btn-mostrar-password"
                    onClick={() => toggleMostrarPasswordModal('confirmarNuevaPassword')}
                  >
                    {mostrarPasswordModal.confirmarNuevaPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {coincidePassword !== null && (
                  <div className={`mensaje-validacion ${coincidePassword ? 'valido' : 'error'}`}>
                    {coincidePassword ? (
                      <><FaCheck /> Las contraseñas coinciden</>
                    ) : (
                      <><FaClose /> Las contraseñas no coinciden</>
                    )}
                  </div>
                )}
                {erroresModal.confirmarNuevaPassword && <span className="mensaje-error">{erroresModal.confirmarNuevaPassword}</span>}
              </div>

              <div className="modal-acciones">
                <button 
                  type="button" 
                  className="btn-cancelar"
                  onClick={() => setMostrarModalPassword(false)}
                  disabled={cargando}
                >
                  <FaTimes /> Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-guardar"
                  disabled={cargando}
                >
                  {cargando ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <FaLock />
                  )}
                  {cargando ? 'Cambiando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación para cambiar contraseña */}
      <ModalConfirmacion
        mostrar={mostrarConfirmacion}
        tipo="confirmar"
        mensaje="¿Está seguro que desea cambiar la contraseña?"
        onConfirmar={confirmarCambioPassword}
        onCancelar={() => setMostrarConfirmacion(false)}
      />

      {/* Modal de éxito después del cambio de contraseña */}
      <ModalConfirmacion
        mostrar={mostrarModalExito}
        tipo="exito"
        mensaje="¡Contraseña actualizada exitosamente!"
        onConfirmar={() => setMostrarModalExito(false)}
        onCancelar={() => setMostrarModalExito(false)}
      />
    </div>
  );
}

export default FormularioEmpleado;