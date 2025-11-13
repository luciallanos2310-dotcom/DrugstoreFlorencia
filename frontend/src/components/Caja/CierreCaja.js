import React, { useState, useEffect } from 'react';
import { FaCalculator, FaMoneyBillWave, FaCashRegister, FaFileExport, FaTimes } from 'react-icons/fa';
import './CierreCaja.css';

function CierreCaja({ cajaId, datosCaja, onCierreConfirmado, onCancelar }) {
  const [datosCierre, setDatosCierre] = useState({
    monto_contado: '',
    observaciones: ''
  });
  const [resumenVentas, setResumenVentas] = useState({
    totalOperaciones: 0,
    totalVentas: 0,
    ventasEfectivo: 0,
    ventasTransferencia: 0,
    totalSaeta: 0,
    comisionSaeta: 0,
    ingresosExtra: 0,
    egresos: 0
  });
  const [procesando, setProcesando] = useState(false);
  const [cargando, setCargando] = useState(true);

  // Cargar datos de la caja y ventas
  const cargarDatosCierre = async () => {
    try {
      setCargando(true);
      const token = localStorage.getItem('token');

      console.log('🔄 ===== INICIANDO CARGA DE DATOS PARA CIERRE =====');
      console.log('🔑 Caja ID:', cajaId);
      console.log('🔑 Token disponible:', !!token);

      // 1. Obtener datos de la caja ACTUAL
      console.log('📦 Obteniendo datos de caja...');
      const responseCaja = await fetch(`http://localhost:8000/api/cajas/${cajaId}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });

      if (!responseCaja.ok) {
        console.error('❌ Error cargando caja:', responseCaja.status, responseCaja.statusText);
        throw new Error('Error cargando caja');
      }
      
      const caja = await responseCaja.json();
      console.log('✅ Datos de caja actual:', caja);
      console.log('📅 Fecha apertura caja:', caja.fecha_hs_apertura);

      // 2. Obtener SOLO las ventas de ESTA caja específica
      const urlVentas = `http://localhost:8000/api/ventas/?caja=${cajaId}`;
      console.log('🔗 URL de ventas:', urlVentas);
      
      const responseVentas = await fetch(urlVentas, {
        headers: { 'Authorization': `Token ${token}` }
      });

      let ventas = [];
      if (responseVentas.ok) {
        ventas = await responseVentas.json();
        console.log('💰 VENTAS ENCONTRADAS - Cantidad:', ventas.length);
        console.log('📋 Detalle completo de ventas:', ventas);
        
        // Log detallado de cada venta
        ventas.forEach((venta, index) => {
          console.log(`   ${index + 1}. Venta ID: ${venta.id}, Total: $${venta.total_venta}, Método: ${venta.tipo_pago_venta}, Descripción: ${venta.descripcion}`);
        });
      } else {
        console.log('❌ Error obteniendo ventas:', responseVentas.status, responseVentas.statusText);
      }

      // 3. Obtener ventas Saeta - FILTRAR MANUALMENTE por ventas de esta caja
      let ventasSaeta = [];
      try {
        // Obtener TODAS las ventas Saeta primero
        const responseSaeta = await fetch(`http://localhost:8000/api/ventas_saeta/`, {
          headers: { 'Authorization': `Token ${token}` }
        });

        if (responseSaeta.ok) {
          const todasSaeta = await responseSaeta.json();
          console.log('📱 TODAS las ventas Saeta (sin filtrar):', todasSaeta.length);
          
          // FILTRAR: solo ventas Saeta que están asociadas a ventas de ESTA caja
          ventasSaeta = todasSaeta.filter(saeta => {
            if (saeta.venta) {
              // Verificar si la venta asociada pertenece a esta caja
              const ventaAsociada = ventas.find(v => v.id === saeta.venta);
              return ventaAsociada !== undefined;
            }
            return false; // Si no tiene venta asociada, no contar
          });
          
          console.log('🎯 VENTAS SAETA FILTRADAS (solo de esta caja):', ventasSaeta.length);
          console.log('📋 Detalle de ventas Saeta filtradas:', ventasSaeta);
          
          // Log detallado de cada venta Saeta filtrada
          ventasSaeta.forEach((saeta, index) => {
            console.log(`   ${index + 1}. Saeta ID: ${saeta.id}, Monto: $${saeta.monto_saeta}, Venta ID: ${saeta.venta}, Fecha: ${saeta.fecha_pago_saeta}`);
          });
        } else {
          console.log('❌ Error obteniendo ventas Saeta:', responseSaeta.status, responseSaeta.statusText);
        }
      } catch (error) {
        console.log('❌ Error cargando ventas Saeta:', error);
      }

      // Resumen final de lo encontrado
      console.log('📊 ===== RESUMEN DE DATOS ENCONTRADOS =====');
      console.log('📍 Ventas normales:', ventas.length);
      console.log('📍 Ventas Saeta (filtradas):', ventasSaeta.length);

      // Calcular resumen
      calcularResumen(ventas, ventasSaeta, caja);

    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      alert('Error al cargar datos para el cierre');
    } finally {
      setCargando(false);
    }
  };

  const calcularResumen = (ventas, ventasSaeta, caja) => {
    console.log('🧮 ===== INICIANDO CÁLCULO DE RESUMEN =====');
    console.log('📥 Datos recibidos:', { 
      ventasCount: ventas.length, 
      saetaCount: ventasSaeta.length, 
      cajaId: caja.id
    });
    
    // ✅ CORRECCIÓN: IDENTIFICAR qué ventas normales son realmente ventas Saeta
    const ventasIdsConSaeta = ventasSaeta.map(saeta => saeta.venta);
    console.log('🔍 IDs de ventas que tienen Saeta asociada:', ventasIdsConSaeta);
    
    // ✅ FILTRAR: Separar ventas normales REALES de ventas Saeta Y de ingresos/egresos
    const ventasReales = ventas.filter(venta => 
      !ventasIdsConSaeta.includes(venta.id) && 
      !venta.descripcion?.toLowerCase().includes('ingreso') &&
      !venta.descripcion?.toLowerCase().includes('egreso')
    );
    
    const ventasSaetaComoNormales = ventas.filter(venta => 
      ventasIdsConSaeta.includes(venta.id)
    );
    
    // ✅ NUEVO: Filtrar ingresos y egresos
    const ingresosExtra = ventas.filter(venta => 
      venta.descripcion?.toLowerCase().includes('ingreso')
    );
    
    const egresosExtra = ventas.filter(venta => 
      venta.descripcion?.toLowerCase().includes('egreso')
    );
    
    console.log('📊 VENTAS SEPARADAS:');
    console.log('   - Ventas reales (productos):', ventasReales.length);
    console.log('   - Ventas Saeta (como normales):', ventasSaetaComoNormales.length);
    console.log('   - Ingresos extra:', ingresosExtra.length);
    console.log('   - Egresos extra:', egresosExtra.length);
    
    // Log detallado de ingresos y egresos encontrados
    ingresosExtra.forEach(ingreso => {
      console.log(`   💰 INGRESO: ID ${ingreso.id}, Monto: $${ingreso.total_venta}, Desc: ${ingreso.descripcion}`);
    });
    
    egresosExtra.forEach(egreso => {
      console.log(`   💰 EGRESO: ID ${egreso.id}, Monto: $${egreso.total_venta}, Desc: ${egreso.descripcion}`);
    });

    // Calcular total de ingresos y egresos
    const totalIngresosExtra = ingresosExtra.reduce((sum, ingreso) => {
      const monto = parseFloat(ingreso.total_venta || 0);
      console.log(`   💰 Ingreso extra ${ingreso.id}: $${monto}`);
      return sum + monto;
    }, 0);
    
    const totalEgresosExtra = egresosExtra.reduce((sum, egreso) => {
      const monto = parseFloat(egreso.total_venta || 0);
      console.log(`   💰 Egreso extra ${egreso.id}: $${monto}`);
      return sum + monto;
    }, 0);

    // Ventas normales REALES - SOLO de esta caja
    const ventasEfectivoReales = ventasReales.filter(v => v.tipo_pago_venta === 'efectivo');
    const ventasTransferenciaReales = ventasReales.filter(v => v.tipo_pago_venta === 'transferencia');
    
    console.log('💵 Ventas REALES por método:');
    console.log('   - Efectivo real:', ventasEfectivoReales.length);
    console.log('   - Transferencia real:', ventasTransferenciaReales.length);

    const totalVentasEfectivo = ventasEfectivoReales.reduce((sum, v) => {
      const total = parseFloat(v.total_venta || 0);
      console.log(`   💰 Venta efectivo REAL ${v.id}: $${total}`);
      return sum + total;
    }, 0);

    const totalVentasTransferencia = ventasTransferenciaReales.reduce((sum, v) => {
      const total = parseFloat(v.total_venta || 0);
      console.log(`   💰 Venta transferencia REAL ${v.id}: $${total}`);
      return sum + total;
    }, 0);

    const totalVentas = totalVentasEfectivo + totalVentasTransferencia;

    // Ventas Saeta - TODAS las que están en esta caja
    const totalSaeta = ventasSaeta.reduce((sum, s) => {
      const monto = parseFloat(s.monto_saeta || 0);
      console.log(`   📱 Saeta ${s.id}: $${monto}`);
      return sum + monto;
    }, 0);

    const comisionSaeta = ventasSaeta.reduce((sum, s) => {
      const monto = parseFloat(s.monto_saeta || 0);
      const porcentaje = parseFloat(s.porcentaje_ganancia_saeta || 15);
      const comision = (monto * porcentaje) / 100;
      console.log(`   📱 Comisión Saeta ${s.id}: $${monto} * ${porcentaje}% = $${comision}`);
      return sum + comision;
    }, 0);

    console.log('💰 TOTALES CALCULADOS:');
    console.log('   - Total ventas efectivo REAL:', totalVentasEfectivo);
    console.log('   - Total ventas transferencia REAL:', totalVentasTransferencia);
    console.log('   - Total ventas general REAL:', totalVentas);
    console.log('   - Total Saeta:', totalSaeta);
    console.log('   - Comisión Saeta:', comisionSaeta);
    console.log('   - Ingresos extra:', totalIngresosExtra);
    console.log('   - Egresos extra:', totalEgresosExtra);

    // ✅ CORRECCIÓN: CALCULAR OPERACIONES - Solo ventas reales + ventas Saeta únicas
    const totalOperaciones = ventasReales.length;
    console.log('🔢 CÁLCULO DE OPERACIONES:');
    console.log(`   - Ventas reales: ${ventasReales.length}`);
    console.log(`   - Total operaciones: ${totalOperaciones}`);

    setResumenVentas({
      totalOperaciones: totalOperaciones,
      totalVentas: totalVentas,
      ventasEfectivo: totalVentasEfectivo,
      ventasTransferencia: totalVentasTransferencia,
      totalSaeta: totalSaeta,
      comisionSaeta: comisionSaeta,
      ingresosExtra: totalIngresosExtra, // ✅ Usar los calculados de las ventas
      egresos: totalEgresosExtra // ✅ Usar los calculados de las ventas
    });

    console.log('✅ ===== RESUMEN GUARDADO EN ESTADO =====');
    console.log('📊 Resumen final:', {
      totalOperaciones,
      totalVentas,
      ventasEfectivo: totalVentasEfectivo,
      ventasTransferencia: totalVentasTransferencia,
      totalSaeta,
      comisionSaeta,
      ingresosExtra: totalIngresosExtra,
      egresos: totalEgresosExtra
    });
  };

  useEffect(() => {
    if (cajaId) {
      console.log('🎯 useEffect ejecutado - cajaId:', cajaId);
      cargarDatosCierre();
    } else {
      console.log('❌ No hay cajaId proporcionado');
    }
  }, [cajaId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDatosCierre(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // CÁLCULOS CORREGIDOS - LIMITAR A 10 DÍGITOS
  const calcularMontoEsperado = () => {
    const montoInicial = parseFloat(datosCaja?.saldo_inicial) || 0;
    
    // SOLO el efectivo real que debería estar en caja
    const efectivoEnCaja = resumenVentas.ventasEfectivo + resumenVentas.ingresosExtra;
    
    // Egresos que salieron de caja
    const egresosDeCaja = resumenVentas.egresos;
    
    const resultado = montoInicial + efectivoEnCaja - egresosDeCaja;
    
    console.log('🧮 Cálculo monto esperado:', {
      montoInicial,
      efectivoEnCaja,
      egresosDeCaja,
      resultado
    });
    
    // LIMITAR a 10 dígitos (99999999.99)
    return Math.min(resultado, 99999999.99);
  };

  const calcularDiferencia = () => {
    const montoContado = parseFloat(datosCierre.monto_contado) || 0;
    const montoEsperado = calcularMontoEsperado();
    const resultado = montoContado - montoEsperado;
    
    console.log('🧮 Cálculo diferencia:', {
      montoContado,
      montoEsperado,
      resultado
    });
    
    // LIMITAR a 10 dígitos
    return Math.min(Math.max(resultado, -99999999.99), 99999999.99);
  };

  const calcularTotalGeneral = () => {
    // Para el saldo final, considerar TODOS los movimientos
    const montoInicial = parseFloat(datosCaja?.saldo_inicial) || 0;
    
    // Todos los ingresos (efectivo + transferencia + ingresos extra)
    const ingresosTotales = resumenVentas.totalVentas + resumenVentas.ingresosExtra;
    
    // Todos los egresos (egresos + comisión Saeta)
    const egresosTotales = resumenVentas.egresos + resumenVentas.comisionSaeta;
    
    const resultado = montoInicial + ingresosTotales - egresosTotales;
    
    console.log('🧮 Cálculo total general:', {
      montoInicial,
      ingresosTotales,
      egresosTotales,
      resultado
    });
    
    // LIMITAR a 10 dígitos (99999999.99) - máximo permitido por Django
    return Math.min(resultado, 99999999.99);
  };

  // FUNCIÓN PARA VALIDAR Y FORMATEAR NÚMEROS
  const validarYFormatearNumero = (numero) => {
    // Redondear a 2 decimales y limitar a 10 dígitos
    const numeroRedondeado = Math.round(numero * 100) / 100;
    return Math.min(numeroRedondeado, 99999999.99);
  };

  const handleConfirmarCierre = async () => {
    console.log('🔄 ===== INICIANDO CONFIRMACIÓN DE CIERRE =====');
    
    if (!datosCierre.monto_contado) {
      console.log('❌ Monto contado no ingresado');
      alert('Por favor ingrese el monto contado');
      return;
    }

    // Validar que el monto contado no sea demasiado grande
    const montoContado = parseFloat(datosCierre.monto_contado);
    if (montoContado > 99999999.99) {
      console.log('❌ Monto contado excede límite:', montoContado);
      alert('El monto contado es demasiado grande. El máximo permitido es $99,999,999.99');
      return;
    }

    try {
      setProcesando(true);
      const token = localStorage.getItem('token');

      // CALCULAR Y VALIDAR TODOS LOS MONTOS
      const saldoFinal = validarYFormatearNumero(calcularTotalGeneral());
      const montoContadoValidado = validarYFormatearNumero(montoContado);

      console.log('🔢 Montos validados para enviar:', {
        saldoFinal,
        montoContado: montoContadoValidado,
        montoEsperado: calcularMontoEsperado(),
        diferencia: calcularDiferencia(),
        observaciones: datosCierre.observaciones
      });

      const datosParaEnviar = {
        fecha_hs_cierre: new Date().toISOString(),
        saldo_final: saldoFinal,
        monto_contado: montoContadoValidado,
        descripcion: datosCierre.observaciones,
        estado: 'cerrada'
      };

      console.log('📤 Enviando cierre de caja al servidor:', datosParaEnviar);

      const response = await fetch(`http://localhost:8000/api/cajas/${cajaId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(datosParaEnviar)
      });

      if (response.ok) {
        const cajaActualizada = await response.json();
        console.log('✅ Caja cerrada exitosamente:', cajaActualizada);
        
        // VERIFICAR que realmente se cerró
        if (cajaActualizada.estado === 'cerrada') {
          console.log('✅ Estado confirmado: CERRADA');
          alert('✅ Cierre de caja registrado exitosamente');
          if (onCierreConfirmado) {
            onCierreConfirmado();
          }
        } else {
          console.log('❌ Estado incorrecto después del cierre:', cajaActualizada.estado);
          throw new Error('La caja no se cerró correctamente en el servidor');
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Error del servidor:', errorData);
        throw new Error(`Error: ${JSON.stringify(errorData)}`);
      }

    } catch (error) {
      console.error('❌ Error cerrando caja:', error);
      alert('Error al registrar cierre de caja: ' + error.message);
    } finally {
      setProcesando(false);
    }
  };

  if (cargando) {
    return (
      <div className="cierre-caja-container">
        <div className="cargando">Cargando datos para cierre de caja...</div>
      </div>
    );
  }

  const montoEsperado = calcularMontoEsperado();
  const diferencia = calcularDiferencia();
  const totalGeneral = calcularTotalGeneral();

  console.log('🎯 RENDERIZANDO COMPONENTE - Estado actual:', {
    resumenVentas,
    montoEsperado,
    diferencia,
    totalGeneral
  });

  return (
    <div className="cierre-caja-container">
      <div className="cierre-caja-header">
        <h1>Cierre de caja</h1>
        <h2>Usuario: {datosCaja?.empleadoNombre || 'No especificado'}</h2>
      </div>
    
    {/* Información de fecha y hora */}
      <div className="info-fecha">
        <div className="fecha-actual">
          <strong>Fecha:</strong> {new Date().toLocaleDateString('es-AR')}
        </div>
        <div className="hora-cierre">
          <strong>Hora de cierre:</strong> {new Date().toLocaleTimeString('es-AR', { 
            hour: '2-digit', minute: '2-digit' 
          })}
        </div>
      </div>


      <div className="cierre-caja-content">
        {/* Columna izquierda - Resumen de ventas */}
        <div className="columna-resumen">
          <h2>Resumen de ventas</h2>
          
          <div className="card-resumen">
            <div className="fila-resumen">
              <span>Total operaciones:</span>
              <strong>{resumenVentas.totalOperaciones}</strong>
            </div>
            
            <div className="fila-resumen total">
              <span>Total ventas:</span>
              <strong>${resumenVentas.totalVentas.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>

            <div className="seccion-metodos-pago">
              <h4>Método de pago:</h4>
              <div className="fila-resumen">
                <span>• Efectivo:</span>
                <strong>${resumenVentas.ventasEfectivo.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
              <div className="fila-resumen">
                <span>• Transferencia:</span>
                <strong>${resumenVentas.ventasTransferencia.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
            </div>

            {/* ✅ CORRECCIÓN: Solo mostrar "Total vendido" de Saeta en Resumen de Ventas */}
            <div className="seccion-saeta">
              <h4>Ventas Saeta:</h4>
              <div className="fila-resumen">
                <span>Total vendido:</span>
                <strong>${resumenVentas.totalSaeta.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha - Arqueo de caja */}
        <div className="columna-arqueo">
          <h2>ARQUEO DE CAJA</h2>
          
          <div className="card-arqueo">
            <div className="fila-arqueo">
              <span>Monto inicial:</span>
              <strong>${(parseFloat(datosCaja?.saldo_inicial) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
            
            {/* ✅ AHORA SÍ SE MOSTRARÁN LOS INGRESOS Y EGRESOS */}
            <div className="fila-arqueo ingreso">
              <span>Ingresos extra:</span>
              <strong>+${resumenVentas.ingresosExtra.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
            
            <div className="fila-arqueo egreso">
              <span>Egresos:</span>
              <strong>-${resumenVentas.egresos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>

            {/* ✅ CORRECCIÓN: Mostrar comisión Saeta y ingreso neto en Arqueo de Caja */}
            <div className="fila-arqueo egreso">
              <span>Comisión Saeta:</span>
              <strong>-${resumenVentas.comisionSaeta.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>

            <div className="fila-arqueo ingreso">
              <span>Ingreso neto Saeta:</span>
              <strong>+${(resumenVentas.totalSaeta - resumenVentas.comisionSaeta).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>

            <div className="fila-arqueo total">
              <span>Monto esperado:</span>
              <strong>${montoEsperado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>

            <div className="campo-contado">
              <label>Monto contado:</label>
              <div className="input-contado">
                <span className="simbolo-peso">$</span>
                <input
                  type="number"
                  name="monto_contado"
                  value={datosCierre.monto_contado}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  max="99999999.99"
                />
              </div>
            </div>

            <div className={`fila-arqueo diferencia ${diferencia >= 0 ? 'positiva' : 'negativa'}`}>
              <span>Diferencia:</span>
              <strong>${diferencia.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>

            <div className="fila-arqueo total-general">
              <span>TOTAL:</span>
              <strong>${totalGeneral.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de observaciones */}
      <div className="seccion-observaciones">
        <h3>Observaciones:</h3>
        <textarea
          name="observaciones"
          value={datosCierre.observaciones}
          onChange={handleChange}
          placeholder="Escribe aquí las observaciones del cierre..."
          rows="4"
        />
      </div>

      {/* Botones de acción */}
      <div className="acciones-cierre">
        {/* Botón Cancelar - SOLO si se proporciona onCancelar */}
        {onCancelar && (
          <button 
            className="btn-cancelar-cierre"
            onClick={onCancelar}
            disabled={procesando}
          >
            Cancelar
          </button>
        )}
  
        <button 
          className="btn-confirmar-cierre"
          onClick={handleConfirmarCierre}
          disabled={procesando}
        > 
          {procesando ? 'Procesando...' : 'Confirmar Cierre'}
        </button>
      </div>
    </div>
  );
}

export default CierreCaja;