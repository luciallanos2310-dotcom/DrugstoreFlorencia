import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaArrowLeft } from "react-icons/fa";
import "./Login.css";

function Login({ onLoginExitoso }) {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleVolverABienvenida = () => {
    navigate('/bienvenida');
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

      const datos = await respuesta.json();

      if (respuesta.ok) {
        console.log('🔑 Datos de login recibidos:', datos); // AGREGAR ESTE CONSOLE.LOG
        
        localStorage.setItem('token', datos.token);
        const usuario = {
          nombre: datos.nombre,
          email: datos.email,
          tipo_usuario: datos.tipo_usuario,
          token: datos.token,
          empleado_id: datos.empleado_id // ✅ Asegurar que esto viene
        };
        localStorage.setItem('user', JSON.stringify(usuario));
        onLoginExitoso(usuario);
        navigate('/dashboard');
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

  return (
    <div className="login-page">
      <button onClick={handleVolverABienvenida} className="btn-volver">
        <FaArrowLeft /> Volver al Inicio
      </button>

      <div className="login-left">
        <h1>florencia</h1>
        <h2>DRUGSTORE</h2>
      </div>

      <div className="login-right">
        <div className="login-card">
          <h2>Iniciar Sesión</h2>
          
          {error && <div className="error-mensaje">{error}</div>}

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
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Conectando..." : "Iniciar Sesión"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;