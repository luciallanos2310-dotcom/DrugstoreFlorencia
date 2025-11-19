# MiApp/views.py - VERSIÓN CORREGIDA
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

from .permissions import IsJefa, IsJefaOrReadOnly, IsJefaOrEmpleado 
from .models import Empleado, Producto, Proveedor, Caja, Venta, DetalleVenta, VentaSaeta, Compra
from .serializers import (
    ProductoSerializer, ProveedorSerializer, CajaSerializer, 
    VentaSerializer, DetalleVentaSerializer, EmpleadoSerializer, CompraSerializer
)
from .models import VentaSaeta
from .serializers import VentaSaetaSerializer

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
        
        if not email or not password or not dni:
            return Response({'error': 'Email, contraseña y DNI son obligatorios'}, status=400)
            
        if password != confirm_password:
            return Response({'error': 'Las contraseñas no coinciden'}, status=400)

        if tipo_usuario == 'jefa' and Empleado.objects.filter(tipo_usuario='jefa').exists():
            return Response({'error': 'Ya existe una jefa/encargada registrada'}, status=400)

        with transaction.atomic():
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
            
            empleado = Empleado.objects.create(
                user=user,
                nombre_emp=first_name,
                apellido_emp=last_name,
                dni_emp=dni,
                telefono_emp=phone,
                domicilio_emp=address,
                tipo_usuario=tipo_usuario
            )
            
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
            # BUSCAR POR EMAIL en lugar de username
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=400)
        
        if not user.check_password(password):
            return Response({'error': 'Contraseña incorrecta'}, status=400)
        
        token, created = Token.objects.get_or_create(user=user)
        
        try:
            empleado = Empleado.objects.get(user=user)
            tipo_usuario = empleado.tipo_usuario
            nombre_completo = f"{empleado.nombre_emp} {empleado.apellido_emp}"
            empleado_id = empleado.id
        except Empleado.DoesNotExist:
            tipo_usuario = 'empleada'
            nombre_completo = f"{user.first_name} {user.last_name}"
            empleado_id = None
        
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
# ===== EMPLEADOS =====
# =======================================================
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def empleados_list(request):
    if request.method == 'GET':
        try:
            user_profile = request.user.empleado
            if user_profile.tipo_usuario != 'jefa':
                return Response({'error': 'No tiene permisos para ver esta información'}, status=403)
            
            empleados = Empleado.objects.select_related('user').all()
            serializer = EmpleadoSerializer(empleados, many=True)
            return Response(serializer.data)
            
        except Empleado.DoesNotExist:
            return Response({'error': 'Perfil de empleado no encontrado'}, status=404)
        except Exception as e:
            return Response({'error': f'Error interno: {str(e)}'}, status=500)
    
    elif request.method == 'POST':
        try:
            user_profile = request.user.empleado
            if user_profile.tipo_usuario != 'jefa':
                return Response({'error': 'No tiene permisos para crear empleados'}, status=403)
            
            data = request.data
            
            required_fields = ['nombre_emp', 'apellido_emp', 'dni_emp', 'telefono_emp', 'domicilio_emp', 'email', 'password']
            for field in required_fields:
                if not data.get(field):
                    return Response({'error': f'El campo {field} es requerido'}, status=400)
            
            if Empleado.objects.filter(dni_emp=data['dni_emp']).exists():
                return Response({'error': 'Ya existe un empleado con este DNI'}, status=400)
            
            if User.objects.filter(email=data['email']).exists():
                return Response({'error': 'Ya existe un usuario con este email'}, status=400)
            
            tipo_usuario = data.get('tipo_usuario', 'empleada')
            if tipo_usuario not in ['jefa', 'empleada']:
                return Response({'error': 'Tipo de usuario no válido'}, status=400)
            
            if tipo_usuario == 'jefa' and Empleado.objects.filter(tipo_usuario='jefa').exists():
                return Response({'error': 'Ya existe una jefa/encargada registrada'}, status=400)

            with transaction.atomic():
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
                
                empleado = Empleado.objects.create(
                    user=user,
                    nombre_emp=data['nombre_emp'],
                    apellido_emp=data['apellido_emp'],
                    dni_emp=data['dni_emp'],
                    telefono_emp=data['telefono_emp'],
                    domicilio_emp=data['domicilio_emp'],
                    tipo_usuario=tipo_usuario
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
        user_profile = request.user.empleado
        if user_profile.tipo_usuario != 'jefa':
            return Response({'error': 'No tiene permisos para realizar esta acción'}, status=403)
        
        empleado = Empleado.objects.get(id=id)
        
        if request.method == 'PUT':
            data = request.data
            
            required_fields = ['nombre_emp', 'apellido_emp', 'dni_emp', 'telefono_emp', 'domicilio_emp', 'email']
            for field in required_fields:
                if not data.get(field):
                    return Response({'error': f'El campo {field} es requerido'}, status=400)
            
            if Empleado.objects.filter(dni_emp=data['dni_emp']).exclude(id=id).exists():
                return Response({'error': 'Ya existe otro empleado con este DNI'}, status=400)
            
            if User.objects.filter(email=data['email']).exclude(id=empleado.user.id).exists():
                return Response({'error': 'Ya existe otro usuario con este email'}, status=400)
            
            with transaction.atomic():
                empleado.nombre_emp = data['nombre_emp']
                empleado.apellido_emp = data['apellido_emp']
                empleado.dni_emp = data['dni_emp']
                empleado.telefono_emp = data['telefono_emp']
                empleado.domicilio_emp = data['domicilio_emp']
                empleado.tipo_usuario = data.get('tipo_usuario', empleado.tipo_usuario)
                empleado.save()
                
                if empleado.user:
                    empleado.user.email = data['email']
                    empleado.user.first_name = data['nombre_emp']
                    empleado.user.last_name = data['apellido_emp']
                    if data.get('password'):
                        empleado.user.set_password(data['password'])
                    empleado.user.save()
                
                return Response({'message': 'Empleado actualizado exitosamente'})
                
        elif request.method == 'DELETE':
            if empleado.user == request.user:
                return Response({'error': 'No puede eliminarse a sí mismo'}, status=400)
            
            with transaction.atomic():
                if empleado.user:
                    empleado.user.delete()
                else:
                    empleado.delete()
                
                return Response({'message': 'Empleado eliminado exitosamente'})
                
    except Empleado.DoesNotExist:
        return Response({'error': 'Empleado no encontrado'}, status=404)
    except Exception as e:
        return Response({'error': f'Error interno: {str(e)}'}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verificar_campos_empleado(request):
    """
    Verificar si los campos únicos (DNI, teléfono, email, nombre completo) ya existen
    """
    try:
        dni = request.GET.get('dni')
        telefono = request.GET.get('telefono')
        email = request.GET.get('email')
        nombre = request.GET.get('nombre')
        apellido = request.GET.get('apellido')
        
        errores = {}
        
        # Verificar DNI
        if dni:
            if Empleado.objects.filter(dni_emp=dni).exists():
                errores['dni'] = 'Ya existe un empleado con este DNI'
        
        # Verificar teléfono
        if telefono:
            if Empleado.objects.filter(telefono_emp=telefono).exists():
                errores['telefono'] = 'Ya existe un empleado con este teléfono'
        
        # Verificar email
        if email:
            if User.objects.filter(email=email).exists():
                errores['email'] = 'Ya existe un empleado con este email'
        
        # Verificar nombre y apellido (combinación única)
        if nombre and apellido:
            if Empleado.objects.filter(
                nombre_emp__iexact=nombre.strip(), 
                apellido_emp__iexact=apellido.strip()
            ).exists():
                errores['nombreCompleto'] = 'Ya existe un empleado con este nombre y apellido'
        
        return Response({'errores': errores})
        
    except Exception as e:
        return Response({'error': f'Error al verificar campos: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verificar_password_actual(request):
    try:
        data = request.data
        empleado_id = data.get('empleado_id')
        password_actual = data.get('password_actual')
        
        if not empleado_id or not password_actual:
            return Response({'error': 'Datos incompletos'}, status=400)
        
        user_profile = request.user.empleado
        if user_profile.tipo_usuario != 'jefa' and str(user_profile.id) != str(empleado_id):
            return Response({'error': 'No tiene permisos para esta acción'}, status=403)
        
        empleado = Empleado.objects.get(id=empleado_id)
        es_correcta = empleado.user.check_password(password_actual)
        
        return Response({'es_correcta': es_correcta})
    
    except Empleado.DoesNotExist:
        return Response({'error': 'Empleado no encontrado'}, status=404)
    except Exception as e:
        return Response({'error': f'Error interno: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cambiar_password(request):
    try:
        data = request.data
        empleado_id = data.get('empleado_id')
        password_actual = data.get('password_actual')
        nueva_password = data.get('nueva_password')
        
        if not empleado_id or not password_actual or not nueva_password:
            return Response({'error': 'Datos incompletos'}, status=400)
        
        user_profile = request.user.empleado
        if user_profile.tipo_usuario != 'jefa' and str(user_profile.id) != str(empleado_id):
            return Response({'error': 'No tiene permisos para esta acción'}, status=403)
        
        empleado = Empleado.objects.get(id=empleado_id)
        
        if not empleado.user.check_password(password_actual):
            return Response({'error': 'La contraseña actual es incorrecta'}, status=400)
        
        if len(nueva_password) < 6:
            return Response({'error': 'La nueva contraseña debe tener al menos 6 caracteres'}, status=400)
        
        empleado.user.set_password(nueva_password)
        empleado.user.save()
        
        return Response({'mensaje': 'Contraseña actualizada exitosamente'})
    
    except Empleado.DoesNotExist:
        return Response({'error': 'Empleado no encontrado'}, status=404)
    except Exception as e:
        return Response({'error': f'Error interno: {str(e)}'}, status=500)

# =======================================================
# ===== VIEWSETS =====
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

    def update(self, request, *args, **kwargs):
        try:
            print("📥 Datos recibidos para actualizar producto:", request.data)
            
            instance = self.get_object()
            data = request.data.copy()
            
            # Asegurar que los datos numéricos estén en formato correcto
            if 'precio_venta' in data:
                data['precio_venta'] = float(data['precio_venta'])
            if 'cantidad' in data:
                data['cantidad'] = int(data['cantidad'])
            if 'stock_minimo' in data:
                data['stock_minimo'] = int(data['stock_minimo'])
            
            print("📤 Datos procesados para actualizar:", data)
            
            serializer = self.get_serializer(instance, data=data, partial=False)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            
            print(f"✅ Producto {instance.id} actualizado exitosamente")
            
            return Response(serializer.data)
            
        except Exception as e:
            print(f"❌ Error al actualizar producto: {str(e)}")
            return Response(
                {'error': f'Error al actualizar producto: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    def partial_update(self, request, *args, **kwargs):
        try:
            print("📥 Datos recibidos para actualización parcial:", request.data)
            
            instance = self.get_object()
            data = request.data.copy()
            
            # Asegurar que los datos numéricos estén en formato correcto
            if 'precio_venta' in data:
                data['precio_venta'] = float(data['precio_venta'])
            if 'cantidad' in data:
                data['cantidad'] = int(data['cantidad'])
            if 'stock_minimo' in data:
                data['stock_minimo'] = int(data['stock_minimo'])
            
            print("📤 Datos procesados para actualización parcial:", data)
            
            serializer = self.get_serializer(instance, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            
            print(f"✅ Producto {instance.id} actualizado parcialmente")
            
            return Response(serializer.data)
            
        except Exception as e:
            print(f"❌ Error en actualización parcial: {str(e)}")
            return Response(
                {'error': f'Error en actualización parcial: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class ProveedorViewSet(viewsets.ModelViewSet):
    queryset = Proveedor.objects.all().order_by('id')
    serializer_class = ProveedorSerializer
    permission_classes = [IsJefaOrReadOnly]

    def get_permissions(self):
        if self.request.user and self.request.user.is_authenticated:
            try:
                empleado = self.request.user.empleado
                
                if empleado.tipo_usuario == 'jefa':
                    return [IsAuthenticated()]
                
                if self.action in ['list', 'retrieve']:
                    return [IsAuthenticated()]
                    
            except Empleado.DoesNotExist:
                pass
        
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = Proveedor.objects.all().order_by('id')
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(nombre_prov__icontains=search) |
                Q(tipo_prov__icontains=search)
            )
        return queryset

class CompraViewSet(viewsets.ModelViewSet):
    queryset = Compra.objects.all().select_related('producto').prefetch_related('proveedores').order_by('-fecha_compra')
    serializer_class = CompraSerializer
    permission_classes = [IsJefaOrReadOnly]

    def create(self, request, *args, **kwargs):
        try:
            print("🎯 Creando compra con datos:", request.data)
            
            # Validación simple
            if not request.data.get('producto'):
                return Response(
                    {'error': 'Producto es requerido'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Usar el serializer directamente
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            compra = serializer.save()

            print(f"✅ Compra creada: {compra.codigo_compra}, Cantidad: {compra.cantidad}")

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            print("💥 Error:", str(e))
            return Response(
                {'error': 'Error interno del servidor'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CajaViewSet(viewsets.ModelViewSet):
    queryset = Caja.objects.all()
    serializer_class = CajaSerializer
    permission_classes = [IsJefaOrEmpleado]

class VentaViewSet(viewsets.ModelViewSet):
    queryset = Venta.objects.all().prefetch_related('detalles')
    serializer_class = VentaSerializer
    permission_classes = [IsJefaOrEmpleado]

    def get_queryset(self):
        queryset = Venta.objects.all().prefetch_related('detalles')
        
        # ✅ FILTRAR POR CAJA - ESTO ES LO QUE FALTA
        caja_id = self.request.query_params.get('caja', None)
        if caja_id:
            queryset = queryset.filter(caja_id=caja_id)
            print(f"🔍 Filtrando ventas por caja: {caja_id} - Encontradas: {queryset.count()}")
        
        # ✅ También filtrar por fecha para mayor seguridad
        fecha = self.request.query_params.get('fecha', None)
        if fecha:
            queryset = queryset.filter(fecha_hora_venta__date=fecha)
            print(f"📅 Filtrando ventas por fecha: {fecha}")
            
        return queryset.order_by('-fecha_hora_venta')

    def create(self, request, *args, **kwargs):
        try:
            print("📥 Datos recibidos para crear venta:", request.data)
            
            # Asegurar que los datos numéricos estén en formato correcto
            data = request.data.copy()
            
            if 'total_venta' in data:
                data['total_venta'] = float(data['total_venta'])
            if 'monto_recibido' in data:
                data['monto_recibido'] = float(data['monto_recibido'])
            if 'vuelto' in data:
                data['vuelto'] = float(data['vuelto'])
            
            # Verificar que la caja existe y está abierta
            caja_id = data.get('caja')
            if caja_id:
                try:
                    caja = Caja.objects.get(id=caja_id)
                    if caja.estado != 'abierta':
                        return Response(
                            {'error': 'No se pueden agregar ventas a una caja cerrada'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    print(f"✅ Caja {caja_id} verificada - Estado: {caja.estado}")
                except Caja.DoesNotExist:
                    return Response(
                        {'error': 'Caja no encontrada'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Procesar detalles si existen
            if 'detalles' in data:
                if isinstance(data['detalles'], str):
                    try:
                        data['detalles'] = json.loads(data['detalles'])
                    except json.JSONDecodeError:
                        data['detalles'] = []
                
                # Asegurar que los detalles tengan los campos correctos
                for detalle in data['detalles']:
                    if 'cantidad' in detalle:
                        detalle['cantidad'] = int(detalle['cantidad'])
                    if 'precio_unitario' in detalle:
                        detalle['precio_unitario'] = float(detalle['precio_unitario'])
                    if 'subtotal' in detalle:
                        detalle['subtotal'] = float(detalle['subtotal'])
            
            print("📤 Datos procesados para venta:", data)
            
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            venta = serializer.save()
            
            print(f"✅ Venta creada exitosamente: {venta.id}")
            
            # Devolver la venta creada con sus detalles
            venta_serializada = self.get_serializer(venta)
            return Response(venta_serializada.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"❌ Error completo al crear venta: {str(e)}")
            return Response(
                {'error': f'Error al crear venta: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class DetalleVentaViewSet(viewsets.ModelViewSet):
    queryset = DetalleVenta.objects.all()
    serializer_class = DetalleVentaSerializer
    permission_classes = [IsJefaOrEmpleado]

class VentaSaetaViewSet(viewsets.ModelViewSet):
    queryset = VentaSaeta.objects.all().select_related('detalle_venta')
    serializer_class = VentaSaetaSerializer
    permission_classes = [IsJefaOrEmpleado]

    def get_queryset(self):
        queryset = VentaSaeta.objects.all().select_related('detalle_venta')
        
        # ✅ FILTRAR POR FECHA
        fecha = self.request.query_params.get('fecha_pago_saeta', None)
        if fecha:
            queryset = queryset.filter(fecha_pago_saeta=fecha)
            print(f"🔍 Filtrando ventas Saeta por fecha: {fecha} - Encontradas: {queryset.count()}")
        
        # ✅ FILTRAR POR CAJA (a través de la venta asociada)
        caja_id = self.request.query_params.get('caja', None)
        if caja_id:
            queryset = queryset.filter(venta__caja_id=caja_id)
            print(f"🔍 Filtrando ventas Saeta por caja: {caja_id} - Encontradas: {queryset.count()}")
            
        return queryset

    def create(self, request, *args, **kwargs):
        try:
            data = request.data.copy()
            
            # Asegurar que los datos numéricos estén en formato correcto
            if 'monto_saeta' in data:
                data['monto_saeta'] = float(data['monto_saeta'])
            if 'porcentaje_ganancia_saeta' in data:
                data['porcentaje_ganancia_saeta'] = float(data['porcentaje_ganancia_saeta'])
            
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            print("Error al crear venta Saeta:", str(e))
            return Response(
                {'error': f'Error al crear venta Saeta: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )