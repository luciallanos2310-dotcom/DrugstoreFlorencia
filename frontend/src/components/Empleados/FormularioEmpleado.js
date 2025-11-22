import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaLock, FaCheck, FaTimes as FaClose, FaEye, FaEyeSlash, FaKey } from 'react-icons/fa';
import ModalConfirmacionUniversal from '../ModalConfirmacionUniversal/ModalConfirmacionUniversal';
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

  // Estados para el modal de contraseña en creación
  const [mostrarModalPasswordCreacion, setMostrarModalPasswordCreacion] = useState(false);
  const [passwordCreacionData, setPasswordCreacionData] = useState({
    password: '',
    confirmarPassword: ''
  });
  const [mostrarPasswordModalCreacion, setMostrarPasswordModalCreacion] = useState({
    password: false,
    confirmarPassword: false
  });

  // Estados para el modal de cambio de contraseña en edición
  const [mostrarModalPasswordEdicion, setMostrarModalPasswordEdicion] = useState(false);
  const [passwordEdicionData, setPasswordEdicionData] = useState({
    passwordActual: '',
    nuevaPassword: '',
    confirmarNuevaPassword: ''
  });
  const [mostrarPasswordModalEdicion, setMostrarPasswordModalEdicion] = useState({
    passwordActual: false,
    nuevaPassword: false,
    confirmarNuevaPassword: false
  });

  const [errores, setErrores] = useState({});
  const [erroresModalCreacion, setErroresModalCreacion] = useState({});
  const [erroresModalEdicion, setErroresModalEdicion] = useState({});
  
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
  
  // Estados para modales
  const [mostrarModalConfirmar, setMostrarModalConfirmar] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [mensajeModal, setMensajeModal] = useState('');
  
  // Estado para el modal de confirmación de guardar empleado
  const [mostrarModalGuardar, setMostrarModalGuardar] = useState(false);
  const [datosParaGuardar, setDatosParaGuardar] = useState(null);

  // Estados para validaciones en tiempo real
  const [validandoCampos, setValidandoCampos] = useState(false);
  const [erroresUnicos, setErroresUnicos] = useState({
    dni: null,
    telefono: null,
    email: null,
    nombreCompleto: null
  });

  // Estado para controlar qué campos se están validando
  const [validandoCampo, setValidandoCampo] = useState({
    dni: false,
    telefono: false,
    email: false,
    nombreCompleto: false
  });

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

  // Función para abrir modal de contraseña en creación
  const abrirModalPasswordCreacion = () => {
    setMostrarModalPasswordCreacion(true);
    setPasswordCreacionData({
      password: formData.password || '',
      confirmarPassword: formData.confirmarPassword || ''
    });
    setErroresModalCreacion({});
    setCoincidePassword(null);
    setValidacionPassword({
      longitud: false,
      mayuscula: false,
      minuscula: false,
      numero: false,
      especial: false
    });
  };

  // Función para guardar contraseña desde el modal de creación
  const guardarPasswordCreacion = () => {
    setFormData(prev => ({
      ...prev,
      password: passwordCreacionData.password,
      confirmarPassword: passwordCreacionData.confirmarPassword
    }));
    setMostrarModalPasswordCreacion(false);
  };

  // Función para abrir modal de cambio de contraseña en edición
  const abrirModalPasswordEdicion = () => {
    setMostrarModalPasswordEdicion(true);
    setPasswordEdicionData({
      passwordActual: '',
      nuevaPassword: '',
      confirmarNuevaPassword: ''
    });
    setErroresModalEdicion({});
    setPasswordActualCorrecta(null);
    setCoincidePassword(null);
    setValidacionPassword({
      longitud: false,
      mayuscula: false,
      minuscula: false,
      numero: false,
      especial: false
    });
  };

  // Resto de las funciones (validarCampoUnico, efectos, etc.) se mantienen igual...
  const validarCampoUnico = async (campo, valor) => {
    if (modo !== 'crear') {
      setErroresUnicos(prev => ({ ...prev, [campo]: null }));
      setValidandoCampo(prev => ({ ...prev, [campo]: false }));
      return;
    }
    
    if (!valor || valor.trim() === '') {
      setErroresUnicos(prev => ({ ...prev, [campo]: null }));
      setValidandoCampo(prev => ({ ...prev, [campo]: false }));
      return;
    }

    setValidandoCampo(prev => ({ ...prev, [campo]: true }));

    try {
      const token = localStorage.getItem('token');
      const parametros = new URLSearchParams();
      
      switch(campo) {
        case 'dni':
          if (valor.length >= 7) {
            parametros.append('dni', valor);
          } else {
            setValidandoCampo(prev => ({ ...prev, [campo]: false }));
            return;
          }
          break;
        case 'telefono':
          if (valor.length >= 6) {
            parametros.append('telefono', valor);
          } else {
            setValidandoCampo(prev => ({ ...prev, [campo]: false }));
            return;
          }
          break;
        case 'email':
          if (valor.includes('@')) {
            parametros.append('email', valor);
          } else {
            setValidandoCampo(prev => ({ ...prev, [campo]: false }));
            return;
          }
          break;
        case 'nombreCompleto':
          if (formData.nombre_emp.length >= 2 && formData.apellido_emp.length >= 2) {
            parametros.append('nombre', formData.nombre_emp);
            parametros.append('apellido', formData.apellido_emp);
          } else {
            setValidandoCampo(prev => ({ ...prev, [campo]: false }));
            return;
          }
          break;
      }

      if (parametros.toString()) {
        const response = await fetch(`/api/empleados/verificar-campos/?${parametros.toString()}`, {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setErroresUnicos(prev => ({
            ...prev,
            [campo]: data.errores?.[campo] || null
          }));
        }
      }
    } catch (error) {
      console.error(`Error validando campo ${campo}:`, error);
    } finally {
      setValidandoCampo(prev => ({ ...prev, [campo]: false }));
    }
  };

  // Efectos separados para cada campo que necesita validación en tiempo real
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validarCampoUnico('dni', formData.dni_emp);
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [formData.dni_emp, modo]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validarCampoUnico('telefono', formData.telefono_emp);
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [formData.telefono_emp, modo]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validarCampoUnico('email', formData.email);
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [formData.email, modo]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.nombre_emp.trim().length >= 2 && formData.apellido_emp.trim().length >= 2) {
        validarCampoUnico('nombreCompleto', `${formData.nombre_emp} ${formData.apellido_emp}`);
      } else {
        setErroresUnicos(prev => ({ ...prev, nombreCompleto: null }));
        setValidandoCampo(prev => ({ ...prev, nombreCompleto: false }));
      }
    }, 800);
    return () => clearTimeout(timeoutId);
  }, [formData.nombre_emp, formData.apellido_emp, modo]);

  // Efecto para validar la contraseña en tiempo real (para modal de creación)
  useEffect(() => {
    const password = modo === 'crear' ? passwordCreacionData.password : passwordEdicionData.nuevaPassword;
    
    if (password) {
      setValidacionPassword({
        longitud: password.length >= 8,
        mayuscula: /[A-Z]/.test(password),
        minuscula: /[a-z]/.test(password),
        numero: /[0-9]/.test(password),
        especial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
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
  }, [passwordCreacionData.password, passwordEdicionData.nuevaPassword, modo]);

  // Efecto para verificar coincidencia de contraseñas
  useEffect(() => {
    if (modo === 'crear') {
      if (passwordCreacionData.confirmarPassword) {
        setCoincidePassword(passwordCreacionData.password === passwordCreacionData.confirmarPassword);
      } else {
        setCoincidePassword(null);
      }
    } else {
      if (passwordEdicionData.confirmarNuevaPassword) {
        setCoincidePassword(passwordEdicionData.nuevaPassword === passwordEdicionData.confirmarNuevaPassword);
      } else {
        setCoincidePassword(null);
      }
    }
  }, [passwordCreacionData.password, passwordCreacionData.confirmarPassword, 
      passwordEdicionData.nuevaPassword, passwordEdicionData.confirmarNuevaPassword, modo]);

  // Efecto para verificar contraseña actual contra la API (solo para edición)
  useEffect(() => {
    const verificarPasswordActual = async () => {
      if (passwordEdicionData.passwordActual && empleado) {
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
              password_actual: passwordEdicionData.passwordActual
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

    const timeoutId = setTimeout(() => {
      if (modo === 'editar') {
        verificarPasswordActual();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [passwordEdicionData.passwordActual, empleado, modo]);

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

    if (name === 'dni_emp' && erroresUnicos.dni) {
      setErroresUnicos(prev => ({ ...prev, dni: null }));
    }
    if (name === 'telefono_emp' && erroresUnicos.telefono) {
      setErroresUnicos(prev => ({ ...prev, telefono: null }));
    }
    if (name === 'email' && erroresUnicos.email) {
      setErroresUnicos(prev => ({ ...prev, email: null }));
    }
    if ((name === 'nombre_emp' || name === 'apellido_emp') && erroresUnicos.nombreCompleto) {
      setErroresUnicos(prev => ({ ...prev, nombreCompleto: null }));
    }
  };

  const handleChangeModalCreacion = (e) => {
    const { name, value } = e.target;
    setPasswordCreacionData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (erroresModalCreacion[name]) {
      setErroresModalCreacion(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleChangeModalEdicion = (e) => {
    const { name, value } = e.target;
    setPasswordEdicionData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (erroresModalEdicion[name]) {
      setErroresModalEdicion(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const toggleMostrarPasswordModalCreacion = (campo) => {
    setMostrarPasswordModalCreacion(prev => ({
      ...prev,
      [campo]: !prev[campo]
    }));
  };

  const toggleMostrarPasswordModalEdicion = (campo) => {
    setMostrarPasswordModalEdicion(prev => ({
      ...prev,
      [campo]: !prev[campo]
    }));
  };

  const verificarCamposUnicos = async () => {
    if (modo !== 'crear') {
      console.log('🔍 Modo edición - omitiendo validación de campos únicos');
      return {};
    }

    try {
      const token = localStorage.getItem('token');
      const parametros = new URLSearchParams();
      
      if (formData.dni_emp) parametros.append('dni', formData.dni_emp);
      if (formData.telefono_emp) parametros.append('telefono', formData.telefono_emp);
      if (formData.email) parametros.append('email', formData.email);
      
      if (formData.nombre_emp.trim() && formData.apellido_emp.trim()) {
        parametros.append('nombre', formData.nombre_emp.trim());
        parametros.append('apellido', formData.apellido_emp.trim());
      }

      console.log('🔍 Verificando campos únicos con parámetros:', parametros.toString());

      const response = await fetch(`/api/empleados/verificar-campos/?${parametros.toString()}`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Resultado validación campos únicos:', data);
        return data.errores || {};
      } else {
        console.error('Error en respuesta de validación:', response.status);
        return {};
      }
    } catch (error) {
      console.error('Error verificando campos únicos:', error);
      return {};
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.nombre_emp.trim()) nuevosErrores.nombre_emp = 'El nombre es requerido';
    if (!formData.apellido_emp.trim()) nuevosErrores.apellido_emp = 'El apellido es requerido';
    
    if (!formData.dni_emp) {
      nuevosErrores.dni_emp = 'El DNI es requerido';
    } else if (isNaN(formData.dni_emp) || parseInt(formData.dni_emp) <= 0) {
      nuevosErrores.dni_emp = 'El DNI debe ser un número válido';
    } else if (formData.dni_emp.length < 7 || formData.dni_emp.length > 8) {
      nuevosErrores.dni_emp = 'El DNI debe tener entre 7 y 8 dígitos';
    }

    if (!formData.telefono_emp.trim()) {
      nuevosErrores.telefono_emp = 'El teléfono es requerido';
    } else if (!/^[\d\s+\-()]+$/.test(formData.telefono_emp)) {
      nuevosErrores.telefono_emp = 'El teléfono debe contener solo números y caracteres válidos';
    }

    if (!formData.domicilio_emp.trim()) nuevosErrores.domicilio_emp = 'La dirección es requerida';
    
    if (!formData.email.trim()) nuevosErrores.email = 'El email es requerido';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) nuevosErrores.email = 'El email no es válido';
    
    // En creación, la contraseña es opcional (puede configurarse desde el modal)
    // No se valida aquí porque es opcional

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const validarModalPasswordCreacion = () => {
    const nuevosErrores = {};

    if (!passwordCreacionData.password) {
      nuevosErrores.password = 'La contraseña es requerida';
    } else {
      const todasCumplidas = Object.values(validacionPassword).every(v => v);
      if (!todasCumplidas) {
        nuevosErrores.password = 'La contraseña no cumple con todos los requisitos de seguridad';
      }
    }
    
    if (!passwordCreacionData.confirmarPassword) {
      nuevosErrores.confirmarPassword = 'Debe confirmar la contraseña';
    } else if (!coincidePassword) {
      nuevosErrores.confirmarPassword = 'Las contraseñas no coinciden';
    }

    setErroresModalCreacion(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const validarModalPasswordEdicion = () => {
    const nuevosErrores = {};

    if (!passwordEdicionData.passwordActual) {
      nuevosErrores.passwordActual = 'La contraseña actual es requerida';
    } else if (!passwordActualCorrecta) {
      nuevosErrores.passwordActual = 'La contraseña actual es incorrecta';
    }

    if (!passwordEdicionData.nuevaPassword) {
      nuevosErrores.nuevaPassword = 'La nueva contraseña es requerida';
    } else {
      const todasCumplidas = Object.values(validacionPassword).every(v => v);
      if (!todasCumplidas) {
        nuevosErrores.nuevaPassword = 'La contraseña no cumple con todos los requisitos de seguridad';
      }
    }
    
    if (!passwordEdicionData.confirmarNuevaPassword) {
      nuevosErrores.confirmarNuevaPassword = 'Debe confirmar la nueva contraseña';
    } else if (!coincidePassword) {
      nuevosErrores.confirmarNuevaPassword = 'Las contraseñas no coinciden';
    }

    setErroresModalEdicion(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔍 Iniciando validación del formulario...');
    console.log('📝 Modo:', modo);
    
    if (!validarFormulario()) {
      console.log('❌ Validación básica falló');
      return;
    }

    console.log('✅ Validación básica exitosa');

    if (modo === 'crear') {
      console.log('🔍 Verificando campos únicos...');
      setCargando(true);
      try {
        const erroresUnicos = await verificarCamposUnicos();
        console.log('📋 Errores únicos encontrados:', erroresUnicos);
        
        if (Object.keys(erroresUnicos).length > 0) {
          setErroresUnicos(erroresUnicos);
          setCargando(false);
          
          const primerError = Object.values(erroresUnicos)[0];
          setMensajeModal(`❌ ${primerError}`);
          setMostrarModalError(true);
          return;
        }
      } catch (error) {
        console.error('Error validando campos únicos:', error);
        setMensajeModal('Error al validar los datos. Intente nuevamente.');
        setMostrarModalError(true);
        setCargando(false);
        return;
      } finally {
        setCargando(false);
      }
    }
    
    const datosParaEnviar = { ...formData };
    if (modo === 'editar') {
      delete datosParaEnviar.password;
      delete datosParaEnviar.confirmarPassword;
    }
    
    setDatosParaGuardar(datosParaEnviar);
    setMensajeModal(
      modo === 'crear' 
        ? `¿Está seguro que desea crear el empleado ${formData.nombre_emp} ${formData.apellido_emp}?`
        : `¿Está seguro que desea actualizar los datos del empleado ${formData.nombre_emp} ${formData.apellido_emp}?`
    );
    setMostrarModalGuardar(true);
  };

  const confirmarGuardarEmpleado = () => {
    setMostrarModalGuardar(false);
    console.log('📤 Enviando datos al componente padre:', datosParaGuardar);
    onGuardar(datosParaGuardar);
  };

  const handleSubmitPasswordCreacion = (e) => {
    e.preventDefault();
    
    if (validarModalPasswordCreacion()) {
      guardarPasswordCreacion();
    }
  };

  const handleSubmitPasswordEdicion = async (e) => {
    e.preventDefault();
    
    if (validarModalPasswordEdicion()) {
      setMostrarModalConfirmar(true);
    }
  };

  const confirmarCambioPassword = async () => {
    setCargando(true);
    setMostrarModalConfirmar(false);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/cambiar-password/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          empleado_id: empleado.id,
          password_actual: passwordEdicionData.passwordActual,
          nueva_password: passwordEdicionData.nuevaPassword
        })
      });

      if (response.ok) {
        setMensajeModal('¡Contraseña actualizada exitosamente!');
        setMostrarModalExito(true);
        setTimeout(() => {
          setMostrarModalPasswordEdicion(false);
          setPasswordEdicionData({
            passwordActual: '',
            nuevaPassword: '',
            confirmarNuevaPassword: ''
          });
        }, 2000);
      } else {
        const errorData = await response.json();
        setMensajeModal(errorData.error || 'Error al cambiar la contraseña');
        setMostrarModalError(true);
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setMensajeModal('Error de conexión al cambiar contraseña');
      setMostrarModalError(true);
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

  const tieneErroresUnicos = modo === 'crear' && Object.values(erroresUnicos).some(error => error !== null);

  const renderEstadoValidacion = (campo) => {
    if (validandoCampo[campo]) {
      return <span className="mensaje-validando">🔍 Verificando...</span>;
    }
    
    if (erroresUnicos[campo]) {
      return <span className="mensaje-error-unico">❌ {erroresUnicos[campo]}</span>;
    }
    
    return null;
  };

  return (
    <div className="formulario-empleado-container">
      <div className="formulario-empleado-card">
        <div className="formulario-header">
          <h1>{titulo}</h1>
          <p>Complete los siguientes campos para {modo === 'crear' ? 'registrar' : 'editar'} un {formData.tipo_usuario === 'jefa' ? 'jefa/encargada' : 'empleada'} en el sistema.</p>
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
                  className={errores.nombre_emp || erroresUnicos.nombreCompleto ? 'error' : ''}
                />
                {errores.nombre_emp && <span className="mensaje-error">{errores.nombre_emp}</span>}
                {renderEstadoValidacion('nombreCompleto')}
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
                  className={errores.dni_emp || erroresUnicos.dni ? 'error' : ''}
                />
                {errores.dni_emp && <span className="mensaje-error">{errores.dni_emp}</span>}
                {renderEstadoValidacion('dni')}
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
                  className={errores.apellido_emp || erroresUnicos.nombreCompleto ? 'error' : ''}
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
                  className={errores.telefono_emp || erroresUnicos.telefono ? 'error' : ''}
                />
                {errores.telefono_emp && <span className="mensaje-error">{errores.telefono_emp}</span>}
                {renderEstadoValidacion('telefono')}
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
                  className={errores.email || erroresUnicos.email ? 'error' : ''}
                />
                {errores.email && <span className="mensaje-error">{errores.email}</span>}
                {renderEstadoValidacion('email')}
              </div>

              {/* Botón para abrir modal de contraseña en creación */}
              {modo === 'crear' && (
                <div className="campo-grupo">
                  <button
                    type="button"
                    className="btn-cambiar-password"
                    onClick={abrirModalPasswordCreacion}
                  >
                    <FaKey /> {formData.password ? 'Contraseña Configurada' : 'Configurar Contraseña'}
                  </button>
                  {formData.password && (
                    <span className="mensaje-exito" style={{fontSize: '12px', display: 'block', marginTop: '5px'}}>
                      ✅ Contraseña configurada
                    </span>
                  )}
                </div>
              )}

              {/* Botón para abrir modal de cambio de contraseña en edición */}
              {modo === 'editar' && (
                <div className="campo-grupo">
                  <button
                    type="button"
                    className="btn-cambiar-password"
                    onClick={abrirModalPasswordEdicion}
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
            <button 
              type="submit" 
              className="btn-guardar"
              disabled={validandoCampos || cargando || tieneErroresUnicos}
            >
              {validandoCampos ? (
                <>
                  <div className="loading-spinner"></div>
                  Validando...
                </>
              ) : cargando ? (
                <>
                  <div className="loading-spinner"></div>
                  Procesando...
                </>
              ) : (
                <>
                  <FaSave /> {textoBoton}
                </>
              )}
            </button>
          </div>

          {modo === 'crear' && tieneErroresUnicos && (
            <div className="advertencia-campos-unicos">
              ⚠️ Existen campos duplicados. Por favor, corrija los errores marcados en rojo antes de continuar.
            </div>
          )}
        </form>
      </div>
      
      {/* Modal de configuración de contraseña (para creación) */}
      {mostrarModalPasswordCreacion && (
        <div className="modal-overlay">
          <div className="modal-contenedor modal-password">
            <div className="modal-header">
              <h3>Configurar Contraseña</h3>
              <button 
                className="btn-cerrar-modal"
                onClick={() => setMostrarModalPasswordCreacion(false)}
              >
                <FaClose />
              </button>
            </div>
            
            <form onSubmit={handleSubmitPasswordCreacion} className="modal-body">
              <div className="campo-grupo">
                <label htmlFor="password">Contraseña:</label>
                <div className="password-input-container">
                  <input
                    type={mostrarPasswordModalCreacion.password ? "text" : "password"}
                    id="password"
                    name="password"
                    value={passwordCreacionData.password}
                    onChange={handleChangeModalCreacion}
                    placeholder="Ingrese la contraseña"
                    className={erroresModalCreacion.password ? 'error' : ''}
                  />
                  <button
                    type="button"
                    className="btn-mostrar-password"
                    onClick={() => toggleMostrarPasswordModalCreacion('password')}
                  >
                    {mostrarPasswordModalCreacion.password ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {erroresModalCreacion.password && (
                  <span className="mensaje-error">{erroresModalCreacion.password}</span>
                )}
                
                {/* Indicadores de validación de contraseña */}
                {passwordCreacionData.password && (
                  <div className="indicadores-password">
                    <div className={`indicador ${validacionPassword.longitud ? 'valido' : 'invalido'}`}>
                      {validacionPassword.longitud ? <FaCheck /> : <FaClose />}
                      Mínimo 8 caracteres
                    </div>
                    <div className={`indicador ${validacionPassword.mayuscula ? 'valido' : 'invalido'}`}>
                      {validacionPassword.mayuscula ? <FaCheck /> : <FaClose />}
                      Una mayúscula
                    </div>
                    <div className={`indicador ${validacionPassword.minuscula ? 'valido' : 'invalido'}`}>
                      {validacionPassword.minuscula ? <FaCheck /> : <FaClose />}
                      Una minúscula
                    </div>
                    <div className={`indicador ${validacionPassword.numero ? 'valido' : 'invalido'}`}>
                      {validacionPassword.numero ? <FaCheck /> : <FaClose />}
                      Un número
                    </div>
                    <div className={`indicador ${validacionPassword.especial ? 'valido' : 'invalido'}`}>
                      {validacionPassword.especial ? <FaCheck /> : <FaClose />}
                      Un carácter especial
                    </div>
                  </div>
                )}
              </div>

              <div className="campo-grupo">
                <label htmlFor="confirmarPassword">Confirmar Contraseña:</label>
                <div className="password-input-container">
                  <input
                    type={mostrarPasswordModalCreacion.confirmarPassword ? "text" : "password"}
                    id="confirmarPassword"
                    name="confirmarPassword"
                    value={passwordCreacionData.confirmarPassword}
                    onChange={handleChangeModalCreacion}
                    placeholder="Confirme la contraseña"
                    className={erroresModalCreacion.confirmarPassword ? 'error' : ''}
                  />
                  <button
                    type="button"
                    className="btn-mostrar-password"
                    onClick={() => toggleMostrarPasswordModalCreacion('confirmarPassword')}
                  >
                    {mostrarPasswordModalCreacion.confirmarPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {erroresModalCreacion.confirmarPassword && (
                  <span className="mensaje-error">{erroresModalCreacion.confirmarPassword}</span>
                )}
                {passwordCreacionData.confirmarPassword && coincidePassword !== null && (
                  <span className={coincidePassword ? 'mensaje-exito' : 'mensaje-error'}>
                    {coincidePassword ? '✅ Las contraseñas coinciden' : '❌ Las contraseñas no coinciden'}
                  </span>
                )}
              </div>
            </form>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-cancelar"
                onClick={() => setMostrarModalPasswordCreacion(false)}
              >
                <FaTimes /> Cancelar
              </button>
              <button 
                type="button" 
                className="btn-guardar"
                onClick={handleSubmitPasswordCreacion}
              >
                <FaSave /> Guardar Contraseña
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cambio de contraseña (para edición) */}
      {mostrarModalPasswordEdicion && (
        <div className="modal-overlay">
          <div className="modal-contenedor modal-password">
            <div className="modal-header">
              <h3>Cambiar Contraseña</h3>
              <button 
                className="btn-cerrar-modal"
                onClick={() => setMostrarModalPasswordEdicion(false)}
              >
                <FaClose />
              </button>
            </div>
            
            <form onSubmit={handleSubmitPasswordEdicion} className="modal-body">
              <div className="campo-grupo">
                <label htmlFor="passwordActual">Contraseña Actual:</label>
                <div className="password-input-container">
                  <input
                    type={mostrarPasswordModalEdicion.passwordActual ? "text" : "password"}
                    id="passwordActual"
                    name="passwordActual"
                    value={passwordEdicionData.passwordActual}
                    onChange={handleChangeModalEdicion}
                    placeholder="Ingrese su contraseña actual"
                    className={erroresModalEdicion.passwordActual ? 'error' : ''}
                  />
                  <button
                    type="button"
                    className="btn-mostrar-password"
                    onClick={() => toggleMostrarPasswordModalEdicion('passwordActual')}
                  >
                    {mostrarPasswordModalEdicion.passwordActual ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {erroresModalEdicion.passwordActual && (
                  <span className="mensaje-error">{erroresModalEdicion.passwordActual}</span>
                )}
                {passwordEdicionData.passwordActual && passwordActualCorrecta !== null && (
                  <span className={passwordActualCorrecta ? 'mensaje-exito' : 'mensaje-error'}>
                    {passwordActualCorrecta ? '✅ Contraseña correcta' : '❌ Contraseña incorrecta'}
                  </span>
                )}
              </div>

              <div className="campo-grupo">
                <label htmlFor="nuevaPassword">Nueva Contraseña:</label>
                <div className="password-input-container">
                  <input
                    type={mostrarPasswordModalEdicion.nuevaPassword ? "text" : "password"}
                    id="nuevaPassword"
                    name="nuevaPassword"
                    value={passwordEdicionData.nuevaPassword}
                    onChange={handleChangeModalEdicion}
                    placeholder="Ingrese la nueva contraseña"
                    className={erroresModalEdicion.nuevaPassword ? 'error' : ''}
                  />
                  <button
                    type="button"
                    className="btn-mostrar-password"
                    onClick={() => toggleMostrarPasswordModalEdicion('nuevaPassword')}
                  >
                    {mostrarPasswordModalEdicion.nuevaPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {erroresModalEdicion.nuevaPassword && (
                  <span className="mensaje-error">{erroresModalEdicion.nuevaPassword}</span>
                )}
                
                {/* Indicadores de validación de contraseña */}
                {passwordEdicionData.nuevaPassword && (
                  <div className="indicadores-password">
                    <div className={`indicador ${validacionPassword.longitud ? 'valido' : 'invalido'}`}>
                      {validacionPassword.longitud ? <FaCheck /> : <FaClose />}
                      Mínimo 8 caracteres
                    </div>
                    <div className={`indicador ${validacionPassword.mayuscula ? 'valido' : 'invalido'}`}>
                      {validacionPassword.mayuscula ? <FaCheck /> : <FaClose />}
                      Una mayúscula
                    </div>
                    <div className={`indicador ${validacionPassword.minuscula ? 'valido' : 'invalido'}`}>
                      {validacionPassword.minuscula ? <FaCheck /> : <FaClose />}
                      Una minúscula
                    </div>
                    <div className={`indicador ${validacionPassword.numero ? 'valido' : 'invalido'}`}>
                      {validacionPassword.numero ? <FaCheck /> : <FaClose />}
                      Un número
                    </div>
                    <div className={`indicador ${validacionPassword.especial ? 'valido' : 'invalido'}`}>
                      {validacionPassword.especial ? <FaCheck /> : <FaClose />}
                      Un carácter especial
                    </div>
                  </div>
                )}
              </div>

              <div className="campo-grupo">
                <label htmlFor="confirmarNuevaPassword">Confirmar Nueva Contraseña:</label>
                <div className="password-input-container">
                  <input
                    type={mostrarPasswordModalEdicion.confirmarNuevaPassword ? "text" : "password"}
                    id="confirmarNuevaPassword"
                    name="confirmarNuevaPassword"
                    value={passwordEdicionData.confirmarNuevaPassword}
                    onChange={handleChangeModalEdicion}
                    placeholder="Confirme la nueva contraseña"
                    className={erroresModalEdicion.confirmarNuevaPassword ? 'error' : ''}
                  />
                  <button
                    type="button"
                    className="btn-mostrar-password"
                    onClick={() => toggleMostrarPasswordModalEdicion('confirmarNuevaPassword')}
                  >
                    {mostrarPasswordModalEdicion.confirmarNuevaPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {erroresModalEdicion.confirmarNuevaPassword && (
                  <span className="mensaje-error">{erroresModalEdicion.confirmarNuevaPassword}</span>
                )}
                {passwordEdicionData.confirmarNuevaPassword && coincidePassword !== null && (
                  <span className={coincidePassword ? 'mensaje-exito' : 'mensaje-error'}>
                    {coincidePassword ? '✅ Las contraseñas coinciden' : '❌ Las contraseñas no coinciden'}
                  </span>
                )}
              </div>
            </form>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-cancelar"
                onClick={() => setMostrarModalPasswordEdicion(false)}
              >
                <FaTimes /> Cancelar
              </button>
              <button 
                type="button" 
                className="btn-guardar"
                onClick={handleSubmitPasswordEdicion}
                disabled={cargando}
              >
                {cargando ? (
                  <>
                    <div className="loading-spinner"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <FaSave /> Cambiar Contraseña
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalConfirmacionUniversal
        mostrar={mostrarModalGuardar}
        tipo="confirmar"
        mensaje={mensajeModal}
        onConfirmar={confirmarGuardarEmpleado}
        onCancelar={() => setMostrarModalGuardar(false)}
        datosAdicionales={formData}
        mostrarResumen={true}
        modo="empleado"
      />

      <ModalConfirmacionUniversal
        mostrar={mostrarModalConfirmar}
        tipo="confirmar"
        mensaje="¿Está seguro que desea cambiar la contraseña?"
        onConfirmar={confirmarCambioPassword}
        onCancelar={() => setMostrarModalConfirmar(false)}
        modo="empleado"
      />

      <ModalConfirmacionUniversal
        mostrar={mostrarModalExito}
        tipo="exito"
        mensaje={mensajeModal}
        onConfirmar={() => setMostrarModalExito(false)}
        onCancelar={() => setMostrarModalExito(false)}
        modo="empleado"
      />

      <ModalConfirmacionUniversal
        mostrar={mostrarModalError}
        tipo="error"
        mensaje={mensajeModal}
        onConfirmar={() => setMostrarModalError(false)}
        onCancelar={() => setMostrarModalError(false)}
        modo="empleado"
      />
    </div>
  );
}

export default FormularioEmpleado;