// VentasSaeta.js
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
  const [gananciaCalculada, setGananciaCalculada] = useState(0);
  const [mostrarModalConfirmar, setMostrarModalConfirmar] = useState(false);

  // Calcular ganancia cuando cambien monto o porcentaje
  useEffect(() => {
    calcularGanancia();
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
      setGananciaCalculada(0);
    }
  }, [mostrar]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calcularGanancia = () => {
    const monto = parseFloat(formData.monto_saeta) || 0;
    const porcentaje = parseFloat(formData.porcentaje_ganancia_saeta) || 0;
    
    if (monto > 0 && porcentaje > 0) {
      const ganancia = (monto * porcentaje) / 100;
      setGananciaCalculada(ganancia);
    } else {
      setGananciaCalculada(0);
    }
  };

  const handleConfirmarVentaSaeta = async () => {
    if (!formData.monto_saeta || parseFloat(formData.monto_saeta) <= 0) {
      alert('Por favor ingrese un monto válido');
      return;
    }

    try {
      setCalculando(true);
      const token = localStorage.getItem('token');

      // Crear la venta Saeta SIN detalle_venta (campo opcional)
      const ventaSaetaData = {
        monto_saeta: parseFloat(formData.monto_saeta),
        fecha_pago_saeta: formData.fecha_pago_saeta,
        porcentaje_ganancia_saeta: parseFloat(formData.porcentaje_ganancia_saeta),
        descripcion: formData.descripcion || 'Recarga Saeta'
      };

      console.log('📤 Creando venta Saeta:', ventaSaetaData);

      const response = await fetch('http://localhost:8000/api/ventas_saeta/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(ventaSaetaData)
      });

      if (response.ok) {
        const ventaSaetaCreada = await response.json();
        console.log('✅ Venta Saeta creada:', ventaSaetaCreada);
        
        // Cerrar modales
        setMostrarModalConfirmar(false);
        
        // Notificar a Ventas.js que se creó una venta Saeta
        if (onVentaSaetaCreada) {
          onVentaSaetaCreada(ventaSaetaCreada);
        }
        
        // Mostrar éxito y cerrar
        setTimeout(() => {
          onCerrar();
          alert('✅ Venta Saeta registrada exitosamente');
        }, 500);
        
      } else {
        const errorData = await response.json();
        console.error('❌ Error creando venta Saeta:', errorData);
        alert('Error al crear venta Saeta: ' + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error('❌ Error creando venta Saeta:', error);
      alert('Error de conexión al crear venta Saeta');
    } finally {
      setCalculando(false);
    }
  };

  const datosParaModal = {
    montoSaeta: parseFloat(formData.monto_saeta) || 0,
    porcentaje: parseFloat(formData.porcentaje_ganancia_saeta) || 0,
    ganancia: gananciaCalculada,
    totalSaeta: (parseFloat(formData.monto_saeta) || 0) - gananciaCalculada
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
                <span className="label">Monto Recarga:</span>
                <span className="valor">
                  ${formData.monto_saeta ? parseFloat(formData.monto_saeta).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="item-resumen">
                <span className="label">Porcentaje Ganancia:</span>
                <span className="valor">
                  {formData.porcentaje_ganancia_saeta}%
                </span>
              </div>
              <div className="item-resumen ganancia">
                <span className="label">Ganancia Drugstore:</span>
                <span className="valor destacado">
                  ${gananciaCalculada.toFixed(2)}
                </span>
              </div>
              <div className="item-resumen total-saeta">
                <span className="label">Total para Saeta:</span>
                <span className="valor total">
                  ${formData.monto_saeta ? (parseFloat(formData.monto_saeta) - gananciaCalculada).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="formulario-saeta">
            <div className="campo-grupo-saeta">
              <label htmlFor="monto_saeta">
                <FaCalculator className="icono-campo" />
                Monto de Recarga Saeta *
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
                className="campo-input-saeta"
                required
              />
            </div>

            <div className="campo-grupo-saeta">
              <label htmlFor="porcentaje_ganancia_saeta">
                <FaPercentage className="icono-campo" />
                Porcentaje de Ganancia *
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
                <FaCalendarAlt className="icono-campo" />
                Fecha de Pago
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
                <FaStickyNote className="icono-campo" />
                Descripción / Notas
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Ej: Recarga de saldo, pago de servicio, etc."
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
            disabled={calculando || !formData.monto_saeta}
          >
            {calculando ? 'Procesando...' : 'Confirmar Venta Saeta'}
          </button>
        </div>
      </div>

      {/* Modal de Confirmación */}
      <ModalConfirmacion
        mostrar={mostrarModalConfirmar}
        tipo="confirmar"
        mensaje="¿Está seguro que desea registrar esta venta Saeta?"
        onConfirmar={handleConfirmarVentaSaeta}
        onCancelar={() => setMostrarModalConfirmar(false)}
        datosVenta={datosParaModal}
      />
    </div>
  );
}

export default VentasSaeta;