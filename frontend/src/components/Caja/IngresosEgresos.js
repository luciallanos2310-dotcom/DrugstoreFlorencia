import React, { useState } from 'react';
import ModalConfirmacion from './ModalConfirmacion';
import './IngresosEgresos.css';

function IngresosEgresos({ cajaId, onRegistroAgregado }) {
  const [mostrarModalForm, setMostrarModalForm] = useState(false);
  const [mostrarModalConfirmar, setMostrarModalConfirmar] = useState(false);
  const [mostrarModalExito, setMostrarModalExito] = useState(false);
  const [mostrarModalError, setMostrarModalError] = useState(false);
  const [mostrarModalHistorial, setMostrarModalHistorial] = useState(false);
  const [tipoRegistro, setTipoRegistro] = useState('');
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [historial, setHistorial] = useState([]);

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

  const verHistorial = async (tipo) => {
    setTipoRegistro(tipo);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/ventas/?caja=${cajaId}&tipo=${tipo}`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filtrar solo los movimientos del tipo seleccionado
        const movimientosFiltrados = data.filter(venta => 
          venta.descripcion?.toLowerCase().includes(tipo)
        );
        setHistorial(movimientosFiltrados);
        setMostrarModalHistorial(true);
      } else {
        mostrarError('Error al cargar el historial');
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
      mostrarError('Error al cargar el historial');
    }
  };

  const mostrarError = (mensaje) => {
    setMensajeError(mensaje);
    setMostrarModalError(true);
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

      {/* Modal del formulario - Ahora con botón Ver Todos */}
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
                    onChange={(e) => setMonto(e.target.value)}
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
            <div className='seccion-mostrar-todos'>
                <button 
                className="btn-ver-todos"
                onClick={() => verHistorial(tipoRegistro)}
                >
                    Ver Todos
                </button>
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

      {/* Modal de Confirmación */}
      <ModalConfirmacion
        mostrar={mostrarModalConfirmar}
        tipo="confirmar"
        mensaje={`¿Está seguro que desea registrar este ${tipoRegistro === 'ingreso' ? 'INGRESO' : 'EGRESO'} por $${parseFloat(monto || 0).toFixed(2)}?`}
        onConfirmar={handleConfirmarRegistro}
        onCancelar={() => setMostrarModalConfirmar(false)}
      />

      {/* Modal de Éxito */}
      <ModalConfirmacion
        mostrar={mostrarModalExito}
        tipo="exito"
        mensaje={`${tipoRegistro === 'ingreso' ? 'INGRESO' : 'EGRESO'} de $${parseFloat(monto || 0).toFixed(2)} registrado exitosamente`}
        onConfirmar={() => setMostrarModalExito(false)}
        onCancelar={() => setMostrarModalExito(false)}
      />

      {/* Modal de Error */}
      <ModalConfirmacion
        mostrar={mostrarModalError}
        tipo="error"
        mensaje={mensajeError}
        onConfirmar={() => setMostrarModalError(false)}
        onCancelar={() => setMostrarModalError(false)}
      />
    </>
  );
}

export default IngresosEgresos;