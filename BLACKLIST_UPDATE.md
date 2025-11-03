# Actualización de Lista Negra - SecuriTI

## Resumen de Cambios

Se ha modernizado completamente la funcionalidad de Lista Negra con una interfaz moderna y validaciones automáticas en todos los flujos de registro.

## Cambios Realizados

### 1. **Frontend - BlacklistPage Modernizada**
   - ✅ Nueva UI con diseño de tarjetas modernas (card-based layout)
   - ✅ Interfaz inspirada en SettingsPage con gradientes y sombras
   - ✅ Formulario actualizado con los siguientes campos:
     - **Foto del visitante** (opcional) - Subida de imagen Base64
     - **Nombre del visitante** (requerido)
     - **Correo electrónico** (requerido)
     - **Motivo** (requerido) - Textarea para descripción detallada
   - ✅ Tarjetas muestran: foto, nombre, correo y motivo
   - ✅ Búsqueda mejorada por nombre, correo o motivo
   - ✅ Botón de eliminar integrado en cada tarjeta
   - ✅ Animaciones suaves (fadeIn, slideUp)
   - ✅ Diseño responsivo para móviles y tablets

### 2. **Frontend - Tipos TypeScript Actualizados**
   - ✅ Interface `BlacklistEntry` actualizada con:
     - `visitorName: string` (requerido)
     - `photo?: string` (opcional)
   - ✅ Interface `Blacklist` actualizada con los mismos campos

### 3. **Frontend - API Services**
   - ✅ Función `addToBlacklist` actualizada para aceptar:
     ```typescript
     {
       email: string;
       visitorName: string;
       reason: string;
       photo?: string;
     }
     ```
   - ✅ Nueva función `checkBlacklist(email: string)` para validar emails
     - Retorna `Blacklist | null`
     - Permite validar antes de registrar visitas/accesos

### 4. **Frontend - Validaciones en Flujos de Registro**

   #### a) **PublicVisitRegistrationPage** ✅
   - Verifica email contra lista negra antes de registrar
   - Muestra alerta detallada si el usuario está en lista negra
   - Permite al personal decidir si continuar o cancelar

   #### b) **SelfRegisterVisitPage** ✅
   - Validación automática durante auto-registro
   - Alerta de seguridad si el email está blacklisteado

   #### c) **PublicAccessListPage** ✅
   - Validación antes de check-in en eventos/accesos
   - Alerta de seguridad con información del visitante

   #### d) **AccessCodesPage** ✅
   - Validación al crear accesos/eventos con invitados
   - Verifica todos los emails invitados en paralelo
   - Muestra lista de todos los usuarios blacklisteados encontrados
   - Permite al administrador decidir si continuar

### 5. **Backend - Modelo Blacklist Actualizado**
   - ✅ Nuevos campos en el schema:
     ```javascript
     visitorName: {
       type: String,
       trim: true,
       required: true
     },
     photo: {
       type: String // Base64 encoded image
     }
     ```
   - ✅ Mantiene compatibilidad con campos legacy (`email`, `name`)

### 6. **Backend - Rutas Blacklist Actualizadas**
   - ✅ Endpoint POST `/blacklist` acepta nuevos campos:
     - `email` (requerido)
     - `visitorName` (requerido)
     - `reason` (requerido)
     - `photo` (opcional)
   - ✅ Mantiene compatibilidad con formato legacy
   - ✅ Nuevo endpoint GET `/blacklist/check?email=...`:
     - Retorna entrada completa de blacklist o `null`
     - Usado por el frontend para validaciones
   - ✅ Endpoint legacy GET `/blacklist/check/:email` mantenido

## Flujo de Validación de Lista Negra

### Cuando un usuario intenta registrarse:

1. **Sistema verifica el email** contra la lista negra
2. **Si hay coincidencia**, muestra alerta:
   ```
   ⚠️ ALERTA DE SEGURIDAD

   El usuario "[Nombre]" con correo [email]
   se encuentra en la lista negra debido a:

   "[Motivo]"

   ¿Desea continuar con el registro de todas formas?
   ```
3. **Personal decide**:
   - **Cancelar**: Se cancela el registro
   - **Continuar**: Se permite el registro (queda registrado pero alertado)

### Puntos de Validación:

✅ **Registro de Visitas Públicas** (`PublicVisitRegistrationPage`)
✅ **Auto-registro de Visitas** (`SelfRegisterVisitPage`)  
✅ **Check-in de Eventos/Accesos** (`PublicAccessListPage`)
✅ **Creación de Accesos con Invitados** (`AccessCodesPage`)

## Beneficios

1. **Seguridad Mejorada**: Alerta automática en todos los puntos de entrada
2. **Decisión Informada**: El personal ve el motivo y puede decidir
3. **No Bloquea**: El sistema alerta pero no bloquea automáticamente
4. **Visual**: Fotos de los visitantes blacklisteados para identificación rápida
5. **Modernizado**: Interfaz moderna y fácil de usar
6. **Trazabilidad**: Todas las entradas tienen fecha y motivo documentado

## Estructura de Datos

### BlacklistEntry (Frontend)
```typescript
{
  _id: string;
  identifier: string;
  identifierType: 'document' | 'phone' | 'email';
  reason: string;
  notes?: string;
  visitorName: string;
  photo?: string;
  createdBy: string;
  companyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### API addToBlacklist
```typescript
{
  email: string;
  visitorName: string;
  reason: string;
  photo?: string; // Base64 string
}
```

## Archivos Modificados

### Frontend:
- `frontend/src/types.ts` - Interfaces actualizadas
- `frontend/src/services/api.ts` - Funciones de API
- `frontend/src/pages/blacklist/BlacklistPage.tsx` - UI modernizada
- `frontend/src/pages/public/PublicVisitRegistrationPage.tsx` - Validación
- `frontend/src/pages/public/SelfRegisterVisitPage.tsx` - Validación
- `frontend/src/pages/public/PublicAccessListPage.tsx` - Validación
- `frontend/src/pages/access/AccessCodesPage.tsx` - Validación

### Backend:
- `backend/src/models/Blacklist.js` - Schema actualizado
- `backend/src/routes/blacklist.js` - Rutas actualizadas

## Próximos Pasos

Para que los cambios sean efectivos en producción:

1. **Probar en desarrollo** el flujo completo
2. **Verificar** que las alertas se muestren correctamente
3. **Validar** que las fotos se guarden y visualicen bien
4. **Desplegar** a producción cuando todo esté verificado

## Notas Técnicas

- Las fotos se guardan como Base64 en la base de datos
- Tamaño máximo de foto: 5MB
- Formatos soportados: JPG, PNG, GIF, WEBP
- La validación es asíncrona y no bloquea la UI
- Compatible con formato legacy de blacklist
