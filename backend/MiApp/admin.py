from django.contrib import admin
from .models import Empleado, Producto, Proveedor, Caja, Venta, DetalleVenta, VentaSaeta, Compra

@admin.register(Empleado)
class EmpleadoAdmin(admin.ModelAdmin):
    list_display = ['id', 'nombre_emp', 'apellido_emp', 'dni_emp', 'tipo_usuario', 'fecha_creacion']
    list_filter = ['tipo_usuario', 'fecha_creacion']
    search_fields = ['nombre_emp', 'apellido_emp', 'dni_emp']

from django.contrib import admin
from .models import Producto

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'codigo_prod',
        'nombre_prod',
        'categoria_prod',
        'precio_venta',
        'cantidad',          # stock disponible
        'stock_minimo',
        'estado_stock_display'
    ]

    list_filter = ['categoria_prod']
    search_fields = ['nombre_prod', 'codigo_prod']

    # Campos de solo lectura (NO se editan: se calculan)
    readonly_fields = [
        'estado_stock_display',
        'disponible',
        'bajo_stock'
    ]

    fieldsets = (
        ('Información del Producto', {
            'fields': (
                'nombre_prod',
                'categoria_prod',
                'descripcion_prod',
                'codigo_prod',
            )
        }),
        ('Precios', {
            'fields': (
                'precio_venta',
            )
        }),
        ('Stock', {
            'fields': (
                'cantidad',          # solo admins pueden ajustarlo
                'stock_minimo',
                'estado_stock_display',
                'disponible',
                'bajo_stock',
            )
        }),
    )

    def estado_stock_display(self, obj):
        if obj.cantidad == 0:
            return "🔴 Agotado"
        elif obj.bajo_stock:
            return "🟡 Bajo stock"
        else:
            return "🟢 En stock"
    estado_stock_display.short_description = 'Estado del Stock'

@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'nombre_prov', 'tipo_prov', 'telefono_prov', 
        'correo_prov', 'estado_display'
    ]
    list_filter = ['tipo_prov', 'estado']
    search_fields = ['nombre_prov', 'codigo_proveedor', 'telefono_prov', 'correo_prov']  # ✅ CAMBIADO
    
    readonly_fields = ['estado_display']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre_prov', 'tipo_prov', 'codigo_proveedor', 'estado', 'estado_display')  # ✅ CAMBIADO
        }),
        ('Información de Contacto', {
            'fields': ('telefono_prov', 'correo_prov', 'direccion_prov')
        }),
        ('Información Adicional', {
            'fields': ('descripcion',)
        }),
    )
    
    def estado_display(self, obj):
        return obj.estado_display
    estado_display.short_description = 'Estado'

@admin.register(Caja)
class CajaAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'empleado', 'fecha_hs_apertura', 'fecha_hs_cierre', 
        'saldo_inicial', 'saldo_final', 'estado', 'turno'
    ]
    list_filter = ['estado', 'turno', 'fecha_hs_apertura']
    search_fields = ['empleado__nombre_emp']
    
    readonly_fields = ['monto_esperado', 'diferencia', 'total_ventas']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('empleado', 'turno', 'estado', 'descripcion')
        }),
        ('Fechas y Horarios', {
            'fields': ('fecha_hs_apertura', 'fecha_hs_cierre')
        }),
        ('Saldos y Montos', {
            'fields': (
                'saldo_inicial', 'saldo_final', 'ingresos', 'egresos', 
                'monto_contado', 'monto_esperado', 'diferencia', 'total_ventas'
            )
        }),
    )

@admin.register(Compra)
class CompraAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'codigo_compra', 'producto',
        'proveedores_display', 'fecha_compra',
        'cantidad', 'precio_total', 'estado'
    ]
    list_filter = ['fecha_compra', 'proveedores', 'estado']
    search_fields = ['codigo_compra', 'producto__nombre_prod', 'proveedores__nombre_prov']

    def proveedores_display(self, obj):
        return ", ".join([p.nombre_prov for p in obj.proveedores.all()])
    proveedores_display.short_description = 'Proveedores'

@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'codigo_venta', 'caja', 'fecha_hora_venta', 
        'total_venta', 'tipo_pago_venta', 'estado_venta'
    ]
    list_filter = ['tipo_pago_venta', 'estado_venta', 'fecha_hora_venta']
    search_fields = ['codigo_venta', 'caja__id']

@admin.register(DetalleVenta)
class DetalleVentaAdmin(admin.ModelAdmin):
    list_display = ['id', 'venta', 'producto', 'cantidad', 'precio_unitario', 'subtotal']
    list_filter = ['creado_en']
    search_fields = ['venta__codigo_venta', 'producto__nombre_prod']

@admin.register(VentaSaeta)
class VentaSaetaAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'venta', 'monto_saeta', 'porcentaje_ganancia_saeta', 
        'ganancia_drugstore', 'fecha_pago_saeta'
    ]
    list_filter = ['fecha_pago_saeta']
    search_fields = ['venta__codigo_venta']