import React, { useState, useEffect } from 'react';
import { FaCalculator, FaPercentage, FaCalendarAlt, FaStickyNote } from 'react-icons/fa';
import ModalConfirmacion from './ModalConfirmacion';
import './VentasSaeta.css';

function VentasSaeta({ mostrar, onCerrar, cajaId, onVentaSaetaCreada }) {
  const [formData, setFormData] = useState({
    monto_saeta: '',
    fecha_pago_saeta: new Date().toISOString().split('T')[0],
    porcentaje_ganancia_saeta: 15,
    descripcion: ''
  });
  const [calculando, setCalculando] = useState(false);
  const [gananciaDrugstore, setGananciaDrugstore] = useState(0);
  const [montoParaSaeta, setMontoParaSaeta] = useState(0);
  const [mostrarModalConfirmar, setMostrarModalConfirmar] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [mensajeError, setMensajeError] = useState('');

  // Calcular ganancias cuando cambien monto o porcentaje
  useEffect(() => {
    calcularGanancias();
  }, [formData.monto_saeta, formData.porcentaje_ganancia_saeta]);

  // Resetear form al abrir
  useEffect(() => {
    if (mostrar) {
      setFormData({
        monto_saeta: '',
        fecha_pago_saeta: new Date().toISOString().split('T')[0],
        porcentaje_ganancia_saeta: 15,
        descripcion: ''
      });
      setGananciaDrugstore(0);
      setMontoParaSaeta(0);
    }
  }, [mostrar]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calcularGanancias = () => {
    const montoTotal = parseFloat(formData.monto_saeta) || 0;
    const porcentajeSaeta = parseFloat(formData.porcentaje_ganancia_saeta) || 0;
    
    if (montoTotal > 0 && porcentajeSaeta > 0) {
      const montoSaeta = (montoTotal * porcentajeSaeta) / 100;
      const gananciaDrugstoreCalc = montoTotal - montoSaeta;
      
      setMontoParaSaeta(montoSaeta);
      setGananciaDrugstore(gananciaDrugstoreCalc);
    } else {
      setMontoParaSaeta(0);
      setGananciaDrugstore(0);
    }
  };

  const mostrarError = (mensaje) => {
    setMensajeError(mensaje);
    setMostrarModalError(true);
  };

  const handleConfirmarVentaSaeta = async () => {
    if (!formData.monto_saeta || parseFloat(formData.monto_saeta) <= 0) {
      mostrarError('Por favor ingrese un monto válido');
      return;
    }

    if (!cajaId) {
      mostrarError('Error: No se encontró la caja activa');
      return;
    }

    try {
      setCalculando(true);
      const token = localStorage.getItem('token');

      const montoTotal = parseFloat(formData.monto_saeta);
      const porcentajeSaeta = parseFloat(formData.porcentaje_ganancia_saeta);

      console.log('🔄 Iniciando creación de venta Saeta para caja:', cajaId);

      // ✅ 1. PRIMERO crear una VENTA para Saeta
      const ventaData = {
        caja: cajaId,
        total_venta: montoTotal,
        tipo_pago_venta: 'efectivo',
        monto_recibido: montoTotal,
        vuelto: 0,
        estado_venta: 'completada',
        descripcion: 'Venta Saeta - Recarga de saldo'
      };

      console.log('📤 Creando venta para Saeta:', ventaData);

      const responseVenta = await fetch('http://localhost:8000/api/ventas/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(ventaData)
      });

      if (!responseVenta.ok) {
        const errorData = await responseVenta.json();
        throw new Error(`Error creando venta: ${JSON.stringify(errorData)}`);
      }

      const ventaCreada = await responseVenta.json();
      console.log('✅ Venta creada para Saeta:', ventaCreada);

      // ✅ 2. LUEGO crear el DetalleVenta
      const detalleData = {
        venta: ventaCreada.id,
        producto: null,
        cantidad: 1,
        precio_unitario: montoTotal,
        subtotal: montoTotal
      };

      console.log('📤 Creando detalle venta para Saeta:', detalleData);

      const responseDetalle = await fetch('http://localhost:8000/api/detalle_ventas/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(detalleData)
      });

      if (!responseDetalle.ok) {
        await fetch(`http://localhost:8000/api/ventas/${ventaCreada.id}/`, {
          method: 'DELETE',
          headers: { 'Authorization': `Token ${token}` }
        });
        throw new Error('Error creando detalle venta');
      }

      const detalleCreado = await responseDetalle.json();
      console.log('✅ Detalle venta creado:', detalleCreado);

      // ✅ 3. FINALMENTE crear la VentaSaeta
      const ventaSaetaData = {
        detalle_venta: detalleCreado.id,
        venta: ventaCreada.id,
        monto_saeta: montoTotal,
        fecha_pago_saeta: formData.fecha_pago_saeta,
        porcentaje_ganancia_saeta: porcentajeSaeta,
        ganancia_drugstore: gananciaDrugstore,
        descripcion: formData.descripcion || 'Recarga Saeta'
      };

      console.log('📤 Creando venta Saeta:', ventaSaetaData);

      const responseSaeta = await fetch('http://localhost:8000/api/ventas_saeta/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(ventaSaetaData)
      });

      if (responseSaeta.ok) {
        const ventaSaetaCreada = await responseSaeta.json();
        console.log('✅ Venta Saeta creada:', ventaSaetaCreada);
        
        // Notificar a Ventas.js
        if (onVentaSaetaCreada) {
          onVentaSaetaCreada(ventaSaetaCreada);
        }
        
        setMostrarModalConfirmar(false);
        setMostrarModalExito(true);
        
        setTimeout(() => {
          setMostrarModalExito(false);
          onCerrar();
        }, 2000);
        
      } else {
        const errorData = await responseSaeta.json();
        console.error('❌ Error creando venta Saeta:', errorData);
        
        // Limpiar recursos creados en caso de error
        await fetch(`http://localhost:8000/api/detalle_ventas/${detalleCreado.id}/`, {
          method: 'DELETE',
          headers: { 'Authorization': `Token ${token}` }
        });
        await fetch(`http://localhost:8000/api/ventas/${ventaCreada.id}/`, {
          method: 'DELETE',
          headers: { 'Authorization': `Token ${token}` }
        });
        
        mostrarError('Error al crear venta Saeta: ' + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error('❌ Error creando venta Saeta:', error);
      mostrarError('Error de conexión al crear venta Saeta: ' + error.message);
    } finally {
      setCalculando(false);
    }
  };

  const datosParaModal = {
    montoTotal: parseFloat(formData.monto_saeta) || 0,
    porcentajeSaeta: parseFloat(formData.porcentaje_ganancia_saeta) || 0,
    montoParaSaeta: montoParaSaeta,
    gananciaDrugstore: gananciaDrugstore
  };

  if (!mostrar) return null;

  return (
    <div className="modal-overlay-saeta" onClick={onCerrar}>
      <div className="modal-saeta" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-saeta">
          <h2>Venta Saeta</h2>
          <button className="btn-cerrar-saeta" onClick={onCerrar}>
            ×
          </button>
        </div>

        <div className="modal-body-saeta">
          {/* Resumen de cálculo */}
          <div className="resumen-calculo-saeta">
            <div className="tarjeta-resumen">
              <div className="item-resumen">
                <span className="label">Monto Total Recarga:</span>
                <span className="valor">
                  ${formData.monto_saeta ? parseFloat(formData.monto_saeta).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="item-resumen">
                <span className="label">Porcentaje</span>
                <span className="valor">
                  {formData.porcentaje_ganancia_saeta}%
                </span>
              </div>
              <div className="item-resumen monto-saeta">
                <span className="label">Ganancia Saeta</span>
                <span className="valor saeta">
                  ${montoParaSaeta.toFixed(2)}
                </span>
              </div>
              <div className="item-resumen ganancia-drugstore">
                <span className="label">Ganancia Drugstore:</span>
                <span className="valor destacado">
                  ${gananciaDrugstore.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="formulario-saeta">
            <div className="campo-grupo-saeta">
              <label htmlFor="monto_saeta">
                Monto Total de Recarga *
              </label>
              <input
                type="number"
                id="monto_saeta"
                name="monto_saeta"
                value={formData.monto_saeta}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                max="999999.99"
                className="campo-input-saeta"
                required
              />
            </div>

            <div className="campo-grupo-saeta">
              <label htmlFor="porcentaje_ganancia_saeta">
                Porcentaje *
              </label>
              <input
                type="number"
                id="porcentaje_ganancia_saeta"
                name="porcentaje_ganancia_saeta"
                value={formData.porcentaje_ganancia_saeta}
                onChange={handleChange}
                step="0.1"
                min="0"
                max="100"
                className="campo-input-saeta"
                required
              />
            </div>

            <div className="campo-grupo-saeta">
              <label htmlFor="fecha_pago_saeta">
                Fecha
              </label>
              <input
                type="date"
                id="fecha_pago_saeta"
                name="fecha_pago_saeta"
                value={formData.fecha_pago_saeta}
                onChange={handleChange}
                className="campo-input-saeta"
              />
            </div>

            <div className="campo-grupo-saeta">
              <label htmlFor="descripcion">
                Descripción 
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className="campo-textarea-saeta"
                rows="3"
              />
            </div>
          </div>
        </div>
        <div className="modal-footer-saeta">
          <button 
            className="btn-cancelar-saeta" 
            onClick={onCerrar}
            disabled={calculando}
          >
            Cancelar
          </button>
          <button 
            className="btn-confirmar-saeta"
            onClick={() => setMostrarModalConfirmar(true)}
            disabled={calculando || !formData.monto_saeta || !cajaId}
          >
            {calculando ? 'Procesando...' : 'Confirmar Venta Saeta'}
          </button>
        </div>
      </div>

      {/* Modal de Confirmación */}
      <ModalConfirmacion
        mostrar={mostrarModalConfirmar}
        tipo="confirmar_saeta"
        mensaje="¿Está seguro que desea registrar esta venta Saeta?"
        onConfirmar={handleConfirmarVentaSaeta}
        onCancelar={() => setMostrarModalConfirmar(false)}
      />

      {/* Modal de Éxito */}
      <ModalConfirmacion
        mostrar={mostrarModalExito}
        tipo="exito"
        mensaje="¡Venta Saeta registrada exitosamente!"
        onConfirmar={() => {
          setMostrarModalExito(false);
          onCerrar();
        }}
        onCancelar={() => {
          setMostrarModalExito(false);
          onCerrar();
        }}
      />

      {/* Modal de Error */}
      <ModalConfirmacion
        mostrar={mostrarModalError}
        tipo="error"
        mensaje={mensajeError}
        onConfirmar={() => setMostrarModalError(false)}
        onCancelar={() => setMostrarModalError(false)}
      />
    </div>
  );
}

export default VentasSaeta;