import React from 'react';
import './ModalConfirmacionUniversal.css';

function ModalConfirmacionUniversal({ 
  mostrar, 
  tipo = 'confirmar', 
  titulo,
  mensaje,
  onConfirmar, 
  onCancelar,
  datosAdicionales = null,
  textoConfirmar = null,
  textoCancelar = null,
  mostrarResumen = false,
  modo = null
}) {
  if (!mostrar) return null;

  // Determinar título automático si no se proporciona
  const getTituloAuto = () => {
    if (titulo) return titulo;
    
    switch(tipo) {
      case 'eliminar': 
        if (modo === 'proveedor') return 'Eliminar Proveedor';
        if (modo === 'empleado') return 'Eliminar Empleado';
        if (modo === 'producto') return 'Eliminar Producto';
        if (modo === 'compra') return 'Eliminar Compra';
        return 'Eliminar';
      
      case 'inhabilitar': return 'Inhabilitar Proveedor';
      case 'habilitar': return 'Habilitar Proveedor';
      case 'cancelar': 
        if (modo === 'venta') return 'Cancelar Venta';
        return 'Cancelar';
      
      case 'confirmar':
        if (modo === 'caja') return 'Confirmar Cierre de Caja';
        if (modo === 'compra') return datosAdicionales?.modo === 'editar' ? 'Confirmar Edición' : 'Confirmar Compra';
        if (modo === 'venta') return 'Confirmar Venta';
        if (modo === 'empleado') {
          // ✅ DETECTAR SI ES EDICIÓN POR EL MENSAJE O DATOS
          const esEdicion = mensaje?.includes('actualizar') || 
                           datosAdicionales?.modo === 'editar' ||
                           datosAdicionales?.id !== undefined;
          return esEdicion ? 'Confirmar Edición' : 'Confirmar Creación';
        }
        if (modo === 'caja') return 'Confirmar Apertura';
        return 'Confirmar Acción';
      
      case 'exito': return '¡Éxito!';
      case 'error': return 'Error';
      case 'advertencia': return 'Advertencia';
      case 'info': return 'Información';
      default: return 'Confirmar Acción';
    }
  };

  // Determinar texto del botón confirmar automático
  const getTextoConfirmarAuto = () => {
    if (textoConfirmar) return textoConfirmar;
    
    switch(tipo) {
      case 'eliminar': 
        if (modo === 'empleado') return 'Eliminar Empleado';
        return 'Eliminar';
      case 'inhabilitar': return 'Inhabilitar';
      case 'habilitar': return 'Habilitar';
      case 'cancelar': return 'Sí, Cancelar';
      case 'confirmar': 
        if (modo === 'compra') return datosAdicionales?.modo === 'editar' ? 'Actualizar' : 'Confirmar';
        if (modo === 'empleado') {
          // ✅ DETECTAR SI ES EDICIÓN POR EL MENSAJE O DATOS
          const esEdicion = mensaje?.includes('actualizar') || 
                           datosAdicionales?.modo === 'editar' ||
                           datosAdicionales?.id !== undefined;
          return esEdicion ? 'Actualizar Empleado' : 'Crear Empleado';
        }
        return 'Confirmar';
      case 'exito': return 'Aceptar';
      case 'error': return 'Aceptar';
      case 'advertencia': return 'Entendido';
      case 'info': return 'Aceptar';
      default: return 'Confirmar';
    }
  };

  // Determinar texto del botón cancelar automático
  const getTextoCancelarAuto = () => {
    if (textoCancelar) return textoCancelar;
    
    switch(tipo) {
      case 'cancelar': return 'No, Continuar';
      default: return 'Cancelar';
    }
  };

  // Verificar si es un modal de solo lectura (éxito, error, info, advertencia)
  const esAlerta = ['exito', 'error', 'advertencia', 'info'].includes(tipo);

  // Renderizar resumen según el tipo de datos
  const renderResumen = () => {
    if (!mostrarResumen || !datosAdicionales) return null;

    switch(modo) {
      case 'venta':
        return (
          <div className="resumen-venta-modal">
            <h4>Resumen de la Venta:</h4>
            <p><strong>Total:</strong> ${datosAdicionales.total?.toFixed(2)}</p>
            <p><strong>Método de pago:</strong> {datosAdicionales.metodoPago === 'efectivo' ? 'Efectivo' : 'Transferencia'}</p>
            {datosAdicionales.metodoPago === 'efectivo' && (
              <>
                <p><strong>Monto recibido:</strong> ${datosAdicionales.montoRecibido?.toFixed(2)}</p>
                <p><strong>Vuelto:</strong> ${datosAdicionales.vuelto?.toFixed(2)}</p>
              </>
            )}
            <p><strong>Productos:</strong> {datosAdicionales.cantidadProductos} items</p>
          </div>
        );

      case 'caja':
        if (tipo === 'confirmar' && datosAdicionales) {
          // ✅ DIFERENCIAR ENTRE APERTURA Y CIERRE
          if (datosAdicionales.montoContado !== undefined) {
            // ES UN CIERRE
            return (
              <div className="resumen-cierre">
                <h4>Resumen del Cierre:</h4>
                <p><strong>Total Teórico:</strong> ${datosAdicionales.totalTeorico?.toFixed(2)}</p>
                <p><strong>Monto Contado:</strong> ${datosAdicionales.montoContado?.toFixed(2)}</p>
                <p><strong>Diferencia:</strong> 
                  <span className={datosAdicionales.diferencia >= 0 ? 'diferencia-positiva' : 'diferencia-negativa'}>
                    ${datosAdicionales.diferencia?.toFixed(2)}
                  </span>
                </p>
              </div>
            );
          } else {
            // ES UNA APERTURA
            return (
              <div className="resumen-apertura">
                <p><strong>Empleado:</strong> {datosAdicionales.empleadoNombre}</p>
                <p><strong>Fecha:</strong> {datosAdicionales.fecha}</p>
                <p><strong>Hora:</strong> {datosAdicionales.hora}</p>
                <p><strong>Turno:</strong> {datosAdicionales.turnoNombre}</p>
                <p><strong>Monto Inicial:</strong> ${parseFloat(datosAdicionales.montoInicial || 0).toFixed(2)}</p>
              </div>
            );
          }
        }
        if (tipo === 'exito' && datosAdicionales) {
          return (
            <div className="resumen-apertura">
              <p><strong>Empleado:</strong> {datosAdicionales.empleadoNombre}</p>
              <p><strong>Turno:</strong> {datosAdicionales.turnoNombre}</p>
              <p>Redirigiendo a ventas...</p>
            </div>
          );
        }
        return null;

      // ✅ AGREGADO: Caso para empleados
      case 'empleado':
        if (tipo === 'confirmar' && datosAdicionales) {
          return (
            <div className="resumen-empleado">
              <h4>Resumen del Empleado:</h4>
              <p><strong>Nombre:</strong> {datosAdicionales.nombre_emp} {datosAdicionales.apellido_emp}</p>
              <p><strong>DNI:</strong> {datosAdicionales.dni_emp}</p>
              <p><strong>Email:</strong> {datosAdicionales.email}</p>
              <p><strong>Puesto:</strong> {datosAdicionales.tipo_usuario === 'jefa' ? 'Jefa/Encargada' : 'Empleada'}</p>
              <p><strong>Teléfono:</strong> {datosAdicionales.telefono_emp || 'No especificado'}</p>
            </div>
          );
        }
        return null;

      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay-universal">
      <div className="modal-contenedor-universal">
        <div className="modal-header-universal">
          <h3>{getTituloAuto()}</h3>
        </div>
        
        <div className="modal-body-universal">
          <p>{mensaje}</p>
          {renderResumen()}
        </div>
        
        <div className="modal-footer-universal">
          {!esAlerta && (
            <button 
              className="btn-cancelar-universal" 
              onClick={onCancelar}
            >
              {getTextoCancelarAuto()}
            </button>
          )}
          <button 
            className={`btn-confirmar-universal ${
              tipo === 'eliminar' ? 'btn-eliminar-universal' : 
              tipo === 'inhabilitar' ? 'btn-inhabilitar-universal' : 
              tipo === 'habilitar' ? 'btn-habilitar-universal' : 
              tipo === 'exito' ? 'btn-exito-universal' : 
              tipo === 'error' ? 'btn-error-universal' : 
              tipo === 'advertencia' ? 'btn-advertencia-universal' : 
              tipo === 'info' ? 'btn-info-universal' : ''
            }`}
            onClick={esAlerta ? onCancelar : onConfirmar}
          >
            {getTextoConfirmarAuto()}
          </button>
        </div>
      </div>
    </div>
  ); 
}

export default ModalConfirmacionUniversal;