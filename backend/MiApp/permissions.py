# MiApp/permissions.py
from rest_framework import permissions

class IsJefa(permissions.BasePermission):
    """Permite acceso solo a usuarios con tipo_usuario='jefa'."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        try:
            # Revisa el UserProfile para obtener el rol
            user_profile = request.user.userprofile
            return user_profile.tipo_usuario == 'jefa'
        except:
            return False

class IsJefaOrReadOnly(permissions.BasePermission):
    """Permite a la 'jefa' POST, PUT, DELETE. Permite a cualquier autenticado solo GET/HEAD/OPTIONS."""
    def has_permission(self, request, view):
        # 1. Permitir siempre operaciones seguras (lectura) a usuarios autenticados
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # 2. Para operaciones de escritura (POST, PUT, DELETE), se requiere ser 'jefa'
        try:
            user_profile = request.user.userprofile
            return user_profile.tipo_usuario == 'jefa'
        except:
            return False

class IsJefaOrEmpleado(permissions.BasePermission):
    """Permite acceso a 'jefa' y 'empleada' para funcionalidades básicas (ej. Venta/Caja)."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            user_profile = request.user.userprofile
            return user_profile.tipo_usuario in ['jefa', 'empleada']
        except:
            return False