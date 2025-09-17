from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import Caja, Empleado, Proveedor, Producto, ProvProducto, Venta, DetalleVenta, VentaSaeta

admin.site.register(Caja)
admin.site.register(Empleado)
admin.site.register(Proveedor)
admin.site.register(Producto)
admin.site.register(ProvProducto)
admin.site.register(Venta)
admin.site.register(DetalleVenta)
admin.site.register(VentaSaeta)