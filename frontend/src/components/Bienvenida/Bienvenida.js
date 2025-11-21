import React from "react";
import "./Bienvenida.css";

function Bienvenida({ onIniciarSesion }) {
  return (
    <div className="bienvenida-page">
      {/* Imagen de fondo que ocupa toda la pantalla */}
      <img 
        src="/images/bienvenida-canva.png"  // Cambia esta ruta por la de tu imagen
        alt="Bienvenida Florencia Drugstore" 
        className="imagen-fondo"
      />
      
      {/* Figuras decorativas - OCULTAS */}
      <div className="decoraciones">
        <div className="semi1"></div>
        <div className="semi2"></div>
        <div className="barra1"></div>
        <div className="barra2"></div>
        <div className="circulo-chico"></div>
        <div className="triangulo1"></div>
        <div className="triangulo2"></div>
        <div className="triangulo3"></div>
        <div className="cuarto-circulo"></div>
        <div className="circulo-grande"></div>
      </div>

      {/* Solo el botón funcional */}
      <div className="contenedor-boton">
        <button className="btn-iniciar" onClick={onIniciarSesion}>
          Iniciar sesión
        </button>
      </div>
    </div>
  );
}

export default Bienvenida;