import React, { useState, useEffect } from 'react';
import ModalConfirmacion from '../Caja/ModalConfirmacion'; // ✅ Asegúrate de importar el modal
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
  
  // ✅ NUEVOS ESTADOS PARA MODALES
  const [mostrarModalConfirmar, setMostrarModalConfirmar] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mostrarModalCancelar, setMostrarModalCancelar] = useState(false);

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
    // ... (mantén todo el código existente de calcularResumen igual)
    // Solo copio una parte para mantener la estructura
    const ventasIdsConSaeta = ventasSaeta.map(saeta => saeta.venta);
    
    const ventasReales = ventas.filter(venta => 
      !ventasIdsConSaeta.includes(venta.id) && 
      !venta.descripcion?.toLowerCase().includes('ingreso') &&
      !venta.descripcion?.toLowerCase().includes('egreso')
    );
    
    // ... resto del código de calcularResumen
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

  // ✅ CORREGIDO: Cálculo del TOTAL TEÓRICO (lo que debería haber en caja)
  const calcularTotalTeorico = () => {
    const montoInicial = parseFloat(datosCaja?.saldo_inicial) || 0;
    
    const efectivoEnCaja = resumenVentas.ventasEfectivo + resumenVentas.ingresosExtra;
    const egresosDeCaja = resumenVentas.egresos;
    const comisionSaeta = resumenVentas.comisionSaeta;
    
    const resultado = montoInicial + efectivoEnCaja - egresosDeCaja - comisionSaeta;
    
    return Math.min(resultado, 99999999.99);
  };

  // ✅ NUEVO: Cálculo de la diferencia
  const calcularDiferencia = () => {
    const montoContado = parseFloat(datosCierre.monto_contado) || 0;
    const totalTeorico = calcularTotalTeorico();
    const resultado = montoContado - totalTeorico;
    
    return Math.min(Math.max(resultado, -99999999.99), 99999999.99);
  };

  // FUNCIÓN PARA VALIDAR Y FORMATEAR NÚMEROS
  const validarYFormatearNumero = (numero) => {
    const numeroRedondeado = Math.round(numero * 100) / 100;
    return Math.min(numeroRedondeado, 99999999.99);
  };

  // ✅ NUEVA FUNCIÓN: Validar antes de mostrar modal de confirmación
  const handleValidarYMostrarConfirmacion = () => {
    if (!datosCierre.monto_contado) {
      alert('Por favor ingrese el monto contado');
      return;
    }

    const montoContado = parseFloat(datosCierre.monto_contado);
    if (montoContado > 99999999.99) {
      alert('El monto contado es demasiado grande. El máximo permitido es $99,999,999.99');
      return;
    }

    setMostrarModalConfirmar(true);
  };

  // ✅ FUNCIÓN MEJORADA: Confirmar cierre (llamada desde el modal)
  const handleConfirmarCierre = async () => {
    console.log('🔄 ===== INICIANDO CONFIRMACIÓN DE CIERRE =====');
    
    try {
      setProcesando(true);
      setMostrarModalConfirmar(false); // Cerrar modal de confirmación
      
      const token = localStorage.getItem('token');

      // CALCULAR Y VALIDAR TODOS LOS MONTOS
      const saldoFinal = validarYFormatearNumero(calcularTotalTeorico());
      const montoContadoValidado = validarYFormatearNumero(parseFloat(datosCierre.monto_contado));

      console.log('🔢 Montos validados para enviar:', {
        saldoFinal,
        montoContado: montoContadoValidado,
        totalTeorico: calcularTotalTeorico(),
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
          
          // ✅ MOSTRAR MODAL DE ÉXITO
          setMostrarModalExito(true);
          
          // Cerrar automáticamente después de 2 segundos y redirigir
          setTimeout(() => {
            setMostrarModalExito(false);
            if (onCierreConfirmado) {
              onCierreConfirmado();
            }
          }, 2000);
          
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

  // ✅ NUEVA FUNCIÓN: Manejar cancelación con modal
  const handleCancelarConConfirmacion = () => {
    setMostrarModalCancelar(true);
  };

  // ✅ NUEVA FUNCIÓN: Confirmar cancelación
  const handleConfirmarCancelacion = () => {
    setMostrarModalCancelar(false);
    if (onCancelar) {
      onCancelar();
    }
  };

  if (cargando) {
    return (
      <div className="cierre-caja-container">
        <div className="cargando">Cargando datos para cierre de caja...</div>
      </div>
    );
  }

  const totalTeorico = calcularTotalTeorico();
  const diferencia = calcularDiferencia();

  // ✅ DATOS PARA EL MODAL DE CONFIRMACIÓN
  const datosParaModalConfirmacion = {
    totalTeorico: totalTeorico,
    montoContado: parseFloat(datosCierre.monto_contado) || 0,
    diferencia: diferencia,
    observaciones: datosCierre.observaciones
  };

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
            
            <div className="fila-arqueo ingreso">
              <span>+ Ingresos extra:</span>
              <strong>${resumenVentas.ingresosExtra.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
            
            <div className="fila-arqueo egreso">
              <span>- Egresos:</span>
              <strong>${resumenVentas.egresos.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>

            <div className="fila-arqueo ingreso">
              <span>+ Ventas Efectivo:</span>
              <strong>${resumenVentas.ventasEfectivo.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>

            <div className="fila-arqueo egreso">
              <span>- Comisión Saeta:</span>
              <strong>${resumenVentas.comisionSaeta.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>

            <div className="fila-arqueo total">
              <span>TOTAL TEÓRICO:</span>
              <strong>${totalTeorico.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>

            <div className="campo-contado">
              <label>MONTO CONTADO:</label>
              <div className="input-contado">
                <span className="simbolo-peso">$</span>
                <input
                  type="number"
                  name="monto_contado"
                  value={datosCierre.monto_contado}
                  onChange={handleChange}
                  onWheel={(e) => e.target.blur()} // ✅ Desactiva scroll del mouse
                  onKeyDown={(e) => {
                    // ✅ Previene cambiar el valor con flechas arriba/abajo
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  max="99999999.99"
                />
              </div>
            </div>
            <div className="fila-arqueo">
              <span>- Total Teórico:</span>
              <strong>${totalTeorico.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>

            <div className={`fila-arqueo diferencia ${diferencia >= 0 ? 'positiva' : 'negativa'}`}>
              <span>DIFERENCIA:</span>
              <strong>${diferencia.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
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
            onClick={handleCancelarConConfirmacion} // ✅ Cambiado para usar modal
            disabled={procesando}
          >
            Cancelar
          </button>
        )}
  
        <button 
          className="btn-confirmar-cierre"
          onClick={handleValidarYMostrarConfirmacion} // ✅ Cambiado para usar modal
          disabled={procesando || !datosCierre.monto_contado}
        > 
          {procesando ? 'Procesando...' : 'Confirmar Cierre'}
        </button>
      </div>

      {/* ✅ MODAL DE CONFIRMACIÓN DE CIERRE */}
      <ModalConfirmacion
        mostrar={mostrarModalConfirmar}
        tipo="confirmar"
        mensaje="¿Está seguro que desea confirmar el cierre de caja?"
        onConfirmar={handleConfirmarCierre}
        onCancelar={() => setMostrarModalConfirmar(false)}
        datosVenta={datosParaModalConfirmacion}
      />

      {/* ✅ MODAL DE ÉXITO */}
      <ModalConfirmacion
        mostrar={mostrarModalExito}
        tipo="exito"
        mensaje="¡Cierre de caja registrado exitosamente!"
        onConfirmar={() => {
          setMostrarModalExito(false);
          if (onCierreConfirmado) {
            onCierreConfirmado();
          }
        }}
        onCancelar={() => {
          setMostrarModalExito(false);
          if (onCierreConfirmado) {
            onCierreConfirmado();
          }
        }}
      />

      {/* ✅ MODAL DE CONFIRMACIÓN DE CANCELACIÓN */}
      <ModalConfirmacion
        mostrar={mostrarModalCancelar}
        tipo="cancelar"
        mensaje="¿Está seguro que desea cancelar el cierre de caja? Los datos ingresados se perderán."
        onConfirmar={handleConfirmarCancelacion}
        onCancelar={() => setMostrarModalCancelar(false)}
      />
    </div>
  );
}

export default CierreCaja;