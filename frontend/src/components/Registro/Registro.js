import React, { useState } from "react";
import { FaUser, FaUsers, FaIdCard, FaPhone, FaHome, FaEnvelope, FaLock, FaArrowLeft, FaUserTie, FaUserShield } from "react-icons/fa";
import Confirmacion from "../Confirmacion/Confirmacion";
import "./Registro.css";

function Registro({ onVolverABienvenida, onVolverALogin }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    phone: "",
    address: "",
    email: "",
    password: "",
    confirmPassword: "",
    tipo_usuario: "empleado" // Valor por defecto
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cuentaCreada, setCuentaCreada] = useState(false);
  const [pasoActual, setPasoActual] = useState(1);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validarPaso1 = () => {
    if (!formData.firstName.trim()) {
      setError("El nombre es obligatorio");
      return false;
    }
    if (!formData.lastName.trim()) {
      setError("El apellido es obligatorio");
      return false;
    }
    if (!formData.dni.trim()) {
      setError("El DNI es obligatorio");
      return false;
    }
    if (!formData.phone.trim()) {
      setError("El teléfono es obligatorio");
      return false;
    }
    
    if (formData.phone.length > 60) {
      setError("El número de teléfono no puede tener más de 60 caracteres");
      return false;
    }
    
    if (!formData.address.trim()) {
      setError("La dirección es obligatoria");
      return false;
    }
    return true;
  };

  const validarPaso2 = () => {
    if (!formData.email.trim()) {
      setError("El email es obligatorio");
      return false;
    }
    if (!formData.password) {
      setError("La contraseña es obligatoria");
      return false;
    }
    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return false;
    }
    return true;
  };

  const manejarSiguiente = () => {
    setError("");
    if (validarPaso1()) {
      setPasoActual(2);
    }
  };

  const manejarAtras = () => {
    setPasoActual(1);
    setError("");
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!validarPaso2()) {
      setLoading(false);
      return;
    }

    try {
      const respuesta = await fetch("http://127.0.0.1:8000/api/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          dni: formData.dni,
          phone: formData.phone,
          address: formData.address,
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirmPassword,
          tipo_usuario: formData.tipo_usuario
    }),
      });

      const datos = await respuesta.json();

      if (respuesta.ok) {
        setCuentaCreada(true);
      } else {
        setError(datos.error || "Error al registrar usuario");
      }
    } catch (error) {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const manejarContinuar = () => {
    setCuentaCreada(false);
    onVolverALogin();
  };

  if (cuentaCreada) {
    return <Confirmacion 
      email={formData.email} 
      nombre={`${formData.firstName} ${formData.lastName}`}
      rol={formData.tipo_usuario}
      onContinuar={manejarContinuar} 
    />;
  }

  return (
    <div className="registro-page">
      <button type="button" onClick={onVolverABienvenida} className="btn-volver">
        <FaArrowLeft /> Volver al Dashboard
      </button>

      <div className="registro-left">
        <h1>florencia</h1>
        <h2>DRUGSTORE</h2>
        <div className="progreso-pasos">
          <div className={`paso ${pasoActual >= 1 ? 'activo' : ''}`}>
            <span>1</span>
            <p>Información Personal</p>
          </div>
          <div className={`paso ${pasoActual >= 2 ? 'activo' : ''}`}>
            <span>2</span>
            <p>Credenciales y Rol</p>
          </div>
        </div>
      </div>

      <div className="registro-right">
        <div className="registro-card">          
          <h2>Crear Nuevo Usuario {pasoActual === 1 ? "(Paso 1/2)" : "(Paso 2/2)"}</h2>

          {error && <div className="error-mensaje">{error}</div>}

          <form onSubmit={pasoActual === 2 ? manejarEnvio : (e) => e.preventDefault()}>
            {pasoActual === 1 && (
              <div className="paso-contenido">
                <div className="input-group">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Nombre"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="input-group">
                  <FaUsers className="input-icon" />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Apellido"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="input-group">
                  <FaIdCard className="input-icon" />
                  <input
                    type="text"
                    name="dni"
                    placeholder="DNI"
                    value={formData.dni}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="input-group">
                  <FaPhone className="input-icon" />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Número de teléfono"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="input-group">
                  <FaHome className="input-icon" />
                  <input
                    type="text"
                    name="address"
                    placeholder="Dirección"
                    value={formData.address}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="botones-paso">
                  <button type="button" onClick={onVolverABienvenida} className="volver-btn">
                    Cancelar
                  </button>
                  <button type="button" onClick={manejarSiguiente} className="siguiente-btn">
                    Siguiente
                  </button>
                </div>
              </div>
            )}

            {pasoActual === 2 && (
              <div className="paso-contenido">
                <div className="input-group">
                  <FaEnvelope className="input-icon" />
                  <input
                    type="email"
                    name="email"
                    placeholder="usuario@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="input-group">
                  <FaLock className="input-icon" />
                  <input
                    type="password"
                    name="password"
                    placeholder="Crea una contraseña segura (mín. 6 caracteres)"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="input-group">
                  <FaLock className="input-icon" />
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Repite tu contraseña"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                {/* Selector de tipo de usuario */}
                <div className="input-group">
                  <label>Tipo de Usuario:</label>
                  <div className="rol-options">
                    <label className="rol-option">
                      <input
                        type="radio"
                        name="tipo_usuario"
                        value="empleado"
                        checked={formData.tipo_usuario === "empleado"}
                        onChange={handleChange}
                      />
                      <FaUserTie className="rol-icon" />
                      <span>Empleado</span>
                    </label>
                    <label className="rol-option">
                      <input
                        type="radio"
                        name="tipo_usuario"
                        value="administrador"
                        checked={formData.tipo_usuario === "administrador"}
                        onChange={handleChange}
                      />
                      <FaUserShield className="rol-icon" />
                      <span>Administrador</span>
                    </label>
                  </div>
                </div>

                <div className="resumen-info">
                  <h4>Resumen del nuevo usuario:</h4>
                  <p><strong>Nombre:</strong> {formData.firstName} {formData.lastName}</p>
                  <p><strong>DNI:</strong> {formData.dni}</p>
                  <p><strong>Rol:</strong> {formData.tipo_usuario === 'empleado' ? 'Empleado' : 'Administrador'}</p>
                </div>

                <div className="botones-paso">
                  <button type="button" onClick={manejarAtras} className="volver-btn">
                    Atrás
                  </button>
                  <button type="submit" className="registro-btn" disabled={loading}>
                    {loading ? "Creando usuario..." : "Crear Usuario"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default Registro;