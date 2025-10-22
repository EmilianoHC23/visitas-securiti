# 🚧 Implementación de Sistema de Accesos/Eventos - PENDIENTE

## ✅ Completado Hasta Ahora (40%)

### 1. Modelos Actualizados ✅
- **Access.js**: Nuevos campos agregados
  - `type` (reunion, proyecto, evento, visita, otro)
  - `eventImage` (imagen del evento)
  - `location` (ubicación del evento)
  - `invitedUsers[]` con tracking de asistencia (pendiente, asistió, no-asistió)
  - `notifyUsers[]` (usuarios a notificar)
  - `additionalInfo` (información adicional)
  - `settings.sendAccessByEmail`, `settings.language`, `settings.noExpiration`

- **Company.js**: Campos de ubicación e info adicional ✅
  - `location` (address, city, country, coordinates)
  - `additionalInfo` (phone, email, website, description)

### 2. Email Templates Creados ✅
Todos los 8 templates están listos en `emailService.js`:
1. ✅ `sendAccessCreatedEmail()` - Confirmación al creador
2. ✅ `sendAccessInvitationEmail()` - Invitación a invitados con QR
3. ✅ `sendAccessReminderToCreatorEmail()` - Recordatorio al creador
4. ✅ `sendAccessReminderToGuestEmail()` - Recordatorio al invitado
5. ✅ `sendGuestCheckedInEmail()` - Notificación de check-in al creador
6. ✅ `sendAccessModifiedToCreatorEmail()` - Modificación notificada al creador
7. ✅ `sendAccessModifiedToGuestEmail()` - Modificación notificada al invitado
8. ✅ `sendAccessCancelledEmail()` - Cancelación (creador e invitados)

### 3. Rutas de Backend Actualizadas ✅
- **company.js**: Ruta PUT `/config` actualizada para soportar `location` y `additionalInfo`

---

## 🔴 PENDIENTE - Implementación Crítica

### 4. Rutas de Access (backend/src/routes/access.js) - **PRIORIDAD ALTA**

#### Rutas que Necesitan Actualización Completa:

**A. POST `/` - Crear Acceso**
```javascript
// Debe aceptar:
{
  type: 'reunion' | 'proyecto' | 'evento' | 'visita' | 'otro',
  title: string,
  description: string,
  eventImage: string (base64),
  location: string,
  schedule: {
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  },
  settings: {
    sendAccessByEmail: boolean,
    language: 'es' | 'en',
    noExpiration: boolean,
    maxUses: number
  },
  invitedUsers: [{
    email: string,
    name: string
  }],
  notifyUsers: [userId],
  additionalInfo: string
}

// Flujo:
// 1. Crear Access con todos los campos
// 2. Generar QR único para cada invitedUser
// 3. Enviar email a creador: sendAccessCreatedEmail()
// 4. Para cada invitado: sendAccessInvitationEmail() con QR personalizado
// 5. Programar recordatorio para día del evento (usar cron o scheduler)
```

**B. PUT `/:id` - Editar Acceso**
```javascript
// Solo permite editar:
// - schedule.endDate (cambiar fecha de finalización)
// - invitedUsers (agregar más invitados)
// - eventImage (cambiar imagen)

// Flujo:
// 1. Validar que acceso existe y usuario es el creador
// 2. Actualizar campos permitidos
// 3. Si cambió endDate: sendAccessModifiedToCreatorEmail() y sendAccessModifiedToGuestEmail() a todos
// 4. Si se agregaron invitados: sendAccessInvitationEmail() solo a nuevos
```

**C. DELETE `/:id` - Cancelar Acceso**
```javascript
// Flujo:
// 1. Cambiar status a 'cancelled'
// 2. Enviar sendAccessCancelledEmail() al creador (isCreator: true)
// 3. Enviar sendAccessCancelledEmail() a todos los invitados (isCreator: false)
```

**D. POST `/check-in/:accessCode` - Registrar Check-in de Invitado** (NUEVA)
```javascript
// Cuando el invitado escanea QR en VisitRegistrationSidePanel
// Input:
{
  accessCode: string,
  invitedUserEmail: string,
  visitId: string // ID de la visita creada
}

// Flujo:
// 1. Buscar Access por accessCode
// 2. Encontrar invitedUser por email
// 3. Actualizar attendance: 'pendiente' -> 'asistio'
// 4. Guardar visitId en invitedUser.visitId
// 5. Actualizar qrScannedAt con timestamp actual
// 6. Enviar sendGuestCheckedInEmail() al creador
```

**E. GET `/agenda` - Obtener Accesos para Agenda** (NUEVA)
```javascript
// Filtros:
{
  startDate: Date,
  endDate: Date,
  status: 'active' | 'finalized'
}

// Response: Array de accesos en el rango de fechas
```

**F. Background Job - Actualizar Estados Automáticos** (NUEVA)
```javascript
// Cron Job que corre cada hora:
// 1. Buscar accesos donde schedule.endDate < now y status = 'active'
// 2. Cambiar status a 'finalized'
// 3. Para invitedUsers con attendance = 'pendiente', cambiar a 'no-asistio'
```

**G. Background Job - Enviar Recordatorios** (NUEVA)
```javascript
// Cron Job que corre cada hora:
// 1. Buscar accesos donde schedule.startDate es "hoy" y no se han enviado recordatorios
// 2. Enviar sendAccessReminderToCreatorEmail() al creador
// 3. Enviar sendAccessReminderToGuestEmail() a cada invitado
// 4. Marcar en BD que recordatorios fueron enviados
```

---

### 5. Frontend - AccessCodesPage.tsx Modernizado - **PRIORIDAD ALTA**

#### Estado Actual:
- Página básica existente en `/frontend/src/pages/access/AccessCodesPage.tsx`
- Tiene lista de accesos pero UI anticuada
- Modal de crear/editar muy básico

#### Mejoras Requeridas:

**A. Diseño Modernizado**
```tsx
// Header con tabs:
- Activos (status: active)
- Finalizados (status: finalized)
- Botón "Crear acceso" (gradiente cyan-blue)

// Vista de tabla responsive:
- Columnas: Título, Inicia, Finaliza, Razón, Acciones
- Vista mobile: Cards colapsables
- Filtros: Por fecha, por tipo, buscar

// Cada fila muestra:
- Título del acceso
- Fecha/hora de inicio y fin
- Razón (type: Reunión, Proyecto, etc.)
- Cantidad de invitados / asistentes
- Acciones: Ver detalles, Editar (solo fin de fecha), Cancelar
```

**B. Modal "Crear Acceso" - Diseño según Imágenes**
```tsx
// Campos principales:
- Razón del acceso: <select> (Reunión, Proyecto, Evento, Visita, Otro)
- Título*: <input>
- Fecha inicio*: <DatePicker>
- Hora inicio*: <TimePicker>
- Fecha fin*: <DatePicker>
- Hora fin*: <TimePicker>
- Toggle: "Sin vencimiento"

// Sección "Agregar visitantes":
- Campo: Correo electrónico* + Nombre*
- Botón "Agregar otro visitante" (+)
- Lista de visitantes agregados con botón eliminar (X)
- Botón "Importar invitados" (CSV futuro)

// Opciones avanzadas (colapsable):
- Agregar imagen: <FileUpload> con preview
- Anfitrión: <select user> (por defecto: current user)
- Notificar a alguien más: <UserMultiSelect>
- Toggle: "Pre-aprobar acceso" (default: ON)
- Toggle: "Envío de accesos" (default: ON)
- Idioma de los accesos: Radio (Español/Inglés)
- Lugar: <input> (ej: Sala de juntas, Piso, etc.)
- Información adicional: <textarea>

// Botones:
- Cancelar
- Enviar (crear y enviar emails)
```

**C. Modal "Editar Acceso" - Limitado**
```tsx
// Solo permite editar:
1. Fecha de finalización
2. Agregar más visitantes (no eliminar existentes)
3. Cambiar imagen del acceso

// Muestra read-only:
- Título, razón, fecha inicio, hora inicio, ubicación, info adicional
- Lista de visitantes actuales con estado de asistencia

// Botón "Guardar cambios" dispara:
- PUT /api/access/:id
- Envía emails de modificación automáticamente
```

**D. Modal "Detalles del Acceso"**
```tsx
// Información completa:
- Razón, Título, Fechas, Ubicación, Info adicional
- Anfitrión, Notificar a, Estado

// Tabla de visitantes:
Columnas:
- Nombre
- Correo electrónico
- WhatsApp (opcional)
- Código QR (botón descargar)
- Campos adicionales (si existen)
- Asistencia (Pendiente/Asistió/No asistió)

// Para accesos finalizados:
- Botón "Descargar todos los QRs" (ZIP)
- Botón "Ver respuestas" (estadísticas de asistencia)
- Solo lectura, no se puede editar ni cancelar
```

---

### 6. Integración con VisitRegistrationSidePanel - **PRIORIDAD MEDIA**

#### Archivo: `/frontend/src/pages/visits/VisitRegistrationSidePanel.tsx`

**Flujo cuando se escanea QR de acceso:**

```tsx
// 1. Detectar QR de acceso (formato especial)
const qrData = JSON.parse(scannedQR);

if (qrData.type === 'access-invitation') {
  // QR contiene:
  {
    type: 'access-invitation',
    accessCode: 'ACC_123456',
    invitedUser: {
      name: 'Emiliano Hernández Chávez',
      email: 'emilianohc23@gmail.com',
      company: 'Microsoft' // opcional
    },
    accessTitle: 'Proyecto',
    hostName: 'Emiliano Hernandez'
  }
  
  // 2. Auto-rellenar formulario:
  setVisitorName(qrData.invitedUser.name);
  setVisitorEmail(qrData.invitedUser.email);
  setVisitorCompany(qrData.invitedUser.company || '');
  setReason(qrData.accessTitle);
  // Host se busca por nombre o se mantiene actual
  
  // 3. Al hacer "Confirmar", crear visita:
  const visitData = {
    ...formData,
    status: 'approved', // Ya pre-aprobada
    accessCode: qrData.accessCode // Vincular con access
  };
  
  const visit = await api.registerVisit(visitData);
  
  // 4. Notificar check-in al access:
  await api.checkInAccess({
    accessCode: qrData.accessCode,
    invitedUserEmail: qrData.invitedUser.email,
    visitId: visit._id
  });
  
  // 5. La visita pasa directamente a "Respuesta recibida" (aprobada)
  // Esperando asignar recurso y registrar entrada
}
```

**Nueva ruta API necesaria:**
```typescript
// En frontend/src/services/api.ts

export const checkInAccess = async (data: {
  accessCode: string;
  invitedUserEmail: string;
  visitId: string;
}) => {
  return apiRequest('/access/check-in', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};
```

---

### 7. Integración con AgendaPage - **PRIORIDAD MEDIA**

#### Archivo: `/frontend/src/pages/visits/AgendaPage.tsx`

**Mejoras requeridas:**

```tsx
// Agregar toggle para filtrar tipo:
- Visitas
- Accesos/Eventos
- Ambos (default)

// Vista de calendario:
- Mostrar accesos como eventos con color diferente
  * Visitas: Azul
  * Accesos: Verde/Morado
  
// Al hacer clic en un acceso:
- Abrir modal con detalles del acceso
- Mostrar lista de invitados
- Botón "Ver en panel de Accesos" (redirige a AccessCodesPage)

// Filtros adicionales:
- Por tipo de acceso (Reunión, Proyecto, Evento)
- Por estado (Activo, Finalizado)
- Por anfitrión
```

---

### 8. Generación de QR Codes - **COMPONENTE FALTANTE**

**Ubicación sugerida:** `/backend/src/utils/qrGenerator.js`

```javascript
const QRCode = require('qrcode');

/**
 * Generar QR para invitación de acceso
 */
async function generateAccessInvitationQR(accessData, invitedUser) {
  const qrData = {
    type: 'access-invitation',
    accessCode: accessData.accessCode,
    invitedUser: {
      name: invitedUser.name,
      email: invitedUser.email,
      company: invitedUser.company || ''
    },
    accessTitle: accessData.title,
    hostName: accessData.createdBy.firstName + ' ' + accessData.createdBy.lastName,
    startDate: accessData.schedule.startDate,
    location: accessData.location
  };
  
  // Generar QR como Data URL (base64)
  const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
  
  return qrCodeDataUrl;
}

module.exports = {
  generateAccessInvitationQR
};
```

**Instalar dependencia:**
```bash
cd backend
npm install qrcode
```

---

### 9. Scheduler de Tareas Automáticas - **COMPONENTE FALTANTE**

**Ubicación sugerida:** `/backend/src/jobs/accessScheduler.js`

```javascript
const cron = require('node-cron');
const Access = require('../models/Access');
const emailService = require('../services/emailService');
const Company = require('../models/Company');

// Cron job que corre cada hora
cron.schedule('0 * * * *', async () => {
  console.log('🕐 Running access scheduler jobs...');
  
  await finalizeExpiredAccesses();
  await sendAccessReminders();
});

async function finalizeExpiredAccesses() {
  try {
    const now = new Date();
    
    // Buscar accesos activos cuya fecha de fin ya pasó
    const expiredAccesses = await Access.find({
      status: 'active',
      'schedule.endDate': { $lt: now }
    });
    
    for (const access of expiredAccesses) {
      // Cambiar estado a finalized
      access.status = 'finalized';
      
      // Actualizar invitados que no asistieron
      access.invitedUsers.forEach(invited => {
        if (invited.attendance === 'pendiente') {
          invited.attendance = 'no-asistio';
        }
      });
      
      await access.save();
      console.log(`✅ Finalized access: ${access.title}`);
    }
  } catch (error) {
    console.error('Error finalizing accesses:', error);
  }
}

async function sendAccessReminders() {
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const todayEnd = new Date(now.setHours(23, 59, 59, 999));
    
    // Buscar accesos que inician hoy y no han enviado recordatorio
    const accesses = await Access.find({
      status: 'active',
      'schedule.startDate': {
        $gte: todayStart,
        $lte: todayEnd
      },
      reminderSent: { $ne: true } // Campo nuevo que hay que agregar al modelo
    }).populate('createdBy');
    
    for (const access of accesses) {
      // Obtener config de company para logo
      const company = await Company.findOne({ companyId: access.companyId });
      
      // Enviar al creador
      await emailService.sendAccessReminderToCreatorEmail({
        creatorEmail: access.createdBy.email,
        creatorName: access.createdBy.firstName,
        accessTitle: access.title,
        startDate: access.schedule.startDate,
        startTime: access.schedule.startTime,
        location: access.location,
        companyName: company.name,
        companyLogo: company.logo
      });
      
      // Enviar a cada invitado
      for (const invited of access.invitedUsers) {
        await emailService.sendAccessReminderToGuestEmail({
          invitedEmail: invited.email,
          invitedName: invited.name,
          hostName: `${access.createdBy.firstName} ${access.createdBy.lastName}`,
          accessTitle: access.title,
          startDate: access.schedule.startDate,
          startTime: access.schedule.startTime,
          location: access.location,
          qrCode: invited.qrCode, // Suponiendo que se guardó al crear
          companyName: company.name,
          companyLogo: company.logo,
          additionalInfo: access.additionalInfo
        });
      }
      
      // Marcar como enviado
      access.reminderSent = true;
      await access.save();
      
      console.log(`📧 Sent reminders for access: ${access.title}`);
    }
  } catch (error) {
    console.error('Error sending reminders:', error);
  }
}

module.exports = {
  finalizeExpiredAccesses,
  sendAccessReminders
};
```

**Inicializar en backend/src/index.js:**
```javascript
// Al final del archivo, después de iniciar el servidor
require('./jobs/accessScheduler');
```

**Instalar dependencia:**
```bash
cd backend
npm install node-cron
```

**Agregar campo al modelo Access.js:**
```javascript
reminderSent: {
  type: Boolean,
  default: false
}
```

---

## 📊 Estado del Proyecto

### Completado: 40%
- ✅ Modelos actualizados (Access, Company)
- ✅ Templates de email creados (8 tipos)
- ✅ Ruta de company actualizada

### En Progreso: 0%
- (nada actualmente)

### Pendiente: 60%
- 🔴 Rutas de access actualizadas (CRÍTICO)
- 🔴 AccessCodesPage modernizado (CRÍTICO)
- 🟡 Integración con VisitRegistrationSidePanel
- 🟡 Integración con AgendaPage
- 🟡 QR Generator utility
- 🟡 Scheduler de tareas automáticas
- 🟢 SettingsPage funcional (puede esperar)

---

## 🎯 Orden de Implementación Recomendado

1. **PASO 1 (CRÍTICO):** Actualizar `/backend/src/routes/access.js`
   - Implementar todas las rutas nuevas y modificadas
   - Agregar campo `reminderSent` al modelo Access
   - Instalar `qrcode` npm package
   - Crear `/backend/src/utils/qrGenerator.js`

2. **PASO 2 (CRÍTICO):** Modernizar `/frontend/src/pages/access/AccessCodesPage.tsx`
   - Crear modales de crear/editar/detalles
   - Implementar diseño responsive
   - Conectar con nuevas rutas de backend

3. **PASO 3:** Implementar `/backend/src/jobs/accessScheduler.js`
   - Instalar `node-cron`
   - Agregar inicialización en backend/src/index.js

4. **PASO 4:** Integrar con `/frontend/src/pages/visits/VisitRegistrationSidePanel.tsx`
   - Detectar QR de accesos
   - Auto-rellenar formulario
   - Llamar a checkInAccess

5. **PASO 5:** Mejorar `/frontend/src/pages/visits/AgendaPage.tsx`
   - Agregar filtros de accesos
   - Mostrar accesos en calendario

6. **PASO 6 (OPCIONAL):** Hacer funcional `/frontend/src/pages/settings/SettingsPage.tsx`
   - Cargar y guardar configuración real
   - Subir logo y ubicación

---

## 🔗 Archivos Clave a Modificar

### Backend:
1. ✅ `/backend/src/models/Access.js` - **COMPLETADO**
2. ✅ `/backend/src/models/Company.js` - **COMPLETADO**
3. ✅ `/backend/src/services/emailService.js` - **COMPLETADO**
4. ✅ `/backend/src/routes/company.js` - **COMPLETADO**
5. 🔴 `/backend/src/routes/access.js` - **PENDIENTE (CRÍTICO)**
6. 🟡 `/backend/src/utils/qrGenerator.js` - **CREAR NUEVO**
7. 🟡 `/backend/src/jobs/accessScheduler.js` - **CREAR NUEVO**
8. 🟡 `/backend/src/index.js` - **AGREGAR LÍNEA DE INICIALIZACIÓN**

### Frontend:
1. 🔴 `/frontend/src/pages/access/AccessCodesPage.tsx` - **PENDIENTE (CRÍTICO)**
2. 🟡 `/frontend/src/pages/visits/VisitRegistrationSidePanel.tsx` - **PENDIENTE**
3. 🟡 `/frontend/src/pages/visits/AgendaPage.tsx` - **PENDIENTE**
4. 🟢 `/frontend/src/pages/settings/SettingsPage.tsx` - **PENDIENTE (OPCIONAL)**
5. 🟡 `/frontend/src/services/api.ts` - **AGREGAR NUEVAS FUNCIONES**

---

## 🎨 Estilo Visual Requerido

- **Colores principales:** Cyan (#06b6d4), Blue (#3b82f6), Gray (#6b7280)
- **Gradientes:** linear-gradient(135deg, cyan-600, blue-600)
- **Borders:** rounded-xl, border-gray-200
- **Shadows:** shadow-sm, shadow-md
- **Spacing:** p-6, p-8, gap-4, gap-6
- **Responsive:** Mobile-first con breakpoints md: y lg:
- **Icons:** Lucide React (Calendar, User, Mail, MapPin, Clock, etc.)

---

## ⚠️ Consideraciones Importantes

1. **Seguridad:**
   - Validar que solo el creador puede editar/cancelar accesos
   - Validar fechas (fin > inicio)
   - Sanitizar inputs de usuario

2. **Performance:**
   - Paginar lista de accesos (50 por página)
   - Lazy load de imágenes grandes
   - Optimizar queries de MongoDB con indexes

3. **UX:**
   - Loading states en todos los botones
   - Confirmaciones antes de cancelar
   - Mensajes de error descriptivos
   - Toast notifications para acciones exitosas

4. **Emails:**
   - Usar logo y colores de la empresa configurados
   - Incluir ubicación si está configurada
   - Links funcionan en producción y desarrollo
   - Templates responsive para móvil

---

## 📝 Notas Finales

- El sistema está 40% completo
- Los componentes críticos son las **rutas de backend** y el **AccessCodesPage**
- Una vez esos estén listos, el resto son mejoras incrementales
- Los emails ya están 100% listos y funcionarán cuando se conecten las rutas
- El modelo de datos está completo y soporta todas las funcionalidades

**Última actualización:** 22 de Octubre 2025
**Desarrollador:** GitHub Copilot
**Estado:** EN PROGRESO - 40% COMPLETADO
