import React, { useState } from "react";
import SeleccionRol from "./components/SeleccionRol";
import Login from "./components/Login";
import Registro from "./components/Registro";
import Dashboard from "./components/Dashboard";
import "./App.css";

function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);
  const [vistaActual, setVistaActual] = useState("seleccion-rol");
  const [rolSeleccionado, setRolSeleccionado] = useState(null);

  const handleSeleccionRol = (rol) => {
    setRolSeleccionado(rol);
    setVistaActual("login");
  };

  const handleLoginExitoso = (usuario) => {
    setUsuarioLogueado(usuario);
    setVistaActual("dashboard");
  };

  const handleVolverASeleccionRol = () => {
    setRolSeleccionado(null);
    setVistaActual("seleccion-rol");
  };

  const handleCerrarSesion = () => {
    setUsuarioLogueado(null);
    setRolSeleccionado(null);
    setVistaActual("seleccion-rol");
    localStorage.removeItem("token");
  };

  return (
    <div className="App">
      {vistaActual === "dashboard" && usuarioLogueado ? (
        <Dashboard usuario={usuarioLogueado} onCerrarSesion={handleCerrarSesion} />
      ) : (
        <>
          {vistaActual === "seleccion-rol" && (
            <SeleccionRol onSeleccionRol={handleSeleccionRol} />
          )}

          {vistaActual === "login" && (
            <Login
              rolSeleccionado={rolSeleccionado}
              onLoginExitoso={handleLoginExitoso}
              onVolverARol={handleVolverASeleccionRol}
              onIrARegistro={() => setVistaActual("registro")}
            />
          )}

          {vistaActual === "registro" && (
            <Registro
              rolSeleccionado={rolSeleccionado}
              onBack={handleVolverASeleccionRol}
              onVolver={() => setVistaActual("login")}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
