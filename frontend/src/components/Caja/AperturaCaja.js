import React, { useState, useEffect } from 'react';
import { FaCashRegister, FaStickyNote, FaChartLine, FaShoppingCart, FaExchangeAlt, FaMoneyBill, FaList, FaCreditCard, FaMoneyCheckAlt, FaMobileAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './AperturaCaja.css';
import ModalConfirmacionUniversal from '../ModalConfirmacionUniversal/ModalConfirmacionUniversal';

function AperturaCaja({ onAperturaConfirmada, onCancelar, cajaAbierta, datosCaja, usuario }) {
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
  const [empleadoAutoSeleccionado, setEmpleadoAutoSeleccionado] = useState(null);
  const [cargandoEmpleado, setCargandoEmpleado] = useState(true);
  
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

  const navigate = useNavigate();

  const turnos = [
    { id: 'mañana', nombre: 'Turno Mañana' },
    { id: 'tarde', nombre: 'Turno Tarde' }
  ];

  // ✅ FUNCIÓN MEJORADA: Navegar a ventas
  const handleNavegarAVentas = () => {
    console.log('🔄 Navegando a ventas...');
    if (onAperturaConfirmada) {
      onAperturaConfirmada(cajaLocalAbierta || datosCaja);
    } else {
      navigate('/dashboard/ventas');
    }
  };

  // ✅ FUNCIÓN MEJORADA: Volver a caja
  const handleVolverACaja = () => {
    console.log('🔄 Volviendo a caja...');
    if (onCancelar) {
      onCancelar();
    } else {
      navigate('/dashboard/caja');
    }
  };

  // Función segura para formatear números
  const formatearNumero = (valor) => {
    const numero = parseFloat(valor) || 0;
    return numero.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // ✅ FUNCIÓN MEJORADA: Buscar empleada automáticamente
 // ✅ FUNCIÓN MEJORADA: Buscar empleada automáticamente
  const buscarEmpleadaAutomaticamente = (empleadosLista) => {
    console.log('🔄 Buscando empleada automáticamente...');

    if (usuario?.tipo_usuario === 'empleada') {
      let empleadoEncontrado = null;

      // ESTRATEGIA MEJORADA: Buscar por coincidencia parcial del nombre
      if (usuario.nombre) {
        const nombreUsuario = usuario.nombre.toLowerCase().trim();
        
        empleadoEncontrado = empleadosLista.find(emp => {
          const nombreCompletoEmpleado = `${emp.nombre_emp || ''} ${emp.apellido_emp || ''}`.toLowerCase().trim();
          const primerNombreEmpleado = (emp.nombre_emp || '').toLowerCase().trim();
          const primerNombreUsuario = nombreUsuario.split(' ')[0];
          
          // Buscar por coincidencia del primer nombre
          return primerNombreEmpleado.includes(primerNombreUsuario) || 
                nombreCompletoEmpleado.includes(primerNombreUsuario);
        });
      }

      if (empleadoEncontrado) {
        console.log('🎯 EMPLEADA ENCONTRADA:', empleadoEncontrado);
        setEmpleadoAutoSeleccionado(empleadoEncontrado);
        setDatosApertura(prev => ({
          ...prev,
          empleado: empleadoEncontrado.id.toString()
        }));
      } else {
        console.warn('⚠️ No se pudo encontrar empleada automáticamente, usando primera empleada');
        // Si no encuentra, usar la primera empleada de la lista
        const primeraEmpleada = empleadosLista.find(emp => emp.tipo_usuario === 'empleada') || empleadosLista[0];
        if (primeraEmpleada) {
          setEmpleadoAutoSeleccionado(primeraEmpleada);
          setDatosApertura(prev => ({
            ...prev,
            empleado: primeraEmpleada.id.toString()
          }));
        }
      }
      setCargandoEmpleado(false);
    } else {
      setCargandoEmpleado(false);
    }
  };

  // Cargar empleados desde la API
  const cargarEmpleados = async () => {
    try {
      console.log('🔄 Cargando información de empleados...');
      
      if (usuario?.tipo_usuario === 'empleada') {
        // ✅ PARA EMPLEADAS: Usar datos del usuario actual
        console.log('👩‍💼 Es empleada, usando datos del usuario:', usuario);
        
        // Crear un objeto de empleada con los datos del usuario
        const empleadoVirtual = {
          id: 1, // ID fijo ya que solo hay una empleada en este contexto
          nombre_emp: usuario.nombre?.split(' ')[0] || 'Empleada',
          apellido_emp: usuario.nombre?.split(' ').slice(1).join(' ') || 'Actual',
          email: usuario.email,
          tipo_usuario: 'empleada'
        };
        
        setEmpleados([empleadoVirtual]);
        setEmpleadoAutoSeleccionado(empleadoVirtual);
        setDatosApertura(prev => ({
          ...prev,
          empleado: "1" // Usar el ID como string
        }));
        setCargandoEmpleado(false);
        
        console.log('✅ Empleada configurada automáticamente:', empleadoVirtual);
        
      } else {
        // ✅ PARA JEFAS: Cargar lista completa de empleados
        console.log('👑 Es jefa, cargando lista completa de empleados');
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
          console.log('✅ Lista de empleados cargada para jefa:', data.length, 'empleados');
        } else {
          console.error('❌ Jefa no pudo cargar empleados:', response.status);
          // Si falla, al menos mostrar un mensaje
          setEmpleados([]);
        }
        setCargandoEmpleado(false);
      }
      
    } catch (error) {
      console.error('❌ Error cargando empleados:', error);
      setCargandoEmpleado(false);
    }
  };

  // Cargar ventas del día con detalles (mantener igual)
  const cargarVentasDelDia = async () => {
    if (!cajaAbierta || !datosCaja?.id) {
      console.log('DEBUG - No se puede cargar ventas: cajaAbierta=', cajaAbierta, 'datosCaja.id=', datosCaja?.id);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      console.log('DEBUG - Cargando ventas para caja:', datosCaja.id);
      
      const responseVentas = await fetch(`http://localhost:8000/api/ventas/?caja=${datosCaja.id}`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (responseVentas.ok) {
        const todasLasVentas = await responseVentas.json();
        console.log('DEBUG - Todas las ventas:', todasLasVentas);
        
        const movimientosCaja = todasLasVentas.filter(v => 
          v.descripcion?.includes('Ingreso') || 
          v.descripcion?.includes('Egreso')
        );
        
        console.log('DEBUG - Movimientos de caja:', movimientosCaja);

        const ventasNormales = todasLasVentas.filter(v => 
          !v.descripcion?.includes('Ingreso') && 
          !v.descripcion?.includes('Egreso')
        );

        console.log('DEBUG - Ventas normales:', ventasNormales);

        const ventasOrdenadas = [...ventasNormales, ...movimientosCaja].sort((a, b) => 
          new Date(b.fecha_hora_venta) - new Date(a.fecha_hora_venta)
        );

        setVentasDelDia(ventasOrdenadas);

        const nuevosDetalles = {};
        for (const venta of ventasNormales) {
          const detalles = await cargarDetallesVenta(venta.id);
          if (detalles && detalles.length > 0) {
            nuevosDetalles[venta.id] = detalles;
          }
        }
        setDetallesVentas(nuevosDetalles);

        calcularResumenGeneral(ventasNormales, movimientosCaja);
      } else {
        console.error('Error cargando ventas:', responseVentas.status);
      }
    } catch (error) {
      console.error('Error cargando ventas del día:', error);
    }
  };

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

  const calcularResumenGeneral = (ventasNormales, movimientosCaja) => {
    let totalVentas = 0;
    let ventasEfectivo = 0;
    let ventasTransferencia = 0;
    let ventasSaeta = 0;
    let ingresosExtra = 0;
    let egresos = 0;

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

  useEffect(() => {
    if (cajaAbierta) {
      cargarVentasDelDia();
      const intervalo = setInterval(cargarVentasDelDia, 15000);
      return () => clearInterval(intervalo);
    }
  }, [cajaAbierta, datosCaja]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // ✅ PREVENIR CAMBIOS EN EMPLEADO PARA EMPLEADAS
    if (name === 'empleado' && usuario?.tipo_usuario === 'empleada') {
      console.log('⚠️ Intento de cambiar empleado bloqueado para empleadas');
      return;
    }
    
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
    
    // ✅ VALIDACIÓN MEJORADA: Para empleadas, verificar que se encontró automáticamente
    if (!datosApertura.empleado) {
      if (usuario?.tipo_usuario === 'empleada') {
        nuevosErrores.empleado = 'No se pudo identificar automáticamente su perfil de empleada. Contacte a la administración.';
      } else {
        nuevosErrores.empleado = 'Debe seleccionar un empleado';
      }
    }
    
    if (!datosApertura.turno) nuevosErrores.turno = 'Debe seleccionar un turno';
    if (!datosApertura.montoInicial) nuevosErrores.montoInicial = 'El monto inicial es requerido';
    else if (parseFloat(datosApertura.montoInicial) <= 0) nuevosErrores.montoInicial = 'El monto debe ser mayor a 0';

    console.log('🔍 Validación - empleado seleccionado:', datosApertura.empleado);
    console.log('🔍 Validación - errores:', nuevosErrores);

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
          empleadoNombre: empleadoAutoSeleccionado ? 
            `${empleadoAutoSeleccionado.nombre_emp} ${empleadoAutoSeleccionado.apellido_emp}` : 
            (empleadoSeleccionado ? `${empleadoSeleccionado.nombre_emp} ${empleadoSeleccionado.apellido_emp}` : ''),
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
    empleadoNombre: empleadoAutoSeleccionado ? 
      `${empleadoAutoSeleccionado.nombre_emp} ${empleadoAutoSeleccionado.apellido_emp}` : 
      (empleadoSeleccionado ? `${empleadoSeleccionado.nombre_emp} ${empleadoSeleccionado.apellido_emp}` : ''),
    fecha: datosApertura.fecha,
    hora: datosApertura.hora,
    turnoNombre: turnoSeleccionado ? turnoSeleccionado.nombre : '',
    montoInicial: datosApertura.montoInicial
  };

  const DetalleVentasDelDia = () => {
    const agruparVentas = () => {
      const ventasAgrupadas = [];
      const ventasProcesadas = new Set();
      
      console.log('DEBUG - Ventas del día:', ventasDelDia);
      
      const ventasPorMontoYHora = {};
      
      ventasDelDia.forEach(venta => {
        if (!venta.fecha_hora_venta || !venta.total_venta) return;
        
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
        
        const montoRedondeado = parseFloat(venta.total_venta).toFixed(2);
        const horaRedondeada = new Date(venta.fecha_hora_venta);
        horaRedondeada.setSeconds(0, 0);
        const clave = `${montoRedondeado}_${horaRedondeada.getTime()}`;
        
        const ventasDuplicadas = ventasPorMontoYHora[clave] || [];
        
        if (ventasDuplicadas.length > 1) {
          console.log('DEBUG - Encontradas ventas duplicadas:', ventasDuplicadas);
          
          const ventaSaeta = ventasDuplicadas.find(v => v.descripcion?.includes('Saeta'));
          const ventaNormal = ventasDuplicadas.find(v => !v.descripcion?.includes('Saeta'));
          
          if (ventaSaeta) {
            console.log('DEBUG - Usando venta Saeta y omitiendo normal');
            
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

        <div className="lista-operaciones-moderna">
          {ventasAgrupadas.length === 0 ? (
            <div className="sin-operaciones">
              <FaList className="icono-sin-operaciones" />
              <p>No hay operaciones registradas hoy</p>
            </div>
          ) : (
            ventasAgrupadas.map((operacion) => (
              <div key={operacion.id} className={`operacion-card ${operacion.tipo}`}>
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
                  </div> 
                  
                  <div className="operacion-hora-total">
                    <span className="hora">{formatearHora(operacion.fecha_hora)}</span>
                    <span className="total">${formatearNumero(operacion.total)}</span>
                  </div>
                </div>

                {(operacion.tipo === 'ingreso' || operacion.tipo === 'egreso') && (
                  <div className="operacion-descripcion">
                    {operacion.descripcion}
                  </div>
                )}

                {operacion.tipo === 'saeta' && (
                  <>
                    <div className="operacion-descripcion">
                      {operacion.descripcion}
                    </div>
                    
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
                  {operacion.productos && operacion.productos.length > 0 ? (
                    <div className="detalle-productos-moderno">
                      {operacion.productos.map((producto, index) => (
                        <div key={`${operacion.id}-${producto.id || index}`} className="producto-item-moderno">
                    
                          <span className="producto-nombre">
                            {producto.producto_nombre || `Producto ${producto.producto_id || producto.producto || 'N/A'}`}
                          </span>
                          
                          {(producto.cantidad && producto.cantidad > 1) && (
                            <span className="producto-cantidad">x{producto.cantidad}</span>
                          )}
                          
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
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

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

        <DetalleVentasDelDia />

        <div className="acciones-caja-modernas">
          <button 
            className="btn-primario"
            onClick={handleNavegarAVentas}
          >
            <FaShoppingCart /> Ir a Ventas
          </button>
          
          <button 
            className="btn-secundario"
            onClick={handleVolverACaja}
          >
            <FaCashRegister /> Volver a Caja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="apertura-caja-container">
      <div className="apertura-caja-card">
        <div className="apertura-header">
          <h1>Apertura de caja</h1>
          <p className="subtitulo">Complete los siguientes datos para registrar la apertura de caja.</p>
        </div>

        <form className="formulario-apertura" onSubmit={(e) => e.preventDefault()}>
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

          <div className="campo-grupo">
            <label htmlFor="empleado">
              Empleada/o:
            </label>
            <div className="input-with-icon">
              {usuario?.tipo_usuario === 'empleada' ? (
                <div className="empleado-auto-seleccionado">
                  <input
                    type="text"
                    value={
                      empleadoAutoSeleccionado 
                        ? `${empleadoAutoSeleccionado.nombre_emp} ${empleadoAutoSeleccionado.apellido_emp}`
                        : usuario?.nombre || "Empleada Actual"
                    }
                    readOnly
                    className={`campo-input campo-solo-lectura ${
                      !empleadoAutoSeleccionado ? 'campo-error' : ''
                    }`}
                  />
                </div>
              ) : (
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
              )}
            </div>
            {errores.empleado && <span className="mensaje-error">{errores.empleado}</span>}
          </div>

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
            <button type="button" className="btn-cancelar-caja" onClick={handleVolverACaja}>
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