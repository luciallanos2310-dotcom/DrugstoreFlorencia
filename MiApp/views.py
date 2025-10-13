from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from django.db import transaction
from .models import Empleado, Producto, Proveedor, ProvProducto
from rest_framework import viewsets, status
from rest_framework.decorators import action
from .serializers import ProductoSerializer, ProveedorSerializer, ProvProductoSerializer
from django.db.models import Q

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
        tipo_usuario = request.data.get('tipo_usuario', 'empleado')
        
        # Validaciones básicas
        if not email or not password or not dni:
            return Response({'error': 'Email, contraseña y DNI son obligatorios'}, status=400)
            
        if password != confirm_password:
            return Response({'error': 'Las contraseñas no coinciden'}, status=400)
            
        # Validar longitud del teléfono
        if phone and len(phone) > 60:
            return Response({'error': 'El número de teléfono no puede tener más de 60 caracteres'}, status=400)
            
        # Validar longitud del DNI
        if dni and len(str(dni)) > 15:
            return Response({'error': 'El DNI no puede tener más de 15 caracteres'}, status=400)
            
        # Verificar si el DNI ya existe
        if Empleado.objects.filter(dni_emp=dni).exists():
            return Response({'error': 'Ya existe un empleado con este DNI'}, status=400)
            
        # Verificar si el email ya existe
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Ya existe un usuario con este email'}, status=400)
        
        # Validar que solo haya una jefa
        if tipo_usuario == 'administrador' and Empleado.objects.filter(tipo_usuario='administrador').exists():
             return Response({'error': 'Ya existe un administrador registrado'}, status=400)

        # USAR TRANSACCIÓN PARA ROLLBACK EN CASO DE ERROR
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
            
            # Crear empleado vinculado al usuario
            empleado = Empleado.objects.create(
                user=user,
                nombre_emp=first_name,
                apellido_emp=last_name,
                dni_emp=dni,
                telefono_emp=phone,
                domicilio_emp=address,
                tipo_usuario=tipo_usuario
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
        
        # Buscar usuario por email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=400)
        
        # Verificar contraseña
        if not user.check_password(password):
            return Response({'error': 'Contraseña incorrecta'}, status=400)
        
        # Obtener o crear token
        token, created = Token.objects.get_or_create(user=user)
        
        # Obtener datos del empleado
        try:
            empleado = Empleado.objects.get(user=user)
            tipo_usuario = empleado.tipo_usuario
            nombre_completo = f"{user.first_name} {user.last_name}"
        except Empleado.DoesNotExist:
            tipo_usuario = 'empleado'
            nombre_completo = f"{user.first_name} {user.last_name}"
        
        return Response({
            'token': token.key,
            'user_id': user.id,
            'tipo_usuario': tipo_usuario,
            'nombre': nombre_completo,
            'email': user.email
        })
        
    except Exception as e:
        return Response({'error': f'Error interno: {str(e)}'}, status=500)

# --- CRUD de Productos ---
class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.all().order_by('id')
    serializer_class = ProductoSerializer
    permission_classes = [IsAuthenticated]

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
        """Obtener proveedores de un producto específico"""
        try:
            producto = self.get_object()
            # Obtener proveedores a través de ProvProducto
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
        """Asignar proveedores a un producto"""
        try:
            producto = self.get_object()
            proveedores_ids = request.data.get('proveedores', [])
            
            # Eliminar relaciones existentes
            ProvProducto.objects.filter(producto=producto).delete()
            
            # Crear nuevas relaciones
            for proveedor_id in proveedores_ids:
                try:
                    proveedor = Proveedor.objects.get(id=proveedor_id)
                    ProvProducto.objects.create(producto=producto, proveedor=proveedor)
                except Proveedor.DoesNotExist:
                    continue
            
            return Response({'message': 'Proveedores asignados correctamente'})
        except Producto.DoesNotExist:
            return Response({'error': 'Producto no encontrado'}, status=status.HTTP_404_NOT_FOUND)

# --- CRUD de Proveedores ---
class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all().order_by('id')
    serializer_class = ProveedorSerializer
    permission_classes = [IsAuthenticated]

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

# --- CRUD de Relación Producto-Proveedor ---
class ProvProductoViewSet(viewsets.ModelViewSet):
    queryset = ProvProducto.objects.all().order_by('id')
    serializer_class = ProvProductoSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def por_producto(self, request):
        producto_id = request.query_params.get('producto_id')
        if not producto_id:
            return Response({'error': 'Se requiere producto_id'}, status=400)
        relaciones = ProvProducto.objects.filter(producto_id=producto_id)
        serializer = self.get_serializer(relaciones, many=True)
        return Response(serializer.data)