# MiApp/serializers.py - VERSIÓN COMPLETA CORREGIDA
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
        fields = ['id', 'nombre_prov', 'tipo_prov', 'telefono_prov', 'correo_prov', 'direccion_prov', 'descripcion', 'estado']

class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = [
            'id', 'nombre_prod', 'categoria_prod', 'descripcion_prod',
            'precio_total', 'precio_venta', 'codigo_prod',
            'fecha_entrada', 'fecha_vencimiento', 'cantidad'
        ]

class CompraSerializer(serializers.ModelSerializer):
    proveedores_nombres = serializers.SerializerMethodField()
    producto_nombre = serializers.CharField(source='producto.nombre_prod', read_only=True)
    
    class Meta:
        model = Compra
        fields = [
            'id', 'codigo_compra', 'proveedores', 'proveedores_nombres', 'producto', 'producto_nombre',
            'categoria_prod', 'fecha_entrada', 'fecha_vencimiento', 'cantidad', 
            'precio_total', 'precio_venta', 'descripcion', 'fecha_actualizacion'
        ]
        read_only_fields = ['fecha_actualizacion']

    def get_proveedores_nombres(self, obj):
        return [proveedor.nombre_prov for proveedor in obj.proveedores.all()]

    def create(self, validated_data):
        try:
            proveedores_data = validated_data.pop('proveedores', [])
            compra = Compra.objects.create(**validated_data)
            compra.proveedores.set(proveedores_data)
            return compra
        except Exception as e:
            print("Error en serializer create:", str(e))
            raise e

    def update(self, instance, validated_data):
        try:
            proveedores_data = validated_data.pop('proveedores', [])
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            instance.proveedores.set(proveedores_data)
            return instance
        except Exception as e:
            print("Error en serializer update:", str(e))
            raise e

class CajaSerializer(serializers.ModelSerializer):
    empleado_nombre = serializers.CharField(source='empleado.nombre_emp', read_only=True)
    
    class Meta:
        model = Caja
        fields = [
            'id', 'empleado', 'empleado_nombre', 'fecha_hs_apertura', 'fecha_hs_cierre', 
            'saldo_inicial', 'saldo_final', 'ingresos', 'egresos', 'monto_contado',
            'descripcion', 'turno', 'estado'
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
            'id', 'caja', 'empleado_nombre', 'fecha_hora_venta', 'total_venta', 
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