# Configuración HTTPS con mkcert

Este proyecto está configurado para usar HTTPS en desarrollo local usando **mkcert**.

## 🔒 ¿Por qué HTTPS?

Los navegadores modernos **requieren HTTPS** para acceder a:
- 📷 Cámara
- 🎤 Micrófono
- 📍 Geolocalización
- 📋 Portapapeles (en algunos casos)

## ✅ Configuración completada

El sistema ya está configurado con:

- ✅ Certificados SSL generados para `13.0.0.87`, `localhost` y `127.0.0.1`
- ✅ Frontend (Vite) configurado en `https://13.0.0.87:3001`
- ✅ Backend configurado en `https://13.0.0.87:3001/api`
- ✅ CORS actualizado para HTTPS
- ✅ Certificados almacenados en `certs/`

## 🚀 Iniciar el sistema

### Backend (Puerto 3001):
```powershell
cd backend
npm start
```

### Frontend (Puerto 3001):
```powershell
cd frontend
npm run dev
```

## 🌐 URLs de acceso

- **Frontend**: https://13.0.0.87:3001
- **Backend API**: https://13.0.0.87:3001/api
- **También disponible en**: https://localhost:3001

## 📱 Configurar otros dispositivos (móviles, tablets)

Para que otros dispositivos en tu red local confíen en los certificados:

### 1. Exportar la CA de mkcert

En tu PC de desarrollo:

```powershell
# Encuentra la ubicación del rootCA.pem
.\mkcert.exe -CAROOT
# Copia: C:\Users\becarios\AppData\Local\mkcert
```

Copia el archivo `rootCA.pem` a tu móvil vía email, USB o AirDrop.

### 2. Instalar en Android

1. Abre **Ajustes** → **Seguridad** → **Cifrado y credenciales**
2. Selecciona **Instalar un certificado** → **Certificado de CA**
3. Selecciona el archivo `rootCA.pem`
4. Dale un nombre como "mkcert Development CA"
5. Confirma la instalación

### 3. Instalar en iOS

1. Envía `rootCA.pem` al iPhone (email o AirDrop)
2. Abre el archivo y confirma la instalación del perfil
3. Ve a **Ajustes** → **General** → **Acerca de** → **Configuración de certificado de confianza**
4. Habilita el certificado de mkcert

### 4. Conectar desde el dispositivo

Asegúrate de estar en la misma red Wi-Fi y abre:

```
https://13.0.0.87:3001
```

## 🔧 Regenerar certificados

Si necesitas regenerar los certificados:

```powershell
cd certs
..\mkcert.exe 13.0.0.87 localhost 127.0.0.1
```

Esto creará nuevos archivos:
- `13.0.0.87+2.pem` (certificado)
- `13.0.0.87+2-key.pem` (llave privada)

## ⚠️ Importante

- **Solo para desarrollo**: Estos certificados son solo para desarrollo local
- **No compartir la CA**: No distribuyas el archivo `rootCA.pem` públicamente
- **Producción**: En producción usa Let's Encrypt u otro proveedor de certificados reales
- **Expiración**: Los certificados de mkcert expiran el **3 de marzo de 2028**

## 🐛 Solución de problemas

### Error: "NET::ERR_CERT_AUTHORITY_INVALID"

**Solución**: La CA de mkcert no está instalada en el navegador/dispositivo.

```powershell
.\mkcert.exe -install
```

### Error: "Cannot find module 'https'"

**Solución**: El módulo `https` es nativo de Node.js, asegúrate de tener Node.js instalado.

### La cámara no funciona

1. Verifica que accedas por HTTPS (candado verde en el navegador)
2. Verifica que el certificado sea válido (click en el candado)
3. Reinicia el navegador después de instalar la CA
4. En Chrome, ve a `chrome://flags/#unsafely-treat-insecure-origin-as-secure` como último recurso

### El backend no inicia en HTTPS

Verifica que los archivos de certificados existan:

```powershell
dir certs
# Deberías ver: 13.0.0.87+2.pem y 13.0.0.87+2-key.pem
```

## 📚 Recursos adicionales

- [mkcert GitHub](https://github.com/FiloSottile/mkcert)
- [Web APIs que requieren HTTPS](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts/features_restricted_to_secure_contexts)

---

**Última actualización**: Diciembre 3, 2025
