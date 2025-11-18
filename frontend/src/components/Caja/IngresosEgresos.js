import React, { useState } from 'react';
<<<<<<< Updated upstream
import ModalConfirmacionUniversal from '../ModalConfirmacionUniversal';
=======
import ModalConfirmacion from '../Caja/ModalConfirmacion';
>>>>>>> Stashed changes
import './IngresosEgresos.css';

function IngresosEgresos({ cajaId, onRegistroAgregado }) {
  const [mostrarModalForm, setMostrarModalForm] = useState(false);
  const [mostrarModalConfirmar, setMostrarModalConfirmar] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [tipoRegistro, setTipoRegistro] = useState('');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  const abrirModalIngreso = () => {
    setTipoRegistro('ingreso');
    setMonto('');
    setDescripcion('');
    setMostrarModalForm(true);
  };

  const abrirModalEgreso = () => {
    setTipoRegistro('egreso');
    setMonto('');
    setDescripcion('');
    setMostrarModalForm(true);
  };

  const mostrarError = (mensaje) => {
    setMensajeError(mensaje);
    setMostrarModalError(true);
  };

  // Función para manejar cambios en el monto (sin números negativos)
  const handleMontoChange = (e) => {
    const value = e.target.value;
    // Solo permitir números positivos
    if (value === '' || (parseFloat(value) >= 0 && !isNaN(parseFloat(value)))) {
      setMonto(value);
    }
  };

  // Función para prevenir teclas no deseadas
  const handleKeyDown = (e) => {
    // Prevenir: negativo (-), exponente (e, E), y otros caracteres no numéricos
    if (['-', 'e', 'E', '+'].includes(e.key)) {
      e.preventDefault();
    }
  };

  // Función para prevenir cambios por scroll wheel
  const preventScroll = (e) => {
    e.target.blur();
  };

  const handleConfirmarRegistro = async () => {
    if (!monto || parseFloat(monto) <= 0) {
      mostrarError('Por favor ingrese un monto válido');
      return;
    }

    if (!cajaId) {
      mostrarError('Error: No se encontró la caja activa');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const ventaData = {
        caja: cajaId,
        total_venta: parseFloat(monto),
        tipo_pago_venta: 'efectivo',
        monto_recibido: tipoRegistro === 'ingreso' ? parseFloat(monto) : 0,
        vuelto: 0,
        estado_venta: 'completada',
        descripcion: descripcion || `${tipoRegistro === 'ingreso' ? 'Ingreso' : 'Egreso'} - ${descripcion || 'Movimiento de caja'}`
      };

      console.log('📤 Creando movimiento como venta:', ventaData);

      const response = await fetch('http://localhost:8000/api/ventas/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(ventaData)
      });

      if (response.ok) {
        const ventaCreada = await response.json();
        console.log('✅ Movimiento registrado como venta:', ventaCreada);
        
        setMostrarModalConfirmar(false);
        setMostrarModalExito(true);
        
        if (onRegistroAgregado) {
          onRegistroAgregado();
        }
        
        setTimeout(() => {
          setMostrarModalExito(false);
        }, 2000);
      } else {
        const errorText = await response.text();
        console.error('❌ Error registrando movimiento:', errorText);
        throw new Error('Error al registrar el movimiento en el sistema');
      }
    } catch (error) {
      console.error('❌ Error registrando movimiento:', error);
      mostrarError(error.message);
    }
  };

  return (
    <>
      <div className="ingresos-egresos-container">
        <button 
          className="btn-ingreso"
          onClick={abrirModalIngreso}
        >
          + Ingresos
        </button>
        <button 
          className="btn-egreso"
          onClick={abrirModalEgreso}
        >
          - Egresos
        </button>
      </div>

      {/* Modal del formulario - SIN botón Ver Todos */}
      {mostrarModalForm && (
        <div className="modal-overlay" onClick={() => setMostrarModalForm(false)}>
          <div className="modal-contenedor" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{tipoRegistro === 'ingreso' ? 'Registrar Ingreso' : 'Registrar Egreso'}</h3>
            </div>
            
            <div className="modal-body">
              <div className="formulario-movimiento">
                <div className="campo-grupo">
                  <label>Monto *</label>
                  <input
                    type="number"
                    value={monto}
                    onChange={handleMontoChange}
                    onKeyDown={handleKeyDown}
                    onWheel={preventScroll}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="campo-input"
                  />
                </div>
                
                <div className="campo-grupo">
                  <label>Descripción</label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder={`Descripción del ${tipoRegistro === 'ingreso' ? 'ingreso' : 'egreso'}`}
                    className="campo-textarea"
                    rows="3"
                  />
                </div>
              </div>
            </div>           
            <div className="modal-footer">            
                <button 
                  className="btn-cancelar" 
                  onClick={() => setMostrarModalForm(false)}
                >
                  Cancelar
                </button>
                <button 
                  className="btn-confirmar"
                  onClick={() => {
                    if (!monto || parseFloat(monto) <= 0) {
                      mostrarError('Por favor ingrese un monto válido');
                      return;
                    }
                    setMostrarModalForm(false);
                    setMostrarModalConfirmar(true);
                  }}
                >
                  Confirmar
                </button>
            </div>
          </div>
        </div>
      )}

<<<<<<< Updated upstream
      {/* Modal de Historial */}
      {mostrarModalHistorial && (
        <div className="modal-overlay" onClick={() => setMostrarModalHistorial(false)}>
          <div className="modal-contenedor modal-historial" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{tipoRegistro === 'ingreso' ? 'Historial de Ingresos' : 'Historial de Egresos'}</h3>
            </div>
            
            <div className="modal-body">
              <div className="historial-lista">
                {historial.length > 0 ? (
                  historial.map((movimiento) => (
                    <div key={movimiento.id} className="historial-item">
                      <div className="historial-info">
                        <div className="historial-monto">
                          ${parseFloat(movimiento.total_venta).toFixed(2)}
                        </div>
                        <div className="historial-descripcion">
                          {movimiento.descripcion}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="sin-historial">
                    No hay {tipoRegistro === 'ingreso' ? 'ingresos' : 'egresos'} registrados
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-cancelar" 
                onClick={() => setMostrarModalHistorial(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación - VERSIÓN UNIVERSAL */}
      <ModalConfirmacionUniversal
=======
      {/* Modal de Confirmación */}
      <ModalConfirmacion
>>>>>>> Stashed changes
        mostrar={mostrarModalConfirmar}
        tipo="confirmar"
        mensaje={`¿Está seguro que desea registrar este ${tipoRegistro === 'ingreso' ? 'INGRESO' : 'EGRESO'} por $${parseFloat(monto || 0).toFixed(2)}?`}
        onConfirmar={handleConfirmarRegistro}
        onCancelar={() => setMostrarModalConfirmar(false)}
        modo="caja"
      />

      {/* Modal de Éxito - VERSIÓN UNIVERSAL */}
      <ModalConfirmacionUniversal
        mostrar={mostrarModalExito}
        tipo="exito"
        mensaje={`${tipoRegistro === 'ingreso' ? 'INGRESO' : 'EGRESO'} de $${parseFloat(monto || 0).toFixed(2)} registrado exitosamente`}
        onConfirmar={() => setMostrarModalExito(false)}
        onCancelar={() => setMostrarModalExito(false)}
        modo="caja"
      />

      {/* Modal de Error - VERSIÓN UNIVERSAL */}
      <ModalConfirmacionUniversal
        mostrar={mostrarModalError}
        tipo="error"
        mensaje={mensajeError}
        onConfirmar={() => setMostrarModalError(false)}
        onCancelar={() => setMostrarModalError(false)}
        modo="caja"
      />
    </>
  );
}

export default IngresosEgresos;