# MiApp/permissions.py
from rest_framework import permissions

class IsJefa(permissions.BasePermission):
    """
    Permiso personalizado para verificar si el usuario es jefa
    """
    def has_permission(self, request, view):
        # Verificar si el usuario está autenticado
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Verificar si tiene perfil de empleado y es jefa
        try:
            return hasattr(request.user, 'empleado') and request.user.empleado.tipo_usuario == 'jefa'
        except:
            return False


class IsJefaOrReadOnly(permissions.BasePermission):
    """
    Permite acceso de lectura a todos los usuarios autenticados,
    pero solo permite escritura a las jefas.
    """
    def has_permission(self, request, view):
        # Los usuarios autenticados pueden ver (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Para escritura (POST, PUT, PATCH, DELETE) solo jefas
        try:
            return hasattr(request.user, 'empleado') and request.user.empleado.tipo_usuario == 'jefa'
        except:
            return False


class IsJefaOrEmpleado(permissions.BasePermission):
    """
    Permite acceso tanto a jefas como empleadas
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            return hasattr(request.user, 'empleado')
        except:
            return False

