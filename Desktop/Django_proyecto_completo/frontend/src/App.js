import React, { useState } from "react";
import BarraLateral from "./components/BarraLateral";
import Login from "./components/Login";
import Registro from "./components/Registro";
import "./App.css";

function App() {
  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  return (
    <div className="contenedor-principal">
      {/* Barra lateral siempre visible */}
      <BarraLateral />
      
      {/* Contenido de login/registro */}
      <div className="contenido-derecho">
        {mostrarRegistro ? (
          <Registro onBack={() => setMostrarRegistro(false)} />
        ) : (
          <Login 
            onLogin={() => console.log("Inicio sesión")}
            onRegistro={() => setMostrarRegistro(true)}
          />
        )}
      </div>
    </div>
  );
}

export default App;