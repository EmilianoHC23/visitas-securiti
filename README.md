# 🛡️ Visitas SecuriTI

[![Build Status](https://github.com/EmilianoHC23/visitas-securiti/workflows/🚀%20Build%20and%20Test/badge.svg)](https://github.com/EmilianoHC23/visitas-securiti/actions)
[![GitHub repo](https://img.shields.io/badge/GitHub-EmilianoHC23%2Fvisitas--securiti-blue?logo=github)](https://github.com/EmilianoHC23/visitas-securiti)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Sistema completo de gestión de visitas empresariales con 6 fases de funcionalidad implementadas**

Desarrollado con React 19, Node.js, Express, MongoDB Atlas y desplegado en Vercel.

## 🌟 Características Principales

### 📋 **FASE 1: Sistema Base**
- ✅ Autenticación JWT con roles (Admin, Recepción, Host)
- ✅ Gestión completa de visitas (CRUD, aprobación, check-in/out)
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Administración de usuarios

### 🏢 **FASE 2: Configuración Empresarial**
- ✅ Configuración de empresa con settings personalizables
- ✅ Generación automática de códigos QR
- ✅ Auto-aprobación y configuraciones de seguridad

### 🚫 **FASE 3: Lista Negra**
- ✅ Gestión completa de blacklist
- ✅ Validación por documento, teléfono o email
- ✅ Sistema de búsqueda y filtros avanzados

### 🎫 **FASE 4: Códigos de Acceso**
- ✅ Códigos de uso único, por tiempo limitado y programados
- ✅ Gestión de eventos con códigos específicos
- ✅ Control de usos y estados de códigos

### 📱 **FASE 5: Registro Público**
- ✅ Interfaz pública para visitantes con QR
- ✅ Auto-registro sin necesidad de usuario
- ✅ Validación automática de blacklist

### � **FASE 6: Analytics Avanzados**
- ✅ Dashboard con métricas avanzadas
- ✅ Reportes por hosts, empresas, horarios
- ✅ Exportación de datos en JSON/CSV
- ✅ Análisis de tendencias y patrones

### 📧 **NUEVA: Sistema de Notificaciones**
- ✅ **Notificaciones automáticas por email**
- ✅ **Confirmación a visitantes** al registrar visitas
- ✅ **Alertas a anfitriones** sobre nuevas visitas
- ✅ **Notificación de aprobación** de visitas
- ✅ **Códigos QR por email** para acceso fácil
- ✅ **Alertas administrativas** del sistema
- ✅ **Templates HTML profesionales** para emails
- ✅ **Configuración SMTP flexible** (Gmail, SendGrid, etc.)

## 🚀 Despliegue en Vercel

### ⚡ Despliegue Automático

1. **Fork o clona este repositorio**
2. **Conecta con Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Conecta tu cuenta de GitHub
   - Importa el repositorio `visitas-securiti`

3. **Configura las variables de entorno en Vercel:**
   ```env
   DATABASE_URL=mongodb+srv://admin:admin123@visitas-securiti.cz8yvzk.mongodb.net/visitas-securiti?retryWrites=true&w=majority&appName=visitas-securiti
   JWT_SECRET=Prod_VisitasSecuriTI_2025_Ultra_Secure_JWT_Secret_Key_For_Production_Only!@#$%
   NODE_ENV=production
   
   # Configuración de Email (Opcional - para notificaciones)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=notificaciones@tuempresa.com
   SMTP_PASS=tu-password-de-aplicacion
   FRONTEND_URL=https://tu-app.vercel.app
   ADMIN_EMAILS=admin@tuempresa.com
   ```

4. **Despliega:**
   - Vercel detectará automáticamente la configuración
   - El despliegue será automático con cada push a main

### 🔧 Configuración Manual

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

# Email Configuration (Opcional - para notificaciones)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-de-aplicacion
FRONTEND_URL=http://localhost:3000
ADMIN_EMAILS=admin@empresa.com

# Production API URL (para Vercel)
VITE_PROD_API_URL=https://tu-app.vercel.app/api
```

### 4. Inicializar la base de datos

```bash
# Para desarrollo (datos de prueba)
npm run init-db

# Para producción (datos realistas)
npm run init-production
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

### 🔑 Credenciales de desarrollo:
- **Admin**: admin@securiti.com / password
- **Recepción**: reception@securiti.com / password  
- **Hosts**:
  - Juan Pérez: juan.perez@securiti.com / password
  - Ana García: ana.garcia@securiti.com / password
  - Carlos Rodríguez: carlos.rodriguez@securiti.com / password
  - Sofía López: sofia.lopez@securiti.com / password

### 📧 Configuración de Email

Para habilitar las notificaciones por email, consulta: [EMAIL_SETUP.md](./EMAIL_SETUP.md)

- Configuración para Gmail, SendGrid, Mailgun, etc.
- Variables de entorno necesarias
- Troubleshooting y verificación

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
- **Email**: Nodemailer para notificaciones automáticas

### Base de Datos (MongoDB)
- **Users**: Gestión de usuarios con roles
- **Visits**: Registro completo de visitas
- **Companies**: Configuración empresarial
- **Blacklist**: Lista negra de visitantes
- **Access**: Códigos de acceso QR
- **Indexes**: Optimizados para consultas frecuentes

### 📧 Sistema de Notificaciones
- **Service**: EmailService con nodemailer
- **Templates**: HTML profesionales para cada tipo
- **Proveedores**: Gmail, SendGrid, Mailgun, Outlook
- **Tipos**: Confirmaciones, alertas, aprobaciones, códigos QR

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
