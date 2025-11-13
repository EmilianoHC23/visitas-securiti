# Visitas SecuriTI — Manual de Usuario

Este manual te guía paso a paso por el flujo de trabajo de la aplicación y el uso de las principales páginas: Visits, Agenda, Users Management, Access Codes, Public Registration, Blacklist, Reports y Settings. Está orientado a usuarios finales (administradores, recepción y hosts).

---

## Roles y permisos

- Administrador (Admin): Acceso completo a configuración, gestión de usuarios, accesos/eventos, visitas, reportes y lista negra.
- Recepción: Gestión operativa del día a día: visitas (registro, entrada/salida), visualización de agenda, reportes y accesos/eventos.
- Host: Puede crear y gestionar sus propios accesos/eventos y ver la agenda. En listados de accesos, verá únicamente los que creó.

Nota: Algunas pantallas muestran más/menos opciones según el rol. Por ejemplo, los Hosts ven sus propios accesos; los Admin/Recepción ven todos.

---

## Flujo de trabajo recomendado

1) Configurar la organización (Settings)
- Sube el logo y ajusta preferencias (ej. auto-checkout).
- Completa la información de ubicación (dirección, mapa, foto e instrucciones de llegada).

2) Generar el QR de Auto-Registro (Public Registration)
- Descarga e imprime el QR institucional para que visitantes se auto-registren.
- Colócalo en recepción o un punto visible.

3) Crear eventos/accesos (Access Codes)
- Define título, fechas/horas y tipo (Reunión, Proyecto, Evento, Visita u Otro).
- Agrega invitados (email y nombre) y opcionalmente habilita el pre-registro público.
- El sistema verifica lista negra antes de crear; puedes cancelar o continuar.

4) Operación diaria (Visits y Agenda)
- Desde Visits, registra nuevas visitas espontáneas, toma foto, aprueba/rechaza, registra entradas y salidas.
- Desde Agenda, consulta los eventos activos por día, en tabla o calendario.

5) Cumplimiento y control (Blacklist y Reports)
- Administra la lista negra para restringir acceso.
- Genera reportes diarios en PDF de visitas completadas o rechazadas.

---

## Access Codes Page (Accesos / Eventos)
Objetivo: Crear y administrar accesos/eventos con invitados, fechas, ubicaciones y opciones avanzadas.

Cómo llegar: Menú lateral → Accesos (o Accesos/Eventos).

Principales acciones:
- Crear acceso: botón "Crear Acceso".
  - Información: Título, Razón (Reunión/Proyecto/Evento/Visita/Otro).
  - Pre-registro público: activar "Crear enlace de pre-registro" para compartir un link abierto (los asistentes se registran por su cuenta).
  - Horario: Fecha y hora de inicio y fin. Opción "Sin vencimiento" para accesos permanentes.
  - Invitados: agrega correos y nombres; el sistema enviará correo con QR a cada invitado si está activa la opción de envío.
  - Opciones avanzadas:
    - Anfitrión responsable: quién recibe notificaciones (puede ser host o admin).
    - Ubicación específica (ej.: Sala A, Edificio 1).
    - Imagen del evento y notas adicionales.
  - Verificación de lista negra: si se detectan correos en la lista negra, verás un aviso con el motivo y podrás cancelar o continuar.
- Ver y filtrar accesos: pestañas "Activos" y "Finalizados". Puedes buscar por título/ubicación/tipo y filtrar por fecha.
- Acciones por acceso:
  - Ver detalles
  - Editar (si está activo)
  - Cancelar (mueve a finalizados como cancelado)
  - Copiar enlace de pre-registro (si está habilitado y activo)
  - Finalizar (marcar como finalizado)


Notas de uso:
- Los Hosts solo ven los accesos que crearon.
- "Sin vencimiento" deshabilita fecha/hora de fin y mantiene el acceso activo hasta que lo finalices manualmente.

---

## Public Registration Page (QR de Auto-Registro)
Objetivo: Obtener el QR institucional para que las personas se auto-registren desde su celular.

Cómo llegar: Menú lateral → Público → Auto-Registro (nombre puede variar) o Public Registration.

Qué verás:
- Vista del QR institucional (generado por la empresa).
- Botón "Descargar QR": genera un PDF listo para imprimir con el QR centrado y las instrucciones.
- Sugerencias de uso: imprimir al menos a 10×10 cm y colocarlo en un lugar visible.

Cómo usarlo:
1) Descarga el PDF y imprime el QR.
2) Colócalo en recepción. Los visitantes abren la cámara del celular, escanean y completan su registro.


---

## Visits Page (Visitas)
Objetivo: Operación diaria de visitantes: registro, aprobación/rechazo, check-in y check-out.

Cómo llegar: Menú lateral → Visitas.

Principales funciones:
- Registrar visita espontánea:
  - Abre "Registrar visita".
  - Toma la fotografía del visitante (cámara del dispositivo) y completa datos básicos.
  - Opcional: escanea un QR de invitación o de datos del visitante para auto-completar.
  - Guarda para crear la visita con fecha/hora actual.
- Estados de una visita:
  - En espera (Pending): recién registrada, a la espera de aprobación.
  - Aprobada (Approved): lista para ingresar; puedes registrar la entrada.
  - Dentro (Checked In): el visitante está dentro de las instalaciones; más tarde registra la salida.
  - Completada (Completed): salida registrada.
  - Rechazada (Rejected): se denegó el acceso (se recomienda capturar motivo).
- Acciones rápidas por tarjeta:
  - Aprobar/Rechazar una visita en espera.
  - Registrar Entrada (Check-In) en aprobadas.
  - Registrar Salida (Check-Out) cuando está dentro.
  - Ver historial/actividad de la visita.

Buenas prácticas:
- Verifica identidad con la foto tomada.
- Si el invitado trae un QR de correo, escanéalo para agilizar el registro.


---

## Agenda Page (Agenda de Eventos)
Objetivo: Visualizar eventos/accesos activos por día en formato tabla o calendario.

Cómo llegar: Menú lateral → Agenda.

Funciones clave:
- Vista: alterna entre Tabla y Calendario.
- Filtros: rango de fechas, anfitrión y búsqueda (por título/ubicación).
- Eventos mostrados: accesos activos (se filtran los finalizados/expirados).
- Enlaces: cuando un acceso tiene código, puede mostrarse un enlace de pre-registro que puedes copiar.

Uso típico:
1) Define el rango (hoy + próximos días/semana).
2) Filtra por anfitrión si lo necesitas.
3) Alterna tabla/calendario según tu preferencia.


---

## Users Management Page (Gestión de Usuarios)
Objetivo: Invitar, editar y eliminar usuarios del sistema con sus roles.

Cómo llegar: Menú lateral → Usuarios.

Acciones disponibles:
- Invitar usuario: correo, nombre(s), apellido(s), rol (Admin, Recepción, Host) y foto de perfil opcional.
- Editar usuario: actualizar datos, rol y foto.
- Eliminar:
  - Invitaciones pendientes: puedes eliminarlas para reutilizar el correo.
  - Usuarios registrados: eliminación permanente (confirma antes de proceder).

Consejos:
- Usa fotos de perfil para facilitar identificación.
- Define correctamente los roles según responsabilidades.


---

## Blacklist Page (Lista Negra)
Objetivo: Restringir el acceso a personas específicas.

Cómo llegar: Menú lateral → Lista Negra.

Funciones:
- Buscar por nombre, correo o motivo.
- Agregar a lista negra: nombre, correo, motivo y foto (opcional).
- Eliminar de la lista negra mediante confirmación.

Integración:
- Al crear accesos, el sistema verifica si algún invitado está en la lista negra y te muestra un aviso con detalles para que decidas continuar o cancelar.


---

## Reports Page (Reportes de Visitas)
Objetivo: Consultar visitas del día y descargar un reporte en PDF.

Cómo llegar: Menú lateral → Reportes.

Funciones:
- Selecciona la fecha del reporte.
- Búsqueda por visitante, empresa, correo o anfitrión.
- Ver detalle cronológico (timeline) de una visita específica.
- Descargar PDF del día: incluye resumen (totales, completadas, rechazadas) y tabla con visitante, empresa, anfitrión, horas de entrada/salida, estado y correo.

Notas:
- El reporte considera visitas Completadas y Rechazadas con motivo.


---

## Settings Page (Configuración)
Objetivo: Configurar la organización y preferencias del sistema.

Cómo llegar: Menú lateral → Configuración.

Secciones principales:
- Cuenta/Organización:
  - Nombre del edificio/empresa.
  - Logo de la empresa (se guarda en la plataforma; tamaño máx. 5MB; formatos: JPG/PNG/WEBP).
  - Preferencias: Auto-checkout, requerir foto, habilitar auto-registro.
- Información adicional (Dirección y llegada):
  - Dirección completa (país, estado, ciudad, colonia, CP, calle).
  - URL de Google Maps.
  - Foto de la empresa y "Instrucciones de llegada" para visitantes.

Consejos:
- Actualiza el logo para que aparezca en PDFs/QR.
- Mantén al día la dirección y mapa para facilitar la llegada.


---



## Preguntas frecuentes y tips

- No veo algunos accesos: si eres Host, verás solo los que creaste. Pide a un Admin cambiar tu rol si necesitas más alcance.
- Invitado en lista negra: revisa el motivo antes de decidir continuar. Lo ideal es cancelar y revisar con seguridad.
- QR de Auto-Registro no carga: revisa la conexión y vuelve a intentar. Si persiste, consulta con un Admin que el QR institucional esté configurado.
- Reporte PDF vacío: verifica la fecha seleccionada y que existan visitas Completadas o Rechazadas ese día.

---

## Soporte
Si necesitas ayuda adicional o encuentras un problema, contacta al Administrador de tu organización o al equipo de soporte indicado por tu empresa.
