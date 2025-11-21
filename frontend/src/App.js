// src/App.js
import React, { useState } from 'react';
import Bienvenida from './components/Bienvenida/Bienvenida';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import './App.css';

function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);
  const [vistaActual, setVistaActual] = useState('bienvenida');

  const handleIniciarSesion = () => setVistaActual('login');

  const handleLoginExitoso = (usuario) => {
    setUsuarioLogueado(usuario);
    setVistaActual('dashboard');
    localStorage.setItem('token', usuario.token);
  };

  const handleVolverABienvenida = () => setVistaActual('bienvenida');

  const handleCerrarSesion = () => {
    setUsuarioLogueado(null);
    setVistaActual('bienvenida');
    localStorage.removeItem('token');
  };

  return (
    <div className="App">
      {/* Si está logueado, muestra el dashboard */}
      {vistaActual === 'dashboard' && usuarioLogueado && (
        <Dashboard
          usuario={usuarioLogueado}
          onCerrarSesion={handleCerrarSesion}
        />
      )}

      {/* Si no está logueado */}
      {!usuarioLogueado && (
        <>
          {vistaActual === 'bienvenida' && (
            <Bienvenida onIniciarSesion={handleIniciarSesion} />
          )}
          {vistaActual === 'login' && (
            <Login
              onLoginExitoso={handleLoginExitoso}
              onVolverABienvenida={handleVolverABienvenida}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
