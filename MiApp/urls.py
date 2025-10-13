from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductoViewSet, ProveedorViewSet, ProvProductoViewSet, register, login_view

router = DefaultRouter()
router.register(r'productos', ProductoViewSet)
router.register(r'proveedores', ProveedorViewSet)
router.register(r'prov_productos', ProvProductoViewSet)

urlpatterns = [
    path('register/', register, name='register'),
    path('login/', login_view, name='login'),
    path('', include(router.urls)),
]