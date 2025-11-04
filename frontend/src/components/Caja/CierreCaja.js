import React, { useState, useEffect } from 'react';
import './CierreCaja.css';

function CierreCaja({ cajaActual, onCerrarCaja, onCancelar }) {
  const [ventas, setVentas] = useState([]);
  const [montoInicial, setMontoInicial] = useState(0);
  const [montoContado, setMontoContado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [ingresos, setIngresos] = useState(0);
  const [egresos, setEgresos] = useState(0);

  useEffect(() => {
    cargarVentasDelDia();
    cargarDatosCaja();
  }, []);

  const cargarVentasDelDia = async () => {
    try {
      const token = localStorage.getItem('token');
      const hoy = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`http://localhost:8000/api/ventas/?fecha=${hoy}`, {
        headers: {
          'Authorization': `Token ${token}`,
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVentas(data);
        
        // Calcular totales por método de pago
        const totalEfectivo = data
          .filter(v => v.tipo_pago_venta === 'efectivo')
          .reduce((sum, venta) => sum + parseFloat(venta.total_venta), 0);
        
        const totalTransferencia = data
          .filter(v => v.tipo_pago_venta === 'transferencia')
          .reduce((sum, venta) => sum + parseFloat(venta.total_venta), 0);
        
        setIngresos(totalEfectivo + totalTransferencia);
      }
    } catch (error) {
      console.error('Error cargando ventas:', error);
    }
  };

  const cargarDatosCaja = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/cajas/${cajaActual?.id}/`, {
        headers: {
          'Authorization': `Token ${token}`,
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMontoInicial(parseFloat(data.monto_inicial) || 0);
      }
    } catch (error) {
      console.error('Error cargando datos de caja:', error);
    }
  };

  const calcularMontoEsperado = () => {
    return montoInicial + ingresos - egresos;
  };

  const calcularDiferencia = () => {
    const esperado = calcularMontoEsperado();
    const contado = parseFloat(montoContado) || 0;
    return contado - esperado;
  };

  const handleConfirmarCierre = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const cierreData = {
        caja: cajaActual?.id,
        monto_inicial: montoInicial,
        monto_final: parseFloat(montoContado) || 0,
        total_ventas: ingresos,
        total_efectivo: ventas
          .filter(v => v.tipo_pago_venta === 'efectivo')
          .reduce((sum, venta) => sum + parseFloat(venta.total_venta), 0),
        total_transferencia: ventas
          .filter(v => v.tipo_pago_venta === 'transferencia')
          .reduce((sum, venta) => sum + parseFloat(venta.total_venta), 0),
        diferencia: calcularDiferencia(),
        observaciones: observaciones,
        estado: 'cerrada'
      };

      const response = await fetch('http://localhost:8000/api/cierre-caja/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(cierreData)
      });

      if (response.ok) {
        onCerrarCaja();
      } else {
        alert('Error al cerrar caja');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    }
  };

  const totalEfectivo = ventas
    .filter(v => v.tipo_pago_venta === 'efectivo')
    .reduce((sum, venta) => sum + parseFloat(venta.total_venta), 0);

  const totalTransferencia = ventas
    .filter(v => v.tipo_pago_venta === 'transferencia')
    .reduce((sum, venta) => sum + parseFloat(venta.total_venta), 0);

  return (
    <div className="cierre-caja-container">
      <div className="cierre-caja-header">
        <h1>Cierre de caja</h1>
        <div className="cierre-info">
          <p><strong>Usuario:</strong> Luján Ramírez</p>
          <p><strong>Fecha:</strong> {new Date().toLocaleDateString('es-ES')}</p>
          <p><strong>Hora de cierre:</strong> {new Date().toLocaleTimeString('es-ES')}</p>
        </div>
      </div>

      <div className="cierre-content">
        {/* Resumen de ventas */}
        <div className="resumen-ventas">
          <h2>Resumen de ventas</h2>
          <div className="resumen-stats">
            <div className="stat-item">
              <span>Total operaciones:</span>
              <strong>{ventas.length}</strong>
            </div>
            <div className="stat-item">
              <span>Total ventas:</span>
              <strong>${ingresos.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* Método de pago */}
        <div className="metodo-pago-resumen">
          <h2>Método de pago:</h2>
          <div className="metodos-list">
            <div className="metodo-item">
              <span>Efectivo</span>
              <strong>${totalEfectivo.toFixed(2)}</strong>
            </div>
            <div className="metodo-item">
              <span>Transferencia</span>
              <strong>${totalTransferencia.toFixed(2)}</strong>
            </div>
          </div>
          <div className="total-general">
            <strong>TOTAL: ${ingresos.toFixed(2)}</strong>
          </div>
        </div>

        {/* Arqueo de caja */}
        <div className="arqueo-caja">
          <h2>ARQUEO DE CAJA</h2>
          <div className="arqueo-grid">
            <div className="arqueo-item">
              <span>Monto inicial:</span>
              <span>${montoInicial.toFixed(2)}</span>
            </div>
            <div className="arqueo-item">
              <span>Ingresos:</span>
              <span>${ingresos.toFixed(2)}</span>
            </div>
            <div className="arqueo-item">
              <span>Egresos:</span>
              <input
                type="number"
                value={egresos}
                onChange={(e) => setEgresos(parseFloat(e.target.value) || 0)}
                className="egresos-input"
              />
            </div>
            <div className="arqueo-item">
              <span>Monto esperado:</span>
              <strong>${calcularMontoEsperado().toFixed(2)}</strong>
            </div>
            <div className="arqueo-item">
              <span>Monto contado:</span>
              <input
                type="number"
                value={montoContado}
                onChange={(e) => setMontoContado(e.target.value)}
                className="monto-contado-input"
                placeholder="0.00"
              />
            </div>
            <div className="arqueo-item diferencia">
              <span>Diferencia:</span>
              <strong className={calcularDiferencia() >= 0 ? 'positivo' : 'negativo'}>
                ${calcularDiferencia().toFixed(2)}
              </strong>
            </div>
          </div>
        </div>

        {/* Observaciones */}
        <div className="observaciones">
          <h2>Observaciones:</h2>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Escribe aquí..."
            className="observaciones-textarea"
          />
        </div>

        {/* Acciones */}
        <div className="acciones-cierre">
          <button className="btn-cerrar-sesion">
            Cerrar sesión
          </button>
          <div className="botones-cierre">
            <button className="btn-cancelar" onClick={onCancelar}>
              Cancelar
            </button>
            <button 
              className="btn-confirmar-cierre" 
              onClick={handleConfirmarCierre}
              disabled={!montoContado}
            >
              Confirmar Cierre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CierreCaja;