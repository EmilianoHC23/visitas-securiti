# Configuración de Correos Electrónicos

## 📧 Configuración SMTP para Gmail

Para que el sistema pueda enviar correos de aprobación/rechazo de visitas, necesitas configurar Gmail:

### Paso 1: Habilitar autenticación de 2 factores
1. Ve a [Google Account Settings](https://myaccount.google.com/)
2. Ve a "Seguridad" → "Verificación en 2 pasos"
3. Activa la verificación en 2 pasos

### Paso 2: Generar contraseña de aplicación
1. Ve a [App Passwords](https://myaccount.google.com/apppasswords)
2. Selecciona "Correo" como aplicación
3. Selecciona "Otro" como dispositivo y escribe "Visitas SecurITI"
4. Copia la contraseña generada (16 caracteres)

### Paso 3: Configurar variables de entorno
Edita el archivo `.env` y reemplaza con tus credenciales:

```bash
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password-generada
EMAIL_FROM=tu-email@gmail.com
```

### Paso 4: Probar configuración
Ejecuta el script de prueba:

```bash
cd backend
node test-email.js
```

## 🔧 Configuración para otros proveedores

### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=tu-email@outlook.com
SMTP_PASS=tu-contraseña
```

### Yahoo
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=tu-email@yahoo.com
SMTP_PASS=tu-contraseña-app
```

## 📨 Plantillas de Correo

El sistema envía automáticamente:

- **Correo de aprobación**: Al visitante y anfitrión cuando se aprueba una visita
- **Correo de rechazo**: Al visitante cuando se rechaza una visita

Los correos incluyen detalles de la visita, fecha, hora y participantes.