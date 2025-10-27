# Crear el archivo README
echo "# Drugstore Florencia - Sistema de Gestión

## Estructura del Proyecto

- **backend/**: API Django con modelos y base de datos
- **frontend/**: Interfaz React para gestión de proveedores

## Instalación y Ejecución

### Prerrequisitos
- Python 3.8+
- Node.js 14+
- pip y npm

### Backend (Django)
\`\`\`bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
\`\`\`
El backend estará en: http://localhost:8000

### Frontend (React)
\`\`\`bash
cd frontend
npm install
npm start
\`\`\`
El frontend estará en: http://localhost:3000

## Funcionalidades Implementadas

✅ **Gestión Completa de Proveedores**
- Lista, creación, edición y eliminación
- Búsqueda por nombre y filtro por rubro
- Diseño responsive y moderna interfaz

✅ **API REST**
- Endpoints para proveedores
- Serializers Django REST Framework
- Autenticación por tokens

✅ **Base de Datos**
- Modelos: Proveedor, Producto, ProvProducto
- Relaciones y migraciones actualizadas
