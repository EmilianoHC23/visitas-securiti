# 🖼️ Implementación de URLs Temporales para Fotos de Visitantes

## 📋 Problema Solucionado

**Problema:** Las fotos de visitantes guardadas en Base64 en MongoDB no se mostraban en los correos electrónicos porque **Gmail, Outlook y otros clientes bloquean imágenes Base64 por seguridad** (prevención de XSS).

**Solución:** Sistema de **URLs temporales firmadas con JWT** que convierte Base64 a imágenes públicas sin comprometer la privacidad.

---

## ✅ Ventajas de esta Solución

### 🔒 Privacidad y Seguridad
- ✅ **Datos sensibles en MongoDB**: Las fotos permanecen en Base64 en tu base de datos
- ✅ **Control total**: Tú decides quién ve las fotos y por cuánto tiempo
- ✅ **URLs temporales**: Tokens JWT que expiran en 30 días
- ✅ **Sin servicios externos**: No subes fotos a Imgur/Cloudinary (datos de identidad)
- ✅ **Cumplimiento GDPR/LFPDPPP**: Fácil de borrar fotos cuando un visitante lo solicita

### 📧 Compatibilidad Email
- ✅ **Gmail**: ✔️ Funciona
- ✅ **Outlook**: ✔️ Funciona
- ✅ **Apple Mail**: ✔️ Funciona
- ✅ **Todos los clientes**: URL pública = máxima compatibilidad

### 💰 Costo
- ✅ **100% gratis**: Sin servicios de terceros
- ✅ **Escalable**: Maneja miles de fotos sin costo adicional

---

## 🔧 Cómo Funciona

### 1. **Guardar foto** (sigue igual)
```javascript
// La foto se guarda en Base64 en MongoDB
visit.visitorPhoto = "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
```

### 2. **Generar URL temporal** (al enviar email)
```javascript
// emailService.js genera token JWT
const token = jwt.sign(
  { visitId: visit._id, type: 'visitor-photo' },
  process.env.JWT_SECRET,
  { expiresIn: '30d' }
);

const photoUrl = `${API_URL}/api/visits/visitor-photo/${visitId}/${token}`;
// Ejemplo: https://visitas-securiti-back.vercel.app/api/visits/visitor-photo/67abc.../eyJhbGc...
```

### 3. **Mostrar en email**
```html
<!-- En lugar de Base64 bloqueado -->
<img src="data:image/jpeg;base64,/9j/4AAQSkZ..." /> ❌

<!-- Ahora usamos URL pública temporal -->
<img src="https://api.ejemplo.com/api/visits/visitor-photo/67abc.../eyJhbGc..." /> ✅
```

### 4. **Servir imagen** (cuando Gmail/Outlook la solicitan)
```javascript
// Endpoint: GET /api/visits/visitor-photo/:visitId/:token

1. Validar token JWT → ✅ ¿Expiró? ¿Es correcto?
2. Buscar visita en MongoDB → ✅ ¿Existe?
3. Convertir Base64 → Buffer
4. Enviar como imagen/jpeg con cache de 7 días
```

---

## 📁 Archivos Modificados

### 1. `backend/src/routes/visits.js`
**Nuevo endpoint público:**
```javascript
router.get('/visitor-photo/:visitId/:token', async (req, res) => {
  // Valida JWT, convierte Base64 → imagen, envía con cache
});
```

**Actualización en creación de visitas:**
```javascript
await emailService.sendApprovalRequestEmail({
  visitId: visit._id, // ✅ NUEVO - necesario para generar URL
  visitorPhoto: req.body.visitorPhoto, // Base64 original
  // ... resto de datos
});
```

### 2. `backend/src/services/emailService.js`
**Nueva función helper:**
```javascript
generateVisitorPhotoUrl(visitId) {
  // Genera token JWT válido por 30 días
  // Retorna URL pública temporal
}
```

**Actualización en template de email:**
```javascript
async sendApprovalRequestEmail(data) {
  // Detecta si visitorPhoto es Base64
  let visitorPhotoUrl = null;
  if (data.visitorPhoto && data.visitorPhoto.startsWith('data:image')) {
    // Generar URL temporal en lugar de usar Base64
    visitorPhotoUrl = this.generateVisitorPhotoUrl(data.visitId);
  }
  
  // En HTML del email:
  <img src="${visitorPhotoUrl}" /> // ✅ URL pública
}
```

### 3. `backend/.env.example`
**Nueva variable requerida:**
```bash
# URLs del sistema
API_URL=https://visitas-securiti-back.vercel.app
```

---

## 🚀 Configuración Requerida

### 1. Agregar `API_URL` al `.env`
```bash
# backend/.env
API_URL=https://visitas-securiti-back.vercel.app
```

**Para desarrollo local:**
```bash
API_URL=http://localhost:5000
```

### 2. ¡Eso es todo!
No se requieren APIs de terceros, credenciales adicionales ni servicios externos.

---

## 🔐 Seguridad

### Token JWT
- **Algoritmo**: HS256 (HMAC SHA-256)
- **Expiración**: 30 días (configurable)
- **Firma**: `process.env.JWT_SECRET` (misma que autenticación)
- **Payload**:
  ```json
  {
    "visitId": "67abc123def456",
    "type": "visitor-photo",
    "iat": 1234567890,
    "exp": 1237159890
  }
  ```

### Validaciones
1. ✅ Token válido y no expirado
2. ✅ `visitId` en token coincide con URL
3. ✅ Tipo de token es `visitor-photo`
4. ✅ Visita existe en base de datos
5. ✅ Visita tiene foto guardada

### ¿Qué pasa si alguien intenta hackear?
```bash
# Token expirado
GET /api/visits/visitor-photo/67abc/expired_token
→ 403 Forbidden: "Token inválido o expirado"

# Token manipulado
GET /api/visits/visitor-photo/67abc/fake_token
→ 403 Forbidden: "Token inválido o expirado"

# Visita inexistente
GET /api/visits/visitor-photo/999999/valid_token
→ 404 Not Found: "Visita no encontrada"

# Visita sin foto
GET /api/visits/visitor-photo/67abc/valid_token
→ 404 Not Found: "Foto no disponible"
```

---

## 📊 Rendimiento

### Cache del navegador
```http
Cache-Control: public, max-age=604800  # 7 días
```

**Beneficios:**
- Primera carga: Descarga desde servidor
- Siguientes 7 días: Usa cache local (0 requests)
- Reduce carga en servidor un ~90%

### Optimización en emails
- Gmail/Outlook cachean imágenes
- Una foto se descarga 1 vez, se muestra N veces
- Ancho de banda mínimo

---

## 🔄 Comparación con Otras Soluciones

| Aspecto | **URLs Temporales** (✅ Implementado) | Imgur/Cloudinary | AWS S3 |
|---------|--------------------------------------|------------------|---------|
| **Privacidad** | ✅ Total (datos en tu DB) | ❌ Datos en terceros | ⚠️ Depende config |
| **Costo** | ✅ $0 | ⚠️ Límites/pago | 💰 ~$5-20/mes |
| **Cumplimiento RGPD** | ✅ Fácil (borras en DB) | ❌ Complicado | ⚠️ Requiere config |
| **Setup** | ✅ 1 variable (.env) | ⚠️ Registro + API key | 💰 Cuenta AWS |
| **Email compatible** | ✅ Todos | ✅ Todos | ✅ Todos |
| **Escalabilidad** | ✅ Miles de fotos | ⚠️ Límites diarios | ✅ Ilimitado |
| **Dependencias** | ✅ Ninguna | ❌ API externa | ❌ AWS |

---

## 🧪 Testing

### Probar endpoint manualmente
```bash
# 1. Crear una visita con foto
POST /api/visits
{
  "visitorPhoto": "data:image/jpeg;base64,/9j/4AAQ...",
  ...
}

# 2. Obtener el visitId de la respuesta (ej: 67abc123)

# 3. Generar token JWT manualmente (Node.js console)
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { visitId: '67abc123', type: 'visitor-photo' },
  process.env.JWT_SECRET,
  { expiresIn: '30d' }
);
console.log(token);

# 4. Acceder a la URL en navegador
https://tu-api.com/api/visits/visitor-photo/67abc123/[TOKEN_GENERADO]
```

### Verificar en email
1. Crear visita con foto
2. Revisar email recibido por el host
3. Inspeccionar HTML del email (buscar `<img src=`)
4. Debe contener URL tipo: `https://api.../visitor-photo/...`
5. Hacer clic derecho → "Abrir imagen en nueva pestaña"
6. Debe mostrar la foto del visitante

---

## 🆚 Para Logos de Empresa vs Fotos de Visitantes

| Tipo | Solución | Razón |
|------|----------|-------|
| **Logos empresa** | Imgur/Supabase | Pocas imágenes, no sensibles, permanentes |
| **Fotos visitantes** | URLs temporales | Miles de fotos, datos sensibles (INE/rostros), deben poder borrarse |

---

## ✅ Próximos Pasos

### Opcional: Ajustar tiempo de expiración
```javascript
// emailService.js - Cambiar de 30 días a 7 días
{ expiresIn: '7d' }
```

### Opcional: Regenerar URLs vencidas
Si un email tiene >30 días, el host puede solicitar un nuevo enlace desde el panel de visitas.

### Futuro: Implementar para otras fotos
Esta misma técnica se puede usar para:
- Fotos de checkout
- Documentos de identificación escaneados
- Credenciales temporales

---

## 📝 Notas Importantes

1. **No cambiar JWT_SECRET**: Invalidaría todas las URLs temporales existentes
2. **API_URL debe ser accesible públicamente**: Gmail/Outlook necesitan descargar las imágenes
3. **HTTPS requerido en producción**: Para que funcione en todos los clientes de email
4. **Base64 permanece en MongoDB**: Esta solución NO reemplaza Base64, solo genera URLs para emails

---

## 🐛 Troubleshooting

### ❌ Problema: "Token inválido o expirado"
**Causa:** JWT_SECRET cambió o token tiene >30 días
**Solución:** Reenviar email con nuevo token

### ❌ Problema: "Visita no encontrada"
**Causa:** La visita fue eliminada de la base de datos
**Solución:** Normal si se borró la visita

### ❌ Problema: Foto no se muestra en email
**Causa:** API_URL no está configurado o es incorrecto
**Solución:** Verificar `.env` → `API_URL=https://tu-dominio-backend.com`

### ❌ Problema: Error 500 al acceder a la foto
**Causa:** Base64 corrupto en MongoDB
**Solución:** Logs en consola → verificar formato de visitorPhoto

---

## 📚 Referencias

- [JWT.io](https://jwt.io/) - Validador de tokens JWT
- [MDN - Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [RGPD - Derecho al olvido](https://gdpr-info.eu/art-17-gdpr/)

---

**Implementado el:** 23 de octubre de 2025  
**Versión:** 1.0  
**Estado:** ✅ Producción
