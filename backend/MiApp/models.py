from django.db import models
from django.contrib.auth.models import User
import uuid

class Empleado(models.Model):
    TIPO_USUARIO_CHOICES = [('jefa', 'Jefa/Encargada'), ('empleada', 'Empleada')]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    nombre_emp = models.CharField(max_length=50, blank=True, null=True)
    apellido_emp = models.CharField(max_length=50, blank=True, null=True)
    dni_emp = models.CharField(max_length=15, unique=True, blank=True, null=True)
    telefono_emp = models.CharField(max_length=50, blank=True, null=True)
    domicilio_emp = models.TextField(blank=True, null=True)
    tipo_usuario = models.CharField(max_length=10, choices=TIPO_USUARIO_CHOICES, default='empleada')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.nombre_emp} {self.apellido_emp}" if self.nombre_emp else f"Empleado {self.id}"

class Caja(models.Model):
    TURNO_CHOICES = [('mañana', 'Turno Mañana'), ('tarde', 'Turno Tarde')]
    
    empleado = models.ForeignKey('Empleado', on_delete=models.PROTECT, null=True, blank=True)
    fecha_hs_apertura = models.DateTimeField()
    fecha_hs_cierre = models.DateTimeField(null=True, blank=True)
    saldo_inicial = models.DecimalField(max_digits=10, decimal_places=2)
    saldo_final = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    turno = models.CharField(max_length=20, choices=TURNO_CHOICES, default='mañana')
    descripcion = models.TextField(blank=True, null=True)
    estado = models.CharField(max_length=20, choices=[('abierta', 'Abierta'), ('cerrada', 'Cerrada')], default='abierta')

    def __str__(self):
        return f"Caja {self.id} - {self.turno}"

# models.py - Actualizar el modelo Proveedor
class Proveedor(models.Model):
    nombre_prov = models.CharField(max_length=50)
    tipo_prov = models.CharField(max_length=50)
    telefono_prov = models.CharField(max_length=20, null=True, blank=True)
    correo_prov = models.EmailField(null=True, blank=True)
    direccion_prov = models.CharField(max_length=100, blank=True, null=True)
    descripcion = models.TextField(blank=True, null=True)
    estado = models.BooleanField(default=True)  # ✅ SOLO ESTE CAMPO NUEVO

    def __str__(self):
        return self.nombre_prov

    @property
    def estado_display(self):
        return "Activo" if self.estado else "Inactivo"

class Producto(models.Model):
    nombre_prod = models.CharField(max_length=100)
    categoria_prod = models.CharField(max_length=50)
    descripcion_prod = models.TextField(blank=True, null=True)
    precio_total = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Precio total")
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="Precio venta")
    codigo_prod = models.CharField(max_length=20, unique=True, blank=True, null=True, verbose_name="Código")
    fecha_entrada = models.DateField(verbose_name="Fecha entrada")
    fecha_vencimiento = models.DateField(null=True, blank=True, verbose_name="Fecha vencimiento")
    cantidad = models.IntegerField(verbose_name="Stock disponible", default=0)

    def __str__(self):
        return self.nombre_prod

    def vender(self, cantidad_vendida):
        """Vender producto - reducir cantidad"""
        if cantidad_vendida > self.cantidad:
            raise ValueError(f"Stock insuficiente. Disponible: {self.cantidad}, Solicitado: {cantidad_vendida}")
        self.cantidad -= cantidad_vendida
        self.save()

    def comprar(self, cantidad_comprada, precio_total=None, precio_venta=None):
        """Comprar producto - aumentar cantidad y actualizar precios si se proporcionan"""
        self.cantidad += cantidad_comprada
        
        if precio_total is not None:
            self.precio_total = precio_total
        if precio_venta is not None:
            self.precio_venta = precio_venta
            
        self.save()

    @property
    def disponible(self):
        return self.cantidad > 0

    @property
    def bajo_stock(self):
        return self.cantidad < 10

class Compra(models.Model):
    codigo_compra = models.CharField(max_length=50, unique=True)
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    proveedores = models.ManyToManyField(Proveedor)
    categoria_prod = models.CharField(max_length=100, blank=True)
    fecha_entrada = models.DateField()
    fecha_vencimiento = models.DateField(null=True, blank=True)
    cantidad = models.IntegerField()
    precio_total = models.DecimalField(max_digits=10, decimal_places=2)
    precio_venta = models.DecimalField(max_digits=10, decimal_places=2)
    descripcion = models.TextField(blank=True, null=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.codigo_compra} - {self.producto.nombre_prod}"

    def save(self, *args, **kwargs):
        if not self.pk:
            self.producto.comprar(
                self.cantidad, 
                self.precio_total, 
                self.precio_venta
            )
        else:
            compra_anterior = Compra.objects.get(pk=self.pk)
            diferencia = self.cantidad - compra_anterior.cantidad
            if diferencia != 0:
                self.producto.comprar(diferencia)
        
        if not self.categoria_prod:
            self.categoria_prod = self.producto.categoria_prod
            
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        self.producto.vender(self.cantidad)
        super().delete(*args, **kwargs)

# models.py - Modelos mejorados para Ventas
class Venta(models.Model):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('completada', 'Completada'), 
        ('cancelada', 'Cancelada')
    ]
    PAGO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia')
    ]
    
    caja = models.ForeignKey('Caja', on_delete=models.PROTECT)
    fecha_hora_venta = models.DateTimeField(auto_now_add=True)
    total_venta = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    estado_venta = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='completada')
    tipo_pago_venta = models.CharField(max_length=20, choices=PAGO_CHOICES, default='efectivo')
    monto_recibido = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    vuelto = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    descripcion = models.TextField(blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Venta {self.id} - ${self.total_venta}"

    def save(self, *args, **kwargs):
        # Calcular vuelto solo si es pago en efectivo
        if self.tipo_pago_venta == 'efectivo' and self.monto_recibido > 0:
            self.vuelto = max(self.monto_recibido - self.total_venta, 0)
        else:
            self.vuelto = 0
        super().save(*args, **kwargs)

class DetalleVenta(models.Model):
    venta = models.ForeignKey('Venta', on_delete=models.CASCADE, related_name='detalles')
    producto = models.ForeignKey('Producto', on_delete=models.PROTECT)
    cantidad = models.PositiveIntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Detalle {self.id} - {self.producto.nombre_prod}"

    def save(self, *args, **kwargs):
        # Calcular subtotal automáticamente
        self.subtotal = self.cantidad * self.precio_unitario
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = 'Detalle de Venta'
        verbose_name_plural = 'Detalles de Ventas'

class VentaSaeta(models.Model):
    detalle_venta = models.ForeignKey('DetalleVenta', on_delete=models.CASCADE)
    monto_saeta = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_pago_saeta = models.DateField()
    porcentaje_ganancia_saeta = models.DecimalField(max_digits=5, decimal_places=2)
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Saeta {self.id} - ${self.monto_saeta}"