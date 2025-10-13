from rest_framework import serializers
from .models import Producto, Proveedor, ProvProducto, Empleado
from django.contrib.auth.models import User

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
        # Obtener los proveedores relacionados
        prov_productos = ProvProducto.objects.filter(producto=obj)
        return [{
            'id': pp.proveedor.id,
            'nombre': pp.proveedor.nombre_prov,
            'tipo': pp.proveedor.tipo_prov
        } for pp in prov_productos]

class EmpleadoSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    
    class Meta:
        model = Empleado
        fields = ['id', 'nombre_emp', 'apellido_emp', 'dni_emp', 'telefono_emp', 
                 'domicilio_emp', 'tipo_usuario', 'email', 'first_name', 'last_name']