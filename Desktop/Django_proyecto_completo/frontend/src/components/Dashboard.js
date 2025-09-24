import React from "react";
import {
  FaHome,
  FaShoppingCart,
  FaBox,
  FaCashRegister,
  FaTruck,
  FaUsers,
  FaCog,
  FaSignOutAlt,
  FaPlusCircle,
  FaChartBar,
} from "react-icons/fa";
import "./Dashboard.css";

function Dashboard({ usuario, onCerrarSesion }) {
  const fechaActual = new Date();
  const opcionesFecha = { 
    weekday: 'long',
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  };
  const fechaFormateada = fechaActual.toLocaleDateString('es-ES', opcionesFecha);

  // Generar calendario compacto (solo primeras 2 semanas)
  const generarDiasCalendario = () => {
    const dias = [];
    for (let i = 1; i <= 14; i++) {
      dias.push(i);
    }
    return dias;
  };

  const diasCalendario = generarDiasCalendario();

  return (
    <div className="dashboard-container">
      {/* Barra lateral */}
      <aside className="barra-lateral">
        <div className="logo">
          <h1>FLORENCIA</h1>
          <h2>DRUGSTORE</h2>
        </div>

        <nav className="menu">
          <a href="#inicio" className="menu-item activo">
            <FaHome /> Inicio
          </a>
          <a href="#ventas" className="menu-item">
            <FaShoppingCart /> Ventas
          </a>
          <a href="#productos" className="menu-item">
            <FaBox /> Productos
          </a>
          <a href="#caja" className="menu-item">
            <FaCashRegister /> Caja
          </a>
          <a href="#proveedores" className="menu-item">
            <FaTruck /> Proveedores
          </a>
          <a href="#empleados" className="menu-item">
            <FaUsers /> Empleados
          </a>
          <a href="#configuracion" className="menu-item">
            <FaCog /> Configuración
          </a>
        </nav>

        <button className="logout-btn" onClick={onCerrarSesion}>
          <FaSignOutAlt /> Cerrar sesión
        </button>
      </aside>

      {/* Contenido principal */}
      <main className="contenido-principal">
        <div className="dashboard-content">
          {/* Header */}
          <div className="bienvenida-header">
            <h1>Bienvenida, {usuario?.nombre || "Lucia Llanos"}</h1>
            <p className="fecha">{fechaFormateada}</p>
          </div>

          {/* Acciones rápidas */}
          <div className="acciones-rapidas">
            <div className="accion-item nueva-venta">
              <FaPlusCircle className="icono-accion" />
              <span>Nueva venta</span>
            </div>
            <div className="accion-item nuevo-producto">
              <FaBox className="icono-accion" />
              <span>Nuevo producto</span>
            </div>
            <div className="accion-item reporte-rapido">
              <FaChartBar className="icono-accion" />
              <span>Reporte rápido</span>
            </div>
          </div>

          {/* Grid principal */}
          <div className="main-grid">
            {/* Productos más vendidos */}
            <div className="columna productos-vendidos-section">
              <h3>Productos más vendidos</h3>
              <div className="lista-productos-vendidos">
                <div className="producto-vendido-item">
                  <span className="nombre-producto">Coca Cola 2.25L</span>
                  <div className="stats-producto">
                    <span className="ventas-count">120 ventas</span>
                    <span className="tendencia positiva">+12%</span>
                  </div>
                </div>
                <div className="producto-vendido-item">
                  <span className="nombre-producto">Quilmes 1L</span>
                  <div className="stats-producto">
                    <span className="ventas-count">40 ventas</span>
                    <span className="tendencia negativa">-5%</span>
                  </div>
                </div>
                <div className="producto-vendido-item">
                  <span className="nombre-producto">Azúcar 1Kg</span>
                  <div className="stats-producto">
                    <span className="ventas-count">60 ventas</span>
                    <span className="tendencia positiva">+8%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Productos por reponer */}
            <div className="columna productos-reponer-section">
              <h3>Productos por reponer</h3>
              <div className="lista-productos-reponer">
                <div className="producto-reponer-item">
                  <span className="nombre-producto">Fanta 500ml</span>
                  <span className="stock-info">8 uds</span>
                </div>
                <div className="producto-reponer-item">
                  <span className="nombre-producto">Yerba Playadito</span>
                  <span className="stock-info">5 uds</span>
                </div>
                <div className="producto-reponer-item">
                  <span className="nombre-producto">Café Cabrales</span>
                  <span className="stock-info">10 uds</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sección inferior */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', height: '180px' }}>
            {/* Calendario */}
            <div className="calendario-section">
              <h3>SEPTIEMBRE 2025</h3>
              <div className="calendario-grid">
                <div className="dias-semana">
                  <div className="dia-semana">D</div>
                  <div className="dia-semana">L</div>
                  <div className="dia-semana">M</div>
                  <div className="dia-semana">M</div>
                  <div className="dia-semana">J</div>
                  <div className="dia-semana">V</div>
                  <div className="dia-semana">S</div>
                </div>
                <div className="dias-mes">
                  {diasCalendario.map((dia) => (
                    <div
                      key={dia}
                      className={`dia-mes ${dia === 1 ? "dia-actual" : ""}`}
                    >
                      {dia}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ventas semanales */}
            <div className="ventas-semana-section">
              <h3>Ventas semanales</h3>
              <div className="grafico-barras">
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((dia, i) => (
                  <div className="barra-dia" key={i}>
                    <div
                      className="barra"
                      style={{ height: `${20 + i * 8}px` }}
                    ></div>
                    <span className="etiqueta-dia">{dia}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;