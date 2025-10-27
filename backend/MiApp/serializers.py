from rest_framework import serializers
from .models import Producto, Proveedor, ProvProducto, Empleado, UserProfile, Caja, Venta, DetalleVenta
from django.contrib.auth.models import User

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
        fields = ['id', 'nombre_emp', 'apellido_emp', 'dni_emp', 'telefono_emp', 
                 'domicilio_emp', 'tipo_usuario', 'email', 'first_name', 'last_name', 'username']

class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = ['id', 'nombre_prov', 'tipo_prov', 'telefono_prov', 'correo_prov', 'direccion_prov']

class ProvProductoSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.CharField(source='proveedor.nombre_prov', read_only=True)
    producto_nombre = serializers.CharField(source='producto.nombre_prod', read_only=True)
    
    class Meta:
        model = ProvProducto
        fields = ['id', 'producto', 'proveedor', 'proveedor_nombre', 'producto_nombre']

class ProductoSerializer(serializers.ModelSerializer):
    proveedores_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Producto
        fields = ['id', 'nombre_prod', 'categoria_prod', 'descripcion_prod', 
                 'stock_actual', 'stock_minimo', 'precio_prod', 'fecha_vencimiento', 'proveedores_info']
    
    def get_proveedores_info(self, obj):
        prov_productos = ProvProducto.objects.filter(producto=obj)
        return [{
            'id': pp.proveedor.id,
            'nombre': pp.proveedor.nombre_prov,
            'tipo': pp.proveedor.tipo_prov
        } for pp in prov_productos]

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    empleado_nombre = serializers.CharField(source='empleado_relacionado.nombre_emp', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'tipo_usuario', 'dni', 'telefono', 'direccion', 'empleado_relacionado', 'empleado_nombre']

class CajaSerializer(serializers.ModelSerializer):
    empleado_nombre = serializers.CharField(source='empleado.nombre_emp', read_only=True)
    
    class Meta:
        model = Caja
        fields = ['id', 'empleado', 'empleado_nombre', 'fecha_hs_apertura', 'fecha_hs_cierre', 
                 'saldo_inicial', 'saldo_final', 'turno', 'observaciones', 'estado']

class DetalleVentaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre_prod', read_only=True)
    
    class Meta:
        model = DetalleVenta
        fields = ['id', 'venta', 'producto', 'producto_nombre', 'cantidad_venta', 
                 'precio_uni_venta', 'subtotal_venta']

class VentaSerializer(serializers.ModelSerializer):
    detalles = DetalleVentaSerializer(many=True, read_only=True, source='detalleventa_set')
    empleado_nombre = serializers.CharField(source='caja.empleado.nombre_emp', read_only=True)
    
    class Meta:
        model = Venta
        fields = ['id', 'caja', 'empleado_nombre', 'fecha_hora_venta', 'total_venta', 
                 'estado_venta', 'tipo_pago_venta', 'monto_recibido', 'vuelto', 'detalles']