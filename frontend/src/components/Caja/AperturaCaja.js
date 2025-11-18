import React, { useState, useEffect } from 'react';
import { FaCashRegister, FaStickyNote, FaChartLine, FaShoppingCart, FaExchangeAlt, FaMoneyBill, FaList, FaCreditCard, FaMoneyCheckAlt, FaMobileAlt } from 'react-icons/fa';
import './AperturaCaja.css';
import ModalConfirmacionUniversal from '../ModalConfirmacionUniversal';

function AperturaCaja({ onAperturaConfirmada, onCancelar, cajaAbierta, datosCaja }) {
  const [datosApertura, setDatosApertura] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora: '08:00',
    empleado: '',
    turno: '',
    montoInicial: '',
    descripcion: ''
  });

  const [empleados, setEmpleados] = useState([]);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mostrarExito, setMostrarExito] = useState(false);
  const [errores, setErrores] = useState({});
  const [cajaLocalAbierta, setCajaLocalAbierta] = useState(null);
  
  // Estados para el detalle de ventas
  const [ventasDelDia, setVentasDelDia] = useState([]);
  const [detallesVentas, setDetallesVentas] = useState({});
  const [resumenGeneral, setResumenGeneral] = useState({
    totalVentas: 0,
    ventasEfectivo: 0,
    ventasTransferencia: 0,
    ventasSaeta: 0,
    ingresosExtra: 0,
    egresos: 0,
    totalOperaciones: 0
  });

  const turnos = [
    { id: 'mañana', nombre: 'Turno Mañana' },
    { id: 'tarde', nombre: 'Turno Tarde' }
  ];

  // Función segura para formatear números - MOVIDA AQUÍ
  const formatearNumero = (valor) => {
    const numero = parseFloat(valor) || 0;
    return numero.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Cargar empleados desde la API
  const cargarEmpleados = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/empleados/', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEmpleados(data);
      } else {
        console.error('Error cargando empleados:', response.status);
      }
    } catch (error) {
      console.error('Error cargando empleados:', error);
    }
  };

  // Cargar ventas del día con detalles - VERSIÓN MEJORADA
  const cargarVentasDelDia = async () => {
    if (!cajaAbierta || !datosCaja?.id) {
      console.log('DEBUG - No se puede cargar ventas: cajaAbierta=', cajaAbierta, 'datosCaja.id=', datosCaja?.id);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      console.log('DEBUG - Cargando ventas para caja:', datosCaja.id);
      
      // Cargar TODAS las ventas de esta caja
      const responseVentas = await fetch(`http://localhost:8000/api/ventas/?caja=${datosCaja.id}`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (responseVentas.ok) {
        const todasLasVentas = await responseVentas.json();
        console.log('DEBUG - Todas las ventas:', todasLasVentas);
        
        // Filtrar movimientos de caja
        const movimientosCaja = todasLasVentas.filter(v => 
          v.descripcion?.includes('Ingreso') || 
          v.descripcion?.includes('Egreso')
        );
        
        console.log('DEBUG - Movimientos de caja:', movimientosCaja);

        // Filtrar ventas normales (sin movimientos)
        const ventasNormales = todasLasVentas.filter(v => 
          !v.descripcion?.includes('Ingreso') && 
          !v.descripcion?.includes('Egreso')
        );

        console.log('DEBUG - Ventas normales:', ventasNormales);

        // Ordenar TODAS las ventas por fecha (más recientes primero)
        const ventasOrdenadas = [...ventasNormales, ...movimientosCaja].sort((a, b) => 
          new Date(b.fecha_hora_venta) - new Date(a.fecha_hora_venta)
        );

        // Usar TODAS las ventas para el estado
        setVentasDelDia(ventasOrdenadas);

        // Cargar detalles SOLO para ventas normales (no para movimientos)
        const nuevosDetalles = {};
        for (const venta of ventasNormales) {
          const detalles = await cargarDetallesVenta(venta.id);
          if (detalles && detalles.length > 0) {
            nuevosDetalles[venta.id] = detalles;
          }
        }
        setDetallesVentas(nuevosDetalles);

        // Calcular resumen general
        calcularResumenGeneral(ventasNormales, movimientosCaja);
      } else {
        console.error('Error cargando ventas:', responseVentas.status);
      }
    } catch (error) {
      console.error('Error cargando ventas del día:', error);
    }
  };

  // Cargar detalles específicos de una venta - VERSIÓN CORREGIDA
  const cargarDetallesVenta = async (ventaId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:8000/api/detalle_ventas/?venta=${ventaId}`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const detalles = await response.json();
        console.log(`DEBUG - Detalles para venta ${ventaId}:`, detalles);
        
        // Filtrar solo los detalles que pertenecen a esta venta específica
        const detallesFiltrados = detalles.filter(detalle => 
          detalle.venta === ventaId || 
          (detalle.venta && detalle.venta.toString() === ventaId.toString())
        );
        
        console.log(`DEBUG - Detalles filtrados para venta ${ventaId}:`, detallesFiltrados);
        return detallesFiltrados;
      }
      return [];
    } catch (error) {
      console.error(`Error cargando detalles de venta ${ventaId}:`, error);
      return [];
    }
  };

  // Calcular resumen general - VERSIÓN CORREGIDA
  const calcularResumenGeneral = (ventasNormales, movimientosCaja) => {
    let totalVentas = 0;
    let ventasEfectivo = 0;
    let ventasTransferencia = 0;
    let ventasSaeta = 0;
    let ingresosExtra = 0;
    let egresos = 0;

    // Procesar ventas normales
    ventasNormales.forEach(venta => {
      const monto = parseFloat(venta.total_venta) || 0;
      totalVentas += monto;
      
      if (venta.descripcion?.includes('Saeta')) {
        ventasSaeta += monto;
      } else if (venta.tipo_pago_venta === 'efectivo') {
        ventasEfectivo += monto;
      } else if (venta.tipo_pago_venta === 'transferencia') {
        ventasTransferencia += monto;
      }
    });

    // Procesar movimientos de caja
    movimientosCaja.forEach(movimiento => {
      const monto = parseFloat(movimiento.total_venta) || 0;
      if (movimiento.descripcion?.includes('Ingreso')) {
        ingresosExtra += monto;
      } else if (movimiento.descripcion?.includes('Egreso')) {
        egresos += monto;
      }
    });

    setResumenGeneral({
      totalVentas: totalVentas || 0,
      ventasEfectivo: ventasEfectivo || 0,
      ventasTransferencia: ventasTransferencia || 0,
      ventasSaeta: ventasSaeta || 0,
      ingresosExtra: ingresosExtra || 0,
      egresos: egresos || 0,
      totalOperaciones: ventasNormales.length + movimientosCaja.length
    });
  };

  useEffect(() => {
    cargarEmpleados();
  }, []);

  // Actualizar ventas cada 15 segundos cuando la caja está abierta
  useEffect(() => {
    if (cajaAbierta) {
      cargarVentasDelDia(); // Cargar inmediatamente
      const intervalo = setInterval(cargarVentasDelDia, 15000); // Actualizar cada 15 segundos
      return () => clearInterval(intervalo);
    }
  }, [cajaAbierta, datosCaja]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatosApertura(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errores[name]) {
      setErrores(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!datosApertura.fecha) nuevosErrores.fecha = 'La fecha de apertura es requerida';
    if (!datosApertura.hora) nuevosErrores.hora = 'La hora de apertura es requerida';
    if (!datosApertura.empleado) nuevosErrores.empleado = 'Debe seleccionar un empleado';
    if (!datosApertura.turno) nuevosErrores.turno = 'Debe seleccionar un turno';
    if (!datosApertura.montoInicial) nuevosErrores.montoInicial = 'El monto inicial es requerido';
    else if (parseFloat(datosApertura.montoInicial) <= 0) nuevosErrores.montoInicial = 'El monto debe ser mayor a 0';

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleConfirmarApertura = () => {
    if (validarFormulario()) {
      setMostrarConfirmacion(true);
    }
  };

  const handleConfirmacionFinal = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const datosParaEnviar = {
        empleado: parseInt(datosApertura.empleado),
        fecha_hs_apertura: `${datosApertura.fecha}T${datosApertura.hora}:00`,
        saldo_inicial: parseFloat(datosApertura.montoInicial),
        turno: datosApertura.turno,
        descripcion: datosApertura.descripcion,
        estado: 'abierta'
      };

      const response = await fetch('http://localhost:8000/api/cajas/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(datosParaEnviar)
      });

      if (response.ok) {
        const cajaCreada = await response.json();
        
        const datosCajaParaMostrar = {
          empleadoNombre: empleadoSeleccionado ? 
            `${empleadoSeleccionado.nombre_emp} ${empleadoSeleccionado.apellido_emp}` : '',
          turnoNombre: turnoSeleccionado ? turnoSeleccionado.nombre : '',
          montoInicial: datosApertura.montoInicial,
          saldo_inicial: parseFloat(datosApertura.montoInicial),
          turno: datosApertura.turno,
          fecha_hs_apertura: `${datosApertura.fecha}T${datosApertura.hora}:00`,
          id: cajaCreada.id,
          descripcion: datosApertura.descripcion
        };

        setCajaLocalAbierta(datosCajaParaMostrar);
        setMostrarExito(true);
        setMostrarConfirmacion(false);
        
        if (onAperturaConfirmada) {
          onAperturaConfirmada(datosCajaParaMostrar);
        }
        
      } else {
        const errorData = await response.json();
        console.error('Error al abrir caja:', errorData);
        alert('Error al abrir caja: ' + JSON.stringify(errorData));
        setMostrarConfirmacion(false);
      }
    } catch (error) {
      console.error('Error al abrir caja:', error);
      alert('Error de conexión al abrir caja');
      setMostrarConfirmacion(false);
    }
  };

  const empleadoSeleccionado = empleados.find(emp => emp.id === parseInt(datosApertura.empleado));
  const turnoSeleccionado = turnos.find(t => t.id === datosApertura.turno);

  const datosModal = {
    empleadoNombre: empleadoSeleccionado ? `${empleadoSeleccionado.nombre_emp} ${empleadoSeleccionado.apellido_emp}` : '',
    fecha: datosApertura.fecha,
    hora: datosApertura.hora,
    turnoNombre: turnoSeleccionado ? turnoSeleccionado.nombre : '',
    montoInicial: datosApertura.montoInicial
  };

// Componente para mostrar el detalle de ventas - VERSIÓN SIMPLIFICADA
const DetalleVentasDelDia = () => {
  const agruparVentas = () => {
  const ventasAgrupadas = [];
  const ventasProcesadas = new Set();
  
  console.log('DEBUG - Ventas del día:', ventasDelDia);
  
  // Primero, crear un mapa para identificar ventas duplicadas por monto y hora (redondeado)
  const ventasPorMontoYHora = {};
  
  ventasDelDia.forEach(venta => {
    if (!venta.fecha_hora_venta || !venta.total_venta) return;
    
    // Redondear monto a 2 decimales y hora al minuto
    const montoRedondeado = parseFloat(venta.total_venta).toFixed(2);
    const horaRedondeada = new Date(venta.fecha_hora_venta);
    horaRedondeada.setSeconds(0, 0);
    const clave = `${montoRedondeado}_${horaRedondeada.getTime()}`;
    
    if (!ventasPorMontoYHora[clave]) {
      ventasPorMontoYHora[clave] = [];
    }
    ventasPorMontoYHora[clave].push(venta);
  });
  
  console.log('DEBUG - Ventas agrupadas por monto y hora:', ventasPorMontoYHora);
  
  ventasDelDia.forEach(venta => {
    if (ventasProcesadas.has(venta.id)) {
      return;
    }
    
    ventasProcesadas.add(venta.id);

    // Si es un movimiento de caja (ingreso/egreso)
    if (venta.descripcion?.includes('Ingreso') || venta.descripcion?.includes('Egreso')) {
      ventasAgrupadas.push({
        id: venta.id,
        tipo: venta.descripcion?.includes('Ingreso') ? 'ingreso' : 'egreso',
        descripcion: venta.descripcion,
        total: parseFloat(venta.total_venta) || 0,
        fecha_hora: venta.fecha_hora_venta,
        metodoPago: venta.tipo_pago_venta,
        esMovimiento: true
      });
      return;
    }
    
    // Calcular la clave para esta venta (igual que en la agrupación)
    const montoRedondeado = parseFloat(venta.total_venta).toFixed(2);
    const horaRedondeada = new Date(venta.fecha_hora_venta);
    horaRedondeada.setSeconds(0, 0);
    const clave = `${montoRedondeado}_${horaRedondeada.getTime()}`;
    
    // Verificar si esta venta tiene duplicados (mismo monto y misma hora redondeada)
    const ventasDuplicadas = ventasPorMontoYHora[clave] || [];
    
    // Si hay más de una venta con el mismo monto y hora, procesar solo una
    if (ventasDuplicadas.length > 1) {
      console.log('DEBUG - Encontradas ventas duplicadas:', ventasDuplicadas);
      
      // Preferir la venta Saeta sobre la normal
      const ventaSaeta = ventasDuplicadas.find(v => v.descripcion?.includes('Saeta'));
      const ventaNormal = ventasDuplicadas.find(v => !v.descripcion?.includes('Saeta'));
      
      // Si hay una venta Saeta, usar esa y marcar las otras como procesadas
      if (ventaSaeta) {
        console.log('DEBUG - Usando venta Saeta y omitiendo normal');
        
        // Marcar todas las ventas duplicadas como procesadas
        ventasDuplicadas.forEach(v => ventasProcesadas.add(v.id));
        
        const codigoVenta = ventaSaeta.codigo_venta || `V-${ventaSaeta.id.toString().padStart(3, '0')}`;
        
        ventasAgrupadas.push({
          id: ventaSaeta.id,
          codigoVenta: codigoVenta,
          tipo: 'saeta',
          descripcion: ventaSaeta.descripcion,
          total: parseFloat(ventaSaeta.total_venta) || 0,
          fecha_hora: ventaSaeta.fecha_hora_venta,
          metodoPago: ventaSaeta.tipo_pago_venta,
          montoRecibido: parseFloat(ventaSaeta.monto_recibido || 0),
          vuelto: parseFloat(ventaSaeta.vuelto || 0),
          esSaeta: true
        });
        return;
      }
    }
    
    // Si es una venta Saeta individual
    if (venta.descripcion?.includes('Saeta')) {
      const codigoVenta = venta.codigo_venta || `V-${venta.id.toString().padStart(3, '0')}`;
      
      ventasAgrupadas.push({
        id: venta.id,
        codigoVenta: codigoVenta,
        tipo: 'saeta',
        descripcion: venta.descripcion,
        total: parseFloat(venta.total_venta) || 0,
        fecha_hora: venta.fecha_hora_venta,
        metodoPago: venta.tipo_pago_venta,
        montoRecibido: parseFloat(venta.monto_recibido || 0),
        vuelto: parseFloat(venta.vuelto || 0),
        esSaeta: true
      });
      return;
    }
    
    // Si es una venta normal que no fue procesada como duplicado
    const productosVenta = detallesVentas[venta.id] || [];
    const codigoVenta = venta.codigo_venta || `V-${venta.id.toString().padStart(3, '0')}`;
    
    const productosEstaVenta = productosVenta.filter(detalle => {
      return detalle.venta === venta.id || 
             (detalle.venta && detalle.venta.toString() === venta.id.toString());
    });
    
    ventasAgrupadas.push({
      id: venta.id,
      codigoVenta: codigoVenta,
      tipo: 'venta',
      total: parseFloat(venta.total_venta) || 0,
      fecha_hora: venta.fecha_hora_venta,
      metodoPago: venta.tipo_pago_venta,
      productos: productosEstaVenta,
      montoRecibido: parseFloat(venta.monto_recibido || 0),
      vuelto: parseFloat(venta.vuelto || 0),
      descripcion: venta.descripcion
    });
  });
  
  return ventasAgrupadas.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
};

  const ventasAgrupadas = agruparVentas();

  // Función para formatear la hora
  const formatearHora = (fechaHora) => {
    if (!fechaHora) return '--:--';
    try {
      return new Date(fechaHora).toLocaleTimeString('es-AR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return '--:--';
    }
  };

  return (
    <div className="detalle-ventas-moderno">
      <div className="detalle-header-moderno">
        <h3>Operaciones del Día</h3>
      </div>

      {/* Resumen en tarjetas */}
      <div className="resumen-cards">
        <div className="resumen-card">
          <div className="resumen-icon total">
            <FaMoneyBill />
          </div>
          <div className="resumen-info">
            <span className="resumen-label">Total Ventas</span>
            <span className="resumen-valor">${formatearNumero(resumenGeneral.totalVentas)}</span>
          </div>
        </div>
        
        <div className="resumen-card">
          <div className="resumen-icon operaciones">
            <FaList />
          </div>
          <div className="resumen-info">
            <span className="resumen-label">Operaciones</span>
            <span className="resumen-valor">{ventasAgrupadas.length}</span>
          </div>
        </div>
        
        <div className="resumen-card">
          <div className="resumen-icon ingresos">
            <FaChartLine />
          </div>
          <div className="resumen-info">
            <span className="resumen-label">Ingresos Extra</span>
            <span className="resumen-valor">${formatearNumero(resumenGeneral.ingresosExtra)}</span>
          </div>
        </div>
        
        <div className="resumen-card">
          <div className="resumen-icon egresos">
            <FaExchangeAlt />
          </div>
          <div className="resumen-info">
            <span className="resumen-label">Egresos</span>
            <span className="resumen-valor">${formatearNumero(resumenGeneral.egresos)}</span>
          </div>
        </div>
      </div>

      {/* Lista de operaciones */}
      <div className="lista-operaciones-moderna">
        {ventasAgrupadas.length === 0 ? (
          <div className="sin-operaciones">
            <FaList className="icono-sin-operaciones" />
            <p>No hay operaciones registradas hoy</p>
          </div>
        ) : (
          ventasAgrupadas.map((operacion) => (
            <div key={operacion.id} className={`operacion-card ${operacion.tipo}`}>
              {/* Header de la operación */}
              <div className="operacion-header-moderno">
                <div className="operacion-tipo-info">
                  {operacion.tipo === 'ingreso' && (
                    <div className="tipo-badge ingreso">
                      <FaMoneyCheckAlt /> INGRESO
                    </div>
                  )}
                  {operacion.tipo === 'egreso' && (
                    <div className="tipo-badge egreso">
                      <FaExchangeAlt /> EGRESO
                    </div>
                  )}
                  {operacion.tipo === 'saeta' && (
                    <div className="tipo-badge saeta">
                      <FaMobileAlt /> SAETA
                    </div>
                  )}
                  {operacion.tipo === 'venta' && (
                    <div className={`tipo-badge metodo-${operacion.metodoPago}`}>
                      {operacion.metodoPago === 'efectivo' ? <FaMoneyBill /> : <FaCreditCard />}
                      {operacion.metodoPago === 'efectivo' ? 'EFECTIVO' : 'TRANSFERENCIA'}
                    </div>
                  )}
                  
                {/*}  {(operacion.tipo === 'venta' || operacion.tipo === 'saeta') && (
                    <span className="codigo-venta">{operacion.codigoVenta}</span>
                  )}*/}
                </div> 
                
                <div className="operacion-hora-total">
                  <span className="hora">{formatearHora(operacion.fecha_hora)}</span>
                  <span className="total">${formatearNumero(operacion.total)}</span>
                </div>
              </div>

              {/* CONTENIDO ESPECÍFICO SEGÚN TIPO */}

              {/* Para movimientos de caja */}
              {(operacion.tipo === 'ingreso' || operacion.tipo === 'egreso') && (
                <div className="operacion-descripcion">
                  {operacion.descripcion}
                </div>
              )}

              {/* Para ventas Saeta */}
              {operacion.tipo === 'saeta' && (
                <>
                  <div className="operacion-descripcion">
                    {operacion.descripcion}
                  </div>
                  
                  {/* Información de pago si es en efectivo */}
                  {operacion.metodoPago === 'efectivo' && (
                    <div className="info-efectivo">
                      <div className="info-item">
                        <span className="info-label">Recibido:</span>
                        <span className="info-valor">${formatearNumero(operacion.montoRecibido)}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Vuelto:</span>
                        <span className="info-valor">${formatearNumero(operacion.vuelto)}</span>
                      </div>
                    </div>
                  )}
                </>
              )}

            {operacion.tipo === 'venta' && (
              <>
                {/* Detalles de productos */}
                {operacion.productos && operacion.productos.length > 0 ? (
                  <div className="detalle-productos-moderno">
                    {operacion.productos.map((producto, index) => (
                      <div key={`${operacion.id}-${producto.id || index}`} className="producto-item-moderno">
                  
                        <span className="producto-nombre">
                          {producto.producto_nombre || `Producto ${producto.producto_id || producto.producto || 'N/A'}`}
                        </span>
                        
                        {/* Mostrar cantidad solo si es mayor a 1 */}
                        {(producto.cantidad && producto.cantidad > 1) && (
                          <span className="producto-cantidad">x{producto.cantidad}</span>
                        )}
                        
                        {/* Mostrar precio unitario solo si la cantidad es mayor a 1 */}
                        {(producto.cantidad && producto.cantidad > 1) ? (
                          <>
                            <span className="producto-precio-unitario">
                              ${formatearNumero(producto.precio_unitario)}
                            </span>
                            <span className="producto-subtotal">
                              ${formatearNumero(producto.subtotal)}
                            </span>
                          </>
                        ) : (
                          // Si es solo 1 unidad, mostrar solo el subtotal (que es igual al precio unitario)
                          <span className="producto-subtotal-solo">
                            ${formatearNumero(producto.subtotal)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="sin-productos">
                    <span>No hay detalles de productos para esta venta</span>
                  </div>
                )}

                  {/* Información adicional para ventas en efectivo */}
                  {operacion.metodoPago === 'efectivo' && (
                    <div className="info-efectivo">
                      <div className="info-item">
                        <span className="info-label">Recibido:</span>
                        <span className="info-valor">${formatearNumero(operacion.montoRecibido)}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Vuelto:</span>
                        <span className="info-valor">${formatearNumero(operacion.vuelto)}</span>
                      </div>
                    </div>
                  )}

                  {/* Descripción adicional 
                  {operacion.descripcion && (
                    <div className="nota-venta">
                      <strong>Nota:</strong> {operacion.descripcion}
                    </div>
                  )}
                  */}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
  // Si hay una caja abierta, mostrar el estado con detalle de ventas
  const cajaActual = cajaLocalAbierta || datosCaja;

  if (cajaAbierta === true && cajaActual) {
    return (
      <div className="estado-caja-moderno">
        <div className="caja-header-moderno">
          <div className="caja-info-principal">
            <div className="caja-badge">
            Caja Actualmente Abierta
            </div>
            <div className="caja-fecha">
              {new Date(cajaActual.fecha_hs_apertura).toLocaleDateString('es-AR')}
            </div>
          </div>
        </div>

        <div className="info-caja-moderna">
          <div className="info-item-moderno">
   
            <div className="info-content">
              <span className="label-info">Empleada: </span>
              <span className="info-value">{cajaActual.empleadoNombre}</span>
            </div>
          </div>
          
          <div className="info-item-moderno">
   
            <div className="info-content">
              <span className="label-info">Turno: </span>
              <span className="info-value">{cajaActual.turnoNombre}</span>
            </div>
          </div>
          
          <div className="info-item-moderno"> 
       
            <div className="info-content">
              <span className="label-info">Monto Inicial: </span>
              <span className="info-value">${formatearNumero(cajaActual.saldo_inicial)}</span>
            </div>
          </div>

          {cajaActual.descripcion && (
            <div className="info-item-moderno">
              <FaStickyNote className="info-icon" />
              <div className="info-content">
                <span className="info-label">Descripción</span>
                <span className="info-value">{cajaActual.descripcion}</span>
              </div>
            </div>
          )}
        </div>

        {/* Detalle de ventas del día */}
        <DetalleVentasDelDia />

        <div className="acciones-caja-modernas">
          <button 
            className="btn-primario"
            onClick={() => {
              if (onAperturaConfirmada) {
                onAperturaConfirmada(cajaActual);
              }
            }}
          >
            <FaShoppingCart /> Ir a Ventas
          </button>
          
          <button 
            className="btn-secundario"
            onClick={onCancelar}
          >
            <FaCashRegister /> Volver a Caja
          </button>
        </div>
      </div>
    );
  }

  // Estado normal - formulario de apertura de caja
  return (
    <div className="apertura-caja-container">
      <div className="apertura-caja-card">
        <div className="apertura-header">
          <h1>Apertura de caja</h1>
          <p className="subtitulo">Complete los siguientes datos para registrar la apertura de caja.</p>
        </div>

        <form className="formulario-apertura" onSubmit={(e) => e.preventDefault()}>
          {/* Fecha de apertura */}
          <div className="campo-grupo">
            <label htmlFor="fecha">
              Fecha de apertura:
            </label>
            <div className="input-with-icon">
              <input
                type="date"
                id="fecha"
                name="fecha"
                value={datosApertura.fecha}
                onChange={handleChange}
                className={`campo-input ${errores.fecha ? 'error' : ''}`}
              />
            </div>
            {errores.fecha && <span className="mensaje-error">{errores.fecha}</span>}
          </div>

          {/* Hora de apertura */}
          <div className="campo-grupo">
            <label htmlFor="hora">
              Hora de apertura:
            </label>
            <div className="input-with-icon">
              <input
                type="time"
                id="hora"
                name="hora"
                value={datosApertura.hora}
                onChange={handleChange}
                className={`campo-input ${errores.hora ? 'error' : ''}`}
              />
            </div>
            {errores.hora && <span className="mensaje-error">{errores.hora}</span>}
          </div>

          {/* Empleado */}
          <div className="campo-grupo">
            <label htmlFor="empleado">
              Empleada/o:
            </label>
            <div className="input-with-icon">
              <select
                id="empleado"
                name="empleado"
                value={datosApertura.empleado}
                onChange={handleChange}
                className={`campo-input ${errores.empleado ? 'error' : ''}`}
              >
                <option value="">Seleccionar empleada/o</option>
                {empleados.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre_emp} {emp.apellido_emp}
                  </option>
                ))}
              </select>
            </div>
            {errores.empleado && <span className="mensaje-error">{errores.empleado}</span>}
          </div>

          {/* Turno */}
          <div className="campo-grupo">
            <label htmlFor="turno">
              Turno:
            </label>
            <div className="input-with-icon">
              <select
                id="turno"
                name="turno"
                value={datosApertura.turno}
                onChange={handleChange}
                className={`campo-input ${errores.turno ? 'error' : ''}`}
              >
                <option value="">Seleccionar turno</option>
                {turnos.map(turno => (
                  <option key={turno.id} value={turno.id}>
                    {turno.nombre}
                  </option>
                ))}
              </select>
            </div>
            {errores.turno && <span className="mensaje-error">{errores.turno}</span>}
          </div>

          {/* Monto inicial */}
          <div className="campo-grupo">
            <label htmlFor="montoInicial">
              Monto inicial:
            </label>
            <div className="input-with-icon">
              <input
                type="number"
                id="montoInicial"
                name="montoInicial"
                value={datosApertura.montoInicial}
                onChange={handleChange}
                placeholder="$"
                step="0.01"
                min="0"
                className={`campo-input ${errores.montoInicial ? 'error' : ''}`}
              />
            </div>
            {errores.montoInicial && <span className="mensaje-error">{errores.montoInicial}</span>}
          </div>

          {/* Descripción */}
          <div className="campo-grupo">
            <label htmlFor="descripcion">
              Descripción:
            </label>
            <div className="input-with-icon">
              <textarea
                id="descripcion"
                name="descripcion"
                value={datosApertura.descripcion}
                onChange={handleChange}
                placeholder="Escribe aquí"
                className="campo-textarea"
                rows="3"
              />
            </div>
          </div>

          <div className="acciones-apertura">
            <button type="button" className="btn-cancelar-caja" onClick={onCancelar}>
              Cancelar
            </button>
            <button 
              type="button"
              className="btn-confirmar-caja"
              onClick={handleConfirmarApertura}
            >
              Confirmar apertura
            </button>
          </div>
        </form>
      </div>

      {/* Modal de confirmación - VERSIÓN UNIVERSAL */}
      <ModalConfirmacionUniversal
        mostrar={mostrarConfirmacion}
        tipo="confirmar"
        mensaje="¿Está seguro que desea confirmar la apertura de caja?"
        onCancelar={() => setMostrarConfirmacion(false)}
        onConfirmar={handleConfirmacionFinal}
        datosAdicionales={datosModal}
        mostrarResumen={true}
        modo="caja"
      />

      {/* Modal de éxito - VERSIÓN UNIVERSAL */}
      <ModalConfirmacionUniversal
        mostrar={mostrarExito}
        tipo="exito"
        mensaje="¡Caja abierta correctamente!"
        onCancelar={() => setMostrarExito(false)}
        onConfirmar={() => setMostrarExito(false)}
        datosAdicionales={datosModal}
        modo="caja"
      />
    </div>
  );
}

export default AperturaCaja;