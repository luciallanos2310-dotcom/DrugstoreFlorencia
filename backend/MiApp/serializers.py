from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Empleado, Producto, Proveedor, Caja, Venta, DetalleVenta, VentaSaeta, Compra

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class EmpleadoSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Empleado
        fields = [
            'id', 'nombre_emp', 'apellido_emp', 'dni_emp', 'telefono_emp', 
            'domicilio_emp', 'tipo_usuario', 'email', 'first_name', 'last_name', 
            'username', 'fecha_creacion', 'descripcion'
        ]

class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = ['id', 'nombre_prov', 'tipo_prov', 'telefono_prov', 'correo_prov', 'direccion_prov', 'descripcion', 'codigo_proveedor', 'estado']  # ✅ CAMBIADO

# En serializers.py - ProductoSerializer
class ProductoSerializer(serializers.ModelSerializer):
    estado_stock = serializers.SerializerMethodField()
    
    class Meta:
        model = Producto
        fields = [
            'id', 'nombre_prod', 'categoria_prod', 'descripcion_prod',
            'codigo_prod', 'precio_venta', 'cantidad', 'stock_minimo',
            'estado_stock', 'disponible', 'bajo_stock'
        ]
        read_only_fields = ['estado_stock', 'disponible', 'bajo_stock']

    def get_estado_stock(self, obj):
        if obj.cantidad == 0:
            return "🔴 Agotado"
        elif obj.bajo_stock:
            return "🟡 Bajo stock"
        else:
            return "🟢 En stock"

class CompraSerializer(serializers.ModelSerializer):
    proveedores_nombres = serializers.SerializerMethodField()
    producto_nombre = serializers.CharField(source='producto.nombre_prod', read_only=True)

    class Meta:
        model = Compra
        fields = [
            'id', 'codigo_compra', 'estado',
            'proveedores', 'proveedores_nombres',
            'producto', 'producto_nombre',
            'cantidad', 'precio_total',
            'fecha_compra', 'descripcion'
        ]
        read_only_fields = ['fecha_compra']

    def get_proveedores_nombres(self, obj):
        return [p.nombre_prov for p in obj.proveedores.all()]

    def update(self, instance, validated_data):
        """
        SOLO permitir modificar: descripción, proveedores y estado.
        EL MODELO se encarga del stock automáticamente en save()
        """
        # Obtener proveedores antes de pop
        proveedores_data = validated_data.pop('proveedores', None)
        
        # Aplicar cambios permitidos
        for attr, value in validated_data.items():
            if attr in ['descripcion', 'estado']:
                setattr(instance, attr, value)

        instance.save()  # ✅ El modelo maneja el stock automáticamente

        if proveedores_data is not None:
            instance.proveedores.set(proveedores_data)

        return instance
class CajaSerializer(serializers.ModelSerializer):
    empleado_nombre = serializers.CharField(source='empleado.nombre_emp', read_only=True)
    monto_esperado = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    diferencia = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_ventas = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    
    class Meta:
        model = Caja
        fields = [
            'id', 'empleado', 'empleado_nombre', 'fecha_hs_apertura', 'fecha_hs_cierre', 
            'saldo_inicial', 'saldo_final', 'ingresos', 'egresos', 'monto_contado',
            'descripcion', 'turno', 'estado', 'monto_esperado', 'diferencia', 'total_ventas'
        ]

class DetalleVentaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre_prod', read_only=True)
    
    class Meta:
        model = DetalleVenta
        fields = ['id', 'venta', 'producto', 'producto_nombre', 'cantidad', 'precio_unitario', 'subtotal', 'creado_en']

class VentaSerializer(serializers.ModelSerializer):
    detalles = DetalleVentaSerializer(many=True, read_only=True)
    empleado_nombre = serializers.CharField(source='caja.empleado.nombre_emp', read_only=True)
    
    class Meta:
        model = Venta
        fields = [
            'id', 'caja', 'empleado_nombre', 'codigo_venta', 'fecha_hora_venta', 'total_venta', 
            'estado_venta', 'tipo_pago_venta', 'monto_recibido', 'vuelto', 
            'descripcion', 'detalles', 'creado_en', 'actualizado_en'
        ]

class VentaSaetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = VentaSaeta
        fields = [
            'id', 'detalle_venta', 'venta', 'monto_saeta', 
            'fecha_pago_saeta', 'porcentaje_ganancia_saeta', 'ganancia_drugstore', 'descripcion'
        ]