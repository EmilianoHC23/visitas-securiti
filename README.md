# 🛡️ Visitas SecuriTI

[![Build Status](https://github.com/EmilianoHC23/visitas-securiti/workflows/🚀%20Build%20and%20Test/badge.svg)](https://github.com/EmilianoHC23/visitas-securiti/actions)
[![GitHub repo](https://img.shields.io/badge/GitHub-EmilianoHC23%2Fvisitas--securiti-blue?logo=github)](https://github.com/EmilianoHC23/visitas-securiti)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Sistema de gestión de visitas empresariales desarrollado con React, Node.js, Express y MongoDB.

## 🌟 Características

- ✅ Autenticación y autorización por roles (Admin, Recepción, Host)
- 📋 Gestión completa de visitas (crear, aprobar, check-in/out)
- 👥 Administración de usuarios
- 📊 Dashboard con estadísticas en tiempo real
- 📱 Registro de visitantes autoservicio
- 🔒 API RESTful segura con JWT
- 🎨 Interfaz moderna con Tailwind CSS
- ☁️ Listo para despliegue en Vercel

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js (v18 o superior)
- MongoDB (local o Atlas)
- Git

### 1. Clonar el repositorio

```bash
git clone <tu-repositorio>
cd visitas-securiti
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local` con:

```env
# API Configuration
VITE_API_URL=http://localhost:3001/api
VITE_ENVIRONMENT=development

# Database Configuration
DATABASE_URL=mongodb://localhost:27017/visitas-securiti
JWT_SECRET=tu-clave-secreta-super-segura

# Gemini API (opcional)
GEMINI_API_KEY=tu-api-key-aqui

# Production API URL (para Vercel)
VITE_PROD_API_URL=https://tu-app.vercel.app/api
```

### 4. Inicializar la base de datos

```bash
npm run init-db
```

### 5. Ejecutar en desarrollo

```bash
# Terminal 1 - Backend
npm run server:dev

# Terminal 2 - Frontend
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 👤 Usuarios por defecto

Después de inicializar la base de datos:

- **Admin**: admin@securiti.com / password
- **Recepción**: reception@securiti.com / password  
- **Host 1**: host1@securiti.com / password
- **Host 2**: host2@securiti.com / password

## 🏗️ Arquitectura

### Frontend (React + TypeScript)
- **Framework**: React 19 con TypeScript
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Build**: Vite

### Backend (Node.js + Express)
- **Framework**: Express.js
- **Database**: MongoDB con Mongoose
- **Authentication**: JWT
- **Security**: bcryptjs para hash de contraseñas
- **CORS**: Configurado para development y production

### Base de Datos (MongoDB)
- **Users**: Gestión de usuarios con roles
- **Visits**: Registro completo de visitas
- **Indexes**: Optimizados para consultas frecuentes

## 📊 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/refresh` - Renovar token

### Usuarios
- `GET /api/users` - Listar usuarios (Admin)
- `GET /api/users/hosts` - Listar hosts
- `POST /api/users` - Crear usuario (Admin)
- `PUT /api/users/:id` - Actualizar usuario (Admin)
- `DELETE /api/users/:id` - Desactivar usuario (Admin)

### Visitas
- `GET /api/visits` - Listar visitas
- `POST /api/visits` - Crear visita
- `POST /api/visits/register` - Auto-registro de visitante
- `PUT /api/visits/:id/status` - Actualizar estado
- `PUT /api/visits/:id` - Actualizar visita
- `DELETE /api/visits/:id` - Eliminar visita

### Dashboard
- `GET /api/dashboard/stats` - Estadísticas
- `GET /api/dashboard/recent-visits` - Visitas recientes
- `GET /api/dashboard/analytics` - Análisis de datos

## 🌐 Despliegue en Vercel

### Configuración completada ✅

Tu aplicación ya está configurada con MongoDB Atlas y lista para deployment.

**Base de datos**: `visitas-securiti` en MongoDB Atlas  
**Conexión**: ✅ Configurada y probada  
**Datos iniciales**: ✅ Usuarios y visitas de prueba creados  

### 1. Preparar el deployment

```bash
# Crear build de producción
npm run build
```

### 2. Configurar variables en Vercel

En tu dashboard de Vercel, configura estas variables de entorno:

```env
DATABASE_URL=mongodb+srv://emilianohercha23_db_user:visitasdb@visitassecuriti.aupqtqb.mongodb.net/visitas-securiti?retryWrites=true&w=majority&appName=VisitasSecuriTI
JWT_SECRET=crea-una-clave-jwt-super-secreta-para-produccion
NODE_ENV=production
VITE_ENVIRONMENT=production
```

### 3. Desplegar

```bash
# Instalar Vercel CLI (si no lo tienes)
npm i -g vercel

# Desplegar
vercel --prod
```

### 4. Actualizar URL de producción

Después del deployment, actualiza la variable:
```env
VITE_PROD_API_URL=https://tu-app-name.vercel.app/api
```

## 🔧 Scripts disponibles

```bash
npm run dev          # Desarrollo frontend
npm run build        # Build para producción
npm run preview      # Preview del build
npm run start        # Servidor de producción
npm run server:dev   # Servidor de desarrollo
npm run init-db      # Inicializar base de datos
```

## 📁 Estructura del proyecto

```
visitas-securiti/
├── api/                    # Vercel serverless functions
├── server/                 # Backend Node.js
│   ├── models/            # Modelos de MongoDB
│   ├── routes/            # Rutas de la API
│   ├── middleware/        # Middlewares
│   └── index.js          # Servidor principal
├── src/                   # Frontend React (opcional)
├── components/            # Componentes React
├── contexts/             # Context providers
├── pages/                # Páginas de la aplicación
├── services/             # Servicios de API
├── types.ts              # Tipos TypeScript
├── App.tsx               # Componente principal
└── vercel.json           # Configuración de Vercel
```

## 🛠️ Tecnologías utilizadas

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Authentication**: JWT, bcryptjs
- **Deployment**: Vercel
- **Database**: MongoDB Atlas

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

¿Problemas o preguntas? Abre un [issue](../../issues) en GitHub.

---

Desarrollado con ❤️ para SecuriTI
