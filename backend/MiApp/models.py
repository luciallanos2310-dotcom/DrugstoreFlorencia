from django.db import models
from django.contrib.auth.models import User

class Empleado(models.Model):
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    nombre_emp = models.CharField(max_length=50)
    apellido_emp = models.CharField(max_length=50)
    dni_emp = models.IntegerField(unique=True)
    telefono_emp = models.CharField(max_length=60)
    domicilio_emp = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.nombre_emp} {self.apellido_emp}"

class Caja(models.Model):
    TURNO_CHOICES = [
        ('mañana', 'Turno Mañana'),
        ('tarde', 'Turno Tarde'),
        ('noche', 'Turno Noche'),
    ]
    
    empleado = models.ForeignKey(
        Empleado, 
        on_delete=models.PROTECT,  # Cambiado de CASCADE a PROTECT según regla 5
        null=True, 
        blank=True
    )
    fecha_hs_apertura = models.DateTimeField()
    fecha_hs_cierre = models.DateTimeField(null=True, blank=True)
    saldo_inicial = models.DecimalField(max_digits=10, decimal_places=2)
    saldo_final = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    turno = models.CharField(max_length=20, choices=TURNO_CHOICES, default='mañana')
    observaciones = models.TextField(blank=True, null=True)
    estado = models.CharField(
        max_length=20, 
        choices=[('abierta', 'Abierta'), ('cerrada', 'Cerrada')], 
        default='abierta'
    )

    def __str__(self):
        return f"Caja {self.id} - {self.fecha_hs_apertura.date()} - {self.empleado}"

class Proveedor(models.Model):
    nombre_prov = models.CharField(max_length=50)
    tipo_prov = models.CharField(max_length=50)
    telefono_prov = models.CharField(max_length=20, null=True, blank=True)
    correo_prov = models.EmailField(null=True, blank=True)
    direccion_prov = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre_prov

class Producto(models.Model):
    nombre_prod = models.CharField(max_length=100)
    categoria_prod = models.CharField(max_length=50)
    descripcion_prod = models.TextField(blank=True, null=True)
    stock_actual = models.IntegerField(default=0)
    stock_minimo = models.IntegerField(default=0)
    precio_prod = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_vencimiento = models.DateField(null=True, blank=True)
    codigo_barras = models.CharField(max_length=50, unique=True, blank=True, null=True)
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre_prod

class ProvProducto(models.Model):
    producto = models.ForeignKey(
        Producto, 
        on_delete=models.CASCADE  # Según regla 7
    )
    proveedor = models.ForeignKey(
        Proveedor, 
        on_delete=models.CASCADE  # Según regla 6
    )
    precio_compra = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    activo = models.BooleanField(default=True)

    class Meta:
        unique_together = ['producto', 'proveedor']

    def __str__(self):
        return f"{self.proveedor.nombre_prov} → {self.producto.nombre_prod}"

class Venta(models.Model):
    ESTADO_VENTA_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('completada', 'Completada'),
        ('cancelada', 'Cancelada'),
    ]
    
    TIPO_PAGO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
        ('tarjeta', 'Tarjeta'),
    ]
    
    caja = models.ForeignKey(
        Caja, 
        on_delete=models.PROTECT  # Según regla 1 - Restringir borrado
    )  
    fecha_hora_venta = models.DateTimeField(auto_now_add=True)  
    total_venta = models.DecimalField(max_digits=10, decimal_places=2, default=0)  
    estado_venta = models.CharField(
        max_length=50, 
        choices=ESTADO_VENTA_CHOICES, 
        default='completada'
    )  
    tipo_pago_venta = models.CharField(
        max_length=50, 
        choices=TIPO_PAGO_CHOICES, 
        default='efectivo'
    )
    monto_recibido = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    vuelto = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"Venta {self.id} - ${self.total_venta} - {self.fecha_hora_venta.strftime('%d/%m/%Y %H:%M')}"

    def save(self, *args, **kwargs):
        # Calcular vuelto si es pago en efectivo
        if self.tipo_pago_venta == 'efectivo' and self.monto_recibido > 0:
            self.vuelto = self.monto_recibido - self.total_venta
        else:
            self.vuelto = 0
        super().save(*args, **kwargs)

class DetalleVenta(models.Model):
    venta = models.ForeignKey(
        Venta, 
        on_delete=models.CASCADE  # Según regla 2 - Cascada en borrado
    )  
    producto = models.ForeignKey(
        Producto, 
        on_delete=models.PROTECT  # Según regla 4 - Restringir modificación/borrado
    )
    cantidad_venta = models.IntegerField()  
    precio_uni_venta = models.DecimalField(max_digits=10, decimal_places=2)  
    subtotal_venta = models.DecimalField(max_digits=10, decimal_places=2)  

    def __str__(self):
        return f"Detalle {self.id} - {self.producto.nombre_prod} x{self.cantidad_venta}"

    def save(self, *args, **kwargs):
        # Calcular subtotal automáticamente
        self.subtotal_venta = self.cantidad_venta * self.precio_uni_venta
        super().save(*args, **kwargs)

class VentaSaeta(models.Model):
    detalle_venta = models.ForeignKey(
        DetalleVenta, 
        on_delete=models.CASCADE  # Según regla 3 - Cascada en borrado
    )
    monto_saeta = models.DecimalField(max_digits=10, decimal_places=2)  
    fecha_pago_saeta = models.DateField()  
    porcentaje_ganancia_saeta = models.DecimalField(max_digits=5, decimal_places=2)

    def __str__(self):
        return f"Saeta {self.id} - ${self.monto_saeta}"

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
    empleado_relacionado = models.OneToOneField(
        Empleado, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.get_tipo_usuario_display()}"

# Modelo adicional para gestionar turnos
class Turno(models.Model):
    nombre = models.CharField(max_length=50)
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

# Modelo para movimientos de caja (opcional)
class MovimientoCaja(models.Model):
    TIPO_MOVIMIENTO_CHOICES = [
        ('ingreso', 'Ingreso'),
        ('egreso', 'Egreso'),
    ]
    
    caja = models.ForeignKey(Caja, on_delete=models.PROTECT)
    tipo_movimiento = models.CharField(max_length=20, choices=TIPO_MOVIMIENTO_CHOICES)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    descripcion = models.TextField()
    fecha_hora = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tipo_movimiento} - ${self.monto} - {self.fecha_hora}"