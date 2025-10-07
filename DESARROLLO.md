# 🚀 Guía de Configuración para Desarrolladores

## 📋 Pasos Detallados para Configurar el Entorno de Desarrollo

### 1. 🔧 Configuración Inicial

```bash
# 1. Clonar el repositorio
git clone https://github.com/EmilianoHC23/visitas-securiti.git
cd visitas-securiti

# 2. Instalar todas las dependencias
npm run install:all
```

### 2. 🌐 Configuración de Variables de Entorno

#### A. Copiar archivos de ejemplo:
```bash
cp .env.example .env
cp frontend/.env.example frontend/.env  
cp backend/.env.example backend/.env
```

#### B. Configurar Servidor SMTP (para notificaciones):
1. Configurar un servidor SMTP (Gmail, Outlook, servidor propio)
2. Obtener credenciales de autenticación
3. Configurar las variables de entorno para Nodemailer en el backend

#### C. Configurar Base de Datos:

**Opción 1: MongoDB Local**
```bash
# Instalar MongoDB Community Edition
# Windows: https://www.mongodb.com/try/download/community
# macOS: brew install mongodb-community
# Ubuntu: sudo apt install mongodb

# Usar en backend/.env:
MONGODB_URI=mongodb://localhost:27017/visitas-securiti
```

**Opción 2: MongoDB Atlas (Recomendado)**
1. Ir a [MongoDB Atlas](https://cloud.mongodb.com/)
2. Crear cluster gratuito
3. Configurar usuario y password
4. Obtener connection string
5. Configurar en backend/.env:
```
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/visitas-securiti
```

### 3. 🏃‍♂️ Ejecutar el Proyecto

#### Opción A: Todo junto (Recomendado)
```bash
npm run dev
```

#### Opción B: Por separado
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend  
npm run dev:frontend
```

### 4. 🌐 URLs de Desarrollo
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001
- **API Health:** http://localhost:3001/api/health

### 5. 👥 Flujo de Trabajo Colaborativo

#### Configuración Git:
```bash
# Configurar usuario
git config user.name "Tu Nombre"
git config user.email "tu.email@ejemplo.com"

# Crear nueva rama para feature
git checkout -b feature/nueva-funcionalidad

# Hacer cambios y commit
git add .
git commit -m "feat: descripción de cambios"

# Push y crear pull request
git push origin feature/nueva-funcionalidad
```

#### Estructura de Commits:
- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `docs:` documentación
- `style:` formateo, sin cambios de código
- `refactor:` refactorización de código
- `test:` agregar/modificar tests

### 6. 🐛 Solución de Problemas Comunes

#### Error de CORS:
- Verificar que las URLs en `backend/index.js` incluyan tu puerto local
- El frontend debe ejecutarse en puerto 5173

#### Error de Base de Datos:
- Verificar que MongoDB esté ejecutándose (local)
- Verificar connection string (Atlas)
- Verificar firewall/IP whitelist (Atlas)

#### Error de Puertos:
```bash
# Ver qué está usando el puerto
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# Matar proceso si es necesario (Windows)
taskkill /PID <número_pid> /F
```

### 7. 📦 Comandos Útiles

```bash
# Limpiar dependencias
npm run clean

# Reinstalar todo
npm run clean && npm run install:all

# Build de producción
npm run build

# Preview del build
npm run preview

# Ver logs del backend
cd backend && npm run dev

# Ver logs del frontend
cd frontend && npm run dev
```

### 8. 🔑 Datos de Prueba

#### Usuario Administrador:
- Email: admin@securiti.com
- Password: password

#### Usuario Recepción:
- Email: reception@securiti.com  
- Password: password

#### Usuarios Host:
- Email: juan.perez@securiti.com / password
- Email: ana.garcia@securiti.com / password
- Email: carlos.rodriguez@securiti.com / password
- Email: sofia.lopez@securiti.com / password

### 9. 📚 Recursos Adicionales

- [Documentación React](https://react.dev/)
- [Documentación Vite](https://vitejs.dev/)
- [Documentación Express](https://expressjs.com/)
- [Documentación MongoDB](https://docs.mongodb.com/)
- [Documentación Nodemailer](https://nodemailer.com/)

### 10. 🤝 Contacto y Soporte

Si tienes problemas con la configuración:
1. Revisar este archivo
2. Verificar que todas las variables de entorno estén configuradas
3. Verificar que todos los servicios estén ejecutándose
4. Crear un issue en GitHub con detalles del error