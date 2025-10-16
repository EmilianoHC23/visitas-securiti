# Configuración de Email en Vercel

## 📧 Variables de Entorno para Producción

Para que el sistema de emails funcione en producción (Vercel), debes configurar las siguientes variables de entorno en el dashboard de Vercel:

### 1. Acceder a Vercel Dashboard
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto: `visitas-securiti`
3. Ve a **Settings** → **Environment Variables**

### 2. Agregar las siguientes variables:

```bash
# SMTP Configuration
SMTP_HOST=mail.securiti.info
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=ehernandez@securiti.info
SMTP_PASS=Em1L1an0.H2025*
EMAIL_FROM=ehernandez@securiti.info
```

### 3. Configuración de cada variable:

| Variable | Valor | Entorno |
|----------|-------|---------|
| `SMTP_HOST` | `mail.securiti.info` | Production, Preview, Development |
| `SMTP_PORT` | `465` | Production, Preview, Development |
| `SMTP_SECURE` | `true` | Production, Preview, Development |
| `SMTP_USER` | `ehernandez@securiti.info` | Production, Preview, Development |
| `SMTP_PASS` | `Em1L1an0.H2025*` | Production, Preview, Development |
| `EMAIL_FROM` | `ehernandez@securiti.info` | Production, Preview, Development |

### 4. Redeploy

Después de agregar las variables, haz un nuevo deploy:
- Opción 1: Haz push a main (deploy automático)
- Opción 2: En Vercel Dashboard → Deployments → Redeploy

---

## 🔒 Seguridad

⚠️ **IMPORTANTE**: 
- Nunca commits las contraseñas al repositorio
- El archivo `.env` está en `.gitignore`
- Solo configura las variables sensibles en Vercel
- Usa contraseñas de aplicación (App Passwords) cuando sea posible

---

## 🧪 Verificar Configuración

Para probar que el email funciona correctamente:

### En desarrollo (local):
```bash
cd backend
node scripts/test-email-config.js
```

### En la aplicación:
1. Inicia sesión como admin
2. Ve a **Configuración** → **Prueba de Email**
3. Ingresa un email de prueba
4. Click en "Enviar Email de Prueba"

---

## 📝 Configuraciones Alternativas

### Si usas Gmail:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password  # Generar en https://myaccount.google.com/apppasswords
EMAIL_FROM=tu-email@gmail.com
```

### Si usas otro proveedor:
Consulta la documentación de tu proveedor de email para los valores de:
- Host SMTP
- Puerto (normalmente 465 para SSL o 587 para TLS)
- Si requiere SSL/TLS

---

## 🔧 Troubleshooting

### Error: "Invalid login"
- Verifica que el usuario y contraseña sean correctos
- Asegúrate que la cuenta de email existe
- Verifica que el servidor SMTP permita autenticación

### Error: "Connection timeout"
- Verifica que el SMTP_HOST sea correcto
- Verifica que el puerto sea el correcto
- Revisa si hay firewall bloqueando la conexión

### Error: "Self signed certificate"
- El código ya incluye `rejectUnauthorized: false` para certificados autofirmados
- Si persiste, contacta a tu proveedor de hosting de email

---

## 📧 Emails que envía el sistema

1. **Confirmación de visita** - Cuando se registra una visita
2. **Aprobación de visita** - Cuando el admin aprueba (incluye QR)
3. **Rechazo de visita** - Cuando el admin rechaza (con razón)
4. **Check-in exitoso** - Cuando el visitante entra
5. **Check-out** - Cuando el visitante sale (resumen de visita)
6. **Invitaciones** - Para usuarios nuevos
7. **Códigos de acceso** - Para eventos/grupos

---

Última actualización: 16 de octubre de 2025
