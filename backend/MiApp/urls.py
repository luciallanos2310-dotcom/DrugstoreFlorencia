# MiApp/urls.py - VERSIÓN CORREGIDA
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductoViewSet, ProveedorViewSet, CompraViewSet,
    register, login_view, empleados_list, empleado_detail, 
    CajaViewSet, VentaViewSet, DetalleVentaViewSet,
    verificar_password_actual, cambiar_password
)
from .views import VentaSaetaViewSet

router = DefaultRouter()
router.register(r'productos', ProductoViewSet)
router.register(r'proveedores', ProveedorViewSet)
router.register(r'compras', CompraViewSet, basename='compra')  # AGREGADO: basename='compra'
router.register(r'cajas', CajaViewSet)
router.register(r'ventas', VentaViewSet)
router.register(r'detalle_ventas', DetalleVentaViewSet)
router.register(r'ventas_saeta', VentaSaetaViewSet)

urlpatterns = [
    path('register/', register, name='register'),
    path('login/', login_view, name='login'),
    path('empleados/', empleados_list, name='empleados_list'),
    path('empleados/<int:id>/', empleado_detail, name='empleado_detail'),
    path('verificar-password/', verificar_password_actual, name='verificar_password'),
    path('cambiar-password/', cambiar_password, name='cambiar_password'),
    path('', include(router.urls)),
]

# En urls.py - AGREGAR ESTO


