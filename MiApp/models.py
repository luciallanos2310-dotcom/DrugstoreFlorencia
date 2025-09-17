from django.db import models

class Empleado(models.Model):
    nombre_emp = models.CharField(max_length=50)
    apellido_emp = models.CharField(max_length=50)
    dni_emp = models.IntegerField(unique= True)
    telefono_emp = models.IntegerField(null=True, blank=True)
    domicilio_emp = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.nombre_emp} {self.apellido_emp}"

class Caja(models.Model):
    empleado = models.ForeignKey(Empleado, on_delete=models.CASCADE, null=True, blank=True)
    fecha_hs_apertura = models.DateTimeField()
    fecha_hs_cierre = models.DateTimeField(null=True, blank=True)
    saldo_inicial = models.DecimalField(max_digits=10, decimal_places=2)
    saldo_final = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    tipo_movimiento = models.CharField(max_length=100, null=True, blank=True)

    def __str__(self):
        return f"Caja {self.id} - {self.fecha_hs_apertura.date()}"

    
class Proveedor(models.Model):
    nombre_prov = models.CharField(max_length=50)
    tipo_prov = models.CharField(max_length=50)
    telefono_prov = models.IntegerField(null=True, blank=True)
    correo_prov = models.EmailField(null=True, blank=True)
    direccion_prov = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre_prov
    
class Producto(models.Model):
    nombre_prod = models.CharField(max_length=50)
    descripcion_prod = models.CharField(max_length=100, blank=True)
    categoria_prod = models.CharField(max_length=50)
    precio_prod = models.DecimalField(max_digits=10, decimal_places=2)
    stock_prod = models.IntegerField()
    
    def __str__(self):
        return self.nombre_prod
    
class ProvProducto(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    proveedor = models.ForeignKey(Proveedor, on_delete=models.CASCADE)
    nombre_prov_prod = models.CharField(max_length=50)
    descripcion_prov_prod = models.TextField(blank=True)

    def __str__(self):
        return self.nombre_prov_prod

class Venta(models.Model):
    caja = models.ForeignKey(Caja, on_delete=models.CASCADE)  
    fecha_hora_venta = models.DateTimeField()  
    total_venta = models.DecimalField(max_digits=10, decimal_places=2)  
    estado_venta = models.CharField(max_length=50)  
    tipo_pago_venta = models.CharField(max_length=50)  

    def __str__(self):
        return f"Venta {self.id} - {self.total_venta}"

class DetalleVenta(models.Model):
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE)  
    productos = models.ForeignKey(Producto, on_delete=models.CASCADE)  
    cantidad_venta = models.IntegerField()  
    precio_uni_venta = models.DecimalField(max_digits=10, decimal_places=2)  
    subtotal_venta = models.DecimalField(max_digits=10, decimal_places=2)  

class VentaSaeta(models.Model):
    detalle_ventas = models.ForeignKey(DetalleVenta, on_delete=models.CASCADE)  
    monto_saeta = models.DecimalField(max_digits=10, decimal_places=2)  
    fecha_pago_saeta = models.DateField()  
    porcentaje_ganancia_saeta = models.DecimalField(max_digits=5, decimal_places=2)  