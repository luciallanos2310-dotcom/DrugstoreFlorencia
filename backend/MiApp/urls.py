from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductoViewSet, ProveedorViewSet, ProvProductoViewSet, 
    register, login_view, empleados_list, empleado_detail,
    UserProfileViewSet, CajaViewSet, VentaViewSet, DetalleVentaViewSet
)

router = DefaultRouter()
router.register(r'productos', ProductoViewSet)
router.register(r'proveedores', ProveedorViewSet)
router.register(r'prov_productos', ProvProductoViewSet)
router.register(r'user_profiles', UserProfileViewSet)
router.register(r'cajas', CajaViewSet)
router.register(r'ventas', VentaViewSet)
router.register(r'detalle_ventas', DetalleVentaViewSet)

urlpatterns = [
    path('register/', register, name='register'),
    path('login/', login_view, name='login'),
    path('empleados/', empleados_list, name='empleados_list'),
    path('empleados/<int:id>/', empleado_detail, name='empleado_detail'),
    path('', include(router.urls)),
]