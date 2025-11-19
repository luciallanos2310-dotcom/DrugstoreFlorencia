// src/components/Reportes/Reportes.js
import React, { useState, useEffect } from 'react';
import './Reportes.css';

function Reportes({ datosCaja, cajaAbierta }) {
  const [datosReporte, setDatosReporte] = useState({
    totalVentas: 0,
    efectivoRecaudado: 0,
    diferencias: 0
  });

  const [filtros, setFiltros] = useState({
    fecha: new Date().toISOString().split('T')[0], // Fecha de hoy por defecto
    turno: '',
    empleado: ''
  });

  // Estados para almacenar datos de la última caja cerrada
  const [ultimaCajaCerrada, setUltimaCajaCerrada] = useState(null);
  const [ventasUltimaCaja, setVentasUltimaCaja] = useState([]);
  const [detallesVentas, setDetallesVentas] = useState([]);
  const [empleadosVentas, setEmpleadosVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [datosTabla, setDatosTabla] = useState([]);

  // Nuevos estados para el historial de ventas
  const [historialVentas, setHistorialVentas] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);
  const [empleados, setEmpleados] = useState([]);

  // Categorías específicas de tu negocio
  const categoriasLista = [
    'Bebidas', 'Lácteos', 'Golosinas', 'Limpieza', 'Verduras',
    'Carnes', 'Panificados', 'Fiambres', 'Perfumería',
    'Electrodomésticos', 'Papelería', 'Otros'
  ];

  // Colores para cada categoría
  const coloresCategorias = {
    'Bebidas': '#FF6384', 'Lácteos': '#36A2EB', 'Golosinas': '#FFCE56',
    'Limpieza': '#4BC0C0', 'Verduras': '#9966FF', 'Carnes': '#FF9F40',
    'Panificados': '#FF6384', 'Fiambres': '#C9CBCF', 'Perfumería': '#4BC0C0',
    'Electrodomésticos': '#FF6384', 'Papelería': '#36A2EB', 'Otros': '#FFCE56'
  };

  // --- OBTENER ÚLTIMA CAJA CERRADA ---
  const obtenerUltimaCajaCerrada = async () => {
    try {
      setCargando(true);
      setError(null);
      const token = localStorage.getItem('token');

      console.log('🔍 Buscando EXCLUSIVAMENTE última caja cerrada...');

      // SOLO buscar cajas cerradas
      const endpoints = [
        'http://localhost:8000/api/cajas/?estado=cerrada&ordering=-fecha_cierre',
        'http://localhost:8000/api/cajas/?estado=cerrada&ordering=-id',
        'http://localhost:8000/api/cajas/?estado=cerrada'
      ];

      let cajasCerradas = [];
      let responseCajas;

      for (const endpoint of endpoints) {
        try {
          responseCajas = await fetch(endpoint, {
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (responseCajas.ok) {
            cajasCerradas = await responseCajas.json();
            console.log(`✅ Cajas CERRADAS encontradas:`, cajasCerradas.length);
            
            cajasCerradas = cajasCerradas.filter(caja => 
              caja.estado === 'cerrada' || caja.estado === 'Cerrada' || caja.estado === 'CERRADA'
            );
            
            console.log(`✅ Cajas CERRADAS después de filtro:`, cajasCerradas.length);
            if (cajasCerradas.length > 0) break;
          }
        } catch (err) {
          console.warn(`⚠️ Error con endpoint ${endpoint}:`, err);
          continue;
        }
      }

      if (!responseCajas || !responseCajas.ok) {
        const errorText = await responseCajas?.text();
        console.error('❌ Error cargando cajas cerradas:', responseCajas?.status, errorText);
        setError(`Error ${responseCajas?.status}: No se pudieron cargar las cajas cerradas`);
        setCargando(false);
        return;
      }

      if (cajasCerradas.length === 0) {
        console.log('📭 No hay cajas cerradas anteriores');
        setUltimaCajaCerrada(null);
        setVentasUltimaCaja([]);
        setDetallesVentas([]);
        setDatosReporte({ totalVentas: 0, efectivoRecaudado: 0, diferencias: 0 });
        setCargando(false);
        return;
      }

      const ultimaCajaCerradaEncontrada = cajasCerradas.sort((a, b) => {
        if (a.fecha_cierre && b.fecha_cierre) {
          return new Date(b.fecha_cierre) - new Date(a.fecha_cierre);
        }
        return b.id - a.id;
      })[0];

      console.log('✅ ÚLTIMA CAJA CERRADA encontrada:', ultimaCajaCerradaEncontrada);
      setUltimaCajaCerrada(ultimaCajaCerradaEncontrada);

      await cargarDatosReporteCaja(ultimaCajaCerradaEncontrada);
      await cargarVentasCaja(ultimaCajaCerradaEncontrada.id);

    } catch (err) {
      console.error('❌ Error obteniendo última caja cerrada:', err);
      setError(`Error de conexión: ${err.message}`);
      setCargando(false);
    }
  };

  // --- CARGAR DATOS DEL REPORTE ---
  const cargarDatosReporteCaja = async (cajaCerrada) => {
    try {
      console.log('📊 Cargando reporte EXCLUSIVO para caja CERRADA:', cajaCerrada);

      const totalVentas = cajaCerrada.total_ventas || cajaCerrada.total_venta || 0;
      const efectivoRecaudado = cajaCerrada.saldo_final || cajaCerrada.efectivo_recaudado || cajaCerrada.efectivo || 0;
      
      let diferencias = 0;
      if (cajaCerrada.monto_contado !== undefined && cajaCerrada.saldo_final !== undefined) {
        diferencias = (parseFloat(cajaCerrada.monto_contado) || 0) - (parseFloat(cajaCerrada.saldo_final) || 0);
      } else {
        diferencias = cajaCerrada.diferencias || 0;
      }

      console.log('💰 Datos de CIERRE de caja:', {
        totalVentas,
        efectivoRecaudado,
        diferencias
      });

      setDatosReporte({
        totalVentas,
        efectivoRecaudado,
        diferencias
      });
    } catch (err) {
      console.error('❌ Error cargando reporte de caja CERRADA:', err);
    }
  };

  // --- CARGAR VENTAS DE LA CAJA CERRADA ---
  const cargarVentasCaja = async (cajaCerradaId) => {
    try {
      console.log('🛒 Cargando ventas EXCLUSIVAMENTE para caja CERRADA:', cajaCerradaId);
      const token = localStorage.getItem('token');

      const responseVentas = await fetch(`http://localhost:8000/api/ventas/?caja=${cajaCerradaId}`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!responseVentas.ok) {
        console.error('❌ Error cargando ventas de la caja CERRADA:', responseVentas.status);
        setCargando(false);
        return;
      }

      const ventas = await responseVentas.json();
      console.log('✅ Ventas de caja CERRADA cargadas:', ventas.length);
      setVentasUltimaCaja(ventas);

      await cargarDetallesVentas(ventas, token);

    } catch (err) {
      console.error('❌ Error cargando ventas de la caja CERRADA:', err);
      setCargando(false);
    }
  };

  // --- CARGAR DETALLES DE VENTAS + PRODUCTOS ---
  const cargarDetallesVentas = async (ventas, token) => {
    try {
      console.log('📋 Cargando detalles para', ventas.length, 'ventas CERRADAS...');

      const productCache = new Map();
      const detallesTotales = [];

      for (const venta of ventas) {
        try {
          const resDetalles = await fetch(`http://localhost:8000/api/detalle_ventas/?venta=${venta.id}`, {
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (!resDetalles.ok) {
            console.warn(`⚠️ No se pudieron obtener detalles para venta ${venta.id}`);
            continue;
          }

          const detalles = await resDetalles.json();

          for (const det of detalles) {
            let productoObj = null;

            if (det.producto && typeof det.producto === 'object') {
              productoObj = det.producto;
            } else {
              const productoId = det.producto;
              if (productoId == null) {
                productoObj = null;
              } else if (productCache.has(productoId)) {
                productoObj = productCache.get(productoId);
              } else {
                try {
                  const resProd = await fetch(`http://localhost:8000/api/productos/${productoId}/`, {
                    headers: {
                      'Authorization': `Token ${token}`,
                      'Content-Type': 'application/json'
                    }
                  });

                  if (resProd.ok) {
                    productoObj = await resProd.json();
                    productCache.set(productoId, productoObj);
                  } else {
                    console.warn(`⚠️ Producto ${productoId} no encontrado`);
                    productoObj = null;
                  }
                } catch (errProd) {
                  console.error(`❌ Error pidiendo producto ${productoId}:`, errProd);
                  productoObj = null;
                }
              }
            }

            const cantidad = det.cantidad != null ? parseFloat(det.cantidad) : 0;
            const subtotal = det.subtotal != null ? parseFloat(det.subtotal) : 0;

            detallesTotales.push({
              ...det,
              cantidad,
              subtotal,
              producto: productoObj,
              venta: det.venta != null ? (typeof det.venta === 'number' ? det.venta : parseInt(det.venta)) : venta.id
            });
          }

        } catch (errVenta) {
          console.error(`❌ Error cargando detalles para venta ${venta.id}:`, errVenta);
        }
      }

      console.log('✅ Detalles (con productos) de caja CERRADA cargados:', detallesTotales.length);
      setDetallesVentas(detallesTotales);
      
      await cargarEmpleadosVentas(ventas, token);

    } catch (err) {
      console.error('❌ Error cargando detalles de ventas CERRADAS:', err);
      setCargando(false);
    }
  };

  // --- CARGAR EMPLEADOS Y AGRUPAR VENTAS POR EMPLEADO ---
  const cargarEmpleadosVentas = async (ventas, token) => {
    try {
      console.log('👥 Cargando información de empleados para caja CERRADA...');
      const responseEmpleados = await fetch('http://localhost:8000/api/empleados/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!responseEmpleados.ok) {
        console.warn('⚠️ No se pudieron cargar empleados:', responseEmpleados.status);
        setCargando(false);
        return;
      }

      const empleados = await responseEmpleados.json();

      const ventasPorEmpleado = {};
      ventas.forEach(venta => {
        const empleadoId = venta.empleado;
        if (empleadoId) {
          if (!ventasPorEmpleado[empleadoId]) {
            ventasPorEmpleado[empleadoId] = {
              empleado: empleados.find(e => e.id === empleadoId) || null,
              ventas: [],
              totalVentas: 0,
              cantidadVentas: 0
            };
          }
          ventasPorEmpleado[empleadoId].ventas.push(venta);
          ventasPorEmpleado[empleadoId].totalVentas += parseFloat(venta.total_venta || 0);
          ventasPorEmpleado[empleadoId].cantidadVentas += 1;
        }
      });

      setEmpleadosVentas(Object.values(ventasPorEmpleado));
      generarDatosTabla(Object.values(ventasPorEmpleado));
      setCargando(false);

    } catch (err) {
      console.error('❌ Error cargando empleados:', err);
      setCargando(false);
    }
  };

  // --- GENERAR DATOS PARA LA TABLA ---
  const generarDatosTabla = (empleadosConVentas) => {
    try {
      console.log('📊 Generando tabla EXCLUSIVA para caja CERRADA con', empleadosConVentas.length, 'empleados');

      const tablaData = empleadosConVentas.map((item, index) => {
        const empleado = item.empleado;
        const nombreCompleto = empleado ?
          `${empleado.nombre_emp || ''} ${empleado.apellido_emp || ''}`.trim() :
          'Empleado no encontrado';

        const fecha = ultimaCajaCerrada ?
          new Date(ultimaCajaCerrada.fecha_hs_apertura || ultimaCajaCerrada.fecha_apertura).toLocaleDateString('es-ES') :
          '--/--/----';

        const productosVendidos = item.ventas.reduce((total, venta) => {
          const detallesDeEstaVenta = detallesVentas.filter(d => {
            return d.venta === venta.id || (d.venta && d.venta.toString() === venta.id.toString());
          });
          return total + detallesDeEstaVenta.reduce((sum, det) => sum + (det.cantidad || 0), 0);
        }, 0);

        return {
          id: empleado?.id || index,
          fecha,
          turno: obtenerTurnoPorHora(item.ventas[0]?.fecha_hora_venta || item.ventas[0]?.fecha_venta),
          empleado: nombreCompleto,
          productosVendidos,
          totalRecaudado: item.totalVentas || 0,
          diferencia: 0,
          cantidadVentas: item.cantidadVentas || 0
        };
      });

      console.log('✅ Datos de tabla de caja CERRADA generados:', tablaData);
      setDatosTabla(tablaData);
    } catch (err) {
      console.error('❌ Error generando datos de tabla para caja CERRADA:', err);
    }
  };

// --- CARGAR HISTORIAL DE VENTAS ---
const cargarHistorialVentas = async () => {
  try {
    setCargandoHistorial(true);
    const token = localStorage.getItem('token');
    
    // Primero cargar empleados si no están cargados
    if (empleados.length === 0) {
      await cargarEmpleados(token);
    }
    
    // Construir query parameters basados en los filtros
    const params = new URLSearchParams();
    if (filtros.fecha) {
      params.append('fecha', filtros.fecha);
    }
    if (filtros.turno) {
      params.append('turno', filtros.turno);
    }
    if (filtros.empleado) {
      params.append('empleado', filtros.empleado);
    }
    
    // Ordenar por fecha más reciente y limitar a 50 resultados
    params.append('ordering', '-fecha_hora_venta');
    params.append('limit', '50');
    
    console.log('🔍 Buscando historial con filtros:', filtros);
    const response = await fetch(`http://localhost:8000/api/ventas/?${params.toString()}`, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Error al cargar historial de ventas');
    }

    const ventas = await response.json();
    console.log('✅ Historial de ventas cargado:', ventas.length);
    
    // Enriquecer ventas con información de empleados Y CANTIDAD DE PRODUCTOS
    const ventasConDetalles = await Promise.all(
      ventas.map(async (venta) => {
        const empleado = empleados.find(emp => emp.id === venta.empleado);
        
        // Cargar detalles específicos de ESTA venta para contar productos
        const detallesVenta = await cargarDetallesVentaEspecifica(venta.id, token);
        const cantidadProductos = detallesVenta.reduce((total, detalle) => total + (detalle.cantidad || 0), 0);
        
        return {
          ...venta,
          nombre_empleado: empleado ? `${empleado.nombre_emp} ${empleado.apellido_emp}` : 'No asignado',
          cantidad_productos: cantidadProductos
        };
      })
    );
    
    setHistorialVentas(ventasConDetalles);
    
  } catch (err) {
    console.error('❌ Error cargando historial de ventas:', err);
    setError(`Error al cargar historial: ${err.message}`);
  } finally {
    setCargandoHistorial(false);
  }
};

// --- CARGAR DETALLES DE UNA VENTA ESPECÍFICA (solo para contar productos) ---
const cargarDetallesVentaEspecifica = async (ventaId, token) => {
  try {
    const response = await fetch(`http://localhost:8000/api/detalle_ventas/?venta=${ventaId}`, {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return [];
    }

    const detalles = await response.json();
    return detalles;
  } catch (err) {
    console.error(`❌ Error cargando detalles para venta ${ventaId}:`, err);
    return [];
  }
};

  // --- CARGAR EMPLEADOS ---
  const cargarEmpleados = async (token) => {
    try {
      const response = await fetch('http://localhost:8000/api/empleados/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const empleadosData = await response.json();
        setEmpleados(empleadosData);
      }
    } catch (err) {
      console.error('Error cargando empleados:', err);
    }
  };

  // --- CARGAR DETALLES DE UNA VENTA ESPECÍFICA ---
  const cargarDetallesVenta = async (ventaId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/detalle_ventas/?venta=${ventaId}`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar detalles de venta');
      }

      const detalles = await response.json();
      
      // Enriquecer detalles con información de productos
      const detallesConProductos = await Promise.all(
        detalles.map(async (detalle) => {
          if (detalle.producto && typeof detalle.producto === 'number') {
            try {
              const responseProducto = await fetch(`http://localhost:8000/api/productos/${detalle.producto}/`, {
                headers: {
                  'Authorization': `Token ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (responseProducto.ok) {
                const producto = await responseProducto.json();
                return {
                  ...detalle,
                  producto_info: producto
                };
              }
            } catch (err) {
              console.error('Error cargando producto:', err);
            }
          } else if (detalle.producto && typeof detalle.producto === 'object') {
            return {
              ...detalle,
              producto_info: detalle.producto
            };
          }
          return detalle;
        })
      );

      return detallesConProductos;
    } catch (err) {
      console.error('❌ Error cargando detalles de venta:', err);
      return [];
    }
  };

  // --- VER DETALLES DE VENTA ---
  const verDetallesVenta = async (venta) => {
    try {
      setCargandoHistorial(true);
      const detalles = await cargarDetallesVenta(venta.id);
      setVentaSeleccionada({
        ...venta,
        detalles: detalles
      });
      setMostrarDetalles(true);
    } catch (err) {
      console.error('❌ Error mostrando detalles:', err);
      setError('Error al cargar detalles de la venta');
    } finally {
      setCargandoHistorial(false);
    }
  };

  // --- CERRAR DETALLES ---
  const cerrarDetalles = () => {
    setMostrarDetalles(false);
    setVentaSeleccionada(null);
  };

  // --- DETERMINAR TURNO POR HORA ---
  const obtenerTurnoPorHora = (fechaHora) => {
    if (!fechaHora) return 'No especificado';
    try {
      const hora = new Date(fechaHora).getHours();
      if (hora < 12) return 'Mañana';
      if (hora < 18) return 'Tarde';
      return 'Noche';
    } catch (err) {
      return 'No especificado';
    }
  };

  // --- CALCULAR TOTAL PRODUCTOS VENDIDOS ---
  const calcularTotalProductos = (detalles) => {
    if (!detalles) return 0;
    return detalles.reduce((total, detalle) => total + (detalle.cantidad || 0), 0);
  };

  // --- CALCULAR DISTRIBUCIÓN POR CATEGORÍA (SOLO ÚLTIMA CAJA) ---
  const calcularDistribucionCategorias = () => {
    if (!detallesVentas || detallesVentas.length === 0 || !ultimaCajaCerrada) {
      console.log('📊 No hay detalles de ventas para la última caja CERRADA');
      return [];
    }

    console.log('🎯 Calculando distribución EXCLUSIVA para caja #' + ultimaCajaCerrada.id);

    // Obtener los IDs de ventas que pertenecen SOLO a esta caja
    const ventasDeEstaCaja = ventasUltimaCaja.map(venta => venta.id);
    console.log('🛒 Ventas de esta caja:', ventasDeEstaCaja);

    // RESETEAR completamente el mapa de categorías
    const categoriasMap = {};
    
    // Inicializar TODAS las categorías en CERO
    categoriasLista.forEach(categoria => {
      categoriasMap[categoria] = {
        nombre: categoria,
        cantidad: 0,
        color: coloresCategorias[categoria] || '#C9CBCF'
      };
    });

    // CONTAR SOLO los productos de ESTA caja específica
    let totalProductosEstaCaja = 0;
    
    detallesVentas.forEach(detalle => {
      // FILTRAR CRÍTICO: Solo contar si este detalle pertenece a una venta de la última caja
      const ventaId = detalle.venta;
      
      if (ventasDeEstaCaja.includes(ventaId)) {
        const categoria = detalle.producto?.categoria_prod || 'Otros';
        const cantidad = detalle.cantidad || 0;

        if (categoriasMap[categoria]) {
          categoriasMap[categoria].cantidad += cantidad;
          totalProductosEstaCaja += cantidad;
        } else {
          categoriasMap['Otros'].cantidad += cantidad;
          totalProductosEstaCaja += cantidad;
        }
      }
    });

    console.log('📦 Total productos en ESTA caja (' + ultimaCajaCerrada.id + '):', totalProductosEstaCaja);

    // Filtrar categorías que tienen productos en ESTA caja
    const categoriasConVentas = Object.values(categoriasMap).filter(cat => cat.cantidad > 0);

    if (categoriasConVentas.length === 0) {
      console.log('📊 No se vendieron productos en esta caja específica');
      return [];
    }

    // Calcular porcentajes EXCLUSIVOS para ESTA caja
    const categoriasConPorcentaje = categoriasConVentas.map(cat => {
      const porcentaje = totalProductosEstaCaja > 0 ? Math.round((cat.cantidad / totalProductosEstaCaja) * 100) : 0;
      return {
        ...cat,
        porcentaje
      };
    });

    // Ordenar por cantidad (de mayor a menor)
    categoriasConPorcentaje.sort((a, b) => b.cantidad - a.cantidad);

    console.log('✅ Distribución FINAL para caja #' + ultimaCajaCerrada.id + ':', categoriasConPorcentaje);

    return categoriasConPorcentaje;
  };

  // Función para recargar reportes manualmente
  const recargarReportes = () => {
    console.log('🔄 Recargando reportes EXCLUSIVOS de última caja CERRADA...');
    obtenerUltimaCajaCerrada();
  };

  // --- MANEJAR CAMBIOS EN FILTROS ---
  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // --- BUSCAR HISTORIAL ---
  const buscarHistorial = () => {
    cargarHistorialVentas();
  };

  // --- LIMPIAR FILTROS ---
  const limpiarFiltros = () => {
    setFiltros({
      fecha: new Date().toISOString().split('T')[0],
      turno: '',
      empleado: ''
    });
  };

  // Llamada inicial
  useEffect(() => {
    console.log('🚀 Componente Reportes montado - Cargando EXCLUSIVAMENTE última caja CERRADA');
    obtenerUltimaCajaCerrada();
  }, []);

  // Cargar historial cuando cambie la caja cerrada
  useEffect(() => {
    if (ultimaCajaCerrada) {
      cargarHistorialVentas();
    }
  }, [ultimaCajaCerrada]);

  const categorias = calcularDistribucionCategorias();

  // --- GRAFICO TORTA (EXCLUSIVO para última caja cerrada) ---
  const GraficoTorta = () => {
    if (!categorias || categorias.length === 0) {
      return (
        <div className="sin-datos-grafico">
          No hay productos vendidos en la última caja CERRADA
        </div>
      );
    }

    let currentAngle = 0;
    const radius = 80;

    return (
      <div className="grafico-torta-container">
        <svg width="160" height="160" viewBox="0 0 200 200" className="grafico-torta">
          {categorias.map((categoria, index) => {
            const angle = (categoria.porcentaje / 100) * 360;
            const largeArcFlag = angle > 180 ? 1 : 0;

            const x1 = 100 + radius * Math.cos(currentAngle * Math.PI / 180);
            const y1 = 100 + radius * Math.sin(currentAngle * Math.PI / 180);

            const x2 = 100 + radius * Math.cos((currentAngle + angle) * Math.PI / 180);
            const y2 = 100 + radius * Math.sin((currentAngle + angle) * Math.PI / 180);

            const pathData = [
              `M 100 100`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              `Z`
            ].join(' ');

            const segment = (
              <path
                key={index}
                d={pathData}
                fill={categoria.color}
                stroke="#fff"
                strokeWidth="2"
              />
            );

            currentAngle += angle;
            return segment;
          })}
          <circle cx="100" cy="100" r="40" fill="white" />
        </svg>

        <div className="leyenda-torta">
          {categorias.map((categoria, index) => (
            <div key={index} className="item-leyenda">
              <div
                className="color-leyenda"
                style={{ backgroundColor: categoria.color }}
              ></div>
              <span className="porcentaje-categoria">{categoria.porcentaje}%</span>
              <span className="nombre-categoria">{categoria.nombre}</span>
              <span className="cantidad-categoria">({categoria.cantidad} unid.)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- GRAFICO BARRAS ---
  const GraficoBarras = () => {
    const ventasSemanales = [
      { dia: 'Lun', ventas: 12000 }, { dia: 'Mar', ventas: 18000 },
      { dia: 'Mié', ventas: 15000 }, { dia: 'Jue', ventas: 22000 },
      { dia: 'Vie', ventas: 19000 }, { dia: 'Sáb', ventas: 25000 },
      { dia: 'Dom', ventas: 28000 }
    ];

    const maxVentas = Math.max(...ventasSemanales.map(d => d.ventas));

    return (
      <div className="grafico-barras-container">
        <div className="barras-grid">
          {ventasSemanales.map((dia, index) => {
            const altura = (dia.ventas / maxVentas) * 120;
            return (
              <div key={index} className="barra-item">
                <div className="barra-wrapper">
                  <div
                    className="barra"
                    style={{
                      height: `${altura}px`,
                      backgroundColor: '#36A2EB'
                    }}
                  ></div>
                </div>
                <div className="barra-labels">
                  <span className="dia-label">{dia.dia}</span>
                  <span className="venta-label">${(dia.ventas / 1000).toFixed(0)}k</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Componente para mostrar el modal de detalles
  const ModalDetallesVenta = () => {
    if (!mostrarDetalles || !ventaSeleccionada) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-contenido">
          <div className="modal-header">
            <h3>Detalles de Venta #{ventaSeleccionada.id}</h3>
            <button className="btn-cerrar-modal" onClick={cerrarDetalles}>×</button>
          </div>
          
          <div className="venta-info-general">
            <div className="venta-info-item">
              <strong>Fecha:</strong> {new Date(ventaSeleccionada.fecha_hora_venta || ventaSeleccionada.fecha_venta).toLocaleDateString('es-ES')}
            </div>
            <div className="venta-info-item">
              <strong>Hora:</strong> {new Date(ventaSeleccionada.fecha_hora_venta || ventaSeleccionada.fecha_venta).toLocaleTimeString('es-ES')}
            </div>
            <div className="venta-info-item">
              <strong>Turno:</strong> {obtenerTurnoPorHora(ventaSeleccionada.fecha_hora_venta || ventaSeleccionada.fecha_venta)}
            </div>
            <div className="venta-info-item">
              <strong>Empleado:</strong> {ventaSeleccionada.nombre_empleado || 'No asignado'}
            </div>
            <div className="venta-info-item">
              <strong>Total Venta:</strong> ${(ventaSeleccionada.total_venta || 0).toLocaleString()}
            </div>
            <div className="venta-info-item">
              <strong>Total Productos:</strong> {calcularTotalProductos(ventaSeleccionada.detalles)}
            </div>
          </div>

          <div className="detalles-productos">
            <h4>Productos Vendidos</h4>
            {ventaSeleccionada.detalles && ventaSeleccionada.detalles.length > 0 ? (
              <table className="tabla-productos">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio Unit.</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {ventaSeleccionada.detalles.map((detalle, index) => (
                    <tr key={index}>
                      <td>
                        {detalle.producto_info ? 
                          `${detalle.producto_info.nombre_prod || 'Producto'} (${detalle.producto_info.codigo_barra || 'Sin código'})` : 
                          'Producto no encontrado'}
                      </td>
                      <td className="centrado">{detalle.cantidad || 0}</td>
                      <td className="derecha">${(detalle.precio_unitario || 0).toLocaleString()}</td>
                      <td className="derecha">${(detalle.subtotal || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="derecha"><strong>Total:</strong></td>
                    <td className="derecha">
                      <strong>${(ventaSeleccionada.total_venta || 0).toLocaleString()}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            ) : (
              <p>No hay detalles disponibles para esta venta.</p>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn-cerrar" onClick={cerrarDetalles}>Cerrar</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="reportes-container">
      {/* Header EXCLUSIVO para caja CERRADA */}
      <div className="reportes-header">
        <div className="header-info">
          <h1>Reportes EXCLUSIVOS de Caja Cerrada</h1>
          <div className="fecha-turno">
            {ultimaCajaCerrada ? (
              <>
                <span className="fecha">
                  {new Date(ultimaCajaCerrada.fecha_hs_apertura || ultimaCajaCerrada.fecha_apertura).toLocaleDateString('es-ES')}
                </span>
                <span className="turno">
                  Caja #{ultimaCajaCerrada.id} - {ultimaCajaCerrada.turno || 'Sin turno'}
                </span>
                <span className="estado-caja cerrada">
                  🔴 ÚLTIMA CAJA CERRADA
                </span>
                <span className="estado-actual">
                  {cajaAbierta ? '🟢 Caja Actual: ABIERTA' : '🔴 Caja Actual: CERRADA'}
                </span>
              </>
            ) : (
              <span className="sin-caja-cerrada">No hay cajas cerradas registradas</span>
            )}
            <button 
              onClick={recargarReportes}
              className="btn-recargar"
              disabled={cargando}
            >
              {cargando ? 'Cargando...' : '🔄 Actualizar'}
            </button>
          </div>
        </div>
      </div>

      {/* Estados de carga y error */}
      {cargando && (
        <div className="cargando-datos">
          <div className="spinner"></div>
          Cargando datos EXCLUSIVOS de la última caja CERRADA...
        </div>
      )}

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
          <button onClick={recargarReportes} className="btn-reintentar">Reintentar</button>
        </div>
      )}

      {!cargando && !error && !ultimaCajaCerrada && (
        <div className="sin-datos">
          <h3>No hay cajas cerradas anteriores</h3>
          <p>No se encontraron cajas cerradas para mostrar reportes.</p>
          <p>Los reportes se mostrarán automáticamente cuando se cierre una caja.</p>
        </div>
      )}

      {/* Contenedor principal EXCLUSIVO para caja CERRADA */}
      {!cargando && !error && ultimaCajaCerrada && (
        <>
          <div className="graficos-container">
            {/* Gráfico de torta - Izquierda */}
            <div className="grafico-seccion torta-seccion">
              {/* Resumen EXCLUSIVO de caja CERRADA */}
              <div className="resumen-dia">
                <h3>Resumen EXCLUSIVO de la última caja CERRADA</h3>
                <div className="metricas-resumen">
                  <div className="metrica-resumen">
                    <div className="metrica-titulo">Total ventas</div>
                    <div className="metrica-valor">${datosReporte.totalVentas.toLocaleString()}</div>
                  </div>
                  <div className="metrica-resumen">
                    <div className="metrica-titulo">Efectivo Recaudado</div>
                    <div className="metrica-valor">${datosReporte.efectivoRecaudado.toLocaleString()}</div>
                  </div>
                  <div className="metrica-resumen">
                    <div className="metrica-titulo">Diferencias</div>
                    <div className={`metrica-valor ${datosReporte.diferencias >= 0 ? 'positivo' : 'negativo'}`}>
                      ${datosReporte.diferencias.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ventas por categoría EXCLUSIVAS de última caja CERRADA - POR CANTIDAD */}
              <div className="ventas-categoria">
                <h3>Distribución de Productos Vendidos (Última Caja Cerrada)</h3>
                <p className="subtitulo-grafico">Cantidad de productos vendidos por categoría</p>
                <div className="grafico-contenedor">
                  <GraficoTorta />
                </div>
              </div>
            </div>

            {/* Gráfico de barras - Derecha */}
            <div className="grafico-seccion barras-seccion">
              <h3>Resumen semanal</h3>
              <div className="grafico-contenedor">
                <GraficoBarras />
              </div>
            </div>
          </div>

          {/* Sección inferior MODIFICADA - Historial de Ventas */}
          <div className="seccion-inferior">
            {/* Historial de Ventas */}
            <div className="historial-ventas-section">
              <h4>Historial de Ventas</h4>
              
              {/* Filtros */}
<div className="filtros-grid-historial">
  <div className="filtro-grupo">
    <label>Fecha:</label>
    <input
      type="date"
      value={filtros.fecha}
      className="input-filtro"
      onChange={(e) => handleFiltroChange('fecha', e.target.value)}
    />
  </div>
  <div className="filtro-grupo">
    <label>Turno:</label>
    <select
      className="select-filtro"
      value={filtros.turno}
      onChange={(e) => handleFiltroChange('turno', e.target.value)}
    >
      <option value="">Todos</option>
      <option value="Mañana">Mañana</option>
      <option value="Tarde">Tarde</option>
      <option value="Noche">Noche</option>
    </select>
  </div>
  <div className="filtro-grupo">
    <label>Empleada:</label>
    <select
      className="select-filtro"
      value={filtros.empleado}
      onChange={(e) => handleFiltroChange('empleado', e.target.value)}
    >
      <option value="">Todas</option>
      {empleados.map(emp => (
        <option key={emp.id} value={emp.id}>
          {`${emp.nombre_emp} ${emp.apellido_emp}`}
        </option>
      ))}
    </select>
  </div>
  <div className="filtro-grupo acciones-filtros">
    <button 
      className="btn-buscar-historial"
      onClick={buscarHistorial}
      disabled={cargandoHistorial}
    >
      {cargandoHistorial ? 'Buscando...' : '🔍 Buscar'}
    </button>
    <button 
      className="btn-limpiar-filtros"
      onClick={limpiarFiltros}
    >
      Limpiar
    </button>
  </div>
</div>

              {/* Lista de ventas */}
              <div className="lista-ventas-contenedor">
                {cargandoHistorial ? (
                  <div className="cargando-datos">Cargando historial de ventas...</div>
                ) : historialVentas.length > 0 ? (
                  <div className="tabla-ventas-contenedor">
                    <table className="tabla-ventas">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Hora</th>
                          <th>Turno</th>
                          <th>Empleada</th>
                          <th>Productos</th>
                          <th>Total Venta ($)</th>
                          <th>Diferencia</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historialVentas.map((venta) => (
                          <tr key={venta.id}>
                            <td>
                              {new Date(venta.fecha_hora_venta || venta.fecha_venta).toLocaleDateString('es-ES')}
                            </td>
                            <td>
                              {new Date(venta.fecha_hora_venta || venta.fecha_venta).toLocaleTimeString('es-ES', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td>{obtenerTurnoPorHora(venta.fecha_hora_venta || venta.fecha_venta)}</td>
                            <td>{venta.nombre_empleado}</td>
                            <td className="derecha">${(venta.total_venta || 0).toLocaleString()}</td>
                            <td className={`derecha ${(venta.diferencia || 0) >= 0 ? 'positivo' : 'negativo'}`}>
                              ${(venta.diferencia || 0).toLocaleString()}
                            </td>
                            <td className="centrado">
                              <button 
                                className="btn-ver-mas"
                                onClick={() => verDetallesVenta(venta)}
                              >
                                Ver productos
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="sin-datos">
                    No se encontraron ventas con los filtros seleccionados
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal de detalles */}
          <ModalDetallesVenta />
        </>
      )}
    </div>
  );
}

export default Reportes;