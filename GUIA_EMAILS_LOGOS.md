# 🎨 Guía de Uso - Sistema de Emails con Imágenes Incrustadas

## 📝 Resumen

Se ha implementado un sistema completo de imágenes incrustadas (CID) para todos los correos electrónicos del sistema. Ahora **todos los logos e imágenes aparecerán correctamente** en los emails, sin importar si tienes un servidor público o no.

## ✨ ¿Qué Cambió?

### Antes
- Los logos se servían mediante URLs temporales con JWT
- Las URLs apuntaban a `http://13.0.0.87:3001` (IP privada)
- Los clientes de correo bloqueaban las imágenes
- **Resultado:** Logos rotos o no visibles ❌

### Ahora
- Los logos se incrustan directamente en el email (CID attachments)
- No se necesitan URLs públicas
- Funciona en Gmail, Outlook, Apple Mail, etc.
- **Resultado:** Logos siempre visibles ✅

## 🧪 Cómo Probar

### Opción 1: Usando el Script de Prueba

```powershell
cd backend
node scripts/test-email-with-logo.js tu-email@example.com
```

Este script:
1. Se conecta a la base de datos
2. Obtiene la empresa configurada
3. Envía un email de invitación de prueba
4. Muestra si el logo es Base64 o URL
5. Confirma si el email se envió correctamente

### Opción 2: Invitando un Usuario Real

1. Inicia sesión como administrador en el sistema
2. Ve a **Configuración** → **Usuarios**
3. Haz clic en **Invitar Usuario**
4. Completa el formulario con:
   - Nombre
   - Email (usa tu email personal para probar)
   - Rol
5. Haz clic en **Enviar Invitación**
6. Revisa tu bandeja de entrada

### Opción 3: Creando un Evento

1. Crea un nuevo evento/acceso desde el panel
2. Agrega una imagen al evento (opcional)
3. Invita a participantes
4. Los invitados recibirán un email con:
   - Logo de la empresa
   - Imagen del evento (si la agregaste)

## 📊 Métodos de Email Actualizados

| Método | Imágenes Incrustadas | Uso |
|--------|---------------------|-----|
| `sendInvitationEmail` | Logo empresa | Invitaciones de usuarios |
| `sendApprovalRequestEmail` | Logo + Foto visitante | Aprobaciones de visitas |
| `sendAccessInvitationEmail` | Logo + Evento + Ubicación | Invitaciones a eventos |
| `sendAccessCreatedEmail` | Logo + Evento | Confirmación de evento |
| `sendAccessCancelledEmail` | Logo + Evento | Cancelación de evento |
| `sendAccessReminderToCreatorEmail` | Logo + Evento | Recordatorio al creador |
| `sendAccessReminderToGuestEmail` | Logo + Evento | Recordatorio al invitado |
| `sendGuestCheckedInEmail` | Logo + Foto + Evento | Notificación de entrada |
| `sendVisitorNotificationEmail` | Logo | Notificación a visitantes |
| `sendCheckoutEmail` | Logo | Confirmación de salida |

## 🔧 Configuración del Logo

### Paso 1: Subir el Logo

1. Ve a **Configuración** → **Empresa**
2. Haz clic en el círculo/cuadrado del logo
3. Selecciona una imagen (JPG, PNG, WebP)
4. La imagen se guardará automáticamente en Base64
5. Haz clic en **Guardar Cambios**

### Paso 2: Verificar el Logo

El sistema detecta automáticamente el tipo de logo:

- **Base64** (`data:image/...`): Se incrustará en el email ✅
- **URL pública** (`https://...`): Se usará directamente ✅
- **Sin logo**: Se usará un logo por defecto

### Recomendaciones

✅ **Tamaño recomendado:** 200x200 píxeles o similar
✅ **Formato:** PNG con fondo transparente (ideal)
✅ **Peso:** Menos de 100KB (para emails rápidos)
⚠️ **Evitar:** Imágenes muy grandes (>500KB)

## 🐛 Solución de Problemas

### El logo no aparece en el email

1. **Verifica que el logo esté configurado:**
   ```powershell
   # Usando MongoDB Compass o mongosh
   db.companies.findOne({}, { logo: 1, name: 1 })
   ```

2. **Revisa los logs del servidor:**
   ```
   📎 Imagen incrustada con CID: companyLogo@securiti
   ```

3. **Verifica la configuración SMTP:**
   - Asegúrate de que las variables SMTP estén en `.env`
   - Prueba el envío con el script de prueba

### El email no se envía

1. **Revisa las credenciales SMTP:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=tu-email@gmail.com
   SMTP_PASS=tu-app-password
   ```

2. **Para Gmail, usa una contraseña de aplicación:**
   - Ve a: https://myaccount.google.com/apppasswords
   - Genera una nueva contraseña
   - Úsala en `SMTP_PASS`

3. **Verifica que el servicio esté habilitado:**
   ```javascript
   // En los logs deberías ver:
   ✅ EmailService initialized with Nodemailer
   ✅ SMTP connection verified successfully
   ```

### El email llega a spam

Esto es normal en desarrollo. Para producción:
- Configura SPF, DKIM y DMARC
- Usa un dominio verificado
- Usa un servicio SMTP profesional (SendGrid, Mailgun, etc.)

## 📈 Monitoreo

Los logs del servidor mostrarán:

```
📎 Imagen incrustada con CID: companyLogo@securiti
🏢 [INVITATION] Logo empresa: Imagen incrustada (CID)
✅ Invitation email sent to: usuario@example.com
```

Si ves estos mensajes, significa que:
- ✅ El logo se detectó correctamente
- ✅ Se creó el attachment
- ✅ Se envió el email

## 🚀 Próximos Pasos

1. **Configura tu logo de empresa** si aún no lo has hecho
2. **Prueba enviando una invitación** a tu email personal
3. **Verifica que el logo aparezca** en el email recibido
4. **Configura imágenes para eventos** (opcional)

## 📚 Documentación Técnica

- Ver: `backend/ACTUALIZACION_EMAILS.md` para detalles técnicos
- Código: `backend/src/services/emailService.js`
- Función clave: `prepareEmailImage(imageData, cid, fallbackUrl)`

## 💡 Consejos

- Usa PNG con transparencia para mejores resultados
- Prueba el logo en diferentes clientes de correo
- Si cambias el logo, reinicia el servidor backend
- Los attachments aumentan el tamaño del email (normal)

---

¿Preguntas? Revisa los logs o el código en `emailService.js` 🚀
