import React, { useState } from "react";
import { FaEnvelope, FaLock, FaArrowLeft } from "react-icons/fa";
import "./Login.css";

function Login({ rolSeleccionado, onLoginExitoso, onVolverARol, onIrARegistro }) {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Comentado por el momento
  // const [mostrarRecuperacion, setMostrarRecuperacion] = useState(false);
  // const [emailRecuperacion, setEmailRecuperacion] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const respuesta = await fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      console.log("Status de respuesta:", respuesta.status);

      const datos = await respuesta.json();

      if (respuesta.ok) {
        onLoginExitoso({
          nombre: datos.nombre,
          email: datos.email,
          tipo_usuario: datos.tipo_usuario,
          token: datos.token
        });
      } else {
        setError(datos.error || "Error al iniciar sesión");
      }
    } catch (error) {
      setError(`Error de conexión: ${error.message}. Verifica que la URL sea correcta.`);
      console.error("Error detallado:", error);
    } finally {
      setLoading(false);
    }
  };

  // Comentado por el momento - Funcionalidad de recuperación
  /*
  const handleRecuperarContrasena = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Aquí iría la llamada a tu API para recuperar contraseña
      const respuesta = await fetch("http://127.0.0.1:8000/api/recuperar-contrasena/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailRecuperacion
        }),
      });

      if (respuesta.ok) {
        setError("Se ha enviado un enlace de recuperación a tu correo electrónico.");
        setMostrarRecuperacion(false);
        setEmailRecuperacion("");
      } else {
        setError("Error al enviar el enlace de recuperación. Verifica tu email.");
      }
    } catch (error) {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };
  */

  return (
    <div className="login-page">
      {/* Botón para volver a selección de rol */}
      <button onClick={onVolverARol} className="btn-volver">
        <FaArrowLeft /> Volver a selección de rol
      </button>

      <div className="login-left">
        <h1>florencia</h1>
        <h2>DRUGSTORE</h2>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>Iniciar Sesión - {rolSeleccionado === 'empleado' ? 'Empleado' : 'Dueño'}</h2>
          
          {error && <div className="error-mensaje">{error}</div>}

          {/* Siempre mostrar formulario de login (sin recuperación por ahora) */}
          <form onSubmit={handleSubmit}>
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
                placeholder="Contraseña"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="olvido-contrasena">
              <button 
                type="button" 
                className="link-btn olvido-btn"
                
                // Comentado: onClick={() => setMostrarRecuperacion(true)}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Conectando..." : "Iniciar Sesión"}
            </button>
          </form>

          {/* Comentado: Formulario de recuperación */}
          {/*
          {mostrarRecuperacion ? (
            <form onSubmit={handleRecuperarContrasena}>
              <div className="recuperacion-info">
                <p>Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.</p>
              </div>

              <div className="input-group">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  placeholder="usuario@email.com"
                  value={emailRecuperacion}
                  onChange={(e) => setEmailRecuperacion(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="botones-recuperacion">
                <button 
                  type="button" 
                  className="volver-login-btn"
                  onClick={() => {
                    setMostrarRecuperacion(false);
                    setError("");
                  }}
                  disabled={loading}
                >
                  Volver al Login
                </button>
                <button type="submit" className="enviar-btn" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar Enlace"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* ... formulario de login ... *//*}
            </form>
          )}
          */}

          <div className="registro-link">
            <p>¿No tienes una cuenta?</p>
            <button type="button" onClick={onIrARegistro} className="link-btn">
              Crear cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;