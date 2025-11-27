# 🔒 Medidas de Seguridad Implementadas

## Última actualización: 2025-11-13

Este documento detalla todas las medidas de seguridad implementadas en **Visitas SecuriTI** para proteger datos, prevenir ataques y garantizar la privacidad.

---

## 🛡️ Protecciones Implementadas

### 1. **Rate Limiting (Anti Brute-Force)**
✅ **Implementado**

**¿Qué protege?**
- Ataques de fuerza bruta en login
- Ataques de denegación de servicio (DoS)
- Intentos masivos de acceso a la API

**Configuración:**
- **Login:** Máximo 5 intentos cada 15 minutos por IP
- **API General:** Máximo 100 requests por minuto por IP
- **Operaciones sensibles:** Máximo 3 requests por hora

**Archivo:** `backend/src/middleware/rateLimiter.js`

---

### 2. **Helmet - Headers HTTP Seguros**
✅ **Implementado**

**Headers de seguridad activados:**
- `X-DNS-Prefetch-Control` - Controla prefetch DNS
- `X-Frame-Options` - Previene clickjacking
- `X-Content-Type-Options` - Previene MIME sniffing
- `Strict-Transport-Security` - Fuerza HTTPS
- `X-Download-Options` - Previene descargas maliciosas
- `X-Permitted-Cross-Domain-Policies` - Controla políticas cross-domain

**Archivo:** `backend/index.js`

---

### 3. **Account Lockout**
✅ **Implementado**

**¿Cómo funciona?**
- Después de **5 intentos fallidos**, la cuenta se bloquea por **30 minutos**
- El contador se resetea después de login exitoso
- Notifica al usuario cuántos intentos le quedan

**Campos en base de datos:**
- `loginAttempts` - Contador de intentos
- `lockUntil` - Timestamp de desbloqueo

**Archivo:** `backend/src/models/User.js`

**Migración:** Ejecutar `node backend/scripts/add-lockout-fields.js` para usuarios existentes

---

### 4. **Autenticación Robusta**
✅ **Implementado**

**Características:**
- JWT con expiración de 24 horas
- Bcrypt para hash de passwords (10 salt rounds)
- Passwords excluidos de respuestas JSON
- Verificación de usuarios activos/inactivos
- Role-Based Access Control (RBAC)

**Roles:**
- `admin` - Acceso completo
- `reception` - Operaciones y gestión de visitas
- `host` - Solo sus propias visitas y eventos

---

### 5. **Validación de Passwords**
✅ **Implementado**

**Requisitos:**
- Mínimo **8 caracteres** (antes eran 3)
- Validación en frontend y backend

**Archivo:** `frontend/src/pages/Login.tsx`

---

### 6. **Reducción de Payload**
✅ **Implementado**

**Límites:**
- JSON: **2 MB** (antes 10 MB)
- URL-encoded: **2 MB** (antes 10 MB)

**Protege contra:**
- Ataques de denegación de servicio
- Saturación de memoria del servidor

**Archivo:** `backend/index.js`

---

### 7. **Logger Seguro**
✅ **Implementado**

**Características:**
- Los logs sensibles **SOLO** aparecen en desarrollo
- En producción, logs sanitizados sin datos de usuarios
- Logs de auditoría para eventos de seguridad
- No se exponen passwords, tokens o emails en producción

**Tipos de logs:**
- `logger.log()` - Solo en desarrollo
- `logger.error()` - Siempre, pero sanitizado en producción
- `logger.security()` - Eventos de seguridad
- `logger.audit()` - Auditoría de acciones críticas

**Archivo:** `backend/src/utils/logger.js`

---

### 8. **Protección CORS**
✅ **Implementado**

**Configuración:**
- **Desarrollo:** `localhost:5173`, `localhost:3000`
- **Producción:** Solo dominios de Vercel autorizados
- Credentials habilitados para cookies/auth

**Archivo:** `backend/index.js`

---

### 9. **Endpoints Debug Eliminados**
✅ **Implementado**

**Cambios:**
- Eliminado `/api/auth/debug/users` que exponía información de usuarios
- Removidos logs con datos sensibles (emails, passwords)

---

### 10. **Prevención de Inyecciones NoSQL**
✅ **Implementado (inherente)**

**¿Cómo?**
- Uso de Mongoose ORM
- Validación de esquemas
- Tipado estricto en queries

**Sin riesgo de:**
- SQL Injection (no usamos SQL)
- NoSQL Injection (Mongoose sanitiza)

---

## 🔐 Tokens y Almacenamiento

### JWT Tokens
- **Almacenamiento:** `localStorage` (clave: `securitiToken`)
- **Expiración:** 24 horas
- **Renovación:** Endpoint `/api/auth/refresh`

**⚠️ Consideración de seguridad:**
- `localStorage` es vulnerable a XSS
- Mitigado con headers Helmet (X-XSS-Protection)
- Alternativa futura: HttpOnly cookies

---

## 📊 Monitoreo y Auditoría

### Eventos Auditados
- ✅ Login exitoso (usuario, rol, timestamp)
- ✅ Login fallido (email, intentos restantes)
- ✅ Cuenta bloqueada (email, timestamp)
- ✅ Intentos a endpoints no existentes
- ✅ Errores de autenticación (tokens inválidos)

### Logs de Seguridad
```javascript
logger.security('Login attempt for locked account', { email });
logger.audit('Login successful', userId, { email, role });
```

---

## 🚀 Recomendaciones Futuras

### Nivel 1 - Mejorar (Gratis)
- [ ] Implementar CSRF tokens con `csurf`
- [ ] Agregar Content Security Policy estricto
- [ ] Validación de inputs con `express-validator`
- [ ] Migrar tokens a HttpOnly cookies

### Nivel 2 - Avanzado (Requiere configuración)
- [ ] Implementar 2FA (autenticación de dos factores)
- [ ] Agregar CAPTCHA invisible (Cloudflare Turnstile)
- [ ] Implementar honeypot fields en formularios
- [ ] WAF (Web Application Firewall) con Cloudflare

### Nivel 3 - Enterprise (Puede tener costo)
- [ ] Monitoreo con Sentry o LogRocket
- [ ] Análisis de vulnerabilidades con Snyk
- [ ] Penetration testing profesional
- [ ] Certificación de seguridad (ISO 27001)

---

## 🧪 Testing de Seguridad

### Pruebas Manuales
1. **Rate Limiting:**
   - Intentar 6 logins fallidos → debe bloquear
   - Esperar 15 minutos → debe permitir

2. **Account Lockout:**
   - 5 intentos fallidos → cuenta bloqueada 30 min
   - Mensaje indica tiempo restante

3. **Headers Seguros:**
   - Verificar con: `curl -I https://tu-dominio.com/api/health`
   - Debe incluir headers X-Frame-Options, etc.

### Herramientas Recomendadas
- **OWASP ZAP** - Scanner de vulnerabilidades
- **Burp Suite** - Testing de APIs
- **npm audit** - Vulnerabilidades en dependencias

---

## 📞 Contacto de Seguridad

Si encuentras una vulnerabilidad, repórtala a:
- **Email de seguridad:** [Configurar]
- **Proceso:** Responsible disclosure (90 días)

---

## 📝 Changelog de Seguridad

### 2025-11-13
- ✅ Agregado Rate Limiting en login
- ✅ Implementado Helmet para headers seguros
- ✅ Account Lockout (5 intentos / 30 min)
- ✅ Logger seguro (sin datos sensibles en producción)
- ✅ Aumentado requisito de password a 8 caracteres
- ✅ Reducido payload de 10MB a 2MB
- ✅ Eliminado endpoint debug de usuarios
- ✅ Sanitizado logs en auth.js y middleware

### 2025-11-12
- ✅ Implementado RBAC (Role-Based Access Control)
- ✅ Filtros de visitas por rol
- ✅ Redirección post-login basada en rol

---

**Versión del documento:** 1.0  
**Mantenido por:** Equipo de Desarrollo SecuriTI
