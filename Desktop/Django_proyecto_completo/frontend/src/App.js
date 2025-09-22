// App.js
import React, { useState } from "react";
import Login from "./components/Login";
import Registro from "./components/Registro";
import "./App.css";

function App() {
  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  return (
    <div>
      {mostrarRegistro ? (
        <Registro onBack={() => setMostrarRegistro(false)} />
      ) : (
        <Login 
          onLogin={() => console.log("Inicio sesión")} 
          onRegistro={() => setMostrarRegistro(true)} 
        />
      )}
    </div>
  );
}

export default App;