from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework import viewsets, status
from django.db import transaction
from django.db.models import Q
import json

# --- IMPORTACIONES CLAVE DE PERMISOS ---
from .permissions import IsJefa, IsJefaOrReadOnly, IsJefaOrEmpleado 

from .models import Empleado, Producto, Proveedor, ProvProducto, UserProfile, Caja, Venta, DetalleVenta
from .serializers import (
    ProductoSerializer, ProveedorSerializer, ProvProductoSerializer,
    UserProfileSerializer, CajaSerializer, VentaSerializer, DetalleVentaSerializer
)

# =======================================================
# ===== AUTENTICACIÓN =====
# =======================================================
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        confirm_password = request.data.get('confirm_password', password)
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        phone = request.data.get('phone', '')
        address = request.data.get('address', '')
        dni = request.data.get('dni', '')
        tipo_usuario = request.data.get('tipo_usuario', 'empleada')
        
        # Validaciones básicas
        if not email or not password or not dni:
            return Response({'error': 'Email, contraseña y DNI son obligatorios'}, status=400)
            
        if password != confirm_password:
            return Response({'error': 'Las contraseñas no coinciden'}, status=400)

        # Validar que solo haya una jefa
        if tipo_usuario == 'jefa' and UserProfile.objects.filter(tipo_usuario='jefa').exists():
            return Response({'error': 'Ya existe una jefa/encargada registrada'}, status=400)

        with transaction.atomic():
            # Crear usuario de Django
            username = email.split('@')[0]
            counter = 1
            original_username = username
            while User.objects.filter(username=username).exists():
                username = f"{original_username}{counter}"
                counter += 1
                
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            
            # Crear empleado (SIN tipo_usuario)
            empleado = Empleado.objects.create(
                user=user,
                nombre_emp=first_name,
                apellido_emp=last_name,
                dni_emp=dni,
                telefono_emp=phone,
                domicilio_emp=address
                # ❌ NO incluir tipo_usuario aquí
            )
            
            # Crear perfil de usuario (SOLO aquí va el tipo_usuario)
            UserProfile.objects.create(
                user=user,
                tipo_usuario=tipo_usuario,
                dni=dni,
                telefono=phone,
                direccion=address,
                empleado_relacionado=empleado
            )
            
            # Crear token
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'message': 'Usuario creado con éxito',
                'token': token.key,
                'user_id': user.id,
                'empleado_id': empleado.id,
                'tipo_usuario': tipo_usuario,
                'nombre_completo': f"{first_name} {last_name}"
            }, status=201)
        
    except Exception as e:
        return Response({'error': f'Error interno: {str(e)}'}, status=500)
    
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    try:
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({'error': 'Email y contraseña son obligatorios'}, status=400)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=400)
        
        if not user.check_password(password):
            return Response({'error': 'Contraseña incorrecta'}, status=400)
        
        token, created = Token.objects.get_or_create(user=user)
        
        # ✅ LÓGICA CORREGIDA - Solo usar UserProfile
        try:
            user_profile = UserProfile.objects.get(user=user)
            tipo_usuario = user_profile.tipo_usuario
            empleado_id = user_profile.empleado_relacionado.id if user_profile.empleado_relacionado else None
            
            # Obtener nombre del empleado relacionado
            if user_profile.empleado_relacionado:
                nombre_completo = f"{user_profile.empleado_relacionado.nombre_emp} {user_profile.empleado_relacionado.apellido_emp}"
            else:
                nombre_completo = f"{user.first_name} {user.last_name}"
                
        except UserProfile.DoesNotExist:
            # Si no existe perfil, crear uno por defecto
            user_profile = UserProfile.objects.create(
                user=user,
                tipo_usuario='empleada',
                dni='',
                telefono='',
                direccion=''
            )
            tipo_usuario = 'empleada'
            empleado_id = None
            nombre_completo = f"{user.first_name} {user.last_name}"
        
        return Response({
            'token': token.key,
            'user_id': user.id,
            'empleado_id': empleado_id,
            'tipo_usuario': tipo_usuario,
            'nombre': nombre_completo,
            'email': user.email
        })
        
    except Exception as e:
        return Response({'error': f'Error interno: {str(e)}'}, status=500)
    
# =======================================================
# ===== EMPLEADOS (Permisos manuales en la función) =====
# =======================================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def empleados_list(request):
    if request.method == 'GET':
        try:
            # Verificar permisos - solo jefas pueden ver la lista completa
            user_profile = UserProfile.objects.get(user=request.user)
            if user_profile.tipo_usuario != 'jefa':
                # Si no es jefa, se deniega (el frontend ya gestiona esto, pero por seguridad)
                return Response({'error': 'No tiene permisos para ver esta información'}, status=403)
            
            empleados = Empleado.objects.select_related('user').all()
            data = []
            for emp in empleados:
                # Intenta obtener el email del usuario de Django
                email = emp.user.email if emp.user else None
                # Intenta obtener el perfil para asegurar el tipo_usuario
                tipo_usuario_perfil = emp.user.userprofile.tipo_usuario if emp.user and hasattr(emp.user, 'userprofile') else emp.tipo_usuario
                
                data.append({
                    'id': emp.id,
                    'nombre_emp': emp.nombre_emp,
                    'apellido_emp': emp.apellido_emp,
                    'dni_emp': emp.dni_emp,
                    'telefono_emp': emp.telefono_emp,
                    'domicilio_emp': emp.domicilio_emp,
                    # Usar el rol más actualizado si está disponible
                    'tipo_usuario': tipo_usuario_perfil, 
                    'user': {
                        'id': emp.user.id if emp.user else None,
                        'email': email,
                        'username': emp.user.username if emp.user else None
                    }
                })
            return Response(data)
            
        except UserProfile.DoesNotExist:
            return Response({'error': 'Perfil de usuario no encontrado'}, status=404)
        except Exception as e:
            return Response({'error': f'Error interno: {str(e)}'}, status=500)
    
    elif request.method == 'POST':
        try:
            # Verificar permisos - solo jefas pueden crear empleados
            user_profile = UserProfile.objects.get(user=request.user)
            if user_profile.tipo_usuario != 'jefa':
                return Response({'error': 'No tiene permisos para crear empleados'}, status=403)
            
            data = request.data
            
            # Validaciones (código sin cambios)
            required_fields = ['nombre_emp', 'apellido_emp', 'dni_emp', 'telefono_emp', 'domicilio_emp', 'email', 'password']
            for field in required_fields:
                if not data.get(field):
                    return Response({'error': f'El campo {field} es requerido'}, status=400)
            
            # Verificar DNI único
            if Empleado.objects.filter(dni_emp=data['dni_emp']).exists():
                return Response({'error': 'Ya existe un empleado con este DNI'}, status=400)
            
            # Verificar email único
            if User.objects.filter(email=data['email']).exists():
                return Response({'error': 'Ya existe un usuario con este email'}, status=400)
            
            # Validar tipo de usuario
            tipo_usuario = data.get('tipo_usuario', 'empleada')
            if tipo_usuario not in ['jefa', 'empleada']:
                return Response({'error': 'Tipo de usuario no válido'}, status=400)
            
            # Validar que solo haya una jefa
            if tipo_usuario == 'jefa' and Empleado.objects.filter(tipo_usuario='jefa').exists():
                # Esta validación se debe hacer sobre UserProfile/Empleado, ya la tienes aquí
                pass 
            
            with transaction.atomic():
                # Crear usuario (código sin cambios)
                username = data['email'].split('@')[0]
                counter = 1
                original_username = username
                while User.objects.filter(username=username).exists():
                    username = f"{original_username}{counter}"
                    counter += 1
                
                user = User.objects.create_user(
                    username=username,
                    email=data['email'],
                    password=data['password'],
                    first_name=data['nombre_emp'],
                    last_name=data['apellido_emp']
                )
                
                # Crear empleado
                empleado = Empleado.objects.create(
                    user=user,
                    nombre_emp=data['nombre_emp'],
                    apellido_emp=data['apellido_emp'],
                    dni_emp=data['dni_emp'],
                    telefono_emp=data['telefono_emp'],
                    domicilio_emp=data['domicilio_emp'],
                    tipo_usuario=tipo_usuario
                )
                
                # Crear perfil de usuario
                UserProfile.objects.create(
                    user=user,
                    tipo_usuario=tipo_usuario,
                    dni=data['dni_emp'],
                    telefono=data['telefono_emp'],
                    direccion=data['domicilio_emp'],
                    empleado_relacionado=empleado
                )
                
                return Response({
                    'message': 'Empleado creado exitosamente',
                    'empleado_id': empleado.id
                }, status=201)
                
        except Exception as e:
            return Response({'error': f'Error interno: {str(e)}'}, status=500)

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def empleado_detail(request, id):
    try:
        # Verificar permisos - solo jefas pueden modificar/eliminar empleados
        user_profile = UserProfile.objects.get(user=request.user)
        if user_profile.tipo_usuario != 'jefa':
            return Response({'error': 'No tiene permisos para realizar esta acción'}, status=403)
        
        empleado = Empleado.objects.get(id=id)
        
        if request.method == 'PUT':
            data = request.data
            
            # Validaciones (código sin cambios)
            required_fields = ['nombre_emp', 'apellido_emp', 'dni_emp', 'telefono_emp', 'domicilio_emp', 'email']
            for field in required_fields:
                if not data.get(field):
                    return Response({'error': f'El campo {field} es requerido'}, status=400)
            
            # Verificar DNI único (excluyendo el actual)
            if Empleado.objects.filter(dni_emp=data['dni_emp']).exclude(id=id).exists():
                return Response({'error': 'Ya existe otro empleado con este DNI'}, status=400)
            
            # Verificar email único (excluyendo el actual)
            if User.objects.filter(email=data['email']).exclude(id=empleado.user.id).exists():
                return Response({'error': 'Ya existe otro usuario con este email'}, status=400)
            
            with transaction.atomic():
                # Actualizar empleado
                empleado.nombre_emp = data['nombre_emp']
                empleado.apellido_emp = data['apellido_emp']
                empleado.dni_emp = data['dni_emp']
                empleado.telefono_emp = data['telefono_emp']
                empleado.domicilio_emp = data['domicilio_emp']
                empleado.tipo_usuario = data.get('tipo_usuario', empleado.tipo_usuario)
                empleado.save()
                
                # Actualizar usuario
                if empleado.user:
                    empleado.user.email = data['email']
                    empleado.user.first_name = data['nombre_emp']
                    empleado.user.last_name = data['apellido_emp']
                    if data.get('password'):
                        empleado.user.set_password(data['password'])
                    empleado.user.save()
                
                # Actualizar perfil de usuario (también el rol)
                try:
                    user_profile = UserProfile.objects.get(empleado_relacionado=empleado)
                    user_profile.dni = data['dni_emp']
                    user_profile.telefono = data['telefono_emp']
                    user_profile.direccion = data['domicilio_emp']
                    user_profile.tipo_usuario = data.get('tipo_usuario', empleado.tipo_usuario)
                    user_profile.save()
                except UserProfile.DoesNotExist:
                    pass
                
                return Response({'message': 'Empleado actualizado exitosamente'})
                
        elif request.method == 'DELETE':
            # No permitir eliminarse a sí mismo
            if empleado.user == request.user:
                return Response({'error': 'No puede eliminarse a sí mismo'}, status=400)
            
            with transaction.atomic():
                # Eliminar usuario (esto eliminará automáticamente el empleado por CASCADE)
                if empleado.user:
                    empleado.user.delete()
                else:
                    empleado.delete()
                
                return Response({'message': 'Empleado eliminado exitosamente'})
                
    except Empleado.DoesNotExist:
        return Response({'error': 'Empleado no encontrado'}, status=404)
    except Exception as e:
        return Response({'error': f'Error interno: {str(e)}'}, status=500)

# =======================================================
# ===== VIEWSETS (Permisos aplicados) =====
# =======================================================
class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all().order_by('id')
    serializer_class = ProductoSerializer
    permission_classes = [IsJefaOrReadOnly]

    def get_queryset(self):
        queryset = Producto.objects.all().order_by('id')
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(nombre_prod__icontains=search) |
                Q(categoria_prod__icontains=search)
            )
        return queryset

    @action(detail=True, methods=['get'])
    def proveedores(self, request, pk=None):
        try:
            producto = self.get_object()
            proveedores_ids = ProvProducto.objects.filter(
                producto=producto
            ).values_list('proveedor_id', flat=True)
            
            proveedores = Proveedor.objects.filter(id__in=proveedores_ids)
            serializer = ProveedorSerializer(proveedores, many=True)
            return Response(serializer.data)
        except Producto.DoesNotExist:
            return Response({'error': 'Producto no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def asignar_proveedores(self, request, pk=None):
        try:
            producto = self.get_object()
            proveedores_ids = request.data.get('proveedores', [])
            
            ProvProducto.objects.filter(producto=producto).delete()
            
            for proveedor_id in proveedores_ids:
                try:
                    proveedor = Proveedor.objects.get(id=proveedor_id)
                    ProvProducto.objects.create(producto=producto, proveedor=proveedor)
                except Proveedor.DoesNotExist:
                    continue
            
            return Response({'message': 'Proveedores asignados correctamente'})
        except Producto.DoesNotExist:
            return Response({'error': 'Producto no encontrado'}, status=status.HTTP_404_NOT_FOUND)

class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all().order_by('id')
    serializer_class = ProveedorSerializer
    permission_classes = [IsJefaOrReadOnly]

    def get_queryset(self):
        queryset = Proveedor.objects.all().order_by('id')
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(nombre_prov__icontains=search) |
                Q(tipo_prov__icontains=search) |
                Q(correo_prov__icontains=search)
            )
        return queryset

class ProvProductoViewSet(viewsets.ModelViewSet):
    queryset = ProvProducto.objects.all().order_by('id')
    serializer_class = ProvProductoSerializer
    permission_classes = [IsJefaOrReadOnly]

    @action(detail=False, methods=['get'])
    def por_producto(self, request):
        producto_id = request.query_params.get('producto_id')
        if not producto_id:
            return Response({'error': 'Se requiere producto_id'}, status=400)
        relaciones = ProvProducto.objects.filter(producto_id=producto_id)
        serializer = self.get_serializer(relaciones, many=True)
        return Response(serializer.data)

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsJefaOrEmpleado]

class CajaViewSet(viewsets.ModelViewSet):
    queryset = Caja.objects.all()
    serializer_class = CajaSerializer
    permission_classes = [IsJefaOrEmpleado]

class VentaViewSet(viewsets.ModelViewSet):
    queryset = Venta.objects.all()
    serializer_class = VentaSerializer
    permission_classes = [IsJefaOrEmpleado]

class DetalleVentaViewSet(viewsets.ModelViewSet):
    queryset = DetalleVenta.objects.all()
    serializer_class = DetalleVentaSerializer
    permission_classes = [IsJefaOrEmpleado]
