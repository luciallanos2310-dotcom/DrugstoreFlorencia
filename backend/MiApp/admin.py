# MiApp/admin.py - VERSIÓN CORREGIDA
from django.contrib import admin
from .models import Producto, Proveedor, Compra, Caja, Venta, DetalleVenta, Empleado, VentaSaeta

@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = [
        'nombre_prod', 
        'categoria_prod', 
        'precio_venta', 
        'cantidad',  # ✅ Cambiado de 'stock_actual' a 'cantidad'
        'disponible', 
        'bajo_stock',
        'fecha_vencimiento'
    ]
    list_filter = ['categoria_prod', 'fecha_entrada']
    search_fields = ['nombre_prod', 'codigo_prod']
    readonly_fields = ['disponible', 'bajo_stock']
    date_hierarchy = 'fecha_entrada'

@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ['nombre_prov', 'tipo_prov', 'telefono_prov', 'correo_prov', 'estado']
    list_filter = ['tipo_prov', 'estado']
    search_fields = ['nombre_prov']

@admin.register(Compra)
class CompraAdmin(admin.ModelAdmin):
    list_display = [
        'codigo_compra', 
        'producto', 
        'get_proveedores',
        'cantidad', 
        'precio_total',
        'fecha_entrada'
    ]
    list_filter = ['fecha_entrada', 'producto__categoria_prod']
    search_fields = ['codigo_compra', 'producto__nombre_prod']
    filter_horizontal = ['proveedores']
    date_hierarchy = 'fecha_entrada'

    def get_proveedores(self, obj):
        return ", ".join([p.nombre_prov for p in obj.proveedores.all()])
    get_proveedores.short_description = 'Proveedores'

@admin.register(Caja)
class CajaAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'empleado', 
        'fecha_hs_apertura', 
        'fecha_hs_cierre', 
        'saldo_inicial', 
        'saldo_final',
        'estado'
    ]
    list_filter = ['estado', 'turno', 'fecha_hs_apertura']
    readonly_fields = ['fecha_hs_apertura', 'fecha_hs_cierre']

@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    list_display = [
        'id',           # ✅ Cambiado de posición
        'caja',         # ✅ Existe en el modelo
        'fecha_hora_venta',  # ✅ Existe en el modelo  
        'total_venta',  # ✅ Existe en el modelo
        'estado_venta', # ✅ Existe en el modelo
        'tipo_pago_venta', # ✅ Existe en el modelo
        'monto_recibido', # ✅ Existe en el modelo
        'vuelto'        # ✅ Existe en el modelo
    ]
    list_filter = [
        'estado_venta',     # ✅ Es un campo del modelo
        'tipo_pago_venta',  # ✅ Es un campo del modelo  
        'fecha_hora_venta'  # ✅ Es un campo del modelo
    ]
    readonly_fields = [
        'vuelto',           # ✅ Ahora es correcto
        'fecha_hora_venta',
        'creado_en',
        'actualizado_en'
    ]
    date_hierarchy = 'fecha_hora_venta'  # ✅ Ahora es correcto

@admin.register(DetalleVenta)
class DetalleVentaAdmin(admin.ModelAdmin):
    list_display = ['id', 'venta', 'producto', 'cantidad', 'precio_unitario', 'subtotal']
    list_filter = ['producto__categoria_prod']
    search_fields = ['producto__nombre_prod']

@admin.register(Empleado)
class EmpleadoAdmin(admin.ModelAdmin):
    list_display = ['nombre_emp', 'apellido_emp', 'dni_emp', 'telefono_emp', 'tipo_usuario']
    list_filter = ['tipo_usuario']
    search_fields = ['nombre_emp', 'apellido_emp', 'dni_emp']

# En admin.py - AGREGAR ESTO
@admin.register(VentaSaeta)
class VentaSaetaAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'detalle_venta',
        'monto_saeta',
        'fecha_pago_saeta',
        'porcentaje_ganancia_saeta',
        'ganancia_calculada'
    ]
    list_filter = ['fecha_pago_saeta']
    search_fields = ['detalle_venta__venta__id']
    
    def ganancia_calculada(self, obj):
        return f"${(obj.monto_saeta * obj.porcentaje_ganancia_saeta / 100):.2f}"
    ganancia_calculada.short_description = 'Ganancia'