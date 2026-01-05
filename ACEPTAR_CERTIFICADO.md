# 🔒 Cómo aceptar el certificado HTTPS en tu navegador

Cuando accedas a `https://13.0.0.87:3001` por primera vez, verás una advertencia de seguridad. Esto es **normal y seguro** porque estás usando certificados de desarrollo local de mkcert.

## 🌐 Google Chrome / Edge / Brave

### Método 1: Aceptar el certificado directamente

1. Abre: `https://13.0.0.87:3001`
2. Verás: **"Su conexión no es privada"** o **"This site is not secure"**
3. Click en **"Avanzado"** o **"Advanced"**
4. Click en **"Continuar a 13.0.0.87 (no es seguro)"** o **"Proceed to 13.0.0.87 (unsafe)"**
5. ✅ Listo! El sitio cargará con HTTPS

### Método 2: Instalar la CA de mkcert en el navegador

Si quieres que Chrome/Edge confíe automáticamente:

1. Abre PowerShell y ejecuta:
   ```powershell
   cd c:\Users\becarios\Documents\visitas-securiti
   .\mkcert.exe -CAROOT
   ```
   
2. Te mostrará algo como: `C:\Users\becarios\AppData\Local\mkcert`

3. Abre esa carpeta y busca `rootCA.pem`

4. En Chrome:
   - Ve a: `chrome://settings/certificates`
   - Click en **"Autoridades"** → **"Importar"**
   - Selecciona `rootCA.pem`
   - Marca: **"Confiar en este certificado para identificar sitios web"**
   - Click **"Aceptar"**

5. Reinicia Chrome

6. Ahora `https://13.0.0.87:3001` mostrará el candado verde 🔒

## 🦊 Firefox

Firefox no usa el almacén de certificados del sistema, por lo que necesitas aceptar manualmente:

1. Abre: `https://13.0.0.87:3001`
2. Verás: **"Advertencia: Riesgo potencial de seguridad a continuación"**
3. Click en **"Avanzado"**
4. Click en **"Aceptar el riesgo y continuar"**
5. ✅ Listo!

### Para confiar permanentemente en Firefox:

1. Ve a: `about:preferences#privacy`
2. Scroll hasta **"Certificados"** → Click **"Ver certificados"**
3. Pestaña **"Autoridades"** → **"Importar"**
4. Navega a: `C:\Users\becarios\AppData\Local\mkcert\rootCA.pem`
5. Marca: **"Confiar en esta CA para identificar sitios web"**
6. Click **"Aceptar"**
7. Reinicia Firefox

## 📱 Desde móvil/tablet (mismo Wi-Fi)

### Android

1. Copia `rootCA.pem` a tu Android (vía email, USB, etc.)
2. Ve a: **Ajustes** → **Seguridad** → **Cifrado y credenciales**
3. **"Instalar un certificado"** → **"Certificado de CA"**
4. Selecciona `rootCA.pem`
5. Dale un nombre: **"mkcert Development"**
6. Confirma con tu PIN/huella
7. Abre Chrome y ve a: `https://13.0.0.87:3001`

### iOS/iPadOS

1. Envía `rootCA.pem` al iPhone (AirDrop o email)
2. Abre el archivo → **"Instalar perfil"**
3. Confirma en: **Ajustes** → **General** → **Perfil**
4. **Importante**: Ve a **Ajustes** → **General** → **Acerca de** → **Configuración de certificado de confianza**
5. **Activa** el certificado de mkcert
6. Abre Safari y ve a: `https://13.0.0.87:3001`

## ⚡ Inicio rápido

Una vez aceptado el certificado, inicia el sistema:

```powershell
# En la raíz del proyecto
.\start-https.ps1
```

O manualmente:

```powershell
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## ✅ Verificación

Después de aceptar el certificado:

1. Ve a: `https://13.0.0.87:3001`
2. Deberías ver el candado 🔒 (puede ser verde o gris dependiendo del navegador)
3. Click en el candado → **"El certificado es válido"**
4. Ahora puedes usar la cámara, micrófono, geolocalización, etc.

## 🐛 Solución de problemas

### "ERR_CERT_AUTHORITY_INVALID" persiste

Reinicia completamente el navegador (cierra TODAS las ventanas) después de aceptar el certificado.

### El candado aparece tachado 🔒❌

Esto pasa si tienes contenido mixto (HTTPS cargando recursos HTTP). Verifica que:
- Frontend usa: `https://13.0.0.87:3001`
- Backend API usa: `https://13.0.0.87:3001/api`

### "NET::ERR_CERT_COMMON_NAME_INVALID"

Asegúrate de acceder exactamente por `https://13.0.0.87:3001` (no uses otra IP).

---

**¿Problemas?** Consulta `HTTPS_SETUP.md` para más información.
