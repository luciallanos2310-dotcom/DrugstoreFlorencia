from django.db import models
from django.contrib.auth.models import User

class Empleado(models.Model):
    TIPO_USUARIO_CHOICES = [
        ('jefa', 'Jefa/Encargada'),
        ('empleada', 'Empleada'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    nombre_emp = models.CharField(max_length=50)
    apellido_emp = models.CharField(max_length=50)
    dni_emp = models.IntegerField(unique=True)
    telefono_emp = models.CharField(max_length=60)
    domicilio_emp = models.CharField(max_length=100)
    tipo_usuario = models.CharField(max_length=10, choices=TIPO_USUARIO_CHOICES, default='empleada')

    def __str__(self):
        return f"{self.nombre_emp} {self.apellido_emp} ({self.get_tipo_usuario_display()})"

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
    telefono_prov = models.CharField(max_length=20, null=True, blank=True)
    correo_prov = models.EmailField(null=True, blank=True)
    direccion_prov = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre_prov

# MODELO PRODUCTO ACTUALIZADO - ELIMINA LA VERSIÓN ANTERIOR
class Producto(models.Model):
    nombre_prod = models.CharField(max_length=100)
    categoria_prod = models.CharField(max_length=50)
    descripcion_prod = models.TextField(blank=True, null=True)
    stock_actual = models.IntegerField(default=0)  # Cambié stock_inicial por stock_actual
    stock_minimo = models.IntegerField(default=0)
    precio_prod = models.DecimalField(max_digits=10, decimal_places=2)  # Cambié precio_unitario por precio_prod
    fecha_vencimiento = models.DateField(null=True, blank=True)
    proveedores = models.ManyToManyField(Proveedor, through='ProvProducto')

    def __str__(self):
        return self.nombre_prod

class ProvProducto(models.Model):
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    proveedor = models.ForeignKey(Proveedor, on_delete=models.CASCADE)

    class Meta:
        unique_together = ['producto', 'proveedor']  # Evita duplicados

    def __str__(self):
        return f"{self.proveedor.nombre_prov} → {self.producto.nombre_prod}"

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
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)  # Cambié productos por producto
    cantidad_venta = models.IntegerField()  
    precio_uni_venta = models.DecimalField(max_digits=10, decimal_places=2)  
    subtotal_venta = models.DecimalField(max_digits=10, decimal_places=2)  

class VentaSaeta(models.Model):
    detalle_venta = models.ForeignKey(DetalleVenta, on_delete=models.CASCADE)  # Cambié detalle_ventas por detalle_venta
    monto_saeta = models.DecimalField(max_digits=10, decimal_places=2)  
    fecha_pago_saeta = models.DateField()  
    porcentaje_ganancia_saeta = models.DecimalField(max_digits=5, decimal_places=2) 

class UserProfile(models.Model):
    TIPO_USUARIO_CHOICES = [
        ('jefa', 'Jefa/Encargada'),
        ('empleada', 'Empleada'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    tipo_usuario = models.CharField(max_length=10, choices=TIPO_USUARIO_CHOICES, default='empleada')
    dni = models.CharField(max_length=15, unique=True)
    telefono = models.CharField(max_length=50, blank=True)
    direccion = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_tipo_usuario_display()}"