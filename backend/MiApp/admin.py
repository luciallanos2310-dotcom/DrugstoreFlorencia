# MiApp/admin.py
from django.contrib import admin
from .models import Empleado, Producto, Proveedor, Caja, Venta, DetalleVenta, VentaSaeta, Compra

@admin.register(Empleado)
class EmpleadoAdmin(admin.ModelAdmin):
    list_display = ['id', 'nombre_emp', 'apellido_emp', 'dni_emp', 'tipo_usuario', 'fecha_creacion']
    list_filter = ['tipo_usuario', 'fecha_creacion']
    search_fields = ['nombre_emp', 'apellido_emp', 'dni_emp']

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ['id', 'nombre_prod', 'categoria_prod', 'precio_venta', 'cantidad', 'disponible']
    list_filter = ['categoria_prod', 'fecha_entrada']
    search_fields = ['nombre_prod', 'codigo_prod']

@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = [
        'id', 
        'nombre_prov', 
        'tipo_prov', 
        'telefono_prov', 
        'correo_prov',  # ✅ AGREGAR EMAIL
        'direccion_prov', 
        'dni_proveedor', 
        'estado_display'  # ✅ USAR LA PROPERTY
    ]
    
    list_filter = ['tipo_prov', 'estado']
    search_fields = ['nombre_prov', 'dni_proveedor', 'telefono_prov', 'correo_prov', 'direccion_prov']
    
    # ✅ AGREGAR CAMPOS DE SOLO LECTURA PARA PROPIEDADES
    readonly_fields = ['estado_display']
    
    fieldsets = (
        ('Información Básica', {
            'fields': (
                'nombre_prov', 
                'tipo_prov', 
                'dni_proveedor', 
                'estado',
                'estado_display'
            )
        }),
        ('Información de Contacto', {
            'fields': (
                'telefono_prov', 
                'correo_prov', 
                'direccion_prov'
            )
        }),
        ('Información Adicional', {
            'fields': (
                'descripcion',
            )
        }),
    )
    
    def estado_display(self, obj):
        return obj.estado_display
    estado_display.short_description = 'Estado'

from django.contrib import admin
from .models import Caja

@admin.register(Caja)
class CajaAdmin(admin.ModelAdmin):
    list_display = [
        'id', 
        'empleado', 
        'fecha_hs_apertura', 
        'fecha_hs_cierre', 
        'saldo_inicial', 
        'saldo_final', 
        'ingresos',
        'egresos',
        'monto_contado',
        'estado', 
        'turno'
    ]
    
    list_filter = ['estado', 'turno', 'fecha_hs_apertura']
    search_fields = ['empleado__nombre_emp']
    
    fieldsets = (
        ('Información Básica', {
            'fields': (
                'empleado', 
                'turno', 
                'estado',
                'descripcion'
            )
        }),
        ('Fechas y Horarios', {
            'fields': (
                'fecha_hs_apertura', 
                'fecha_hs_cierre'
            )
        }),
        ('Saldos y Montos', {
            'fields': (
                'saldo_inicial',
                'saldo_final',
                'ingresos',
                'egresos',
                'monto_contado',
            )
        }),
    )

@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    list_display = ['id', 'caja', 'fecha_hora_venta', 'total_venta', 'tipo_pago_venta', 'estado_venta']
    list_filter = ['tipo_pago_venta', 'estado_venta', 'fecha_hora_venta']
    search_fields = ['caja__id']

@admin.register(DetalleVenta)
class DetalleVentaAdmin(admin.ModelAdmin):
    list_display = ['id', 'venta', 'producto', 'cantidad', 'precio_unitario', 'subtotal']
    list_filter = ['creado_en']
    search_fields = ['venta__id', 'producto__nombre_prod']

@admin.register(VentaSaeta)
class VentaSaetaAdmin(admin.ModelAdmin):
    list_display = ['id', 'venta', 'monto_saeta', 'porcentaje_ganancia_saeta', 'ganancia_drugstore', 'fecha_pago_saeta']
    list_filter = ['fecha_pago_saeta']
    search_fields = ['venta__id']

@admin.register(Compra)
class CompraAdmin(admin.ModelAdmin):
    list_display = ['id', 'codigo_compra', 'producto', 'fecha_entrada', 'cantidad', 'precio_total']
    list_filter = ['fecha_entrada']
    search_fields = ['codigo_compra', 'producto__nombre_prod']