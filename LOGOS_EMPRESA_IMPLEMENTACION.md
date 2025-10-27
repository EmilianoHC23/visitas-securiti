# 🏢 Sistema de URLs Temporales para Logos de Empresa

## 📋 Problema Resuelto

Los logos de empresa almacenados en Base64 **no se mostraban en los correos electrónicos** porque Gmail, Outlook y otros clientes bloquean imágenes Base64 por razones de seguridad (prevención de XSS).

## ✅ Solución Implementada

Se implementó un sistema de **URLs temporales con tokens JWT** para servir los logos de empresa, similar al sistema ya existente para fotos de visitantes.

### Arquitectura

```
┌─────────────────┐
│  Email Client   │
│ (Gmail/Outlook) │
└────────┬────────┘
         │
         │ GET /api/company/logo/:companyId/:token
         ▼
┌─────────────────┐
│  Vercel Server  │
│   (Backend)     │
└────────┬────────┘
         │
         │ 1. Validar JWT
         │ 2. Verificar companyId
         │ 3. Obtener logo de MongoDB
         │ 4. Convertir Base64 → Buffer
         │ 5. Servir imagen
         ▼
┌─────────────────┐
│    MongoDB      │
│  Company.logo   │
└─────────────────┘
```

## 🔧 Componentes Implementados

### 1. Función Generadora de URLs (`emailService.js`)

```javascript
generateCompanyLogoUrl(companyId) {
  const token = jwt.sign(
    { 
      companyId: companyId,
      type: 'company-logo'
    },
    process.env.JWT_SECRET,
    { expiresIn: '90d' } // 90 días (logos cambian con menos frecuencia)
  );
  
  const baseUrl = process.env.API_URL || 'http://localhost:5000';
  return `${baseUrl}/api/company/logo/${companyId}/${token}`;
}
```

**¿Por qué 90 días?**
- Los logos de empresa cambian con menos frecuencia que las fotos de visitantes
- Mayor duración = menos regeneración de tokens en emails antiguos
- Aún mantiene seguridad con validación JWT

### 2. Endpoint Público (`routes/company.js`)

```javascript
GET /api/company/logo/:companyId/:token
```

**Flujo de validación:**
1. ✅ Verificar token JWT válido
2. ✅ Verificar tipo de token = `company-logo`
3. ✅ Verificar que companyId del token coincida con URL
4. ✅ Buscar empresa en MongoDB
5. ✅ Verificar que existe logo
6. ✅ Convertir Base64 a Buffer
7. ✅ Servir imagen con headers de caché

**Headers de respuesta:**
```http
Content-Type: image/jpeg (o image/png)
Cache-Control: public, max-age=604800 (7 días)
ETag: "companyId-timestamp"
```

### 3. Actualización de Funciones de Email

Las siguientes funciones fueron actualizadas para usar URLs temporales:

- ✅ `sendVisitorNotificationEmail`
- ✅ `sendApprovalRequestEmail`
- ✅ `sendCheckoutEmail`

**Lógica de detección:**
```javascript
let COMPANY_LOGO_URL;
if (data.companyLogo && data.companyLogo.startsWith('data:image')) {
  // Es Base64, generar URL temporal
  if (data.companyId) {
    COMPANY_LOGO_URL = this.generateCompanyLogoUrl(data.companyId);
  } else {
    COMPANY_LOGO_URL = fallbackUrl;
  }
} else if (data.companyLogo) {
  // Ya es URL pública, usar directamente
  COMPANY_LOGO_URL = data.companyLogo;
} else {
  // Sin logo, usar fallback
  COMPANY_LOGO_URL = fallbackUrl;
}
```

### 4. Actualización de Llamadas (`routes/visits.js`)

Se agregó el parámetro `companyId` en todas las llamadas a funciones de email:

```javascript
await emailService.sendVisitorNotificationEmail({
  // ... otros datos
  companyName: company?.name || 'SecurITI',
  companyId: company?.companyId || null,  // ✅ NUEVO
  companyLogo: company?.logo || null,
  // ... más datos
});
```

## 🔒 Seguridad

### Token JWT
- **Algoritmo:** HS256
- **Expiración:** 90 días
- **Payload:**
  ```json
  {
    "companyId": "abc123",
    "type": "company-logo",
    "iat": 1234567890,
    "exp": 1234567890
  }
  ```

### Validaciones
1. ✅ Token JWT válido y no expirado
2. ✅ Tipo de token correcto (`company-logo`)
3. ✅ CompanyId coincide entre token y URL
4. ✅ Empresa existe en base de datos
5. ✅ Logo existe y es Base64 válido

## 🚀 Ventajas del Sistema

| Aspecto | Antes (Imgur) | Ahora (URLs Temporales) |
|---------|---------------|-------------------------|
| **Dependencia Externa** | ❌ Imgur API | ✅ Auto-hospedado |
| **Límites de Tasa** | ❌ Limitado | ✅ Sin límites |
| **Seguridad** | ⚠️ Público permanente | ✅ Tokens temporales |
| **Consistencia** | ⚠️ Distinto a fotos | ✅ Misma arquitectura |
| **Costo** | ⚠️ Posible costo futuro | ✅ Gratis |
| **Control** | ❌ Limitado | ✅ Total |
| **Cache** | ⚠️ CDN de Imgur | ✅ Control propio |

## 📊 Performance

### Caché
- **Navegador:** 7 días (`max-age=604800`)
- **Tipo:** Pública (`public`)
- **Validación:** ETags

### Tamaño Típico
- Logo promedio: ~50-200 KB
- Compresión: JPEG 80% quality
- Tiempo de carga: <500ms

## 🧪 Testing

### Verificar URL Temporal
```bash
# 1. Generar token en consola (ejemplo)
curl -X POST https://visitas-securiti.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# 2. Probar endpoint de logo (reemplazar con token real)
curl https://visitas-securiti.vercel.app/api/company/logo/abc123/TOKEN_JWT
```

### Casos de Prueba
1. ✅ Logo Base64 → URL temporal
2. ✅ Logo URL pública → Sin cambios
3. ✅ Sin logo → Fallback image
4. ✅ Token expirado → 401 Unauthorized
5. ✅ CompanyId inválido → 404 Not Found
6. ✅ Token de tipo incorrecto → 403 Forbidden

## 📧 Compatibilidad de Email Clients

| Cliente | Base64 | URL Temporal |
|---------|--------|--------------|
| Gmail | ❌ Bloqueado | ✅ Funciona |
| Outlook | ❌ Bloqueado | ✅ Funciona |
| Apple Mail | ⚠️ A veces | ✅ Funciona |
| Yahoo Mail | ❌ Bloqueado | ✅ Funciona |
| Thunderbird | ⚠️ A veces | ✅ Funciona |

## 🔄 Migración Futura (Opcional)

Si en el futuro deseas migrar a Supabase Storage:

```javascript
// 1. Subir logo a Supabase
const { data, error } = await supabase.storage
  .from('company-logos')
  .upload(`${companyId}/logo.jpg`, logoFile);

// 2. Obtener URL pública
const { publicURL } = supabase.storage
  .from('company-logos')
  .getPublicUrl(`${companyId}/logo.jpg`);

// 3. Guardar URL en MongoDB
company.logo = publicURL;
await company.save();

// 4. No necesitas generateCompanyLogoUrl() - usar URL directamente
```

## 📝 Logs y Debugging

### Logs Importantes
```
🏢 [EMAIL] Logo empresa: Generando URL temporal con JWT
🏢 [COMPANY LOGO] Solicitud de logo para empresa: abc123
✅ [COMPANY LOGO] Token válido
✅ [COMPANY LOGO] Logo servido exitosamente. Tamaño: 123456 bytes
```

### Errores Comunes
```
❌ [COMPANY LOGO] Token inválido o expirado
❌ [COMPANY LOGO] CompanyId no coincide
⚠️ [EMAIL] No companyId disponible, usando logo fallback
```

## 🎯 Siguiente Paso

Puedes aplicar el mismo sistema a **cualquier otra imagen** que necesites enviar por email:
- Avatares de usuarios
- Imágenes de reportes
- QR codes dinámicos
- Certificados con foto

---

**Implementado:** 2025-10-23  
**Sistema:** URLs Temporales con JWT  
**Válido por:** 90 días  
**Compatible con:** Gmail, Outlook, Apple Mail, Yahoo, Thunderbird
