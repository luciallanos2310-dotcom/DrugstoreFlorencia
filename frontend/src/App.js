import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Bienvenida from './components/Bienvenida/Bienvenida';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import './App.css';

function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    // ✅ SOLUCIÓN: Verificar autenticación pero NO redirigir automáticamente
    if (token && userData) {
      try {
        const usuario = JSON.parse(userData);
        // Solo establecer el usuario si los datos son válidos
        if (usuario && usuario.token && usuario.nombre) {
          setUsuarioLogueado(usuario);
        } else {
          // Datos inválidos, limpiar
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setCargando(false);
  }, []);

  const handleLoginExitoso = (usuario) => {
    setUsuarioLogueado(usuario);
    localStorage.setItem('token', usuario.token);
    localStorage.setItem('user', JSON.stringify(usuario));
  };

  const handleCerrarSesion = () => {
    setUsuarioLogueado(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // Mostrar loading mientras verifica
  if (cargando) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            animation: 'spin 2s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p>Cargando aplicación...</p>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* ✅ CORREGIDO: Bienvenida siempre accesible */}
          <Route path="/bienvenida" element={<Bienvenida />} />
          
          {/* ✅ CORREGIDO: Login siempre accesible */}
          <Route 
            path="/login" 
            element={
              <Login onLoginExitoso={handleLoginExitoso} />
            } 
          />

          {/* ✅ CORREGIDO: Ruta por defecto SIEMPRE va a bienvenida */}
          <Route path="/" element={<Navigate to="/bienvenida" replace />} />

          {/* ✅ CORREGIDO: Dashboard SOLO accesible si está logueado */}
          <Route 
            path="/dashboard/*" 
            element={
              usuarioLogueado ? 
                <Dashboard 
                  usuario={usuarioLogueado}
                  onCerrarSesion={handleCerrarSesion}
                /> : 
                <Navigate to="/login" replace />
            } 
          />

          {/* Ruta para páginas no encontradas */}
          <Route path="*" element={<Navigate to="/bienvenida" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;