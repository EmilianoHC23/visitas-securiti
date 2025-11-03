# Plan de Integración de Lista Negra

## 🎯 Objetivo
Integrar el sistema de lista negra con todos los puntos de entrada de visitantes al sistema.

## 📊 Estado Actual

### ✅ Componentes Implementados
- **Frontend**: `BlacklistPage.tsx` - UI completa y funcional
- **Backend**: Endpoints CRUD en `/api/blacklist`
- **Modelo**: `Blacklist.js` con todos los campos necesarios
- **Verificación**: Endpoint `GET /api/blacklist/check?email=...`

### ❌ Falta Integración
El sistema **NO valida** lista negra en estos flujos:
1. Registro de visitas (`POST /api/visits/register`)
2. Pre-registro de eventos (`POST /api/access/:accessId/pre-register`)
3. Auto-registro público (SelfRegisterVisitPage)
4. Auto-registro de eventos (SelfRegisterEventFormPage)
5. Check-in de accesos (escaneo de QR)

---

## 🔧 Puntos de Integración Necesarios

### 1️⃣ **Registro de Visitas** (`backend/src/routes/visits.js`)

**Endpoint**: `POST /api/visits/register`

**Validación a agregar**:
```javascript
// Después de línea ~150 (antes de crear la visita)
const Blacklist = require('../models/Blacklist');

// Verificar lista negra
const blacklisted = await Blacklist.findOne({
  $or: [
    { email: visitorEmail.toLowerCase() },
    { identifier: visitorEmail.toLowerCase() }
  ],
  companyId: company.companyId,
  isActive: true
});

if (blacklisted) {
  return res.status(403).json({ 
    message: 'Acceso denegado. Persona en lista negra.',
    reason: blacklisted.reason 
  });
}
```

---

### 2️⃣ **Pre-registro de Eventos** (`backend/src/routes/access.js`)

**Endpoint**: `POST /api/access/:accessId/pre-register`

**Validación a agregar**:
```javascript
// Después de línea ~896 (después de validar campos)
const Blacklist = require('../models/Blacklist');

const access = await Access.findById(req.params.accessId)
  .populate('creatorId', 'firstName lastName email');

// Verificar lista negra
const blacklisted = await Blacklist.findOne({
  $or: [
    { email: email.toLowerCase() },
    { identifier: email.toLowerCase() }
  ],
  companyId: access.companyId,
  isActive: true
});

if (blacklisted) {
  return res.status(403).json({ 
    message: 'No puedes registrarte. Contacta con el organizador.',
    reason: blacklisted.reason 
  });
}
```

---

### 3️⃣ **Frontend: Auto-registro de Visitas**

**Archivo**: `frontend/src/pages/public/SelfRegisterVisitPage.tsx`

**Manejo de error a agregar**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    await api.selfRegisterVisit(visitData);
    navigate('/public/self-register/success');
  } catch (error: any) {
    console.error('Error:', error);
    
    // Manejar lista negra
    if (error.response?.status === 403) {
      alert('❌ Acceso denegado. No puedes registrarte en este momento.');
    } else {
      alert(error.message || 'Error al registrar la visita');
    }
  }
};
```

---

### 4️⃣ **Frontend: Auto-registro de Eventos**

**Archivo**: `frontend/src/pages/public/SelfRegisterEventFormPage.tsx`

**Manejo de error a agregar**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    await api.preRegisterToAccess(accessId, data);
    navigate(`/public/self-register/event-success/${accessId}`);
  } catch (error: any) {
    console.error('Error:', error);
    
    // Manejar lista negra
    if (error.response?.status === 403) {
      alert('❌ No puedes registrarte para este evento. Contacta al organizador.');
    } else {
      alert(error.message || 'Error al registrarse');
    }
  }
};
```

---

### 5️⃣ **Check-in de Accesos** (Opcional - más restrictivo)

**Endpoint**: Donde se valida el QR de accesos

**Consideración**: 
- ¿Bloquear en tiempo de check-in o solo en registro?
- Si bloqueamos en check-in, podría causar problemas si alguien ya fue invitado

**Recomendación**: Solo validar en momento de registro/pre-registro, no en check-in.

---

## 🎨 Mejoras de UX Recomendadas

### 1. **Mensaje Amigable en Frontend**
En lugar de mostrar el motivo exacto, mostrar mensaje genérico:
```typescript
if (error.response?.status === 403) {
  alert('No puedes registrarte en este momento. Por favor contacta a recepción.');
}
```

### 2. **Notificación a Administradores**
Cuando alguien en lista negra intenta registrarse:
```javascript
// En backend, después de detectar lista negra
await emailService.sendBlacklistAttemptNotification({
  adminEmail: company.email,
  visitorName: name,
  visitorEmail: email,
  attemptTime: new Date(),
  reason: blacklisted.reason
});
```

### 3. **Log de Intentos**
Crear modelo `BlacklistAttempt` para registrar intentos:
```javascript
const BlacklistAttempt = new mongoose.Schema({
  blacklistEntryId: ObjectId,
  attemptDate: Date,
  attemptType: String, // 'visit', 'event', 'check-in'
  attemptData: Object,
  companyId: String
});
```

---

## 📝 Tareas Priorizadas

### 🔴 Alta Prioridad (Seguridad)
- [ ] Validar lista negra en `POST /api/visits/register`
- [ ] Validar lista negra en `POST /api/access/:accessId/pre-register`
- [ ] Manejar error 403 en `SelfRegisterVisitPage.tsx`
- [ ] Manejar error 403 en `SelfRegisterEventFormPage.tsx`

### 🟡 Media Prioridad (UX)
- [ ] Crear mensajes de error amigables
- [ ] Agregar validación en tiempo real en formularios (check antes de submit)
- [ ] Mostrar indicador visual si email ya está en lista negra

### 🟢 Baja Prioridad (Analytics)
- [ ] Crear modelo `BlacklistAttempt`
- [ ] Email de notificación a admins
- [ ] Dashboard de intentos bloqueados

---

## 🧪 Testing Requerido

### Casos de Prueba:
1. ✅ Agregar persona a lista negra funciona
2. ✅ Eliminar persona de lista negra funciona
3. ✅ Búsqueda en lista negra funciona
4. ❌ Persona en lista negra NO puede auto-registrar visita
5. ❌ Persona en lista negra NO puede pre-registrarse a evento
6. ✅ Persona NO en lista negra SÍ puede registrarse normalmente
7. ❌ Email de notificación se envía cuando hay intento bloqueado

---

## 💡 Recomendaciones Adicionales

### 1. **Validación Case-Insensitive**
Asegurar que `email.toLowerCase()` se use en todas las validaciones.

### 2. **Wildcard Support** (Futuro)
Permitir bloquear dominios completos:
```javascript
{ identifier: '*@spammer.com', identifierType: 'domain' }
```

### 3. **Expiración Temporal**
Agregar campo `expiresAt` para bloqueos temporales:
```javascript
{
  expiresAt: Date,
  isPermanent: Boolean
}
```

### 4. **Razones Predefinidas**
Lista de razones comunes para selección rápida:
- Comportamiento inapropiado
- Fraude
- Amenazas de seguridad
- Incumplimiento de políticas
- Otro (especificar)

---

## 📌 Resumen

**Estado**: ⚠️ **Sistema de lista negra implementado pero NO integrado**

**Acción inmediata**: Agregar validación de lista negra en endpoints de registro de visitas y eventos.

**Tiempo estimado**: 2-3 horas para implementar validaciones básicas.

**Riesgo actual**: Personas en lista negra pueden registrarse libremente sin restricción.
