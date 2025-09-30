# Configuración del Sistema de Notificaciones por Email

## 📧 Variables de Entorno para Email

Para habilitar las notificaciones por email, agrega estas variables de entorno:

### Gmail (Recomendado para desarrollo)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-de-aplicacion
```

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=tu-email@outlook.com
SMTP_PASS=tu-password
```

### SendGrid (Recomendado para producción)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=tu-sendgrid-api-key
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@tu-dominio.mailgun.org
SMTP_PASS=tu-mailgun-password
```

## 🔧 Configuración para Gmail

1. **Habilitar autenticación de 2 factores** en tu cuenta de Gmail
2. **Generar contraseña de aplicación:**
   - Ve a [Gestión de cuenta de Google](https://myaccount.google.com/)
   - Seguridad > Contraseñas de aplicaciones
   - Selecciona "Correo" y tu dispositivo
   - Usa la contraseña generada en `SMTP_PASS`

## 📋 Variables Adicionales (Opcionales)

```env
# URLs del frontend para enlaces en emails
FRONTEND_URL=https://tu-dominio.vercel.app

# Emails de administradores (separados por comas)
ADMIN_EMAILS=admin@empresa.com,supervisor@empresa.com

# Configuración adicional
EMAIL_FROM_NAME="Visitas SecuriTI"
EMAIL_FROM_ADDRESS=notificaciones@empresa.com
```

## 🚀 Variables para Vercel

En tu dashboard de Vercel, agrega estas variables de entorno:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notificaciones@tuempresa.com
SMTP_PASS=tu-password-de-aplicacion
FRONTEND_URL=https://tu-app.vercel.app
ADMIN_EMAILS=admin@tuempresa.com
```

## ✅ Verificación

Una vez configuradas las variables, el sistema enviará automáticamente:

- ✉️ **Confirmación a visitantes** cuando registren una visita
- 🔔 **Notificación a anfitriones** sobre nuevas visitas
- ✅ **Aprobación de visitas** cuando sean autorizadas
- 🎫 **Códigos de acceso QR** por email
- 🚨 **Alertas administrativas** sobre actividad del sistema

## 🔍 Troubleshooting

Si no funcionan los emails:
1. Verifica que las credenciales SMTP sean correctas
2. Para Gmail, asegúrate de usar contraseña de aplicación
3. Revisa los logs del servidor para errores específicos
4. El sistema funcionará sin emails si no están configurados

## 📊 Logs de Email

El servicio de email registra:
- ✅ Emails enviados exitosamente
- ❌ Errores de envío
- 📧 Estado de inicialización del servicio